/**
 * PRODUCTION: shows the whole haveli photo (Shekhawat Haveli at dusk, the
 * media library's artboard-15.jpg, 7681 x 3781) as the banner at the top of
 * fourteen pages. Run by hand on a developer's machine, never on Vercel. It
 * uploads nothing: the photo is already in production's media library (id 22
 * on 26 Oct 2026).
 *   - ADDS it, as a new first block, to the ten pages that open straight on
 *     their title today: Contact, FAQ, Terms of Use, Cookies Policy,
 *     Accessibility Statement, Sitemap, Press, Testimonials, Book Your
 *     Appointment, Museum Guidelines. The new block is an Image Banner,
 *     height "Natural" (the whole photo at its own 2:1 shape, never
 *     cropped), header theme "Dark" (a light nav over the photo), no caption.
 *   - SWAPS it into the existing banner of the four pages that show a thin
 *     4:1 strip cut from the same view: About (about-inner-banner-cropped.jpg),
 *     Craft Your Jewellery (inner-banner-cropped-1.jpg), Personal
 *     Consultation (inner-banner-cropped-3.jpg), Thank You
 *     (inner-banner-cropped-5.jpg). Only the photo changes; the block keeps
 *     its height ("Natural"), header theme and caption, so the banner grows
 *     from a strip to the whole photo. The strip files stay in the library.
 *   - On Book Your Appointment and the Sitemap it also ADDS the gold lotus
 *     divider (a Divider block, as on the legal pages: all devices, large
 *     spacing) right after the title block, above the form / the page tree.
 *     A page that already has a divider there keeps it.
 * Nothing else on those pages changes.
 *
 * ORDER:
 *   1. Deploy the commit this script is run from.
 *   2. Make sure nobody has any of the fourteen pages open in the admin, in
 *      any tab (an idle tab holds the old page and would undo the change on
 *      its next keystroke). Run this script: a dry run, then APPLY (below).
 *   3. Purge Vercel's Data Cache (project Settings -> Data Cache). The live
 *      server caches each page's content for up to a year and this script
 *      cannot reach that cache, so until the purge the pages look as before.
 *      After the purge they update within 10 minutes (the revalidate time).
 *   4. Check a few of the pages on momhindia.org (for example /contact,
 *      /book-an-appointment and /about): the whole haveli photo spans the
 *      top, the menu icon over it is light, the title sits at its bottom.
 *      Run the dry run once more: every page must print "already has the
 *      haveli banner" (Book Your Appointment and the Sitemap: "... and the
 *      divider").
 *   The <slug>.json files of the eight pages apply-production.mts knows
 *   (contact, faq, terms, cookies-policy, accessibility, sitemap, press,
 *   testimonials) carry the same banner, so after step 2 its dry run still
 *   prints "already there and identical, skip" for them. Between the deploy
 *   and step 2 its dry run stops on those eight ("differs"); that is
 *   expected until this script has run.
 *   Keep the four strip files in the media library: no page uses them once
 *   swapped, but an UNDO puts them back.
 *
 * WHAT IT DOES
 *   - Dry run by default: prints each page, what it would change, and writes
 *     nothing. Check that its "database:" line is production's before copying
 *     the name into CONFIRM_DB: when DATABASE_URI is not set, Payload falls
 *     back to the .env in this checkout (your local database).
 *   - Writes only with APPLY=1 and CONFIRM_DB=<the database name it prints>.
 *   - Checks every page before writing any. It stops unless, for each page:
 *     exactly one published page has the slug, its newest version is that
 *     published one (no unpublished draft), nobody has edited it in the admin
 *     in the last 5 minutes, and its first block is as found on 26 Oct 2026:
 *     the title block (Section Intro) on the ten pages that get a banner, a
 *     "Natural" banner showing that page's strip on the other four. A page
 *     whose first block is already the haveli banner prints "already has the
 *     haveli banner" and is left alone; on Book Your Appointment and the
 *     Sitemap that also needs the divider after the title block, else only
 *     the divider is added (the title block must then follow the banner). It also stops unless the media
 *     library holds exactly one artboard-15.jpg of 7681 x 3781 and exactly
 *     one of each strip file, and
 *     unless the newest migration in this checkout is the newest one applied
 *     to the database, so a checkout behind production cannot drop fields it
 *     does not know.
 *   - Writes only the new first block, or the photo of the existing banner,
 *     plus the divider on Book Your Appointment and the Sitemap, and gives
 *     the slug with each write, so a page with the slug lock on cannot move.
 *     Every other block, the title, the slug, the slug lock and the SEO fields
 *     are kept exactly; the read-back after each write checks that.
 *   - Never changes the database structure: Payload's dev-mode schema push is
 *     off (NODE_ENV=production) and the config's onInit table bootstrap is
 *     skipped. Refuses when PAYLOAD_DROP_DATABASE is set.
 *   - Before writing, saves every page as it was in a record outside the repo
 *     (RECORD_DIR, default ~/momh-page-apply-records/<time>-haveli-banner/)
 *     and adds each page's result the moment it is written. UNDO=<that folder>
 *     puts back exactly the pages that run changed, only in the same
 *     database, and only if none of them has been changed, given a draft or
 *     opened in the admin since. If an UNDO stops part-way, run it again:
 *     pages it already put back are skipped. Purge the Data Cache again
 *     after an UNDO, and take the banner out of the eight <slug>.json files
 *     in a follow-up commit.
 *
 * RUN from the repo root (Node 22), with production's DATABASE_URI:
 *   pnpm payload run scripts/page-content/haveli-banner.mts                                  dry run
 *   APPLY=1 CONFIRM_DB=<database> pnpm payload run scripts/page-content/haveli-banner.mts    make the change
 *   UNDO=<record folder> pnpm payload run scripts/page-content/haveli-banner.mts             (dry run; add APPLY=1 CONFIRM_DB=<database> to remove them)
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const SCRIPT = 'haveli-banner'
// Pages that get the banner as a new first block, above their title.
const ADD_SLUGS = [
  'contact',
  'faq',
  'terms',
  'cookies-policy',
  'accessibility',
  'sitemap',
  'press',
  'testimonials',
  'book-an-appointment',
  'museum-guidelines',
]
// Pages whose first block is a banner showing this strip: the photo is swapped.
const SWAP: Record<string, string> = {
  about: 'about-inner-banner-cropped.jpg',
  'craft-your-jewellery': 'inner-banner-cropped-1.jpg',
  'personal-consultation': 'inner-banner-cropped-3.jpg',
  'thank-you': 'inner-banner-cropped-5.jpg',
}
// Pages that also get the gold lotus divider right after their title block.
const DIVIDER_AFTER_TITLE = ['book-an-appointment', 'sitemap']
const DIVIDER = { blockType: 'divider', showOn: 'all', desktopSpacing: 'large', mobileSpacing: 'large' }
const MEDIA_FILE = 'artboard-15.jpg'
const MEDIA_SIZE = { width: 7681, height: 3781 }
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
console.log(`mode: ${UNDO ? `undo ${path.resolve(UNDO)}` : 'the haveli banner'}, ${APPLY ? 'WRITING' : 'dry run, nothing is written'}`)
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

// What to do when a page has a draft: never publish it as it stands.
const draftAdvice = (slug: string) =>
  'Do NOT publish that draft as it stands: on a page with the slug lock on, the admin rewrites the slug from the ' +
  `title, and publishing would move the page off /${slug}. Ask a developer, or in the admin check the slug is ` +
  `${slug} and nothing else changed, publish, then run this again.`

// A live page, read twice: as published and as its newest draft. They must be
// the same document, or someone has unpublished changes in the admin. Returns
// the page and the id of its newest version, for the write to check.
const readPage = async (slug: string): Promise<{ page: Doc; versionId: unknown }> => {
  const live = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, depth: 0, limit: 5 })
  if (live.docs.length !== 1) fail(`${live.docs.length} published pages use /${slug}; expected 1. Nothing was written.`)
  const page = live.docs[0] as Doc
  if (page._status !== 'published') fail(`/${slug}: page ${String(page.id)} is not published (${String(page._status)}). Nothing was written.`)
  const newest = (await payload.findByID({ collection: 'pages', id: page.id as number, draft: true, depth: 0 })) as Doc
  if (stable(newest) !== stable(page)) {
    const moved = newest.slug !== slug ? ` Its newest draft has the slug "${String(newest.slug)}".` : ''
    fail(`/${slug}: page ${String(page.id)} has unpublished changes (a newer draft).${moved} ${draftAdvice(slug)} Nothing was written.`)
  }
  const version = await latestVersion(page.id as number)
  const v = (version?.version ?? {}) as Doc
  if (!version || v._status !== 'published' || v.slug !== slug) {
    fail(`/${slug}: page ${String(page.id)}'s newest version is not its published one (a draft or an older version is newer). ${draftAdvice(slug)} Nothing was written.`)
  }
  if (await recentLock(page.id as number)) {
    fail(`/${slug}: page ${String(page.id)} was edited in the admin in the last 5 minutes. Close it in every tab and wait 5 minutes. Nothing was written.`)
  }
  return { page, versionId: version?.id }
}

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

const typesOf = (layout: unknown): string[] => ((layout as Block[]) || []).map((b) => b.blockType)

// ── UNDO: put back exactly the pages one earlier run changed ──────────
if (UNDO) {
  const dir = path.resolve(UNDO)
  const recordFile = path.join(dir, 'record.json')
  if (!fs.existsSync(recordFile)) fail(`${dir} is not a record made by this script (no record.json). Nothing was written.`)
  const record = JSON.parse(fs.readFileSync(recordFile, 'utf8'))
  if (record.script !== SCRIPT) fail(`${dir} was not made by this script. Nothing was written.`)
  if (record.database !== dbName || record.host !== dbHost) {
    fail(`that record is of ${record.database} on ${record.host}, not ${dbName} on ${dbHost}. Nothing was written.`)
  }
  const saveRecord = () => fs.writeFileSync(recordFile, `${JSON.stringify(record, null, 1)}\n`)
  const entries = record.pages as Doc[]
  // A page that run started writing but never recorded (it stopped between the
  // write and the read-back) cannot be vouched for: if it has changed since,
  // that run may have written it, or a later run did (that run's own record
  // covers it then). It is left alone here and named again at the end.
  const uncertain: string[] = []
  for (const p of entries.filter((e) => !e.after)) {
    const slug = `/${String(p.slug)}`
    if (p.attemptedAt && (await latestVersion(p.pageId as number))?.id !== p.beforeVersionId) {
      uncertain.push(slug)
      console.log(`${slug.padEnd(23)} that run may have written it before stopping; left alone here, check it in the admin`)
    } else {
      console.log(`${slug.padEnd(23)} not written by that run, nothing to put back`)
    }
  }
  const checkLine = () =>
    uncertain.length
      ? `\nNot put back: ${uncertain.join(', ')}. If one still shows the haveli banner and no later run's record covers it, put it back in the admin.`
      : ''
  const done = entries.filter((e) => e.after && e.afterVersionId !== undefined)
  if (!done.length) fail('that run wrote no page. Nothing was written.')
  await checkMigrations()
  // Every page first: if any one has changed since, nothing is put back. A
  // page an earlier UNDO of this record already put back is skipped, so an
  // UNDO that stopped part-way can simply be run again.
  const plan: { entry: Doc; slug: string; id: unknown; versionId: unknown; layout: Block[] }[] = []
  for (const p of done) {
    const slug = String(p.slug)
    const { page, versionId } = await readPage(slug)
    if (page.id !== p.pageId) fail(`/${slug} is now page ${String(page.id)}, not ${String(p.pageId)}. Nothing was written.`)
    const before = (p.before as Doc).layout as Block[]
    if (versionId === p.undoneVersionId || stable(page.layout) === stable(before)) {
      console.log(`/${slug.padEnd(22)} already put back, skip`)
      continue
    }
    if (stable(page) !== stable(p.after)) fail(`/${slug}: page ${String(page.id)} has changed since that run. Nothing was written.`)
    if (versionId !== p.afterVersionId) fail(`/${slug}: page ${String(page.id)} has a newer version than that run's. Nothing was written.`)
    // The photo the old banner showed must still be in the media library
    // (the four strips are used by no page once swapped; do not delete them).
    for (const b of before.filter((x) => x.blockType === 'imageBanner')) {
      const found = await payload.find({ collection: 'media', where: { id: { equals: b.image } }, depth: 0, limit: 1 })
      if (!found.docs.length) fail(`/${slug}: its old banner photo (media ${String(b.image)}) is no longer in the media library, so it cannot be put back. Nothing was written.`)
    }
    plan.push({ entry: p, slug, id: page.id, versionId, layout: before })
    console.log(`/${slug.padEnd(22)} unchanged since that run; would put back: ${typesOf(before).join(', ')}`)
  }
  if (!plan.length) {
    console.log(`\nEvery page is already put back, nothing to do.${checkLine()}`)
    process.exit(0)
  }
  if (!APPLY) {
    console.log(`\nDry run. To put the pages back: UNDO=${dir} APPLY=1 CONFIRM_DB=${dbName} (same command)${checkLine()}`)
    process.exit(0)
  }
  const restored: string[] = []
  for (const [i, p] of plan.entries()) {
    const progress = () =>
      `Put back so far: ${restored.join(', ') || 'none'}; not yet: ${plan.slice(i).map((x) => `/${x.slug}`).join(', ')}. ` +
      'Run the same UNDO again to finish; pages already put back are skipped.'
    if ((await latestVersion(p.id as number))?.id !== p.versionId) {
      fail(`/${p.slug}: page ${String(p.id)} changed while this ran. ${progress()}`)
    }
    try {
      await payload.update({
        collection: 'pages',
        id: p.id as number,
        data: { layout: p.layout, slug: p.slug, _status: 'published' },
        context,
        overrideLock: false,
        depth: 0,
      })
    } catch (err) {
      const now = await latestVersion(p.id as number).catch(() => undefined)
      fail(`${(err as Error).message}\n/${p.slug}: ${now?.id === p.versionId ? 'not written' : 'the write may have happened; check it in the admin'}. ${progress()}`)
    }
    const back = (await payload.findByID({ collection: 'pages', id: p.id as number, depth: 0 })) as Doc
    p.entry.undoneAt = new Date().toISOString()
    p.entry.undoneVersionId = (await latestVersion(p.id as number))?.id
    saveRecord()
    const diff = firstDifference(back, { layout: p.layout, slug: p.slug, _status: 'published' })
    if (diff) fail(`/${p.slug}: page ${String(p.id)} was put back but reads back differently (at ${diff}). Check it in the admin.`)
    restored.push(`/${p.slug}`)
    console.log(`/${p.slug.padEnd(22)} put back as it was before ${String(record.startedAt)}`)
  }
  console.log(`\nDone. Now purge Vercel's Data Cache, as after the change.${checkLine()}`)
  console.log('The 8 <slug>.json files of this commit still carry the banner: take it out of them in a follow-up commit, or apply-production.mts stops on those pages.')
  process.exit(0)
}

// ── ADD and SWAP: every check first, then one write per page ───────────
await checkMigrations()
const mediaByName = async (filename: string): Promise<Doc> => {
  const found = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, depth: 0, limit: 5 })
  if (found.docs.length !== 1) fail(`the media library holds ${found.docs.length} files named ${filename}; expected 1. Nothing was written.`)
  return found.docs[0] as Doc
}
const photo = await mediaByName(MEDIA_FILE)
if (photo.width !== MEDIA_SIZE.width || photo.height !== MEDIA_SIZE.height) {
  fail(`${MEDIA_FILE} (media ${String(photo.id)}) is ${String(photo.width)} x ${String(photo.height)}, not ${MEDIA_SIZE.width} x ${MEDIA_SIZE.height}; it is not the haveli photo. Nothing was written.`)
}
console.log(`photo: ${MEDIA_FILE}, media ${String(photo.id)}, ${String(photo.width)} x ${String(photo.height)}, alt "${String(photo.alt)}"`)
const BANNER = { blockType: 'imageBanner', image: photo.id, headerTheme: 'dark', height: 'natural' }
const isOurBanner = (b: Block | undefined) =>
  b?.blockType === 'imageBanner' && b.image === photo.id && b.height === BANNER.height && b.headerTheme === BANNER.headerTheme

const toAdd: { slug: string; page: Doc; versionId: unknown; layout: Block[]; done: string }[] = []
for (const slug of ADD_SLUGS) {
  const { page, versionId } = await readPage(slug)
  const layout = (page.layout as Block[]) || []
  const hasBanner = isOurBanner(layout[0])
  const wantsDivider = DIVIDER_AFTER_TITLE.includes(slug)
  if (hasBanner && !wantsDivider) {
    console.log(`/${slug.padEnd(22)} already has the haveli banner, skip`)
    continue
  }
  const rest = hasBanner ? layout.slice(1) : layout
  if (rest[0]?.blockType !== 'sectionIntro') {
    fail(`/${slug}: its ${hasBanner ? 'block after the banner' : 'first block'} is ${rest[0]?.blockType ?? 'missing'}, not the title block (sectionIntro); the page was edited since 26 Oct 2026. Nothing was written.`)
  }
  const addDivider = wantsDivider && rest[1]?.blockType !== 'divider'
  if (hasBanner && !addDivider) {
    console.log(`/${slug.padEnd(22)} already has the haveli banner and the divider, skip`)
    continue
  }
  const next = [hasBanner ? layout[0] : (BANNER as Block), rest[0], ...(addDivider ? [DIVIDER as Block] : []), ...rest.slice(1)]
  const what = [hasBanner ? '' : 'the banner', addDivider ? 'the divider after the title block' : ''].filter(Boolean).join(' and ')
  const done = [hasBanner ? '' : 'banner', addDivider ? 'divider' : ''].filter(Boolean).join(' and ')
  toAdd.push({ slug, page, versionId, layout: next, done: `${done} added` })
  console.log(`/${slug.padEnd(22)} page ${String(page.id)}: will add ${what} (${typesOf(next).slice(0, 4).join(', ')}${next.length > 4 ? ', ...' : ''}; ${layout.length} blocks kept)`)
}
for (const [slug, stripFile] of Object.entries(SWAP)) {
  const { page, versionId } = await readPage(slug)
  const layout = (page.layout as Block[]) || []
  const first = layout[0]
  if (first?.blockType === 'imageBanner' && first.image === photo.id) {
    console.log(`/${slug.padEnd(22)} already has the haveli banner, skip`)
    continue
  }
  const strip = await mediaByName(stripFile)
  if (first?.blockType !== 'imageBanner' || first.image !== strip.id) {
    fail(`/${slug}: its first block is ${first?.blockType ?? 'missing'}${first?.blockType === 'imageBanner' ? ` showing media ${String(first.image)}` : ''}, not the banner showing ${stripFile} (media ${String(strip.id)}); the page was edited since 26 Oct 2026. Nothing was written.`)
  }
  if (first.height !== 'natural') {
    fail(`/${slug}: its banner's height is "${String(first.height)}", not "natural"; the whole photo would not show. Nothing was written.`)
  }
  toAdd.push({ slug, page, versionId, layout: [{ ...first, image: photo.id }, ...layout.slice(1)], done: 'photo swapped' })
  console.log(`/${slug.padEnd(22)} page ${String(page.id)}: will swap the banner's ${stripFile} for ${MEDIA_FILE} (height, header theme and the other ${layout.length - 1} blocks kept)`)
}
if (!toAdd.length) {
  console.log('\nEvery page already has the haveli banner (and Book Your Appointment and the Sitemap their divider), nothing to do.')
  process.exit(0)
}
if (!APPLY) {
  console.log(`\nDry run. To make these changes: APPLY=1 CONFIRM_DB=${dbName} (same command)`)
  process.exit(0)
}

// record first, so every page can always be put back
const dir = path.join(RECORD_ROOT, `${new Date().toISOString().replace(/[:.]/g, '-')}-${SCRIPT}`)
fs.mkdirSync(dir, { recursive: true })
const record: Doc & { pages: Doc[] } = {
  script: SCRIPT,
  database: dbName,
  host: dbHost,
  startedAt: new Date().toISOString(),
  mediaId: photo.id,
  pages: toAdd.map((p) => ({ slug: p.slug, pageId: p.page.id, before: p.page, beforeVersionId: p.versionId })),
}
const save = () => fs.writeFileSync(path.join(dir, 'record.json'), `${JSON.stringify(record, null, 1)}\n`)
save()
console.log(`record: ${dir}`)

for (const [i, p] of toAdd.entries()) {
  const id = p.page.id as number
  const undoHint = i ? ` Pages written so far can be put back with UNDO=${dir} APPLY=1 CONFIRM_DB=${dbName}` : ''
  // Nothing may have been saved on the page since the checks above.
  if ((await latestVersion(id))?.id !== p.versionId) {
    fail(`/${p.slug}: page ${id} changed while this ran; it and the pages after it were not written.${undoHint}`)
  }
  // Marked before the write, so a run that stops between the write and the
  // read-back is never mistaken by UNDO for a page it did not touch.
  record.pages[i].attemptedAt = new Date().toISOString()
  save()
  try {
    await payload.update({
      collection: 'pages',
      id,
      // The slug is given too, so the write can never move the page.
      data: { layout: p.layout, slug: p.slug, _status: 'published' },
      context,
      overrideLock: false,
      depth: 0,
    })
  } catch (err) {
    // The update is one transaction: when it failed, the newest version is
    // still the one seen above and nothing was written on this page.
    const now = await latestVersion(id).catch(() => undefined)
    fail(
      now?.id === p.versionId
        ? `${(err as Error).message}\n/${p.slug}: nothing was written on this page or the ones after it.${undoHint}`
        : `${(err as Error).message}\n/${p.slug}: the run stopped after writing. The page as it was is in ${dir}; check it in the admin.`,
    )
  }
  const back = (await payload.findByID({ collection: 'pages', id, depth: 0 })) as Doc
  const entry = record.pages[i]
  entry.after = back
  entry.afterVersionId = (await latestVersion(id))?.id
  save()
  // The banner first, then every other block as it was; title, slug, lock and SEO unchanged.
  const diff = firstDifference(back, {
    layout: p.layout,
    slug: p.slug,
    slugLock: p.page.slugLock,
    title: p.page.title,
    meta: p.page.meta,
    _status: 'published',
  })
  if (diff) fail(`/${p.slug}: page ${id} reads back differently (at ${diff}). Put the pages back with UNDO=${dir} APPLY=1 CONFIRM_DB=${dbName}`)
  console.log(`/${p.slug.padEnd(22)} ${p.done} and published`)
}
console.log(`\nDone. Now purge Vercel's Data Cache (step 3). To put the pages back: UNDO=${dir} APPLY=1 CONFIRM_DB=${dbName} (same command)`)
process.exit(0)
