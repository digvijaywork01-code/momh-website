/**
 * Puts the photos a new page needs into the media library, with their alt
 * text, before apply-production.mts adds the page that uses them. Run by hand
 * on a developer's machine (Sachin for production), never on Vercel.
 *
 * WHAT IT UPLOADS
 *   Every folder under scripts/page-content/media/ that holds a manifest.json
 *   (today: media/press/, the 34 Press photos momh-press-01.jpg ...
 *   momh-press-34.jpg). The manifest lists each file with its alt text, size,
 *   pixel size and SHA-256; a file that does not match it exactly is refused.
 *   SET=press limits the run to that folder.
 *
 * WHERE THE FILES GO
 *   The script uploads through Payload, so the files go where the site keeps
 *   its images. A database on another host is production: it needs
 *   BLOB_READ_WRITE_TOKEN, and the files go into the Vercel Blob store. A
 *   database on this computer must be a *_local copy and must NOT have the
 *   token: the files go into public/media. Every other mix is refused.
 *
 * WHY IT IS CAREFUL ABOUT NAMES
 *   The Blob store is set up with addRandomSuffix: false, so a file uploaded
 *   under a name that is already in the store REPLACES it, silently, for every
 *   page that uses it. And Payload, when a name is taken (in the database or
 *   in this checkout's public/media, even in Blob mode), quietly renames the
 *   upload. So before anything is written, for every photo:
 *   - a media record with that name holding the same photo (same file type,
 *     pixel size and stored size; Payload re-saves a photo without its
 *     embedded metadata, and this script works out that size the same way):
 *     already there, skip. Same photo, other alt text: skip, with a note;
 *   - a media record with that name holding another photo: STOP;
 *   - no record, but the file or one of its resized copies is already in the
 *     Blob store, at its public address, or in this checkout's public/media:
 *     STOP (uploading would overwrite it, or be renamed).
 *   The same checks run again right before each upload. It also checks that
 *   the token's store is the one production uses: one of the five newest
 *   photos the site already had must be in it.
 *
 * RUN from the repo root (Node 22), with production's DATABASE_URI and
 * BLOB_READ_WRITE_TOKEN (the same environment as `pnpm payload migrate`):
 *   pnpm payload run scripts/page-content/upload-media.mts                          dry run: checks, writes nothing
 *   APPLY=1 CONFIRM_DB=<database> pnpm payload run scripts/page-content/upload-media.mts   upload what is missing
 *   UNDO=<record folder> pnpm payload run scripts/page-content/upload-media.mts      dry run of the undo
 *   (add APPLY=1 CONFIRM_DB=<database> to remove exactly what that run uploaded)
 *
 *   - Writes only with APPLY=1 and CONFIRM_DB=<the database name it prints>.
 *   - Before writing, saves a record outside the repo (RECORD_DIR, default
 *     ~/momh-media-upload-records/<time>/) and adds each photo to it before it
 *     is uploaded. If a run stops part-way, run the same APPLY again to finish
 *     (photos already there are skipped), or UNDO to remove what it added.
 *     UNDO removes exactly those photos (records, files and resized copies,
 *     and any file a stopped upload left behind), only in the same database
 *     and store, only if nobody has changed them and nothing uses them.
 *   - Never changes the database structure: it checks the database exists and
 *     has a media table before Payload connects (so a mistyped name cannot
 *     create a new database), runs with NODE_ENV=production (no schema push)
 *     and skips the config's onInit. Refuses when PAYLOAD_DROP_DATABASE is set.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const MEDIA_ROOT = path.join(here, 'media')
const APPLY = process.env.APPLY === '1'
const UNDO = process.env.UNDO
const SET = process.env.SET?.split(',').map((s) => s.trim()).filter(Boolean)
const RECORD_ROOT = process.env.RECORD_DIR || path.join(os.homedir(), 'momh-media-upload-records')
// Names Payload keeps exactly as they are (lower case, .jpg not .jpeg), so the
// name checked is the name written.
const FILE_NAME = /^[a-z0-9][a-z0-9._-]*\.(jpg|png|webp)$/
const FORMAT_OF: Record<string, string> = { jpg: 'jpeg', png: 'png', webp: 'webp' }
const MIME_OF: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
const BLOB_BASE = /^https:\/\/[a-z\d]+\.public\.blob\.vercel-storage\.com$/

const fail = (msg: string): never => {
  console.error(`STOPPED: ${msg}`)
  process.exit(1)
}

// ── guards, before anything is loaded or connected ─────────────────────
for (const k of ['VERCEL', 'VERCEL_ENV', 'VERCEL_URL', 'AWS_LAMBDA_FUNCTION_NAME']) {
  if (process.env[k]) {
    fail(
      `${k} is set; run this on a developer's machine, not on Vercel. (An env file from \`vercel env pull\` sets it: ` +
        'drop its VERCEL* lines; this script needs only DATABASE_URI and BLOB_READ_WRITE_TOKEN.) Nothing was written.',
    )
  }
}
if (process.env.PAYLOAD_DROP_DATABASE) fail('PAYLOAD_DROP_DATABASE is set; Payload would empty the database on connect. Nothing was written.')
if (UNDO !== undefined && !UNDO.trim()) fail('UNDO is set but empty. Nothing was written.')
if (process.env.SET !== undefined && !SET?.length) fail('SET is set but empty. Nothing was written.')
if (UNDO && SET) fail('UNDO removes exactly what its record lists; do not combine it with SET. Nothing was written.')

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
const local = ['', '127.0.0.1', 'localhost', '::1', '[::1]'].includes(dbHost)
if (local && !dbName.endsWith('_local')) {
  fail(`${dbName} is on this computer but its name does not end in _local; a local copy must be named *_local (it then uses public/media, never the live image store). Nothing was written.`)
}
if (!local && dbName.endsWith('_local')) fail(`${dbName} ends in _local but is on ${dbHost}, not this computer. Nothing was written.`)

const token = process.env.BLOB_READ_WRITE_TOKEN || ''
if (!local && !token) {
  fail(
    'this database is not on this computer, but BLOB_READ_WRITE_TOKEN is not set: the photos would be saved on ' +
      'this computer instead of the image store, and every one would be broken on the live page. Nothing was written.',
  )
}
if (local && token) {
  fail('this is a local database, but BLOB_READ_WRITE_TOKEN is set: test photos would land in the live image store. Unset it. Nothing was written.')
}
// Same parsing as @payloadcms/storage-vercel-blob, so this is the store and the
// public address the site itself uses.
const storeId = token.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]?.toLowerCase()
if (token && !storeId) fail('BLOB_READ_WRITE_TOKEN is not a Vercel Blob read-write token. Nothing was written.')
// TEST_BLOB_BASE_URL: local tests only, to run the public-address checks against a real store (read-only requests).
const testBase = process.env.TEST_BLOB_BASE_URL
if (testBase && (!local || !BLOB_BASE.test(testBase))) fail('TEST_BLOB_BASE_URL is for local test runs only. Nothing was written.')
const blobBase = storeId ? `https://${storeId}.public.blob.vercel-storage.com` : testBase || ''

console.log(`database: ${dbName} on ${dbHost || 'this computer'}`)
console.log(`image storage: ${storeId ? `Vercel Blob store ${storeId}` : 'this computer (public/media), local test'}`)
console.log(`mode: ${UNDO ? `undo ${path.resolve(UNDO)}` : 'upload'}, ${APPLY ? 'WRITING' : 'dry run, nothing is written'}`)
if (APPLY && process.env.CONFIRM_DB !== dbName) fail(`APPLY=1 needs CONFIRM_DB=${dbName} (the database above). Nothing was written.`)

const repo = process.cwd()
const configPath = path.join(repo, 'src', 'payload.config.ts')
if (!fs.existsSync(configPath)) fail(`run this from the MOMH repo root (no ${configPath})`)
const requireFromRepo = createRequire(path.join(repo, 'package.json'))
const importFromRepo = async (name: string, from = requireFromRepo) => import(pathToFileURL(from.resolve(name)).href)

// The database must exist and hold a media table BEFORE Payload connects:
// Payload's adapter creates a database that does not exist, so a mistyped name
// would otherwise make a new, empty database on that server.
{
  const pg = (await importFromRepo('pg', createRequire(requireFromRepo.resolve('@payloadcms/db-postgres')))).default
  const client = new pg.Client({ connectionString: process.env.DATABASE_URI })
  let table: string | null = null
  try {
    await client.connect()
    table = (await client.query("select to_regclass('public.media')::text as t")).rows[0]?.t ?? null
  } catch (err) {
    fail(`cannot open ${dbName}: ${(err as Error).message}. Nothing was written.`)
  } finally {
    await client.end().catch(() => {})
  }
  if (!table) fail(`${dbName} has no media table; is it the right database? Nothing was written.`)
}

// ── the photos, checked against their manifests ────────────────────────
type Entry = {
  set: string
  file: string
  card?: number
  alt: string
  width: number
  height: number
  bytes: number
  sha256: string
  abs: string
  stored: number // the size Payload stores: the photo re-saved without its embedded metadata, on this machine
}
const entries: Entry[] = []
const shippedNames: string[] = [] // every photo in media/*/manifest.json, whatever SET says
const sharp = (await importFromRepo('sharp')).default
if (!UNDO) {
  const sets = fs.existsSync(MEDIA_ROOT)
    ? fs.readdirSync(MEDIA_ROOT).filter((d) => fs.existsSync(path.join(MEDIA_ROOT, d, 'manifest.json'))).sort()
    : []
  const unknown = SET?.filter((s) => !sets.includes(s)) || []
  if (unknown.length) fail(`SET names no media folder: ${unknown.join(', ')} (have: ${sets.join(', ') || 'none'}). Nothing was written.`)
  for (const set of sets) {
    const files = (JSON.parse(fs.readFileSync(path.join(MEDIA_ROOT, set, 'manifest.json'), 'utf8')).files || []) as { file: string }[]
    shippedNames.push(...files.map((f) => String(f.file)))
  }
  for (const set of SET ?? sets) {
    const dir = path.join(MEDIA_ROOT, set)
    const listed = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')).files as Omit<Entry, 'set' | 'abs' | 'stored'>[] | undefined
    if (!Array.isArray(listed) || !listed.length) fail(`media/${set}/manifest.json lists no files. Nothing was written.`)
    for (const f of listed!) {
      const name = String(f.file)
      if (!FILE_NAME.test(name)) fail(`media/${set}: "${name}" is not a plain lower-case image name (.jpg, .png or .webp). Nothing was written.`)
      if (!String(f.alt || '').trim()) fail(`media/${set}/${name} has no alt text in the manifest. Nothing was written.`)
      const abs = path.join(dir, name)
      if (!fs.existsSync(abs)) fail(`media/${set}/${name} is listed in the manifest but missing. Nothing was written.`)
      const buf = fs.readFileSync(abs)
      if (buf.length !== f.bytes || crypto.createHash('sha256').update(buf).digest('hex') !== f.sha256) {
        fail(`media/${set}/${name} is not the file the manifest describes (size or checksum differs). Nothing was written.`)
      }
      const meta = await sharp(buf).metadata()
      if (meta.format !== FORMAT_OF[name.split('.').pop()!]) fail(`media/${set}/${name} is a ${meta.format} file, not what its name says. Nothing was written.`)
      if (meta.width !== f.width || meta.height !== f.height) {
        fail(`media/${set}/${name} is ${meta.width}x${meta.height}, the manifest says ${f.width}x${f.height}. Nothing was written.`)
      }
      if (entries.some((e) => e.file === name)) fail(`${name} is listed twice. Nothing was written.`)
      const stored = (await sharp(buf).rotate().toBuffer()).length
      entries.push({ ...f, file: name, set, abs, stored })
    }
  }
  if (!entries.length) fail('no photos to upload (no media/<set>/manifest.json). Nothing was written.')
}

