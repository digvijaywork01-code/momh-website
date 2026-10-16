/**
 * PRODUCTION: adds the new MOMH pages (Contact Us, FAQ, Accessibility
 * Statement) to the live database, from the same <slug>.json files the local
 * loader uses, so production gets exactly the pages reviewed on localhost.
 * Run by hand on a developer's machine, never on Vercel.
 *
 * ORDER, so no visitor ever sees "page not found":
 *   1. From the reviewed branch, apply its migration to production first
 *      (`pnpm payload migrate` with production's DATABASE_URI). It only adds
 *      empty columns; the live site ignores them.
 *   2. Run this script: a dry run, then APPLY (below). The pages are added and
 *      published, but nobody can reach them yet: the live code has no
 *      /contact, /faq or /accessibility route.
 *   3. Deploy straight after step 2. The build renders the pages with their
 *      content and switches the footer links on with them. Until this deploy
 *      is live, nobody may edit or publish Contact, FAQ or Accessibility in
 *      the admin: the live code does not know the new fields yet, so a save
 *      there would drop Contact's second button and intro.
 *   4. After the deploy, run the dry run again. Every page must print
 *      "already there and identical, skip".
 *   Do NOT deploy first and run this afterwards: each page's lookup is cached
 *   by the live server (unstable_cache, tags only, kept for a year, and kept
 *   across deploys), so a page built while it did not exist keeps showing
 *   "page not found" after this script adds it, and a new deploy does not
 *   clear it. To recover: open the page in the live admin and publish it once
 *   (that refreshes its path); last resort, purge Vercel's Data Cache.
 *
 * WHAT IT DOES
 *   - Dry run by default: prints what it would do and writes nothing.
 *   - Writes only with APPLY=1 and CONFIRM_DB=<the database name it prints>.
 *   - Adds a page only if no page has its slug. A page that is already there
 *     and matches its file is skipped. A page that is there but differs (for
 *     example edited in the admin) stops the whole run before any write.
 *   - Stops unless the migration 20261016_104012_contact_page_fields is
 *     applied, unless both images exist, and if a redirect is set on any of
 *     the pages' addresses.
 *   - Uploads nothing. The images are existing media rows found by filename.
 *   - Never changes the database structure: Payload's dev-mode schema push is
 *     off (NODE_ENV=production) and the config's onInit table bootstrap is
 *     skipped. Refuses when PAYLOAD_DROP_DATABASE is set.
 *   - Before writing, saves a record outside the repo (RECORD_DIR, default
 *     ~/momh-page-apply-records/<time>/), and adds each page to it the moment
 *     the page is created. UNDO=<that folder> removes exactly the pages that
 *     run added, only in the same database, and only if nobody has changed
 *     them, started a draft or opened them in the admin since. If a run was
 *     interrupted, UNDO names any page it cannot vouch for and removes nothing.
 *
 * RUN from the repo root (Node 22), with production's DATABASE_URI:
 *   pnpm payload run scripts/page-content/apply-production.mts                   dry run, every page
 *   ONLY=contact,faq pnpm payload run scripts/page-content/apply-production.mts  dry run, these pages
 *   APPLY=1 CONFIRM_DB=<database> ONLY=contact,faq pnpm payload run scripts/page-content/apply-production.mts
 *   UNDO=<record folder> pnpm payload run scripts/page-content/apply-production.mts   (dry run; add APPLY=1 CONFIRM_DB=<database> to remove)
 *   SHOW=1   also print each page as it would be written
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const MIGRATION = '20261016_104012_contact_page_fields'
// Placeholders a page's JSON may use, and the media file each one stands for.
const MEDIA: Record<string, string> = {
  __OG_MEDIA_ID__: 'og-momh.jpg', // the share image
  __MAP_MEDIA_ID__: 'momh-jaipur-map.png', // the map used on Book Your Appointment
}
const LOCK_SECONDS = 300 // an admin edit lock younger than this blocks UNDO

const APPLY = process.env.APPLY === '1'
const SHOW = process.env.SHOW === '1'
const UNDO = process.env.UNDO
const ONLY = process.env.ONLY?.split(',').map((s) => s.trim()).filter(Boolean)
const RECORD_ROOT = process.env.RECORD_DIR || path.join(os.homedir(), 'momh-page-apply-records')

const fail = (msg: string): never => {
  console.error(`STOPPED: ${msg}`)
  process.exit(1)
}

// ── guards, before anything is loaded or connected ─────────────────────
for (const k of ['VERCEL', 'VERCEL_ENV', 'VERCEL_URL', 'AWS_LAMBDA_FUNCTION_NAME']) {
  if (process.env[k]) fail(`${k} is set; run this on a developer's machine, not on Vercel. Nothing was written.`)
}
if (process.env.PAYLOAD_DROP_DATABASE) fail('PAYLOAD_DROP_DATABASE is set; Payload would empty the database on connect. Nothing was written.')
if (UNDO !== undefined && !UNDO.trim()) fail('UNDO is set but empty. Nothing was written.')
if (process.env.ONLY !== undefined && !ONLY?.length) fail('ONLY is set but empty. Nothing was written.')
if (UNDO && ONLY) fail('UNDO removes exactly what its record lists; do not combine it with ONLY. Nothing was written.')

const available = fs
  .readdirSync(here)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .sort()
if (ONLY?.some((s) => !available.includes(s))) fail(`ONLY must be a comma-separated list of: ${available.join(', ')}`)
if (ONLY && new Set(ONLY).size !== ONLY.length) fail('ONLY names a page twice. Nothing was written.')
const slugs = ONLY ?? available
if (!slugs.length) fail('no <slug>.json page files next to this script')

let dbHost = ''
let dbName = ''
try {
  const u = new URL(process.env.DATABASE_URI || '')
  dbHost = u.hostname
  dbName = decodeURIComponent(u.pathname.replace(/^\//, ''))
  // pg takes host and dbname from the query string ahead of the URL's own,
  // so the name printed (and confirmed) would not be the database written.
  for (const k of ['host', 'hostaddr', 'dbname']) {
    if (u.searchParams.has(k)) fail(`DATABASE_URI sets ${k} in its query string. Nothing was written.`)
  }
} catch {
  fail('DATABASE_URI is unset or unparseable. Nothing was written.')
}
if (!dbName) fail('DATABASE_URI names no database. Nothing was written.')
console.log(`database: ${dbName} on ${dbHost}`)
console.log(`mode: ${UNDO ? `undo ${path.resolve(UNDO)}` : `add ${slugs.join(', ')}`}, ${APPLY ? 'WRITING' : 'dry run, nothing is written'}`)
if (APPLY && process.env.CONFIRM_DB !== dbName) {
  fail(`APPLY=1 needs CONFIRM_DB=${dbName} (the database above). Nothing was written.`)
}

// ── load ───────────────────────────────────────────────────────────────
const repo = process.cwd()
const configPath = path.join(repo, 'src', 'payload.config.ts')
if (!fs.existsSync(configPath)) fail(`run this from the MOMH repo root (no ${configPath})`)
// Production mode: Payload's dev-mode schema push never runs, so this script
// cannot change the database structure. The dependency check is dev-only noise
// here (email-resend vs payload versions, also on main).
Object.assign(process.env, { NODE_ENV: 'production', PAYLOAD_DISABLE_DEPENDENCY_CHECKER: 'true' })
const payloadEntry = createRequire(path.join(repo, 'package.json')).resolve('payload')
const { getPayload } = await import(pathToFileURL(payloadEntry).href)
const { default: config } = await import(pathToFileURL(configPath).href)
// disableOnInit: the config's onInit runs table DDL (the newsletter bootstrap);
// the live site already does that on every cold boot, so skip it here.
const payload = await getPayload({ config, disableOnInit: true })
const context = { disableRevalidate: true } // the live server's cache cannot be reached from here

type Doc = Record<string, unknown>

// Keys sorted at every level, so two reads of the same document compare equal.
const stable = (v: unknown): string =>
  Array.isArray(v)
    ? `[${v.map(stable).join(',')}]`
    : v && typeof v === 'object'
      ? `{${Object.keys(v)
          .sort()
          .map((k) => `${JSON.stringify(k)}:${stable((v as Doc)[k])}`)
          .join(',')}}`
      : JSON.stringify(v)

// Every value in `want` must be in `got` (Payload adds ids and defaults the
// files do not carry). Returns the path of the first difference, or null.
const firstDifference = (got: unknown, want: unknown, at = ''): string | null => {
  if (Array.isArray(want)) {
    if (!Array.isArray(got) || got.length !== want.length) return `${at} (length)`
    for (let i = 0; i < want.length; i++) {
      const d = firstDifference(got[i], want[i], `${at}[${i}]`)
      if (d) return d
    }
    return null
  }
  if (want && typeof want === 'object') {
    if (!got || typeof got !== 'object') return at || '(document)'
    for (const k of Object.keys(want)) {
      const d = firstDifference((got as Doc)[k], (want as Doc)[k], at ? `${at}.${k}` : k)
      if (d) return d
    }
    return null
  }
  return stable(got) === stable(want) ? null : at
}

const recentLock = async (id: number | string): Promise<boolean> => {
  const locks = await payload.find({
    collection: 'payload-locked-documents',
    where: { and: [{ 'document.relationTo': { equals: 'pages' } }, { 'document.value': { equals: id } }] },
    depth: 0,
    limit: 10,
  })
  return locks.docs.some(
    (l: { updatedAt?: string }) => Date.now() - new Date(l.updatedAt || 0).getTime() < LOCK_SECONDS * 1000,
  )
}

// The page's newest saved version (Payload writes one on every save and
// autosave, so a newer one means someone has saved or started a draft).
const latestVersionId = async (id: number | string): Promise<number | string | undefined> => {
  const latest = await payload.findVersions({
    collection: 'pages',
    where: { parent: { equals: id } },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
  })
  return (latest.docs[0] as { id?: number | string } | undefined)?.id
}

// ── UNDO: remove exactly the pages one earlier run added ───────────────
if (UNDO) {
  const dir = path.resolve(UNDO)
  const recordFile = path.join(dir, 'record.json')
  if (!fs.existsSync(recordFile)) fail(`${dir} is not a record made by this script (no record.json). Nothing was written.`)
  const record = JSON.parse(fs.readFileSync(recordFile, 'utf8'))
  if (record.database !== dbName || record.host !== dbHost) {
    fail(`that record is of ${record.database} on ${record.host}, not ${dbName} on ${dbHost}. Nothing was written.`)
  }
  const added: { slug: string; id: number; after?: Doc; versionId?: number | string }[] = record.added || []
  // An interrupted run can leave a page that was created but not fully
  // recorded: an entry with no read-back, or a planned slug with no entry
  // but a page created since the run started. Never guess about those.
  const unverified: string[] = added.filter((a) => !a.after || a.versionId === undefined).map((a) => `${a.slug} (page ${a.id})`)
  for (const slug of (record.pages as string[]) || []) {
    if (added.some((a) => a.slug === slug)) continue
    const found = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, draft: true, depth: 0, limit: 5 })
    for (const d of found.docs as Doc[]) {
      if (new Date(String(d.createdAt)).getTime() >= new Date(String(record.startedAt)).getTime()) {
        unverified.push(`${slug} (page ${String(d.id)}, created after that run started)`)
      }
    }
  }
  if (unverified.length) {
    fail(`that run was interrupted; it may have added ${unverified.join(', ')} without a full record. Check these in the admin. Nothing was written.`)
  }
  if (!added.length) fail('that record lists no added pages. Nothing was written.')
  const toRemove: typeof added = []
  for (const a of added) {
    const found = await payload.find({ collection: 'pages', where: { id: { equals: a.id } }, draft: true, depth: 0, limit: 1 })
    const now = found.docs[0] as Doc | undefined
    if (!now) {
      console.log(`${a.slug}: page ${a.id} is already gone, skip`)
      continue
    }
    if (stable(now) !== stable(a.after)) fail(`${a.slug}: page ${a.id} has changed since it was added. Nothing was written.`)
    if ((await latestVersionId(a.id)) !== a.versionId) {
      fail(`${a.slug}: page ${a.id} has a newer draft or version. Nothing was written.`)
    }
    if (await recentLock(a.id)) fail(`${a.slug}: page ${a.id} is open in the admin. Nothing was written.`)
    console.log(`${a.slug}: page ${a.id} unchanged since it was added, will remove`)
    toRemove.push(a)
  }
  if (!APPLY) {
    console.log(`\nDry run. To remove: UNDO=${dir} APPLY=1 CONFIRM_DB=${dbName} (same command)`)
    process.exit(0)
  }
  for (const a of toRemove) {
    await payload.delete({ collection: 'pages', id: a.id, context, overrideLock: false, depth: 0 })
    const gone = await payload.find({ collection: 'pages', where: { id: { equals: a.id } }, draft: true, depth: 0, limit: 1 })
    if (gone.docs.length) fail(`${a.slug}: page ${a.id} is still there after the delete. Check it in the admin.`)
    console.log(`${a.slug}: removed page ${a.id}`)
  }
  process.exit(0)
}

// ── ADD: checks first, then every write ────────────────────────────────
const migration = await payload.find({
  collection: 'payload-migrations',
  where: { name: { equals: MIGRATION } },
  depth: 0,
  limit: 1,
})
if (!migration.docs.length) fail(`migration ${MIGRATION} is not applied to this database. Run it first (step 1). Nothing was written.`)

const mediaIds: Record<string, number> = {}
for (const [placeholder, filename] of Object.entries(MEDIA)) {
  const found = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, depth: 0, limit: 1 })
  if (!found.docs[0]) fail(`media ${filename} not found (needed for ${placeholder}). Nothing was written.`)
  mediaIds[placeholder] = found.docs[0].id
}
console.log(`images: ${Object.entries(MEDIA).map(([p, f]) => `${f} = ${mediaIds[p]}`).join(', ')}`)

// A redirect on a page's address would send visitors elsewhere instead.
const redirects = await payload.find({ collection: 'redirects', depth: 0, limit: 1000, pagination: false })
const redirected = (slug: string) =>
  redirects.docs.filter((r: { from?: string }) => {
    const from = String(r.from || '').replace(/^https?:\/\/[^/]+/, '').replace(/\/+$/, '')
    return from === `/${slug}` || from === slug
  })

type Plan = { slug: string; data: Doc; state: 'add' | 'same' }
const plans: Plan[] = []
const problems: string[] = []
for (const slug of slugs) {
  const raw = fs.readFileSync(path.join(here, `${slug}.json`), 'utf8')
  const page = JSON.parse(raw)
  if (page.slug !== slug) fail(`${slug}.json holds slug "${page.slug}"`)
  const unknownPlaceholder = (raw.match(/__[A-Z_]+_MEDIA_ID__/g) || []).find((p) => !(p in MEDIA))
  if (unknownPlaceholder) fail(`${slug}.json uses an unknown placeholder ${unknownPlaceholder}`)
  const fill = (v: unknown): unknown =>
    typeof v === 'string' && v in mediaIds
      ? mediaIds[v]
      : Array.isArray(v)
        ? v.map(fill)
        : v && typeof v === 'object'
          ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]))
          : v
  const data = { ...(fill(page) as Doc), _status: 'published' }

  if (redirected(slug).length) problems.push(`${slug}: a redirect is set on /${slug}; remove it first`)
  const existing = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, draft: true, depth: 0, limit: 5 })
  if (existing.docs.length > 1) {
    problems.push(`${slug}: ${existing.docs.length} pages already use this slug`)
  } else if (existing.docs.length === 1) {
    const diff = firstDifference(existing.docs[0], data)
    if (diff) problems.push(`${slug}: page ${existing.docs[0].id} already exists and differs from ${slug}.json (first at ${diff})`)
    else plans.push({ slug, data, state: 'same' })
  } else {
    plans.push({ slug, data, state: 'add' })
  }
  if (SHOW) console.log(`\n${slug} as it would be written:\n${JSON.stringify(data, null, 1)}`)
}
for (const p of plans) {
  const blocks = (p.data.layout as unknown[]).length
  console.log(`${p.slug.padEnd(14)} ${p.state === 'add' ? `will add (${blocks} blocks, published)` : 'already there and identical, skip'}`)
}
if (problems.length) fail(`${problems.join('; ')}. Nothing was written.`)
const toAdd = plans.filter((p) => p.state === 'add')
if (!toAdd.length) {
  console.log('Nothing to add.')
  process.exit(0)
}
if (!APPLY) {
  console.log(`\nDry run. To add: APPLY=1 CONFIRM_DB=${dbName}${ONLY ? ` ONLY=${ONLY.join(',')}` : ''} (same command)`)
  process.exit(0)
}

// record first, so an interrupted run can still be undone
const dir = path.join(RECORD_ROOT, new Date().toISOString().replace(/[:.]/g, '-'))
fs.mkdirSync(dir, { recursive: true })
const record = {
  database: dbName,
  host: dbHost,
  migration: MIGRATION,
  startedAt: new Date().toISOString(),
  pages: toAdd.map((p) => p.slug),
  added: [] as Doc[],
}
const save = () => fs.writeFileSync(path.join(dir, 'record.json'), `${JSON.stringify(record, null, 1)}\n`)
save()
console.log(`record: ${dir}`)

try {
  for (const p of toAdd) {
    const created = await payload.create({ collection: 'pages', data: p.data, context, depth: 0 })
    // into the record at once, before any other query can fail
    const entry: Doc = { slug: p.slug, id: created.id }
    record.added.push(entry)
    save()
    const back = (
      await payload.find({ collection: 'pages', where: { id: { equals: created.id } }, draft: true, depth: 0, limit: 1 })
    ).docs[0] as Doc
    entry.after = back
    entry.versionId = await latestVersionId(created.id)
    save()
    const diff = firstDifference(back, p.data)
    if (diff) {
      fail(`${p.slug}: page ${created.id} was added but reads back differently (at ${diff}). Remove it with UNDO=${dir} APPLY=1 CONFIRM_DB=${dbName}`)
    }
    console.log(`${p.slug}: added page ${created.id}, published, reads back as ${p.slug}.json`)
  }
} catch (err) {
  fail(`${(err as Error).message}\nThe run stopped part-way. What it added is in ${dir}; check with UNDO=${dir} (a dry run).`)
}
console.log(`\nDone. To remove what this run added: UNDO=${dir} APPLY=1 CONFIRM_DB=${dbName} (same command)`)
process.exit(0)
