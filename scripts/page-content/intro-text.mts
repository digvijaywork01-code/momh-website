/**
 * PRODUCTION: the text under the opening photo on five pages (follow-up to
 * the haveli banner, PR #14). With PR #14 a page's label, title and the
 * FIRST sentence of its intro sit on the opening photo, and the rest of the
 * intro stays in the block below it. These five intros were one sentence,
 * so nothing was left below the photo. Run by hand on a developer's
 * machine, never on Vercel.
 *   - ADDS a second sentence (or two) to the title block (Section Intro,
 *     "body") of About, Contact, Founder's Vision and Sitemap: after the
 *     existing sentence, in the same paragraph, separated by one space. The
 *     existing sentence (the one shown on the photo) is not changed.
 *   - INSERTS one new Section Intro on The Architecture, between the opening
 *     hero and the first band ("A Facade Carved by Hand"): white, no hairline
 *     divider, display heading style, tight top and bottom padding, no
 *     eyebrow, no headline, no buttons, one paragraph of text.
 * Nothing else on those pages changes. Each title block is found by its id
 * (Contact and Sitemap open on it today; their banner only arrives with
 * haveli-banner.mts), so the two scripts can run in either order.
 *
 * ORDER (with PR #14's release):
 *   1. Deploy the commit this script is run from.
 *   2. Run haveli-banner.mts (its own dry run, then APPLY).
 *   3. Make sure nobody has About, Contact, Founder's Vision, Sitemap or The
 *      Architecture open in the admin, in any tab. Run this script: a dry
 *      run, then APPLY (below).
 *   4. Purge Vercel's Data Cache (project Settings -> Data Cache), as for
 *      PR #14. The pages update within 10 minutes after the purge.
 *   5. Check /about, /contact, /founders-vision, /sitemap: the existing
 *      sentence on the photo, the new text once, directly under it. On
 *      /architecture the new paragraph sits right under the hero. Run the
 *      dry run once more: every page must print "already has the text".
 *   contact.json and sitemap.json in this commit carry the same text, so
 *   apply-production.mts still prints "identical" for those two pages after
 *   step 3 (between the deploy and step 3 its dry run reports them as
 *   differing; that is expected).
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
 *     in the last 5 minutes, and its content is as found on 28 Oct 2026: the
 *     title block with that id holds exactly the existing sentence (one
 *     paragraph), and on The Architecture the hero is directly followed by
 *     the band with that id. A page that already has the new text prints
 *     "already has the text" and is left alone. It also stops unless the
 *     newest migration in this checkout is the newest one applied to the
 *     database, so a checkout behind production cannot drop fields it does
 *     not know.
 *   - Writes only that block's text or the one new block, and gives the slug
 *     with each write, so a page with the slug lock on cannot move. Every
 *     other block, the title, the slug, the slug lock and the SEO fields are
 *     kept exactly; the read-back after each write checks that.
 *   - Never changes the database structure: Payload's dev-mode schema push is
 *     off (NODE_ENV=production) and the config's onInit table bootstrap is
 *     skipped. Refuses when PAYLOAD_DROP_DATABASE is set.
 *   - Before writing, saves every page as it was in a record outside the repo
 *     (RECORD_DIR, default ~/momh-page-apply-records/<time>-intro-text/) and
 *     adds each page's result the moment it is written. UNDO=<that folder>
 *     puts back exactly the pages that run changed, only in the same
 *     database, and only if none of them has been changed, given a draft or
 *     opened in the admin since. If an UNDO stops part-way, run it again:
 *     pages it already put back are skipped. Purge the Data Cache again
 *     after an UNDO, and take the text out of contact.json and sitemap.json
 *     in a follow-up commit.
 *
 * RUN from the repo root (Node 22), with production's DATABASE_URI:
 *   pnpm payload run scripts/page-content/intro-text.mts                                  dry run
 *   APPLY=1 CONFIRM_DB=<database> pnpm payload run scripts/page-content/intro-text.mts    make the change
 *   UNDO=<record folder> pnpm payload run scripts/page-content/intro-text.mts             (dry run; add APPLY=1 CONFIRM_DB=<database> to put the pages back)
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const SCRIPT = 'intro-text'
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
  if (process.env[k])
    fail(`${k} is set; run this on a developer's machine, not on Vercel. Nothing was written.`)
}
if (process.env.PAYLOAD_DROP_DATABASE)
  fail(
    'PAYLOAD_DROP_DATABASE is set; Payload would empty the database on connect. Nothing was written.',
  )
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
    fail(
      `DATABASE_URI is a ${parsed.protocol} address; only postgres:// is accepted. Nothing was written.`,
    )
  }
  dbHost = parsed.hostname
  dbPort = parsed.port || '5432'
  dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
  // pg takes host, port and dbname from the query string ahead of the URL's
  // own, so the name printed (and confirmed) would not be the database written.
  for (const k of parsed.searchParams.keys()) {
    if (!ALLOWED_PARAMS.has(k))
      fail(`DATABASE_URI sets ${k} in its query string. Nothing was written.`)
  }
}
if (!dbHost || dbHost.startsWith('/') || dbHost.startsWith('%2F'))
  fail('DATABASE_URI names no network host. Nothing was written.')
if (!dbName) fail('DATABASE_URI names no database. Nothing was written.')
console.log(`database: ${dbName} on ${dbHost}:${dbPort}`)
console.log(
  `mode: ${UNDO ? `undo ${path.resolve(UNDO)}` : 'the intro text'}, ${APPLY ? 'WRITING' : 'dry run, nothing is written'}`,
)
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
    where: {
      and: [{ 'document.relationTo': { equals: 'pages' } }, { 'document.value': { equals: id } }],
    },
    depth: 0,
    limit: 10,
  })
  return locks.docs.some(
    (l: { updatedAt?: string }) =>
      Date.now() - new Date(l.updatedAt || 0).getTime() < LOCK_SECONDS * 1000,
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
  const live = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 5,
  })
  if (live.docs.length !== 1)
    fail(`${live.docs.length} published pages use /${slug}; expected 1. Nothing was written.`)
  const page = live.docs[0] as Doc
  if (page._status !== 'published')
    fail(
      `/${slug}: page ${String(page.id)} is not published (${String(page._status)}). Nothing was written.`,
    )
  const newest = (await payload.findByID({
    collection: 'pages',
    id: page.id as number,
    draft: true,
    depth: 0,
  })) as Doc
  if (stable(newest) !== stable(page)) {
    const moved =
      newest.slug !== slug ? ` Its newest draft has the slug "${String(newest.slug)}".` : ''
    fail(
      `/${slug}: page ${String(page.id)} has unpublished changes (a newer draft).${moved} ${draftAdvice(slug)} Nothing was written.`,
    )
  }
  const version = await latestVersion(page.id as number)
  const v = (version?.version ?? {}) as Doc
  if (!version || v._status !== 'published' || v.slug !== slug) {
    fail(
      `/${slug}: page ${String(page.id)}'s newest version is not its published one (a draft or an older version is newer). ${draftAdvice(slug)} Nothing was written.`,
    )
  }
  if (await recentLock(page.id as number)) {
    fail(
      `/${slug}: page ${String(page.id)} was edited in the admin in the last 5 minutes. Close it in every tab and wait 5 minutes. Nothing was written.`,
    )
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
    await payload.find({
      collection: 'payload-migrations',
      depth: 0,
      limit: 1000,
      pagination: false,
    })
  ).docs
    .map((m: { name?: string }) => String(m.name))
    .filter((n: string) => /^\d{8}_\d{6}/.test(n))
    .sort()
  const newestHere = files.at(-1)
  const there = applied.at(-1)
  if (!newestHere || newestHere !== there) {
    fail(
      `this checkout's newest migration is ${newestHere}, the database's is ${there}. Run this from the deployed commit. Nothing was written.`,
    )
  }
}

const typesOf = (layout: unknown): string[] => ((layout as Block[]) || []).map((b) => b.blockType)

// ── UNDO: put back exactly the pages one earlier run changed ──────────
if (UNDO) {
  const dir = path.resolve(UNDO)
  const recordFile = path.join(dir, 'record.json')
  if (!fs.existsSync(recordFile))
    fail(`${dir} is not a record made by this script (no record.json). Nothing was written.`)
  const record = JSON.parse(fs.readFileSync(recordFile, 'utf8'))
  if (record.script !== SCRIPT) fail(`${dir} was not made by this script. Nothing was written.`)
  if (record.database !== dbName || record.host !== dbHost) {
    fail(
      `that record is of ${record.database} on ${record.host}, not ${dbName} on ${dbHost}. Nothing was written.`,
    )
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
      console.log(
        `${slug.padEnd(23)} that run may have written it before stopping; left alone here, check it in the admin`,
      )
    } else {
      console.log(`${slug.padEnd(23)} not written by that run, nothing to put back`)
    }
  }
  const checkLine = () =>
    uncertain.length
      ? `\nNot put back: ${uncertain.join(', ')}. If one still shows the new intro text and no later run's record covers it, put it back in the admin.`
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
    if (page.id !== p.pageId)
      fail(`/${slug} is now page ${String(page.id)}, not ${String(p.pageId)}. Nothing was written.`)
    const before = (p.before as Doc).layout as Block[]
    if (versionId === p.undoneVersionId || stable(page.layout) === stable(before)) {
      console.log(`/${slug.padEnd(22)} already put back, skip`)
      continue
    }
    if (stable(page) !== stable(p.after))
      fail(`/${slug}: page ${String(page.id)} has changed since that run. Nothing was written.`)
    if (versionId !== p.afterVersionId)
      fail(
        `/${slug}: page ${String(page.id)} has a newer version than that run's. Nothing was written.`,
      )
    plan.push({ entry: p, slug, id: page.id, versionId, layout: before })
    console.log(
      `/${slug.padEnd(22)} unchanged since that run; would put back: ${typesOf(before).join(', ')}`,
    )
  }
  if (!plan.length) {
    console.log(`\nEvery page is already put back, nothing to do.${checkLine()}`)
    process.exit(0)
  }
  if (!APPLY) {
    console.log(
      `\nDry run. To put the pages back: UNDO=${dir} APPLY=1 CONFIRM_DB=${dbName} (same command)${checkLine()}`,
    )
    process.exit(0)
  }
  const restored: string[] = []
  for (const [i, p] of plan.entries()) {
    const progress = () =>
      `Put back so far: ${restored.join(', ') || 'none'}; not yet: ${plan
        .slice(i)
        .map((x) => `/${x.slug}`)
        .join(', ')}. ` + 'Run the same UNDO again to finish; pages already put back are skipped.'
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
      fail(
        `${(err as Error).message}\n/${p.slug}: ${now?.id === p.versionId ? 'not written' : 'the write may have happened; check it in the admin'}. ${progress()}`,
      )
    }
    const back = (await payload.findByID({
      collection: 'pages',
      id: p.id as number,
      depth: 0,
    })) as Doc
    p.entry.undoneAt = new Date().toISOString()
    p.entry.undoneVersionId = (await latestVersion(p.id as number))?.id
    saveRecord()
    const diff = firstDifference(back, { layout: p.layout, slug: p.slug, _status: 'published' })
    if (diff)
      fail(
        `/${p.slug}: page ${String(p.id)} was put back but reads back differently (at ${diff}). Check it in the admin.`,
      )
    restored.push(`/${p.slug}`)
    console.log(`/${p.slug.padEnd(22)} put back as it was before ${String(record.startedAt)}`)
  }
  console.log(`\nDone. Now purge Vercel's Data Cache, as after the change.${checkLine()}`)
  console.log(
    'contact.json and sitemap.json in this commit still carry the new text: take it out of them in a follow-up commit, or apply-production.mts reports those two pages as differing.',
  )
  process.exit(0)
}

// ── ADD: every check first, then one write per page ──────────────────
await checkMigrations()

// The four title blocks that get a second sentence: found by id, and
// checked to still hold exactly the sentence shown on the photo.
const APPEND: { slug: string; blockId: string; sentence: string; add: string }[] = [
  {
    slug: 'about',
    blockId: '6a70585b304d2a00043921f7',
    sentence: 'Welcome to the Museum of Meenakari Heritage.',
    add: 'The museum opened at Shekhawat Haveli in March 2024 and is devoted to meenakari, the art of enamelling on gold. Our story tells how the craft reached Rajasthan, what its name means, and how the museum came to be.',
  },
  {
    slug: 'contact',
    blockId: '6ad3492f26df0456af232395',
    sentence:
      'Whether you are planning a visit, researching the collection, or considering a commission, our team is glad to help.',
    add: 'Below, you will see how to get in touch, where we are, and a short note on each kind of enquiry, from press and image requests to group, school and research visits.',
  },
  {
    slug: 'founders-vision',
    blockId: '6a84427a07a7c700046a17cd',
    sentence:
      'The Museum of Meenakari Heritage began as one person’s conviction that this craft deserved to be remembered, studied, and seen.',
    add: 'This page traces how that conviction took shape, from years spent among Jaipur’s goldsmiths and enamellers to the case for a museum, and how the work goes on now that its doors are open.',
  },
  {
    slug: 'sitemap',
    blockId: '6ad8b69d72462ddaf55b86c9',
    sentence: 'This is a plain list of the pages on momhindia.org.',
    add: 'The pages fall into three groups: the Museum, its story and its craft; contact, common questions and our policies; and appointments, guidelines and commissions. Each entry in the list links to its page.',
  },
]
// The new block on The Architecture, right before its first band.
const ARCH = {
  slug: 'architecture',
  beforeBlockId: '6a901b8455f1ff0004a2f6bb',
  text: 'Shekhawat Haveli stands on Sardar Patel Marg in C-Scheme, near the historic walled city. The museum shares the building with the flagship boutique of The House of Sunita Shekhawat.',
}

type Lexical = { type?: string; text?: string; children?: Lexical[] } & Doc
const textOf = (n: Lexical | undefined): string =>
  !n ? '' : typeof n.text === 'string' ? n.text : (n.children ?? []).map(textOf).join('')
const plain = (value: unknown): string =>
  textOf((value as { root?: Lexical } | null)?.root)
    .replace(/\s+/g, ' ')
    .trim()
const run = (text: string): Lexical => ({
  mode: 'normal',
  text,
  type: 'text',
  style: '',
  detail: 0,
  format: 0,
  version: 1,
})
const paragraph = (text: string): Lexical => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  children: [run(text)],
  direction: 'ltr',
  textStyle: '',
  textFormat: 0,
})

const toWrite: { slug: string; page: Doc; versionId: unknown; layout: Block[]; done: string }[] = []
for (const a of APPEND) {
  const { page, versionId } = await readPage(a.slug)
  const layout = (page.layout as Block[]) || []
  const i = layout.findIndex((b) => b.id === a.blockId)
  if (i < 0 || layout[i].blockType !== 'sectionIntro') {
    fail(
      `/${a.slug}: no title block (sectionIntro) with id ${a.blockId}; the page was edited since 28 Oct 2026. Nothing was written.`,
    )
  }
  const now = plain(layout[i].body)
  if (now === `${a.sentence} ${a.add}`) {
    console.log(`/${a.slug.padEnd(22)} already has the text, skip`)
    continue
  }
  const root = (layout[i].body as { root?: Lexical } | null)?.root
  const paras = (root?.children ?? []).filter((p) => /\S/.test(textOf(p)))
  if (now !== a.sentence || paras.length !== 1 || paras[0].type !== 'paragraph') {
    fail(
      `/${a.slug}: its title block reads "${now.slice(0, 90)}", not exactly "${a.sentence}" in one paragraph; the page was edited since 28 Oct 2026. Nothing was written.`,
    )
  }
  // A copy of the body: the new sentence as one more run of the same paragraph.
  const body = JSON.parse(JSON.stringify(layout[i].body)) as { root: Lexical }
  const para = (body.root.children ?? []).find((p) => /\S/.test(textOf(p)))!
  para.children = [...(para.children ?? []), run(` ${a.add}`)]
  const next = layout.map((b, k) => (k === i ? { ...b, body } : b))
  toWrite.push({ slug: a.slug, page, versionId, layout: next, done: 'text added' })
  console.log(
    `/${a.slug.padEnd(22)} page ${String(page.id)}: will add after "${a.sentence.slice(0, 40)}...": "${a.add.slice(0, 60)}..."`,
  )
}
{
  const { page, versionId } = await readPage(ARCH.slug)
  const layout = (page.layout as Block[]) || []
  const i = layout.findIndex((b) => b.id === ARCH.beforeBlockId)
  const prev = i > 0 ? layout[i - 1] : undefined
  if (i < 0)
    fail(
      `/${ARCH.slug}: no block with id ${ARCH.beforeBlockId} (the first band); the page was edited since 28 Oct 2026. Nothing was written.`,
    )
  if (prev?.blockType === 'sectionIntro' && plain(prev.body) === ARCH.text) {
    console.log(`/${ARCH.slug.padEnd(22)} already has the text, skip`)
  } else {
    if (i !== 1 || prev?.blockType !== 'infoHero') {
      fail(
        `/${ARCH.slug}: the first band is block ${i + 1}, after ${prev?.blockType ?? 'nothing'}, not right after the opening hero; the page was edited since 28 Oct 2026. Nothing was written.`,
      )
    }
    const INTRO = {
      blockType: 'sectionIntro',
      backgroundColor: 'white',
      showTopDivider: false,
      headingStyle: 'display',
      bodyWidth: 'normal',
      tightTop: true,
      tightBottom: true,
      body: {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [paragraph(ARCH.text)],
          direction: 'ltr',
        },
      },
    }
    const next = [...layout.slice(0, i), INTRO as Block, ...layout.slice(i)]
    toWrite.push({ slug: ARCH.slug, page, versionId, layout: next, done: 'text block added' })
    console.log(
      `/${ARCH.slug.padEnd(22)} page ${String(page.id)}: will add a text block between the hero and the first band ("${ARCH.text.slice(0, 50)}..."; ${layout.length} blocks kept)`,
    )
  }
}
if (!toWrite.length) {
  console.log('\nEvery page already has the text, nothing to do.')
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
  pages: toWrite.map((p) => ({
    slug: p.slug,
    pageId: p.page.id,
    before: p.page,
    beforeVersionId: p.versionId,
  })),
}
const save = () =>
  fs.writeFileSync(path.join(dir, 'record.json'), `${JSON.stringify(record, null, 1)}\n`)
save()
console.log(`record: ${dir}`)

for (const [i, p] of toWrite.entries()) {
  const id = p.page.id as number
  const undoHint = i
    ? ` Pages written so far can be put back with UNDO=${dir} APPLY=1 CONFIRM_DB=${dbName}`
    : ''
  // Nothing may have been saved on the page since the checks above.
  if ((await latestVersion(id))?.id !== p.versionId) {
    fail(
      `/${p.slug}: page ${id} changed while this ran; it and the pages after it were not written.${undoHint}`,
    )
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
  // The new text, then every other block as it was; title, slug, lock and SEO unchanged.
  const diff = firstDifference(back, {
    layout: p.layout,
    slug: p.slug,
    slugLock: p.page.slugLock,
    title: p.page.title,
    meta: p.page.meta,
    _status: 'published',
  })
  if (diff)
    fail(
      `/${p.slug}: page ${id} reads back differently (at ${diff}). Put the pages back with UNDO=${dir} APPLY=1 CONFIRM_DB=${dbName}`,
    )
  console.log(`/${p.slug.padEnd(22)} ${p.done} and published`)
}
console.log(
  `\nDone. Now purge Vercel's Data Cache (step 4). To put the pages back: UNDO=${dir} APPLY=1 CONFIRM_DB=${dbName} (same command)`,
)
process.exit(0)