// ── load ───────────────────────────────────────────────────────────────
// Production mode: Payload's dev-mode schema push never runs, so this script
// cannot change the database structure.
Object.assign(process.env, { NODE_ENV: 'production', PAYLOAD_DISABLE_DEPENDENCY_CHECKER: 'true' })
const { getPayload } = await importFromRepo('payload')
const { sql } = await importFromRepo('@payloadcms/db-postgres')
const { default: config } = await import(pathToFileURL(configPath).href)
const payload = await getPayload({ config, disableOnInit: true })
const db = (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<{ rows: Record<string, unknown>[] }> } }).drizzle

const mediaConfig = payload.collections.media?.config
if (!mediaConfig?.upload) fail('the media collection is missing from this checkout. Nothing was written.')
const staticDir = path.resolve(repo, String((mediaConfig.upload as { staticDir?: string }).staticDir || 'media'))

type Doc = Record<string, unknown> & { id: number }
type Added = { file: string; id?: number; after?: Doc; leftovers?: string[] }

const stem = (file: string) => file.replace(/\.[^.]+$/, '')
// The file and the resized copies Payload makes of it ("<stem>-300x417.jpg").
const isCopyOf = (name: string, file: string) => name === file || name.startsWith(`${stem(file)}-`)
const findMedia = async (where: Record<string, unknown>, limit = 2) =>
  (await payload.find({ collection: 'media', where, depth: 0, limit })).docs as Doc[]

