/**
 * PRODUCTION: trims the live Book Your Appointment page (/book-an-appointment)
 * to the Book An Appointment PDF (21 May 2026), which has no hero banner, no
 * rule above the title and nothing between the form and the contact panel.
 * Run by hand on a developer's machine, never on Vercel.
 *
 * WHAT IT CHANGES, on that one page only:
 *   - removes 5 blocks: the hero banner (Image Banner), Getting Here (Visit
 *     Info), the Museum Guidelines and Craft Your Jewellery carousels, and
 *     the Frequently Asked Questions block;
 *   - unticks "Show top divider" on the title block (Section Intro);
 *   - unticks the slug lock. With it on, opening the page in the admin
 *     rewrites its slug from the title ("Book Your Appointment" ->
 *     book-your-appointment), and publishing would move the page off
 *     /book-an-appointment. The slug itself is not changed.
 * Kept exactly as they are: the title block's text, the form, the contact
 * panel, the title, the slug and the SEO fields.
 *
 * ORDER, keeping the in-between short:
 *   1. Deploy feat/book-appointment-restyle, from the commit this script is
 *      run from. On phones and tablets the page looks as today while the
 *      banner is on it; on desktop (1024px and up) the title, form and
 *      contact panel take the new look at once, while the banner, Getting
 *      Here, the carousels and the FAQ stay until step 3. So run steps 2 and
 *      3 straight after the deploy is live.
 *   2. Make sure nobody has this page open in the admin, in any tab (an idle
 *      tab holds the old page and would bring the blocks back on its next
 *      keystroke). Run this script: a dry run, then APPLY (below).
 *   3. Purge Vercel's Data Cache (project Settings -> Data Cache). The live
 *      server caches each page's content for up to a year and this script
 *      cannot reach that cache, so until the purge the live page keeps its
 *      old blocks. After the purge it updates within 10 minutes (the page's
 *      revalidate time). The purge refetches every page's content once.
 *   4. Check https://momhindia.org/book-an-appointment: the page opens on
 *      "By Appointment Only", the form follows, then the red contact panel;
 *      on a phone the menu icon is dark. Run the dry run once more: it must
 *      print "Already trimmed, nothing to do."
 *
 * WHAT IT DOES
 *   - Dry run by default: prints the page, each block it would remove, and
 *     writes nothing. Check that its "database:" line is production's before
 *     copying the name into CONFIRM_DB: when DATABASE_URI is not set, Payload
 *     falls back to the .env in this checkout (your local database).
 *   - Writes only with APPLY=1 and CONFIRM_DB=<the database name it prints>.
 *   - Stops before any write unless the page is exactly as found on 22 Oct
 *     2026: one published page on /book-an-appointment, its newest version
 *     is that published one (no unpublished draft), nobody has edited it in
 *     the admin in the last 5 minutes, its 8 blocks are the same blocks (by
 *     id and type, in order) and the divider is ticked. Edits inside the
 *     kept blocks are carried over as they are; the removed blocks are saved
 *     in the record. A page already trimmed prints "Already trimmed" and is
 *     left alone. It also stops unless the newest migration in this checkout
 *     is the newest one applied to the database, so a checkout behind
 *     production cannot drop fields it does not know.
 *   - Never says to publish a pending draft: on this page, opening it in the
 *     admin with the slug lock on writes a draft that moves it to
 *     /book-your-appointment. Ask a developer if the run stops on a draft.
 *   - Never changes the database structure: Payload's dev-mode schema push is
 *     off (NODE_ENV=production) and the config's onInit table bootstrap is
 *     skipped. Refuses when PAYLOAD_DROP_DATABASE is set.
 *   - Before writing, saves the whole page as it was in a record outside the
 *     repo (RECORD_DIR, default ~/momh-page-apply-records/<time>-trim-book-
 *     an-appointment/). UNDO=<that folder> puts the page back exactly as it
 *     was, only in the same database, and only if nobody has changed it,
 *     started a draft or opened it in the admin since. Purge the Data Cache
 *     again after an UNDO.
 *
 * RUN from the repo root (Node 22), with production's DATABASE_URI:
 *   pnpm payload run scripts/page-content/trim-book-an-appointment.mts                                  dry run
 *   APPLY=1 CONFIRM_DB=<database> pnpm payload run scripts/page-content/trim-book-an-appointment.mts    trim the page
 *   UNDO=<record folder> pnpm payload run scripts/page-content/trim-book-an-appointment.mts             (dry run; add APPLY=1 CONFIRM_DB=<database> to restore)
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const SLUG = 'book-an-appointment'
// The page's blocks as they are on production today (read from a fresh copy,
// 22 Oct 2026), by id and type, in order.
const BEFORE_BLOCKS: [string, string][] = [
  ['6aa246b9a891c00004c8f283', 'imageBanner'],
  ['6aa246b9a891c00004c8f284', 'sectionIntro'],
  ['6aa246b9a891c00004c8f285', 'appointmentForm'],
  ['6aa246b9a891c00004c8f28e', 'visitInfo'],
  ['6aa246b9a891c00004c8f292', 'carousel'], // Museum Guidelines
  ['6aa246b9a891c00004c8f296', 'carousel'], // Craft Your Jewellery With Us
  ['6aa246b9a891c00004c8f29e', 'faq'],
  ['6aa246b9a891c00004c8f29f', 'contactPanel'],
]
const REMOVE_TYPES = new Set(['imageBanner', 'visitInfo', 'carousel', 'faq'])
const AFTER_BLOCKS = BEFORE_BLOCKS.filter(([, t]) => !REMOVE_TYPES.has(t))
// Query-string settings the database address may carry; anything else (a
// port, a socket, a database name) could make it connect somewhere other
// than the name and host printed and confirmed.
const ALLOWED_PARAMS = new Set(['sslmode', 'ssl', 'connect_timeout', 'application_name'])
const LOCK_SECONDS = 300 // an admin edit lock younger than this blocks every write

const APPLY = process.env.APPLY === '1'
const UNDO = process.env.UNDO
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

let dbHost = ''
let dbName = ''
let dbPort = ''
let parsed: URL | null = null
try {
  parsed = new URL(process.env.DATABASE_URI || '')
} catch {
  fail('DATABASE_URI is unset or unparseable. Nothing was written.')
}
if (parsed) {
  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    fail(`DATABASE_URI is a ${parsed.protocol} address; only postgres:// is accepted. Nothing was written.`)
  }
  dbHost = parsed.hostname
  dbPort = parsed.port || '5432'
  dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
  // pg takes host, port and dbname from the query string ahead of the URL's
  // own, so the name printed (and confirmed) would not be the database written.
  for (const k of parsed.searchParams.keys()) {
    if (!ALLOWED_PARAMS.has(k)) fail(`DATABASE_URI sets ${k} in its query string. Nothing was written.`)
  }
}
if (!dbHost || dbHost.startsWith('/') || dbHost.startsWith('%2F')) fail('DATABASE_URI names no network host. Nothing was written.')
if (!dbName) fail('DATABASE_URI names no database. Nothing was written.')
console.log(`database: ${dbName} on ${dbHost}:${dbPort}`)
console.log(`mode: ${UNDO ? `undo ${path.resolve(UNDO)}` : `trim /${SLUG}`}, ${APPLY ? 'WRITING' : 'dry run, nothing is written'}`)
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
const requireFromRepo = createRequire(path.join(repo, 'package.json'))
// The database must exist and hold a pages table BEFORE Payload connects:
// Payload's adapter creates a database that does not exist, so a mistyped name
// would otherwise make a new, empty database on that server.
{
  const pgEntry = createRequire(requireFromRepo.resolve('@payloadcms/db-postgres')).resolve('pg')
  const pg = (await import(pathToFileURL(pgEntry).href)).default
  const client = new pg.Client({ connectionString: process.env.DATABASE_URI })
  let table: string | null = null
  try {
    await client.connect()
    table = (await client.query("select to_regclass('public.pages')::text as t")).rows[0]?.t ?? null
  } catch (err) {
    fail(`cannot open ${dbName}: ${(err as Error).message}. Nothing was written.`)
  } finally {
    await client.end().catch(() => {})
  }
  if (!table) fail(`${dbName} has no pages table; is it the right database? Nothing was written.`)
}
const payloadEntry = requireFromRepo.resolve('payload')
const { getPayload } = await import(pathToFileURL(payloadEntry).href)
const { default: config } = await import(pathToFileURL(configPath).href)
// disableOnInit: the config's onInit runs table DDL (the newsletter bootstrap);
// the live site already does that on every cold boot, so skip it here.
const payload = await getPayload({ config, disableOnInit: true })
const context = { disableRevalidate: true } // the live server's cache cannot be reached from here

type Doc = Record<string, unknown>
type Block = Doc & { blockType: string; id?: string }

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

// Every value in `want` must be in `got`. Returns the path of the first
// difference, or null.
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

// The first words of a block's headline (Lexical rich text), for the printout.
const textOf = (node: unknown): string => {
  if (!node || typeof node !== 'object') return ''
  const n = node as Doc
  if (typeof n.text === 'string') return n.text
  const kids = (n.root as Doc | undefined)?.children ?? n.children
  return Array.isArray(kids) ? kids.map(textOf).join('') : ''
}
const describe = (b: Block): string => {
  const label = textOf(b.headline).trim() || (b.blockType === 'imageBanner' ? `image ${String(b.image)}` : '')
  return `${b.blockType}${label ? ` "${label.slice(0, 40)}"` : ''} (id ${b.id})`
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
const latestVersion = async (id: number | string): Promise<Doc | undefined> => {
  const latest = await payload.findVersions({
    collection: 'pages',
    where: { parent: { equals: id } },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
  })
  return latest.docs[0] as Doc | undefined
}

// What to do when the page has a draft: never publish it as it stands.
const DRAFT_ADVICE =
  'Do NOT publish that draft: with the slug lock on, the admin rewrites the slug from the title, and publishing ' +
  `would move the page off /${SLUG}. Ask a developer, or in the admin click Unlock beside the slug, set it back ` +
  `to ${SLUG}, check nothing else changed, publish, then run this again.`

// The live page, read twice: as published and as its newest draft. They must
// be the same document, or someone has unpublished changes in the admin.
// Returns the page and the id of its newest version, for the write to check.
const readPage = async (): Promise<{ page: Doc; versionId: unknown }> => {
  const live = await payload.find({ collection: 'pages', where: { slug: { equals: SLUG } }, depth: 0, limit: 5 })
  if (live.docs.length !== 1) fail(`${live.docs.length} published pages use /${SLUG}; expected 1. Nothing was written.`)
  const page = live.docs[0] as Doc
  if (page._status !== 'published') fail(`page ${String(page.id)} is not published (${String(page._status)}). Nothing was written.`)
  const newest = (await payload.findByID({ collection: 'pages', id: page.id as number, draft: true, depth: 0 })) as Doc
  if (stable(newest) !== stable(page)) {
    const moved = newest.slug !== SLUG ? ` Its newest draft has the slug "${String(newest.slug)}".` : ''
    fail(`page ${String(page.id)} has unpublished changes (a newer draft).${moved} ${DRAFT_ADVICE} Nothing was written.`)
  }
  const version = await latestVersion(page.id as number)
  const v = (version?.version ?? {}) as Doc
  if (!version || v._status !== 'published' || v.slug !== SLUG) {
    fail(`page ${String(page.id)}'s newest version is not its published one (a draft or an older version is newer). ${DRAFT_ADVICE} Nothing was written.`)
  }
  if (await recentLock(page.id as number)) {
    fail(`page ${String(page.id)} was edited in the admin in the last 5 minutes. Close it in every tab and wait 5 minutes. Nothing was written.`)
  }
  return { page, versionId: version?.id }
}

const typesOf = (layout: unknown): string[] => ((layout as Block[]) || []).map((b) => b.blockType)
const blocksOf = (layout: unknown): [string, string][] =>
  ((layout as Block[]) || []).map((b) => [String(b.id), b.blockType])

// A checkout whose fields lag the database would re-save the kept blocks
// without the fields it does not know, so the newest migration here must be
// the newest one applied there.
const checkMigrations = async (): Promise<void> => {
  const files = fs
    .readdirSync(path.join(repo, 'src', 'migrations'))
    .filter((f) => /^\d{8}_\d{6}.*\.ts$/.test(f))
    .map((f) => f.replace(/\.ts$/, ''))
    .sort()
  const applied = (
    await payload.find({ collection: 'payload-migrations', depth: 0, limit: 1000, pagination: false })
  ).docs
    .map((m: { name?: string }) => String(m.name))
    .filter((n: string) => /^\d{8}_\d{6}/.test(n))
    .sort()
  const newestHere = files.at(-1)
  const there = applied.at(-1)
  if (!newestHere || newestHere !== there) {
    fail(`this checkout's newest migration is ${newestHere}, the database's is ${there}. Run this from the deployed commit. Nothing was written.`)
  }
}

// ── UNDO: put the page back exactly as one earlier run found it ────────
if (UNDO) {
  const dir = path.resolve(UNDO)
  const recordFile = path.join(dir, 'record.json')
  if (!fs.existsSync(recordFile)) fail(`${dir} is not a record made by this script (no record.json). Nothing was written.`)
  const record = JSON.parse(fs.readFileSync(recordFile, 'utf8'))
  if (record.script !== 'trim-book-an-appointment') fail(`${dir} was not made by this script. Nothing was written.`)
  if (record.database !== dbName || record.host !== dbHost) {
    fail(`that record is of ${record.database} on ${record.host}, not ${dbName} on ${dbHost}. Nothing was written.`)
  }
  if (!record.after || record.afterVersionId === undefined) {
    fail('that run did not finish (no read-back in its record). Check the page in the admin. Nothing was written.')
  }
  await checkMigrations()
  const { page, versionId } = await readPage()
  if (page.id !== record.pageId) fail(`/${SLUG} is now page ${String(page.id)}, not ${record.pageId}. Nothing was written.`)
  if (stable(page) !== stable(record.after)) fail(`page ${String(page.id)} has changed since that run. Nothing was written.`)
  if (versionId !== record.afterVersionId) {
    fail(`page ${String(page.id)} has a newer version than that run's. Nothing was written.`)
  }
  const restore = { layout: record.before.layout, slugLock: record.before.slugLock }
  const restoredIntro = (restore.layout as Block[]).find((b) => b.blockType === 'sectionIntro')
  console.log(`page ${String(page.id)} unchanged since that run; would put back: ${typesOf(restore.layout).join(', ')}`)
  console.log(`title divider -> ${restoredIntro?.showTopDivider ? 'ticked' : 'unticked'}, slug lock -> ${String(restore.slugLock)}`)
  if (!APPLY) {
    console.log(`\nDry run. To restore: UNDO=${dir} APPLY=1 CONFIRM_DB=${dbName} (same command)`)
    process.exit(0)
  }
  if ((await latestVersion(page.id as number))?.id !== versionId) {
    fail(`page ${String(page.id)} changed while this ran. Nothing was written.`)
  }
  await payload.update({
    collection: 'pages',
    id: page.id as number,
    data: { ...restore, slug: SLUG, _status: 'published' },
    context,
    overrideLock: false,
    depth: 0,
  })
  const back = (await payload.findByID({ collection: 'pages', id: page.id as number, depth: 0 })) as Doc
  const diff = firstDifference(back, { ...restore, slug: SLUG, _status: 'published' })
  if (diff) fail(`page ${String(page.id)} was restored but reads back differently (at ${diff}). Check it in the admin.`)
  console.log(`page ${String(page.id)} restored as it was before ${record.startedAt}.`)
  console.log('Now purge Vercel\'s Data Cache, as after the trim.')
  process.exit(0)
}

// ── TRIM: checks first, then one write ─────────────────────────────────
await checkMigrations()
const { page, versionId: seenVersionId } = await readPage()
const layout = (page.layout as Block[]) || []
const types = typesOf(layout)
console.log(`page ${String(page.id)} "${String(page.title)}" on /${SLUG}, published; slug lock ${String(page.slugLock)}`)
console.log(`blocks now: ${types.join(', ')}`)

const intro = layout.find((b) => b.blockType === 'sectionIntro')
if (stable(blocksOf(layout)) === stable(AFTER_BLOCKS) && intro?.showTopDivider === false && page.slugLock === false) {
  console.log('Already trimmed, nothing to do.')
  process.exit(0)
}
if (stable(blocksOf(layout)) !== stable(BEFORE_BLOCKS)) {
  fail(
    `the blocks are not the 8 this script expects (${BEFORE_BLOCKS.map(([id, t]) => `${t} ${id.slice(-4)}`).join(', ')}); ` +
      'the page was edited since. Nothing was written.',
  )
}
if (intro?.showTopDivider !== true) fail('the title block\'s top divider is already unticked; the page was edited since. Nothing was written.')

const removed = layout.filter((b) => REMOVE_TYPES.has(b.blockType))
const kept = layout
  .filter((b) => !REMOVE_TYPES.has(b.blockType))
  .map((b) => (b.blockType === 'sectionIntro' ? { ...b, showTopDivider: false } : b))
console.log('will remove:')
for (const b of removed) console.log(`  - ${describe(b)}`)
console.log(`will keep: ${kept.map(describe).join(', ')}`)
console.log('will untick: the title block\'s top divider, and the slug lock (the slug stays book-an-appointment)')
if (!APPLY) {
  console.log(`\nDry run. To trim: APPLY=1 CONFIRM_DB=${dbName} (same command)`)
  process.exit(0)
}

// record first, so the page can always be put back
const dir = path.join(RECORD_ROOT, `${new Date().toISOString().replace(/[:.]/g, '-')}-trim-${SLUG}`)
fs.mkdirSync(dir, { recursive: true })
const record: Doc = {
  script: 'trim-book-an-appointment',
  database: dbName,
  host: dbHost,
  startedAt: new Date().toISOString(),
  pageId: page.id,
  before: page,
  beforeVersionId: seenVersionId,
}
const save = () => fs.writeFileSync(path.join(dir, 'record.json'), `${JSON.stringify(record, null, 1)}\n`)
save()
console.log(`record: ${dir}`)

// Nothing may have been saved on the page since the checks above.
if ((await latestVersion(page.id as number))?.id !== seenVersionId) {
  fail(`page ${String(page.id)} changed while this ran. Nothing was written. Run it again.`)
}
try {
  await payload.update({
    collection: 'pages',
    id: page.id as number,
    // The slug is given too, so the write can never move the page.
    data: { layout: kept, slug: SLUG, slugLock: false, _status: 'published' },
    context,
    overrideLock: false,
    depth: 0,
  })
  const back = (await payload.findByID({ collection: 'pages', id: page.id as number, depth: 0 })) as Doc
  record.after = back
  record.afterVersionId = (await latestVersion(page.id as number))?.id
  save()
  // Everything kept must read back as it was, apart from the two ticks.
  const diff = firstDifference(back, { layout: kept, slugLock: false, slug: SLUG, title: page.title, meta: page.meta, _status: 'published' })
  if (diff) fail(`page ${String(page.id)} was trimmed but reads back differently (at ${diff}). Put it back with UNDO=${dir} APPLY=1 CONFIRM_DB=${dbName}`)
} catch (err) {
  // The update is one transaction: when it failed, the newest version is
  // still the one seen above and nothing was written.
  const now = await latestVersion(page.id as number).catch(() => undefined)
  fail(
    now?.id === seenVersionId
      ? `${(err as Error).message}\nNothing was written.`
      : `${(err as Error).message}\nThe run stopped after writing. The page as it was is in ${dir}; check the page in the admin.`,
  )
}
console.log(`page ${String(page.id)} trimmed and published: ${AFTER_BLOCKS.map(([, t]) => t).join(', ')}.`)
console.log(`\nDone. Now purge Vercel's Data Cache (step 3). To put the page back: UNDO=${dir} APPLY=1 CONFIRM_DB=${dbName} (same command)`)
process.exit(0)
