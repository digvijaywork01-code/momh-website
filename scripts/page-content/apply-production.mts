/**
 * PRODUCTION: adds the new MOMH pages (Contact Us, FAQ, Accessibility
 * Statement, Press) to the live database, from the same <slug>.json files the
 * local loader uses, so production gets exactly the pages reviewed on
 * localhost. Run by hand on a developer's machine, never on Vercel.
 *
 * PRESS (feat/press-page): before step 1, upload the 34 press photos with
 * upload-media.mts (dry run, then APPLY; see its header). This script finds
 * them by file name and, when it adds the Press page, stops if one is missing,
 * appears twice, or is not the photo shipped in media/press/ (pixel size,
 * stored size or alt text differs). press.json must have every article
 * address filled in: the script stops while any card still points at
 * https://url-needed.invalid/. If Contact, FAQ and Accessibility went live
 * before Press, they print "already there and identical, skip"; if one of them
 * was edited in the admin since, it differs and stops the run: then add Press
 * alone with ONLY=press ALLOW_PARTIAL=1 (their routes are already live).
 *
 * SITEMAP (feat/sitemap-page) brings a migration again: the Site Map block's
 * new tables (MIGRATION below). Follow ORDER from step 1: migrate production,
 * then the dry run (pages already live print "already there and identical,
 * skip", sitemap prints "will add"), APPLY, and deploy straight after. Its
 * Cookies Policy and Testimonials links are live from day one and show "page
 * not found" until those pages are released; nothing needs doing on the
 * Sitemap when they are. After the deploy: /sitemap returns 200 and the
 * footer's Sitemap is a link.
 *
 * ORDER, so no visitor ever sees "page not found":
 *   0. The release ships every page here at once (routes and footer links in
 *      one deploy), so every page's wording must be signed off first, the
 *      Accessibility Statement included (owner and legal). Any change goes
 *      into its <slug>.json before step 2.
 *   1. From the reviewed branch, apply its migration to production first
 *      (`pnpm payload migrate` with production's DATABASE_URI). It only adds
 *      empty columns and the Press Grid's empty tables; the live site ignores
 *      them.
 *   2. Run this script: a dry run, then APPLY (below), for EVERY page (no
 *      ONLY). The pages are added and published, but nobody can reach them
 *      yet: the live code has no /contact, /faq or /accessibility route.
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
 * LATER PAGES (Terms of Use, feat/terms-of-use): run the dry run and APPLY
 * from the exact commit that will be deployed. When the earlier pages are
 * already live, the dry run should print "already there and identical, skip"
 * for them and "will add" for the new page only: then APPLY with no ONLY and
 * deploy straight after (no migration: Terms uses existing blocks and the
 * share image og-momh.jpg). If a live page was edited in the admin since, or
 * its newest draft moved to another slug, the run stops. Then add the new page
 * alone with ONLY=terms ALLOW_PARTIAL=1, but only if every other page with a
 * <slug>.json in that commit is already live on momhindia.org (for example
 * /press, once Press is merged); otherwise the deploy would ship a route with
 * no page behind it. After the deploy, check the live site itself, not only
 * the dry run: /terms returns 200 and the footer's Terms of Use is a link.
 *
 * WHAT IT DOES
 *   - Dry run by default: prints what it would do and writes nothing.
 *   - Writes only with APPLY=1 and CONFIRM_DB=<the database name it prints>.
 *   - Adds a page only if no page has its slug. A page that is already there
 *     and matches its file is skipped. A page that is there but differs (for
 *     example edited in the admin) stops the whole run before any write.
 *   - Stops unless the migration MIGRATION (below) is applied, unless every
 *     image exists, and if a redirect is set on any of the pages' addresses.
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
 *   APPLY=1 CONFIRM_DB=<database> pnpm payload run scripts/page-content/apply-production.mts   add every page
 *   UNDO=<record folder> pnpm payload run scripts/page-content/apply-production.mts   (dry run; add APPLY=1 CONFIRM_DB=<database> to remove)
 *   ONLY=contact,faq   limit to these pages: dry runs only. With APPLY it is
 *                      refused, because adding some pages and deploying would
 *                      ship the others' routes and links with no page behind
 *                      them (and a cached "page not found"). ALLOW_PARTIAL=1
 *                      overrides that, for a deliberate partial add only.
 *   SHOW=1   also print each page as it would be written
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
// The newest migration these pages need (Site Map; it comes after the Press
// Grid and 20261016_104012_contact_page_fields, so those are applied too).
const MIGRATION = '20261021_093343_site_map_block'
// Placeholders a page's JSON may use, and the media file each one stands for.
const MEDIA: Record<string, string> = {
  __OG_MEDIA_ID__: 'og-momh.jpg', // the share image
  __MAP_MEDIA_ID__: 'momh-jaipur-map.png', // the map used on Book Your Appointment
}
// A page's JSON may also name any media file directly, as "__MEDIA:<file name>__"
// (the Press page's photos: "__MEDIA:momh-press-01.jpg__" ...).
const FILE_PLACEHOLDER = /__MEDIA:([A-Za-z0-9._-]+)__/g
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
if (APPLY && !UNDO && ONLY && ONLY.length < available.length && process.env.ALLOW_PARTIAL !== '1') {
  fail(
    `APPLY with ONLY adds only ${ONLY.join(', ')}; the deploy ships every page's route and footer link, ` +
      'so add them all (drop ONLY). For a deliberate partial add set ALLOW_PARTIAL=1. Nothing was written.',
  )
}
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
const missingFiles: string[] = []
const fileRows: string[] = []
// The photos shipped with the pages (media/<set>/manifest.json, uploaded by
// upload-media.mts). A photo a page uses must still be that photo: same pixel
// size, same stored size (Payload re-saves a photo without its embedded
// metadata; worked out here the same way) and same alt text. Checked only for
// pages this run adds (below), so a later alt-text edit in the admin does not
// block releasing other pages.
const sharp = (await import(pathToFileURL(requireFromRepo.resolve('sharp')).href)).default
const manifestEntries = new Map<string, { set: string; file: string; width: number; height: number; alt: string }>()
const shippedDiff = new Map<string, string>() // file -> how the media record differs from media/<set>/
const mediaRoot = path.join(here, 'media')
for (const set of fs.existsSync(mediaRoot) ? fs.readdirSync(mediaRoot) : []) {
  const file = path.join(mediaRoot, set, 'manifest.json')
  if (!fs.existsSync(file)) continue
  for (const f of JSON.parse(fs.readFileSync(file, 'utf8')).files || []) manifestEntries.set(f.file, { set, ...f })
}
for (const slug of slugs) {
  const raw = fs.readFileSync(path.join(here, `${slug}.json`), 'utf8')
  for (const [placeholder, filename] of raw.matchAll(FILE_PLACEHOLDER)) {
    if (placeholder in mediaIds) continue
    const found = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, depth: 0, limit: 2 })
    if (found.docs.length !== 1) {
      missingFiles.push(`${filename} (${found.docs.length} found)`)
      continue
    }
    const m = found.docs[0] as { id: number; width?: number; height?: number; filesize?: number; createdAt?: string; alt?: string }
    const shipped = manifestEntries.get(filename)
    if (shipped) {
      const buf = fs.readFileSync(path.join(mediaRoot, shipped.set, shipped.file))
      const stored = (await sharp(buf).rotate().toBuffer()).length
      const diff = [
        (m.width !== shipped.width || m.height !== shipped.height) && `pixels ${m.width}x${m.height} vs ${shipped.width}x${shipped.height}`,
        m.filesize !== stored && `stored size ${m.filesize} vs ${stored}`,
        (m.alt || '') !== shipped.alt && `alt text "${m.alt || ''}" vs the manifest's`,
      ].filter(Boolean)
      if (diff.length) shippedDiff.set(filename, `media ${m.id} differs from media/${shipped.set}/manifest.json (${diff.join(', ')})`)
    }
    mediaIds[placeholder] = m.id
    fileRows.push(
      `  ${filename} = ${m.id} (${m.width}x${m.height}, added ${String(m.createdAt).slice(0, 10)}${m.alt ? '' : ', NO ALT TEXT'}` +
        `${shipped ? (shippedDiff.has(filename) ? `, DIFFERS from media/${shipped.set}/` : `, matches media/${shipped.set}/`) : ''})`,
    )
  }
}
if (missingFiles.length) {
  fail(`these images must each exist exactly once in the media library first: ${missingFiles.join(', ')}. Nothing was written.`)
}
// Printed so the person running this can see each photo is the one just
// uploaded (size and date), not an older file that happens to share its name.
if (fileRows.length) console.log(`and ${fileRows.length} more images found by file name:\n${fileRows.join('\n')}`)

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
  const pending = raw.match(/[^"]*url-needed\.invalid[^"]*/gi)
  if (pending) fail(`${slug}.json still has ${pending.length} article address(es) to fill in (${pending.join(', ')}). Nothing was written.`)
  const fill = (v: unknown): unknown =>
    typeof v === 'string' && v in mediaIds
      ? mediaIds[v]
      : Array.isArray(v)
        ? v.map(fill)
        : v && typeof v === 'object'
          ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]))
          : v
  const data = { ...(fill(page) as Doc), _status: 'published' }
  // Anything still looking like a media placeholder after the swap (a typo such
  // as "__MEDIA:press 01.jpg__") would only fail at write time, part-way
  // through the run, so it stops the dry run instead.
  const leftover = JSON.stringify(data).match(/__[A-Za-z_]*MEDIA[^"]*__/i)
  if (leftover) fail(`${slug}.json has a media placeholder that matches no rule: ${leftover[0]}. Nothing was written.`)

  if (redirected(slug).length) problems.push(`${slug}: a redirect is set on /${slug}; remove it first`)
  const existing = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, draft: true, depth: 0, limit: 5 })
  if (existing.docs.length > 1) {
    problems.push(`${slug}: ${existing.docs.length} pages already use this slug`)
  } else if (existing.docs.length === 1) {
    const diff = firstDifference(existing.docs[0], data)
    if (diff) problems.push(`${slug}: page ${existing.docs[0].id} already exists and differs from ${slug}.json (first at ${diff})`)
    else plans.push({ slug, data, state: 'same' })
  } else {
    // The lookup above reads each page's newest version. A live page whose
    // newest draft moved to another slug (slugLock on: opening it in the admin
    // rewrites the slug from its title) is invisible to it, and adding would
    // publish a second page on this slug. So look at the live rows too.
    const live = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, depth: 0, limit: 5 })
    if (live.docs.length) {
      problems.push(
        `${slug}: page ${live.docs[0].id} is live on /${slug}, but its newest draft has another slug; ` +
          `open it in the admin, set the slug back to "${slug}" and publish, then run this again`,
      )
    } else {
      plans.push({ slug, data, state: 'add' })
    }
  }
  if (SHOW) console.log(`\n${slug} as it would be written:\n${JSON.stringify(data, null, 1)}`)
}
for (const p of plans) {
  const blocks = (p.data.layout as unknown[]).length
  console.log(`${p.slug.padEnd(14)} ${p.state === 'add' ? `will add (${blocks} blocks, published)` : 'already there and identical, skip'}`)
}
for (const p of plans.filter((x) => x.state === 'add')) {
  const raw = fs.readFileSync(path.join(here, `${p.slug}.json`), 'utf8')
  for (const [, filename] of raw.matchAll(FILE_PLACEHOLDER)) {
    const d = shippedDiff.get(filename)
    if (d) problems.push(`${p.slug} uses ${filename}: ${d}; make the media record match it in the admin, or upload the right photo (upload-media.mts)`)
  }
}
if (problems.length) fail(`${problems.join('; ')}. Nothing was written.`)
const toAdd = plans.filter((p) => p.state === 'add')
if (!toAdd.length) {
  console.log('Nothing to add.')
  process.exit(0)
}
if (!APPLY) {
  console.log(
    `\nDry run. To add: APPLY=1 CONFIRM_DB=${dbName}` +
      `${ONLY ? ` ONLY=${ONLY.join(',')}${ONLY.length < available.length ? ' ALLOW_PARTIAL=1' : ''}` : ''} (same command)`,
  )
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