// The store's own listing (needs the token). Shape checked, so a change in the
// library can only stop the run, never hide a file.
const blobLib = storeId ? await importFromRepo('@vercel/blob', createRequire(requireFromRepo.resolve('@payloadcms/storage-vercel-blob'))) : null
const blobNames = async (prefix: string): Promise<string[]> => {
  if (!blobLib) return []
  const names: string[] = []
  let cursor: string | undefined
  do {
    const res = await blobLib.list({ prefix, token, limit: 1000, cursor })
    if (!res || !Array.isArray(res.blobs) || res.blobs.some((b: { pathname?: unknown }) => typeof b.pathname !== 'string')) {
      throw new Error('the image store answered in an unexpected shape')
    }
    names.push(...res.blobs.map((b: { pathname: string }) => b.pathname))
    cursor = res.hasMore ? res.cursor : undefined
  } while (cursor)
  return names
}
// A plain request to a file's public address: 200 there, 404 not there.
const publicStatus = async (file: string): Promise<number> =>
  (await fetch(`${blobBase}/${encodeURIComponent(file)}?check=${Date.now()}`, { method: 'HEAD', cache: 'no-store' })).status
const diskNames = (file: string) => (fs.existsSync(staticDir) ? fs.readdirSync(staticDir).filter((n) => isCopyOf(n, file)) : [])

