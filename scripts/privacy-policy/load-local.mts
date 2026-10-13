/**
 * LOCAL-ONLY loader for the /privacy-policy page (MOMH).
 *
 * Puts the Privacy Policy page (page.json, next to this script) and its hero
 * image (privacy-policy-hero.jpg, also here) into a LOCAL database, so the
 * page can be reviewed on localhost. Production content is entered by hand in
 * momhindia.org/admin, never by this script. It refuses to run against
 * anything that is not a local `*_local` database, refuses on Vercel, and
 * refuses when a Blob token is set (a token would turn the hero upload into a
 * production write).
 *
 * Run from the repo root (Node 22):
 *   pnpm payload run scripts/privacy-policy/load-local.mts
 *
 * Idempotent: reuses the media row named privacy-policy-hero.jpg if present,
 * and updates the privacy-policy page if it exists (otherwise creates it).
 * The page is saved as published.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const HERO_FILE = path.join(here, 'privacy-policy-hero.jpg')
const PAGE_FILE = path.join(here, 'page.json')

const fail = (msg: string): never => {
  console.error(`REFUSED: ${msg}`)
  process.exit(1)
}

// ── guards ─────────────────────────────────────────────────────────────
for (const k of ['VERCEL', 'VERCEL_ENV', 'VERCEL_URL', 'AWS_LAMBDA_FUNCTION_NAME']) {
  if (process.env[k]) fail(`${k} is set; this loader is for a local machine only`)
}
if (process.env.BLOB_READ_WRITE_TOKEN) fail('BLOB_READ_WRITE_TOKEN is set; uploads would go to production')
let dbHost = ''
let dbName = ''
try {
  const u = new URL(process.env.DATABASE_URI || '')
  dbHost = u.hostname
  dbName = decodeURIComponent(u.pathname.replace(/^\//, ''))
} catch {
  fail('DATABASE_URI is unset or unparseable')
}
if (!['127.0.0.1', 'localhost', '::1', '[::1]'].includes(dbHost)) fail(`database host ${dbHost} is not local`)
if (!dbName.endsWith('_local')) fail(`database ${dbName} does not end in _local`)
if (!fs.existsSync(HERO_FILE) || !fs.existsSync(PAGE_FILE)) fail('page.json or privacy-policy-hero.jpg missing next to this script')
console.log(`target: ${dbHost} / ${dbName}`)

// ── load ───────────────────────────────────────────────────────────────
const repo = process.cwd()
const configPath = path.join(repo, 'src', 'payload.config.ts')
if (!fs.existsSync(configPath)) fail(`run this from a MOMH checkout (no ${configPath})`)
// payload and the config are imported only here, after every guard above has
// passed, so nothing is loaded or connected before the target is checked.
const payloadEntry = createRequire(path.join(repo, 'package.json')).resolve('payload')
const { getPayload } = await import(pathToFileURL(payloadEntry).href)
const { default: config } = await import(pathToFileURL(configPath).href)
const payload = await getPayload({ config })

const page = JSON.parse(fs.readFileSync(PAGE_FILE, 'utf8'))
const { heroAlt, ...pageData } = page

// hero media: reuse by filename, else upload (staticDir public/media, no token)
const found = await payload.find({
  collection: 'media',
  where: { filename: { equals: 'privacy-policy-hero.jpg' } },
  limit: 1,
  depth: 0,
})
const media =
  found.docs[0] ??
  (await payload.create({ collection: 'media', data: { alt: heroAlt }, filePath: HERO_FILE }))
console.log(`hero media id ${media.id} (${found.docs[0] ? 'existing' : 'uploaded'})`)

pageData.layout = pageData.layout.map((b: { blockType: string; image?: unknown }) =>
  b.blockType === 'imageBanner' && b.image === '__HERO_MEDIA_ID__' ? { ...b, image: media.id } : b,
)

const existing = await payload.find({
  collection: 'pages',
  where: { slug: { equals: 'privacy-policy' } },
  draft: true,
  limit: 1,
  depth: 0,
})
const data = { ...pageData, _status: 'published' }
const context = { disableRevalidate: true }
const saved = existing.docs[0]
  ? await payload.update({ collection: 'pages', id: existing.docs[0].id, data, context, depth: 0 })
  : await payload.create({ collection: 'pages', data, context, depth: 0 })

// read back
const check = await payload.findByID({ collection: 'pages', id: saved.id, depth: 0 })
const types = (check.layout || []).map((b: { blockType: string }) => b.blockType)
console.log(`page id ${check.id} ${existing.docs[0] ? 'updated' : 'created'}: status ${check._status}, ${types.length} blocks`)
console.log(`  ${types.filter((t: string) => t === 'textSection').length} textSection, ${types.filter((t: string) => t === 'divider').length} divider, first ${types.slice(0, 2).join(', ')}`)
if (check._status !== 'published' || types.length !== pageData.layout.length) fail('read-back does not match page.json')
process.exit(0)
