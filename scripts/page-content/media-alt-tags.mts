/**
 * PRODUCTION: removes the leftover tag from the front of 110 image descriptions
 * (the "alt" text) in the media library, so
 *   "[momh-seed] Shekhawat Haveli at dusk"  becomes  "Shekhawat Haveli at dusk".
 * Run by hand on a developer's machine, never on Vercel.
 *
 * WHY: the seed code that first filled the site wrote a tag in front of each
 * description so it could find its own rows again ([momh-seed], [momh-mg-seed],
 * [momh-ac] and so on, eleven tags). That code was removed in June 2026; the
 * tags stayed in the database. Pages print a photo's description into their
 * HTML, so the tag is in the page Google reads, and Google showed it in its
 * results ("[momh-seed] Shekhawat Haveli at dusk." under Book Your Appointment).
 * Screen readers read it out too.
 *
 * ORDER:
 *   1. Nothing to deploy: no code depends on this script. page-banners.mts does
 *      not read these descriptions, so the two can run in either order.
 *   2. Make sure nobody has one of these images open in the admin (an idle tab
 *      holds the old description and would put it back when saved). Run this
 *      script: a dry run, then APPLY (below). Keep the record folder it names.
 *   3. Purge Vercel's Data Cache (project Settings -> Data Cache). The live
 *      server caches each page's content for up to a year and this script
 *      cannot reach that cache, so until the purge the pages look as before.
 *   4. Ten minutes after the purge (the revalidate time), check the pages. The
 *      first visit can still show the old copy and starts the update, so load
 *      each page twice. The second time,
 *        curl -s https://momhindia.org/book-an-appointment | grep -c '\[momh'
 *      must print 0, and the same for / and the other pages. The home page is the
 *      one page with no revalidate time, so only the purge refreshes it; if / still
 *      prints 1, redeploy once (after the purge, never before it) and check again.
 *      Run the dry run once more: it must print "Nothing to do".
 *   5. Google keeps its old text until it next reads each page. To hurry that,
 *      ask for re-indexing of / and /book-an-appointment in Search Console.
 *
 * WHAT IT DOES
 *   - Dry run by default: prints each description before and after, writes
 *     nothing. Check that its "database:" line is production's before copying
 *     the name into CONFIRM_DB: when DATABASE_URI is not set in the shell, it
 *     comes from the .env in this checkout (your local database).
 *   - Writes only with APPLY=1 and CONFIRM_DB=<the database name it prints>.
 *   - Knows every row it may change, by id, file name and exact text, read from
 *     production on 5 Nov 2026. A row holding the tagged text is changed; a row
 *     already clean is left alone. It stops, having written nothing, if any row
 *     is missing, has another file name or holds any other text, if a tagged
 *     description exists that is not on its list, or if one of these images has
 *     an admin edit lock under 5 minutes old.
 *   - Changes the media table's alt column and nothing else, in one transaction:
 *     all the rows change or none do. Inside the transaction it checks that
 *     every other column of those rows is unchanged, then reads them again
 *     after the commit.
 *   - Goes straight to the database instead of through Payload on purpose. A
 *     Payload save would change the image's updatedAt, which is part of its web
 *     address (getMediaUrl), so all these images would get new addresses and be
 *     processed again by Vercel's image optimiser. Payload never starts, so the
 *     database structure cannot change either.
 *   - Before writing, saves what it will change in a record outside the repo
 *     (RECORD_DIR, default ~/momh-page-apply-records/<time>-media-alt-tags/).
 *     UNDO=<that folder> puts those rows' tags back, only in the same database
 *     and only if each still holds the clean text. Purge the Data Cache again
 *     after an UNDO.
 *
 * RUN from the repo root (Node 22), with production's DATABASE_URI:
 *   pnpm payload run scripts/page-content/media-alt-tags.mts                                  dry run
 *   APPLY=1 CONFIRM_DB=<database> pnpm payload run scripts/page-content/media-alt-tags.mts    make the change
 *   UNDO=<record folder> pnpm payload run scripts/page-content/media-alt-tags.mts             (dry run; add APPLY=1 CONFIRM_DB=<database> to put the tags back)
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const SCRIPT = 'media-alt-tags'
// Query-string settings the database address may carry; anything else (a
// port, a socket, a database name) could make it connect somewhere other
// than the name and host printed and confirmed.
const ALLOWED_PARAMS = new Set(['sslmode', 'ssl', 'connect_timeout', 'application_name'])
const LOCK_SECONDS = 300 // an admin edit lock younger than this blocks every write

// [media id, file name, tag, description without the tag]
type Row = readonly [number, string, string, string]
const ROWS: readonly Row[] = [
  [22, 'artboard-15.jpg', 'momh-seed', 'Shekhawat Haveli at dusk'],
  [23, 'artboard-16.jpg', 'momh-seed', 'Sunita Shekhawat portrait'],
  [24, 'artboard-17.jpg', 'momh-seed', 'Pichvai-style palace painting'],
  [25, 'artboard-18.jpg', 'momh-seed', 'Mughal miniature — rider with falcon'],
  [26, 'artboard-19.jpg', 'momh-seed', 'Shekhawat Haveli arched entrance'],
  [27, 'artboard-20.jpg', 'momh-seed', 'Enamel colour-tile grid'],
  [28, 'artboard-21.jpg', 'momh-seed', 'Meenakari pendant macro'],
  [29, 'artboard-22.jpg', 'momh-seed', 'Museum spiral staircase'],
  [30, 'artboard-23.jpg', 'momh-seed', 'Meenakari pendants in maker’s hand'],
  [31, 'artboard-24.jpg', 'momh-seed', 'Deccan Chronicle — red mandala exhibits'],
  [32, 'artboard-25.jpg', 'momh-seed', 'Lifestyle Asia — museum exhibit wall'],
  [33, 'artboard-26.jpg', 'momh-seed', 'Mint Lounge — flower painting wall'],
  [34, 'artboard-27.jpg', 'momh-seed', 'Museum guests tour group'],
  [35, 'artboard-28.jpg', 'momh-seed', 'Red mandala enamel piece'],
  [36, 'artboard-29.png', 'momh-seed', 'Red floral icon (Founder)'],
  [37, 'artboard-30.png', 'momh-seed', 'White fish icon (About, Craft Jewellery)'],
  [38, 'artboard-31.png', 'momh-seed', 'White peacock icon (Craftsmanship, Gallery)'],
  [39, 'artboard-32.png', 'momh-seed', 'Brown phoenix icon (Architecture)'],
  [40, 'artboard-33.png', 'momh-seed', 'White bouquet icon (Events)'],
  [41, 'artboard-34.png', 'momh-seed', 'White floral icon (Collection)'],
  [42, 'landing-page-opener.mp4', 'momh-seed', 'Haveli opener video'],
  [43, 'founder-signature.png', 'momh-seed', 'Sunita Shekhawat signature'],
  [44, 'inner-banner-cropped.jpg', 'momh-plan-visit-seed', 'Shekhawat Haveli — cropped twilight façade banner'],
  [45, 'visit-2-map.jpg', 'momh-plan-visit-seed', 'Google Map showing the Museum of Meenakari Heritage location'],
  [46, 'visit-jewelry.jpg', 'momh-plan-visit-seed', 'Meenakari gold leaf pendant set on a painted botanical study — bespoke consultation'],
  [47, 'visit-artisan.jpg', 'momh-plan-visit-seed', 'Master artisan applying enamel colour with a fine tool — colour palette in hand'],
  [48, 'visit-museum-exhibit.jpg', 'momh-plan-visit-seed', 'MOMH gallery interior — dark exhibition hall with central vitrine and panel wall'],
  [49, 'visit-museum-lobby.jpg', 'momh-plan-visit-seed', 'MOMH lounge with round elevator column, beige armchairs and coffee-table books'],
  [50, 'visit-5-haveli-bottom.jpg', 'momh-plan-visit-seed', 'Shekhawat Haveli at twilight — full façade with jali screens against blue sky'],
  [51, 'visit-jewelry-3.jpg', 'momh-plan-visit-seed', "Artisan's hands holding a gold-and-purple meenakari piece in progress — palette tray in background"],
  [52, 'visit-museum-3.jpg', 'momh-plan-visit-seed', 'MOMH spiral staircase — sculpted wooden banister winding through the gallery interior'],
  [53, 'inner-banner-cropped-1.jpg', 'momh-craft-seed', 'Shekhawat Haveli — cropped twilight façade banner'],
  [54, 'craft-inspiration.jpg', 'momh-craft-seed', 'Meenakari jewellery sketches with gold proof pieces in resin trays'],
  [55, 'craft-design.jpg', 'momh-craft-seed', 'Artisan filing a gold pendant with a jewellery saw — design refinement'],
  [56, 'craft-development.jpg', 'momh-craft-seed', 'Master jeweller setting kundan and rubies into a polki necklace'],
  [57, 'craft-newsletter.jpg', 'momh-craft-seed', 'Workbench with traditional jewellery tools — newsletter feature'],
  [58, 'inner-banner-cropped-2.jpg', 'momh-mg-seed', 'Shekhawat Haveli — cropped twilight façade banner'],
  [59, 'mg-flower-wall.jpg', 'momh-mg-seed', 'MOMH gallery wall lined with framed botanical paintings and jewellery vitrine'],
  [60, 'mg-essentials.jpg', 'momh-mg-seed', 'Gold meenakari necklace displayed in a dark exhibition vitrine'],
  [61, 'mg-experience.jpg', 'momh-mg-seed', 'Painted floral ceiling above a quiet visitor lounge with chairs and a low table'],
  [62, 'mg-staircase.jpg', 'momh-mg-seed', 'White spiral staircase rising above a dark marble floor — MOMH interior'],
  [63, 'mg-archmap.jpg', 'momh-mg-seed', "Top-down painted plan of Shekhawat Haveli's gardens and architecture"],
  [64, 'mg-library.jpg', 'momh-mg-seed', 'MOMH library / reading lounge with bookshelves, sofas and pendant lighting'],
  [65, 'artboard-35.png', 'momh-mg-seed', 'White fish icon — Visit The Museum panel'],
  [66, 'artboard-36.png', 'momh-mg-seed', 'White peacock icon — Explore Gallery panel'],
  [67, 'artboard-37.png', 'momh-mg-seed', 'Brown phoenix/leaf icon — Have a Question panel'],
  [68, 'inner-banner-cropped-3.jpg', 'momh-consult-seed', 'Shekhawat Haveli — cropped twilight façade banner'],
  [69, 'consultation-haveli-night.jpg', 'momh-consult-seed', 'Shekhawat Haveli at night — moon visible above the building'],
  [70, 'inner-banner-cropped-4.jpg', 'momh-bka-seed', 'Shekhawat Haveli — cropped twilight façade banner'],
  [71, 'consultation-haveli-night-1.jpg', 'momh-bka-seed', 'Shekhawat Haveli at night — moon visible above the building'],
  [72, 'inner-banner-cropped-5.jpg', 'momh-thanks-seed', 'Shekhawat Haveli — cropped twilight façade banner'],
  [73, 'thank-you-architecture.jpg', 'momh-thanks-seed', 'Shekhawat Haveli close-up — Sanskrit "Shekhawat Haveli" text carved in stone'],
  [74, 'thank-you-enamel-tiles.jpg', 'momh-thanks-seed', 'Enamel tile installation — grid of coloured meenakari samples on black panels'],
  [75, 'thank-you-blue-floral.jpg', 'momh-thanks-seed', 'Blue meenakari enamel close-up — white floral pattern on cobalt blue ground'],
  [76, 'artboard-38.png', 'momh-thanks-seed', 'White peacock icon (Press / Blogs)'],
  [77, 'artboard-39.png', 'momh-thanks-seed', 'Brown phoenix icon (Architecture)'],
  [78, 'artboard-40.png', 'momh-thanks-seed', 'White bouquet icon (Events)'],
  [85, 'about-inner-banner-cropped.jpg', 'momh-about', 'Shekhawat Haveli — cropped twilight façade banner'],
  [86, 'about-homage-old-jaipur.jpg', 'momh-about', 'Archival sepia photograph of old Jaipur street life near Hawa Mahal'],
  [87, 'about-enamel-palette.jpg', 'momh-about', 'Brass enamel colour palette above a karigar applying meenakari to a gold bangle'],
  [88, 'about-crescent-pendant.jpg', 'momh-about', 'Blue crescent meenakari pendant with floral enamelling held mid-work'],
  [89, 'about-haveli-facade.jpg', 'momh-about', 'Shekhawat Haveli rose-stone façade with carved jaali and foliage'],
  [90, 'about-gallery-interior.jpg', 'momh-about', 'Museum of Meenakari Heritage gallery interior with framed archival images'],
  [91, 'fv-banner-drafting-table.jpg', 'momh-fv', 'Sunita Shekhawat at her drafting table, black and white'],
  [92, 'fv-enamel-pendant.jpg', 'momh-fv', 'A meenakari pendant in gold and green enamel held in the maker’s hands'],
  [93, 'fv-shekhawat-haveli.jpg', 'momh-fv', 'Shekhawat Haveli exterior, black and white'],
  [94, 'fv-design-drawing.jpg', 'momh-fv', 'Loose stones and tweezers on a jewellery design drawing'],
  [95, 'fv-founder-at-desk.jpg', 'momh-fv', 'Sunita Shekhawat reviewing work at her desk'],
  [96, 'fv-drafting-leaning.jpg', 'momh-fv', 'Sunita Shekhawat leaning over drawings at the drafting table'],
  [97, 'fv-studio-desk.jpg', 'momh-fv', 'Sunita Shekhawat standing at her studio desk'],
  [98, 'fv-studio-team.jpg', 'momh-fv', 'The studio team gathered over drawings, black and white'],
  [99, 'founders-vision.mp4', 'momh-fv', 'The Founder’s Vision film'],
  [100, 'ac-01.jpg', 'momh-ac', 'Jeweller’s compass and a gold strip on a dark worn workbench'],
  [101, 'ac-02.jpg', 'momh-ac', 'Carved jaali screens in a Jaipur haveli'],
  [102, 'ac-03.jpg', 'momh-ac', 'A karigar shaping a green enamelled peacock pendant'],
  [103, 'ac-04.jpg', 'momh-ac', 'A tray of finished green and red enamelled elements'],
  [104, 'ac-05.jpg', 'momh-ac', 'White flux powder in a brass bowl'],
  [105, 'ac-06.jpg', 'momh-ac', 'Brass bowls of powdered enamel in many colours'],
  [106, 'ac-07.jpg', 'momh-ac', 'Enamel pieces firing in a glowing kiln'],
  [107, 'ac-08.jpg', 'momh-ac', 'Antique map of the maritime trade routes between Europe and India'],
  [108, 'ac-09.jpg', 'momh-ac', 'A karigar holding a green enamelled disc, tools behind'],
  [109, 'ac-10.jpg', 'momh-ac', 'Step 1, Framework — gold wirework laid on a dark base'],
  [110, 'ac-11.jpg', 'momh-ac', 'Step 2, Gem setting — stones being set into a gold strip'],
  [111, 'ac-12.jpg', 'momh-ac', 'Step 3, Engraving — floral engraving across a gold surface'],
  [112, 'ac-13.jpg', 'momh-ac', 'Step 4, Enamel application — enamel worked into a gold bracelet'],
  [113, 'ac-14.jpg', 'momh-ac', 'Step 5, Firing — a piece under the flame'],
  [114, 'ac-15.jpg', 'momh-ac', 'Step 6, Polishing — a finished jewel being polished'],
  [115, 'ac-16.jpg', 'momh-ac', 'Painted enamel: a pink lotus painted on a pearl-bordered disc'],
  [116, 'ac-17.jpg', 'momh-ac', 'Champlevé: red and green enamel in engraved gold recesses'],
  [117, 'ac-18.jpg', 'momh-ac', 'Cloisonné: floral enamel held within fine wire compartments'],
  [118, 'ac-19.jpg', 'momh-ac', 'Plique-à-jour: a butterfly with translucent unbacked wings'],
  [119, 'ac-20.jpg', 'momh-ac', 'Ab-e-lehr: translucent enamel over wave-engraved gold'],
  [120, 'ac-21.jpg', 'momh-ac', 'Boond-tila: green enamel around a raised gold flower'],
  [121, 'ac-22.jpg', 'momh-ac', 'Ferozi-zamin: turquoise enamel on an engraved ground'],
  [122, 'arch-01.jpg', 'momh-arch', 'Dark carved jaali panels — the museum façade latticework at night'],
  [123, 'arch-02.jpg', 'momh-arch', 'Sunlight through carved jharokha screens inside the museum'],
  [124, 'arch-03.jpg', 'momh-arch', 'The sculptural spiral staircase winding through the building'],
  [125, 'arch-04.jpg', 'momh-arch', 'Gallery lounge under a hand-painted ceiling'],
  [126, 'arch-05.jpg', 'momh-arch', 'An ornate carved mirror on the gallery stair landing'],
  [127, 'arch-06.jpg', 'momh-arch', 'A lit exhibit wall with framed archival works'],
  [128, 'arch-07.jpg', 'momh-arch', 'Hand-painted ceiling above a seating corner'],
  [129, 'arch-08.jpg', 'momh-arch', 'A chevron-patterned minaret exhibit in a lit case'],
  [130, 'arch-09.jpg', 'momh-arch', 'Framed miniatures and jewels on a gallery wall'],
  [131, 'arch-10.jpg', 'momh-arch', 'Painted ceiling above the winding stair'],
  [132, 'arch-11.jpg', 'momh-arch', 'A display table under focused gallery light'],
  [133, 'arch-12.jpg', 'momh-arch', 'A jewel case beside the staircase rail'],
  [134, 'arch-13.jpg', 'momh-arch', 'A dark gallery wall of lit displays'],
  [135, 'arch-14.jpg', 'momh-arch', 'The Renaissance Connection exhibit wall'],
  [136, 'arch-15.jpg', 'momh-arch', 'A corridor of lit jewel displays'],
  [137, 'arch-16.jpg', 'momh-arch', 'The museum’s red sandstone exterior at street level'],
]

type Step = { id: number; file: string; from: string; to: string }
const tagged = (r: Row) => `[${r[2]}] ${r[3]}`

const APPLY = process.env.APPLY === '1'
const UNDO = process.env.UNDO
const RECORD_ROOT = process.env.RECORD_DIR || path.join(os.homedir(), 'momh-page-apply-records')

function fail(msg: string): never {
  console.error(`STOPPED: ${msg}`)
  process.exit(1)
}

// ── guards, before anything is loaded or connected ─────────────────────
for (const k of ['VERCEL', 'VERCEL_ENV', 'VERCEL_URL', 'AWS_LAMBDA_FUNCTION_NAME']) {
  if (process.env[k]) fail(`${k} is set; run this on a developer's machine, not on Vercel. Nothing was written.`)
}
if (UNDO !== undefined && !UNDO.trim()) fail('UNDO is set but empty. Nothing was written.')

let parsed: URL
try {
  parsed = new URL(process.env.DATABASE_URI || '')
} catch {
  fail('DATABASE_URI is unset or unparseable. Nothing was written.')
}
if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
  fail(`DATABASE_URI is a ${parsed.protocol} address; only postgres:// is accepted. Nothing was written.`)
}
const dbHost = parsed.hostname
const dbPort = parsed.port || '5432'
const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
// pg takes host, port and dbname from the query string ahead of the URL's
// own, so the name printed (and confirmed) would not be the database written.
for (const k of parsed.searchParams.keys()) {
  if (!ALLOWED_PARAMS.has(k)) fail(`DATABASE_URI sets ${k} in its query string. Nothing was written.`)
}
if (!dbHost || dbHost.startsWith('/') || dbHost.toLowerCase().startsWith('%2f')) {
  fail('DATABASE_URI names no network host. Nothing was written.')
}
if (!dbName) fail('DATABASE_URI names no database. Nothing was written.')
console.log(`database: ${dbName} on ${dbHost}:${dbPort}`)
console.log(`mode: ${UNDO ? `undo ${path.resolve(UNDO)}` : 'remove the tags'}, ${APPLY ? 'WRITING' : 'dry run, nothing is written'}`)
if (APPLY && process.env.CONFIRM_DB !== dbName) {
  fail(`APPLY=1 needs CONFIRM_DB=${dbName} (the database above). Nothing was written.`)
}

// ── which rows, and in which direction ─────────────────────────────────
const byId = new Map<number, Row>(ROWS.map((r) => [r[0], r]))
let wanted: Row[] = [...ROWS]
if (UNDO) {
  const file = path.join(path.resolve(UNDO), 'record.json')
  let record: { script?: unknown; database?: unknown; host?: unknown; port?: unknown; ids?: unknown }
  try {
    record = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (err) {
    fail(`cannot read ${file}: ${(err as Error).message}. Nothing was written.`)
  }
  if (record.script !== SCRIPT) fail(`${file} is not a record of this script. Nothing was written.`)
  if (record.database !== dbName || record.host !== dbHost || record.port !== dbPort) {
    fail(`${file} was made on ${String(record.database)} on ${String(record.host)}:${String(record.port)}, not this database. Nothing was written.`)
  }
  const ids = record.ids
  if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length || ids.some((i) => !byId.has(i))) {
    fail(`${file} does not list a valid set of rows. Nothing was written.`)
  }
  wanted = ids.map((i: number) => byId.get(i) as Row)
}
const steps: Step[] = wanted.map((r) =>
  UNDO
    ? { id: r[0], file: r[1], from: r[3], to: tagged(r) }
    : { id: r[0], file: r[1], from: tagged(r), to: r[3] },
)
const allIds = steps.map((s) => s.id)

// ── connect (pg directly: Payload is never loaded) ─────────────────────
const repo = process.cwd()
if (!fs.existsSync(path.join(repo, 'src', 'payload.config.ts'))) fail(`run this from the MOMH repo root (now in ${repo})`)
const requireFromRepo = createRequire(path.join(repo, 'package.json'))
const pgEntry = createRequire(requireFromRepo.resolve('@payloadcms/db-postgres')).resolve('pg')
const pg = (await import(pathToFileURL(pgEntry).href)).default

const open = async (ifFails = 'Nothing was written.') => {
  // query_timeout: a connection that goes silent fails its query instead of
  // hanging. It must stay above the lock_timeout set in the transaction.
  const c = new pg.Client({ connectionString: process.env.DATABASE_URI, query_timeout: 60000 })
  // Without a listener, a lost connection crashes Node before the waiting query
  // can report it, and the messages below would never print.
  c.on('error', () => {})
  try {
    await c.connect()
  } catch (err) {
    fail(`cannot open ${dbName}: ${(err as Error).message}. ${ifFails}`)
  }
  return c
}
// Not awaited: on a dead connection end() may never finish, and every path here
// ends in process.exit, which closes the socket anyway.
const close = (c: { end: () => Promise<void> }) => {
  void c.end().catch(() => {})
}
const client = await open()

// ── read the rows and decide, before any write ─────────────────────────
const problems: string[] = []
const change: Step[] = []
let already = 0
try {
  const table = (await client.query("select to_regclass('public.media')::text as t")).rows[0]?.t
  if (!table) fail(`${dbName} has no media table; is it the right database? Nothing was written.`)

  const rows: { id: number; filename: string; alt: string | null }[] = (
    await client.query('select id, filename, alt from media where id = any($1::int[])', [allIds])
  ).rows
  const found = new Map(rows.map((r) => [r.id, r]))
  for (const s of steps) {
    const row = found.get(s.id)
    if (!row) problems.push(`media ${s.id} (${s.file}) is not in the database`)
    else if (row.filename !== s.file) problems.push(`media ${s.id} is ${row.filename}, expected ${s.file}`)
    else if (row.alt === s.from) change.push(s)
    else if (row.alt === s.to) already++
    else problems.push(`media ${s.id} (${s.file}) reads ${JSON.stringify(row.alt)}, expected ${JSON.stringify(s.from)}`)
  }
  if (!UNDO) {
    const others: { id: number; filename: string; alt: string }[] = (
      await client.query(`select id, filename, alt from media where alt like '[momh%' and not (id = any($1::int[]))`, [allIds])
    ).rows
    for (const o of others) problems.push(`media ${o.id} (${o.filename}) has a tag but is not on this script's list: ${JSON.stringify(o.alt)}`)
  }
  const locked: { id: number }[] = (
    await client.query(
      `select distinct r.media_id as id
         from payload_locked_documents_rels r
         join payload_locked_documents l on l.id = r.parent_id
        where r.media_id = any($1::int[])
          and l.updated_at > now() - make_interval(secs => $2)`,
      [allIds, LOCK_SECONDS],
    )
  ).rows
  for (const l of locked) problems.push(`media ${l.id} has an admin edit lock under ${LOCK_SECONDS / 60} minutes old`)
} catch (err) {
  close(client)
  fail(`could not read the rows: ${(err as Error).message}. Nothing was written.`)
}
if (problems.length) {
  close(client)
  for (const p of problems) console.error(`  ${p}`)
  fail(`${problems.length} problem(s) above. Nothing was written.`)
}

for (const s of change) console.log(`media ${String(s.id).padEnd(4)} ${s.file}\n    was: ${s.from}\n    now: ${s.to}`)
console.log(`${change.length} to change, ${already} already done, ${steps.length} on the list.`)
if (!change.length) {
  close(client)
  console.log('Nothing to do.')
  process.exit(0)
}
if (!APPLY) {
  close(client)
  console.log(`Dry run: nothing was written. To make the change: APPLY=1 CONFIRM_DB=${dbName} (and the same command).`)
  process.exit(0)
}

// ── record, then one transaction ───────────────────────────────────────
let recordDir = ''
if (!UNDO) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  recordDir = path.join(RECORD_ROOT, `${stamp}-${SCRIPT}`)
  try {
    fs.mkdirSync(recordDir, { recursive: true })
    fs.writeFileSync(
      path.join(recordDir, 'record.json'),
      JSON.stringify(
        { script: SCRIPT, database: dbName, host: dbHost, port: dbPort, when: new Date().toISOString(), ids: change.map((s) => s.id), rows: change },
        null,
        2,
      ),
      { flag: 'wx' },
    )
  } catch (err) {
    close(client)
    fail(`cannot write the record in ${recordDir}: ${(err as Error).message}. Nothing was written.`)
  }
  console.log(`record: ${recordDir}`)
}

const ids = change.map((s) => s.id)
const snapshot = async (c: typeof client) =>
  new Map<number, { alt: string; rest: string }>(
    (
      await c.query(`select id, alt, md5((to_jsonb(m) - 'alt')::text) as rest from media m where id = any($1::int[])`, [ids])
    ).rows.map((r: { id: number; alt: string; rest: string }) => [r.id, r]),
  )

try {
  await client.query('begin')
  await client.query(`set local lock_timeout = '15s'`)
  // If this machine drops off the network, the server lets go of the rows itself.
  await client.query(`set local idle_in_transaction_session_timeout = '30s'`)
  // "no key update": admin saves that only point at these images are not held up.
  await client.query('select id from media where id = any($1::int[]) order by id for no key update', [ids])
  const was = await snapshot(client)
  for (const s of change) {
    const res = await client.query('update media set alt = $1 where id = $2 and filename = $3 and alt = $4', [s.to, s.id, s.file, s.from])
    if (res.rowCount !== 1) throw new Error(`media ${s.id} changed while this script was running`)
  }
  const now = await snapshot(client)
  for (const s of change) {
    if (now.get(s.id)?.alt !== s.to) throw new Error(`media ${s.id} did not read back as expected`)
    if (!was.get(s.id)?.rest || now.get(s.id)?.rest !== was.get(s.id)?.rest) throw new Error(`another column of media ${s.id} changed`)
  }
} catch (err) {
  // Wait briefly: on a dead connection this never answers, and leaving ends the
  // transaction anyway, because nothing was committed.
  await Promise.race([client.query('rollback').catch(() => {}), new Promise((r) => setTimeout(r, 5000))])
  close(client)
  // A record of a run that changed nothing must not be there for a later UNDO.
  if (recordDir) fs.rmSync(recordDir, { recursive: true, force: true })
  fail(`${(err as Error).message}. Rolled back: nothing was written.`)
}
try {
  await client.query('commit')
} catch (err) {
  close(client)
  fail(`the connection failed during the commit (${(err as Error).message}), so the result is not known. Run the dry run to see where it stands.`)
}
close(client)

// ── read back on a new connection ──────────────────────────────────────
const unread = `The change WAS committed, but it could not be read back. Run the dry run (it must print "Nothing to do"), then purge the Data Cache.${recordDir ? ` To undo: UNDO=${recordDir}` : ''}`
const check = await open(unread)
let after: Awaited<ReturnType<typeof snapshot>>
try {
  after = await snapshot(check)
} catch (err) {
  fail(`${(err as Error).message}. ${unread}`)
}
close(check)
const wrong = change.filter((s) => after.get(s.id)?.alt !== s.to)
if (wrong.length) fail(`committed, but ${wrong.length} row(s) read back differently: ${wrong.map((s) => s.id).join(', ')}.`)

console.log(`Done: ${change.length} description(s) changed and read back.`)
if (recordDir) console.log(`To undo: UNDO=${recordDir} (dry run; add APPLY=1 CONFIRM_DB=${dbName}).`)
console.log('Next: purge the Data Cache in Vercel, or the live pages keep the old text.')
process.exit(0)