// Where a file (or a resized copy of it) already sits, outside the media records.
// Payload checks this checkout's public/media even in Blob mode, and renames
// the upload when the name is there, so the disk counts in both modes.
const leftoversOf = async (file: string): Promise<string[]> => {
  const found: string[] = []
  const disk = diskNames(file)
  if (disk.length) {
    found.push(
      storeId
        ? `${disk.slice(0, 2).join(', ')}${disk.length > 2 ? ' …' : ''} in this checkout's public/media (from a local run; Payload would rename the upload). Move them aside (mv public/media public/media.local) or run from a clean checkout`
        : `${disk.slice(0, 2).join(', ')}${disk.length > 2 ? ' …' : ''} in public/media`,
    )
  }
  const blobs = (await blobNames(stem(file))).filter((n) => isCopyOf(n, file))
  if (blobs.length) found.push(`${blobs.slice(0, 2).join(', ')}${blobs.length > 2 ? ' …' : ''} in the image store`)
  if (blobBase && !found.length) {
    const status = await publicStatus(file)
    if (status !== 404) found.push(`its public address (answers ${status}, expected 404 for a new name)`)
  }
  return found
}

// ── UNDO: remove exactly what one earlier run added ────────────────────
if (UNDO) {
  const dir = path.resolve(UNDO)
  const recordFile = path.join(dir, 'record.json')
  if (!fs.existsSync(recordFile)) fail(`${dir} is not a record made by this script (no record.json). Nothing was written.`)
  const record = JSON.parse(fs.readFileSync(recordFile, 'utf8'))
  if (record.database !== dbName || record.host !== dbHost) {
    fail(`that record is of ${record.database} on ${record.host || 'this computer'}, not ${dbName} on ${dbHost || 'this computer'}. Nothing was written.`)
  }
  if ((record.store || '') !== (storeId || '')) {
    fail(`that record is of image store "${record.store || 'this computer'}", not "${storeId || 'this computer'}". Nothing was written.`)
  }
  const startedAt = new Date(String(record.startedAt)).getTime()
  const added: Added[] = record.added || []
  const planned: string[] = record.planned || []

  // Every column in the database that points at a media record. Fails closed:
  // with no such column found, nothing is removed.
  const refs = (
    await db.execute(sql`
      select kcu.table_name as t, kcu.column_name as c
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
      join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
      where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public' and ccu.table_name = 'media' and ccu.column_name = 'id'`)
  ).rows as { t: string; c: string }[]
  if (!refs.length) fail('found no database column that points at media records, so cannot tell whether a photo is in use. Nothing was written.')
  const usedBy = async (id: number): Promise<string[]> => {
    const uses: string[] = []
    for (const { t, c } of refs) {
      if (!/^[a-z0-9_]+$/.test(t) || !/^[a-z0-9_]+$/.test(c)) fail(`unexpected table name ${t}.${c}. Nothing was written.`)
      const n = Number((await db.execute(sql`select count(*)::int as n from ${sql.raw(`"${t}"`)} where ${sql.raw(`"${c}"`)} = ${id}`)).rows[0]?.n || 0)
      if (n) uses.push(`${t} (${n})`)
    }
    return uses
  }

  type Removal = { file: string; id: number; name: string }
  const removals: Removal[] = []
  const strays: { file: string; names: string[] }[] = [] // files a stopped upload left with no record
  const unclear: string[] = []
  for (const a of added) {
    const now = a.id ? (await findMedia({ id: { equals: a.id } }, 1))[0] : undefined
    if (a.id && !now) {
      console.log(`${a.file}: media ${a.id} is already gone, skip`)
    } else if (now) {
      const ok = a.after
        ? now.filename === a.after.filename && now.updatedAt === a.after.updatedAt
        : isCopyOf(String(now.filename), a.file) && new Date(String(now.createdAt)).getTime() >= startedAt && now.updatedAt === now.createdAt
      if (!ok) {
        unclear.push(`${a.file} (media ${now.id} has changed since that run)`)
        continue
      }
      const uses = await usedBy(now.id)
      if (uses.length) {
        unclear.push(`${a.file} (media ${now.id} is in use: ${uses.join(', ')}; remove the page or item using it first)`)
        continue
      }
      console.log(`${a.file}: media ${now.id} (${now.filename}) unchanged and unused, will remove`)
      removals.push({ file: a.file, id: now.id, name: String(now.filename) })
    }
    // A stopped upload can leave files with no record. The run checked those
    // names were free before it started, so whatever is there now with no
    // record is its own.
    if (!now && (a.leftovers?.length || !a.id)) {
      const names = [...(storeId ? (await blobNames(stem(a.file))).filter((n) => isCopyOf(n, a.file)) : diskNames(a.file))]
      const recorded = names.length ? await findMedia({ filename: { in: names } }, 50) : []
      const free = names.filter((n) => !recorded.some((d) => d.filename === n))
      if (free.length) {
        console.log(`${a.file}: ${free.length} file(s) left by that run with no record (${free.slice(0, 2).join(', ')}${free.length > 2 ? ' …' : ''}), will remove`)
        strays.push({ file: a.file, names: free })
      }
    }
  }
  for (const file of planned) {
    if (added.some((a) => a.file === file)) continue
    for (const d of await findMedia({ filename: { like: stem(file) } }, 20)) {
      if (isCopyOf(String(d.filename), file) && new Date(String(d.createdAt)).getTime() >= startedAt) {
        unclear.push(`${d.filename} (media ${d.id}, created after that run started but not in its record: probably by a later run; undo that run first)`)
      }
    }
  }
  if (unclear.length) fail(`not removing anything; check these first: ${unclear.join('; ')}. Nothing was written.`)
  if (!removals.length && !strays.length) {
    console.log('Nothing to remove.')
    process.exit(0)
  }
  // In Blob mode, Payload's delete also removes this checkout's public/media
  // copies of the same names; refuse rather than touch local files silently.
  if (storeId) {
    const localCopies = removals.flatMap((r) => diskNames(r.name))
    if (localCopies.length) fail(`this checkout's public/media holds ${localCopies.slice(0, 2).join(', ')} …; move public/media aside or run from a clean checkout. Nothing was written.`)
  }
  if (!APPLY) {
    console.log(`\nDry run. To remove: UNDO=${dir} APPLY=1 CONFIRM_DB=${dbName} (same command)`)
    process.exit(0)
  }
  for (const r of removals) {
    const uses = await usedBy(r.id) // again, right before the delete
    if (uses.length) fail(`${r.file}: media ${r.id} came into use (${uses.join(', ')}); stopped before removing it.`)
    // Payload removes the record and asks the storage to delete the file and its resized copies.
    await payload.delete({ collection: 'media', id: r.id, depth: 0, overrideAccess: true })
    if ((await findMedia({ id: { equals: r.id } }, 1)).length) fail(`${r.file}: media ${r.id} is still there after the delete. Check it in the admin.`)
    // The storage hook swallows delete errors, so check the files are gone too.
    const left = storeId ? (await blobNames(stem(r.name))).filter((n) => isCopyOf(n, r.name)) : diskNames(r.name)
    if (left.length) fail(`${r.file}: media ${r.id} was removed but its files are still in the image storage: ${left.join(', ')}. Remove them by hand.`)
    console.log(`${r.file}: removed media ${r.id} and its files`)
  }
  for (const s of strays) {
    for (const n of s.names) {
      if ((await findMedia({ filename: { equals: n } }, 1)).length) fail(`${n} now has a media record; stopped before removing it.`)
      if (storeId) await blobLib.del(`${blobBase}/${n}`, { token })
      else fs.unlinkSync(path.join(staticDir, n))
    }
    console.log(`${s.file}: removed ${s.names.length} file(s) left by that run`)
  }
  process.exit(0)
}

