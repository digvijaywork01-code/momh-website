import crypto from 'node:crypto'
import { sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

/**
 * A cap on how often one connection can send each kind of form. The counts
 * live in the hidden Form Attempts table (src/collections/FormAttempts.ts),
 * keyed by a keyed hash of the form kind and the sender's network, so no IP
 * address is stored.
 *
 *   enquiry     Book An Appointment and Personal Consultation. Checked in
 *               the save's own spam hook, inside Payload's transaction, so
 *               a refused enquiry's count is rolled back with it: this caps
 *               enquiries that are actually saved (and emailed).
 *   newsletter  Sign-ups, counted in the route whether refused or not.
 *   upload      Consultation file-upload links, the same way.
 *
 * Why plain SQL on the save's own connection: the spam hook runs while
 * Payload's transaction holds a database connection. Asking the pool for a
 * second one there could leave many simultaneous sends each holding one
 * and waiting for another, so they would all hang. Inside the transaction,
 * the check uses a savepoint, so a failure here never spoils the save.
 *
 * The caps leave room for a real visitor who makes a few mistakes, and for
 * many people on one shared connection (mobile networks in India, a venue's
 * Wi-Fi). Count and add happen under a lock per key, so a burst of
 * simultaneous sends cannot slip past the cap. Inside a hook that lock lasts
 * until the save ends, so call this as the hook's last step, never before a
 * slow one such as the reCAPTCHA check.
 *
 * Fails open: if the count cannot be read or written (database trouble, or
 * the table not created yet), the send goes ahead and a warning is logged.
 */

type Window = { ms: number; max: number }

export const RATE_LIMITS = {
  enquiry: [
    { ms: 10 * 60 * 1000, max: 5 },
    { ms: 24 * 60 * 60 * 1000, max: 20 },
  ],
  newsletter: [
    { ms: 60 * 60 * 1000, max: 15 },
    { ms: 24 * 60 * 60 * 1000, max: 50 },
  ],
  upload: [
    { ms: 60 * 60 * 1000, max: 10 },
    { ms: 24 * 60 * 60 * 1000, max: 30 },
  ],
} as const satisfies Record<string, readonly Window[]>

export type RateLimitBucket = keyof typeof RATE_LIMITS

type SqlQuery = ReturnType<typeof sql>
type SqlDb = {
  execute: (query: SqlQuery) => Promise<{ rows: Array<Record<string, unknown>> }>
  transaction: <T>(fn: (tx: SqlDb) => Promise<T>) => Promise<T>
}
type DrizzleAdapter = { drizzle: SqlDb; sessions?: Record<string | number, { db?: SqlDb }> }

/**
 * The sender's IP address. On Vercel both headers are set by Vercel itself;
 * x-forwarded-for can carry a list, whose first entry is the visitor.
 */
export const clientIp = (headers: Headers | undefined | null): string | null => {
  const real = headers?.get?.('x-real-ip')?.trim()
  if (real) return real
  const first = headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim()
  return first || null
}

/**
 * What the cap counts by: an IPv4 address as it is; an IPv6 address by its
 * first 64 bits, the part one home or phone connection is given (the rest
 * it can change at will).
 */
export const networkOf = (ip: string): string => {
  if (!ip.includes(':')) return ip
  const lastColon = ip.lastIndexOf(':')
  if (ip.slice(lastColon + 1).includes('.')) return ip.slice(lastColon + 1) // ::ffff:1.2.3.4
  const [head, tail = ''] = ip.toLowerCase().split('::')
  const left = head ? head.split(':') : []
  const right = tail ? tail.split(':') : []
  const groups = ip.includes('::')
    ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right]
    : left
  return `${groups
    .slice(0, 4)
    .map((g) => g.replace(/^0+(?=.)/, ''))
    .join(':')}::/64`
}

const keyFor = (bucket: RateLimitBucket, ip: string): string =>
  crypto
    .createHmac('sha256', process.env.PAYLOAD_SECRET || 'momh-rate-limit')
    .update(`${bucket}:${networkOf(ip)}`)
    .digest('base64url')

/** Under a lock per key: false if a cap is reached, else counts this send. */
const countAndAdd = async (
  db: SqlDb,
  key: string,
  windows: readonly Window[],
): Promise<boolean> => {
  await db.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`)
  for (const window of windows) {
    const { rows } = await db.execute(
      sql`SELECT count(*)::int AS n FROM "form_attempts" WHERE "key" = ${key} AND "created_at" > now() - make_interval(secs => ${window.ms / 1000})`,
    )
    if (Number(rows[0]?.n ?? 0) >= window.max) return false
  }
  await db.execute(sql`INSERT INTO "form_attempts" ("key") VALUES (${key})`)
  return true
}

/**
 * Says whether this send is within its caps, and counts it. Pass `req`
 * from inside a Payload hook (the check then runs on the save's own
 * connection); leave it out in a route.
 */
export const withinRateLimit = async (
  payload: Payload,
  bucket: RateLimitBucket,
  headers: Headers | undefined | null,
  req?: PayloadRequest,
): Promise<boolean> => {
  const ip = clientIp(headers)
  if (!ip) return true
  const key = keyFor(bucket, ip)
  const adapter = payload.db as unknown as DrizzleAdapter
  const transactionId = req?.transactionID ? await req.transactionID : undefined
  const tx = transactionId !== undefined ? adapter.sessions?.[transactionId]?.db : undefined

  try {
    if (tx) {
      await tx.execute(sql`SAVEPOINT momh_rate_limit`)
      try {
        const ok = await countAndAdd(tx, key, RATE_LIMITS[bucket])
        await tx.execute(sql`RELEASE SAVEPOINT momh_rate_limit`)
        return ok
      } catch (err) {
        await tx.execute(sql`ROLLBACK TO SAVEPOINT momh_rate_limit`).catch(() => undefined)
        throw err
      }
    }
    const ok = await adapter.drizzle.transaction((t) => countAndAdd(t, key, RATE_LIMITS[bucket]))
    // Now and then, one quick statement clears rows older than two days.
    if (Math.random() < 0.05) {
      await adapter.drizzle.execute(
        sql`DELETE FROM "form_attempts" WHERE "created_at" < now() - interval '2 days'`,
      )
    }
    return ok
  } catch (err) {
    payload.logger.warn({
      msg: 'Form rate limit unavailable; send allowed',
      bucket,
      err: err instanceof Error ? err.message : String(err),
    })
    return true
  }
}
