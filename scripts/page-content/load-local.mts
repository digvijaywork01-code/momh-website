/**
 * LOCAL-ONLY loader for the MOMH pages built from existing blocks (Contact
 * Us, and on later branches FAQ and the Accessibility Statement).
 *
 * Every `<slug>.json` next to this script is one page (title, slug, meta,
 * layout). The loader puts those pages into a LOCAL database, so they can be
 * reviewed on localhost. Production content is entered by hand in
 * momhindia.org/admin, never by this script. It refuses to run against
 * anything that is not a local `*_local` database, refuses on Vercel, and
 * refuses when a Blob token is set. It uploads nothing: the images a page
 * uses are existing media rows, looked up by filename, never by id.
 *
 * Run from the repo root (Node 22):
 *   pnpm payload run scripts/page-content/load-local.mts            (every page here)
 *   pnpm payload run scripts/page-content/load-local.mts contact    (only these slugs)
 *
 * Idempotent: updates each page if its slug exists (otherwise creates it).
 * Pages are saved as published.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

// Placeholders a page's JSON may use, and the media file each one stands for.
const MEDIA: Record<string, string> = {
  __OG_MEDIA_ID__: 'og-momh.jpg', // the share image
  __MAP_MEDIA_ID__: 'momh-jaipur-map.png', // the map used on Book Your Appointment
}

const fail = (msg: string): never => {
  console.error(`REFUSED: ${msg}`)
  process.exit(1)
}

// ── guards ─────────────────────────────────────────────────────────────
for (const k of ['VERCEL', 'VERCEL_ENV', 'VERCEL_URL', 'AWS_LAMBDA_FUNCTION_NAME']) {
  if (process.env[k]) fail(`${k} is set; this loader is for a local machine only`)
}
if (process.env.BLOB_READ_WRITE_TOKEN) fail('BLOB_READ_WRITE_TOKEN is set; this loader is for a local machine only')
let dbHost = ''
let dbName = ''
let queryHost = false
try {
  const u = new URL(process.env.DATABASE_URI || '')
  dbHost = u.hostname
  dbName = decodeURIComponent(u.pathname.replace(/^\//, ''))
  // pg takes host and hostaddr from the query string ahead of the URL's own
  // host, so `127.0.0.1/x_local?host=remote` would connect to "remote".
  queryHost = u.searchParams.has('host') || u.searchParams.has('hostaddr')
} catch {
  fail('DATABASE_URI is unset or unparseable')
}
if (queryHost) fail('DATABASE_URI sets a host in its query string')
if (!['127.0.0.1', 'localhost', '::1', '[::1]'].includes(dbHost)) fail(`database host ${dbHost} is not local`)
if (!dbName.endsWith('_local')) fail(`database ${dbName} does not end in _local`)

const available = fs
  .readdirSync(here)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .sort()
// `payload run <script> [slug ...]` hands the script [node, payload bin, ...slugs]
const asked = process.argv.slice(2).filter((a) => !a.startsWith('-') && !a.endsWith('.mts'))
const unknown = asked.filter((s) => !available.includes(s))
if (unknown.length) fail(`no page file for ${unknown.join(', ')} (have: ${available.join(', ')})`)
const slugs = asked.length ? asked : available
if (!slugs.length) fail('no <slug>.json page files next to this script')
console.log(`target: ${dbHost} / ${dbName}; pages: ${slugs.join(', ')}`)

// ── load ───────────────────────────────────────────────────────────────
const repo = process.cwd()
const configPath = path.join(repo, 'src', 'payload.config.ts')
if (!fs.existsSync(configPath)) fail(`run this from a MOMH checkout (no ${configPath})`)
// The repo's @payloadcms/email-resend version differs from payload's (on main
// too). Payload's dev-only dependency check then throws in a promise nobody
// awaits, which ends a `payload run` process before anything loads (`pnpm dev`
// only logs it). The check says nothing about this script, so skip it here.
process.env.PAYLOAD_DISABLE_DEPENDENCY_CHECKER = 'true'
// payload and the config are imported only here, after every guard above has
// passed, so nothing is loaded or connected before the target is checked.
const payloadEntry = createRequire(path.join(repo, 'package.json')).resolve('payload')
const { getPayload } = await import(pathToFileURL(payloadEntry).href)
const { default: config } = await import(pathToFileURL(configPath).href)
const payload = await getPayload({ config })

const mediaIds: Record<string, number> = {}
const mediaId = async (placeholder: string): Promise<number> => {
  if (!(placeholder in mediaIds)) {
    const filename = MEDIA[placeholder]
    const found = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
      depth: 0,
    })
    if (!found.docs[0]) fail(`media ${filename} not found (needed for ${placeholder})`)
    mediaIds[placeholder] = found.docs[0].id
  }
  return mediaIds[placeholder]
}

for (const slug of slugs) {
  const raw = fs.readFileSync(path.join(here, `${slug}.json`), 'utf8')
  const page = JSON.parse(raw)
  if (page.slug !== slug) fail(`${slug}.json holds slug "${page.slug}"`)

  // swap each placeholder for the id of the media row it stands for
  const used = [...new Set(raw.match(/__[A-Z_]+_MEDIA_ID__/g) || [])]
  const ids: Record<string, number> = {}
  for (const p of used) {
    if (!(p in MEDIA)) fail(`${slug}.json uses an unknown placeholder ${p}`)
    ids[p] = await mediaId(p)
  }
  const fill = (v: unknown): unknown =>
    typeof v === 'string' && v in ids
      ? ids[v]
      : Array.isArray(v)
        ? v.map(fill)
        : v && typeof v === 'object'
          ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]))
          : v
  const filled = fill(page) as typeof page

  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    draft: true,
    limit: 1,
    depth: 0,
  })
  // (a draft-aware match can be a version whose page is gone: no id, so create)
  const existingId = existing.docs[0]?.id
  const data = { ...filled, _status: 'published' }
  const context = { disableRevalidate: true }
  const saved = existingId
    ? await payload.update({ collection: 'pages', id: existingId, data, context, depth: 0 })
    : await payload.create({ collection: 'pages', data, context, depth: 0 })

  // read back
  const check = await payload.findByID({ collection: 'pages', id: saved.id, depth: 0 })
  const types = (check.layout || []).map((b: { blockType: string }) => b.blockType)
  console.log(
    `${slug}: page id ${check.id} ${existingId ? 'updated' : 'created'}, status ${check._status}, ` +
      `${types.length} blocks (${types.join(', ')})`,
  )
  if (check.slug !== slug || check._status !== 'published' || types.length !== filled.layout.length) {
    fail(`${slug}: read-back does not match ${slug}.json`)
  }
}
process.exit(0)