// ── checks first ───────────────────────────────────────────────────────
// The token's store must already hold a file the site uses, or it is not the
// site's store (a wrong token would put the photos where the site never looks).
if (blobBase) {
  // Photos the site already had: none of the ones shipped for this script to upload.
  const newest = (
    await payload.find({ collection: 'media', where: { filename: { not_in: shippedNames } }, sort: '-createdAt', depth: 0, limit: 5 })
  ).docs as Doc[]
  if (!newest.length) {
    if (storeId) fail('this database has no media records to check the image store against. Nothing was written.')
  } else {
    let seen: Doc | undefined
    for (const d of newest) {
      if ((await publicStatus(String(d.filename))) === 200) {
        seen = d
        break
      }
    }
    if (!seen) {
      fail(`the image store ${blobBase} holds none of this database's ${newest.length} newest photos (${newest.map((d) => d.filename).join(', ')}): wrong token or wrong database? Nothing was written.`)
    }
    console.log(`image store check: ${seen!.filename} (media ${seen!.id}) is in it, so it is this site's store`)
  }
}

// Same photo = same type, pixel size and stored size; the alt text may differ.
const samePhoto = (d: Doc, e: Entry) => d.mimeType === MIME_OF[e.file.split('.').pop()!] && d.width === e.width && d.height === e.height && d.filesize === e.stored
const plan = async (e: Entry): Promise<{ state: 'add' | 'same'; note?: string; problem?: string }> => {
  const found = await findMedia({ filename: { equals: e.file } })
  if (found.length > 1) return { state: 'same', problem: `${e.file}: ${found.length} media records already have this name` }
  if (found.length === 1) {
    const d = found[0]
    if (!samePhoto(d, e)) {
      return {
        state: 'same',
        problem: `${e.file}: media ${d.id} already has this name but holds another photo (${d.mimeType}, ${d.width}x${d.height}, ${d.filesize} bytes; expected ${e.width}x${e.height}, ${e.stored} bytes)`,
      }
    }
    return { state: 'same', note: (d.alt || '') !== e.alt ? `alt text differs from the manifest (admin edit?): "${d.alt}"` : undefined }
  }
  const left = await leftoversOf(e.file)
  if (left.length) return { state: 'add', problem: `${e.file}: no media record, but already in ${left.join('; and ')}; uploading would overwrite it or be renamed` }
  return { state: 'add' }
}

const plans: { e: Entry; state: 'add' | 'same' }[] = []
const problems: string[] = []
for (const e of entries) {
  const p = await plan(e)
  if (p.problem) problems.push(p.problem)
  else plans.push({ e, state: p.state })
  if (!p.problem) {
    console.log(`${e.file.padEnd(22)} ${p.state === 'add' ? `will upload (${e.width}x${e.height}, ${Math.round(e.bytes / 1024)} KB)` : `already there and identical, skip${p.note ? `; note: ${p.note}` : ''}`}`)
  }
}
if (problems.length) fail(`${problems.join('; ')}. Nothing was written.`)
const toAdd = plans.filter((p) => p.state === 'add')
console.log(`\n${toAdd.length} to upload, ${plans.length - toAdd.length} already there.`)
if (!toAdd.length) {
  console.log('Nothing to upload.')
  process.exit(0)
}
if (!APPLY) {
  console.log(`\nDry run. To upload: APPLY=1 CONFIRM_DB=${dbName}${SET ? ` SET=${SET.join(',')}` : ''} (same command)`)
  process.exit(0)
}

// ── write ──────────────────────────────────────────────────────────────
// record first, so an interrupted run can still be undone
const dir = path.join(RECORD_ROOT, new Date().toISOString().replace(/[:.]/g, '-'))
fs.mkdirSync(dir, { recursive: true })
const record = {
  database: dbName,
  host: dbHost,
  store: storeId || '',
  startedAt: new Date().toISOString(),
  planned: toAdd.map((p) => p.e.file),
  added: [] as Added[],
}
const save = () => fs.writeFileSync(path.join(dir, 'record.json'), `${JSON.stringify(record, null, 1)}\n`)
save()
console.log(`record: ${dir}`)

let current: Added | undefined
try {
  for (const { e } of toAdd) {
    // The name must still be free right before the upload.
    const again = await plan(e)
    if (again.problem || again.state !== 'add') throw new Error(again.problem || `${e.file} was added by someone else meanwhile`)
    current = { file: e.file }
    record.added.push(current) // before the upload, so UNDO knows to look for leftovers
    save()
    const created = (await payload.create({ collection: 'media', data: { alt: e.alt }, filePath: e.abs, depth: 0, overrideAccess: true })) as Doc
    current.id = created.id
    save()
    const back = (await findMedia({ id: { equals: created.id } }, 1))[0]
    current.after = back
    save()
    if (back.filename !== e.file) throw new Error(`${e.file} was stored as ${back.filename}`)
    if (!samePhoto(back, e) || back.alt !== e.alt) throw new Error(`${e.file} reads back differently from the manifest`)
    if (storeId) {
      const status = await publicStatus(e.file)
      if (status !== 200) throw new Error(`${e.file} was recorded but its public address answers ${status}`)
    } else if (!fs.existsSync(path.join(staticDir, e.file))) {
      throw new Error(`${e.file} was recorded but is not in ${staticDir}`)
    }
    console.log(`${e.file}: uploaded as media ${created.id}, reads back as the manifest`)
    current = undefined
  }
} catch (err) {
  if (current && !current.id) {
    // The upload stopped before a record was made; note any files it left.
    try {
      current.leftovers = storeId ? (await blobNames(stem(current.file))).filter((n) => isCopyOf(n, current!.file)) : diskNames(current.file)
    } catch {
      current.leftovers = ['(could not list the image store)']
    }
    save()
  }
  fail(
    `${(err as Error).message}.\nThe run stopped part-way; ${record.added.filter((a) => a.id).length} photo(s) were added (record: ${dir}).\n` +
      `To finish, run the same APPLY command again (photos already there are skipped).\n` +
      `To remove what it added instead: UNDO=${dir} (a dry run first, then add APPLY=1 CONFIRM_DB=${dbName}).`,
  )
}
console.log(`\nDone: ${toAdd.length} uploaded. To remove them again: UNDO=${dir} APPLY=1 CONFIRM_DB=${dbName} (same command)`)
process.exit(0)
