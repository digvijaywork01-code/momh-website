/**
 * PRODUCTION: creates the two form records the enquiry forms save into:
 *   form 1  "Book An Appointment"     (the form on /book-an-appointment)
 *   form 2  "Personal Consultation"   (the form on /personal-consultation)
 * Run by hand on a developer's machine, never on Vercel.
 *
 * WHY: the new form validation (the same rules as the SS site) saves every
 * enquiry in the admin under Form Submissions BEFORE any email is sent, so no
 * enquiry is lost when an email fails. Payload only accepts a submission that
 * points at an existing form record, and production has none today (forms is
 * empty, its id counter unused). The code refers to the records by number
 * (src/utilities/formIds.ts: appointment 1, consultation 2), as the SS site
 * does, so this script creates exactly those two numbers.
 *
 * ORDER (this script ships in the same PR as the form-validation code):
 *   0. Not while production runs Payload older than 3.90.0: the form
 *      builder there has a critical security hole (advisory
 *      GHSA-r488-j9vj-wx3q, CVSS 10). Upgrade and deploy that first.
 *   1. BEFORE merging, check out the PR's branch (pnpm install) and run this
 *      script on production: a dry run, then APPLY (below). The live site
 *      still runs the old code then, and no page reads these records, so
 *      creating them changes nothing visitors see.
 *   2. Only then merge the PR and deploy main from the CLI
 *      (`vercel deploy --prod`): the Vercel project has no Git link, so a
 *      merge alone deploys nothing, and the deploy's build runs
 *      `payload migrate`. Deployed without these records, every enquiry
 *      would be refused ("Submission failed").
 *   3. Never delete these two records or give them email recipients in the
 *      admin: the site's own email step sends the emails.
 *
 * WHAT IT DOES
 *   - Dry run by default: prints what it would create, writes nothing. Check
 *     that its "database:" line is production's before copying the name into
 *     CONFIRM_DB: when DATABASE_URI is not set in the shell, it comes from the
 *     .env in this checkout (your local database).
 *   - Writes only with APPLY=1 and CONFIRM_DB=<the database name it prints>.
 *   - Each record: the title above, "after submit: go to /thank-you", no
 *     questions, no emails. A record already exactly like that is left alone.
 *     It stops, having written nothing, if either number holds anything else,
 *     if either title is used by another record, or if a record has emails or
 *     questions attached.
 *   - Writes in one transaction: both records or neither. It then moves the
 *     id counter past them, so a form made later in the admin gets number 3.
 *     It reads both records back on a new connection.
 *   - Goes straight to the database instead of through Payload on purpose:
 *     Payload never starts, so the database structure cannot change.
 *   - Before writing, saves a record of what it created outside the repo
 *     (RECORD_DIR, default ~/momh-page-apply-records/<time>-form-records/).
 *     UNDO=<that folder> deletes those records again, only in the same
 *     database, only if they are unchanged and no enquiry or page uses them.
 *
 * RUN from the repo root (Node 22), with production's DATABASE_URI:
 *   pnpm payload run scripts/page-content/form-records.mts                                  dry run
 *   APPLY=1 CONFIRM_DB=<database> pnpm payload run scripts/page-content/form-records.mts    create them
 *   UNDO=<record folder> pnpm payload run scripts/page-content/form-records.mts             (dry run; add APPLY=1 CONFIRM_DB=<database> to delete them)
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const SCRIPT = 'form-records'
// Query-string settings the database address may carry; anything else (a
// port, a socket, a database name) could make it connect somewhere other
// than the name and host printed and confirmed.
const ALLOWED_PARAMS = new Set(['sslmode', 'ssl', 'connect_timeout', 'application_name'])
const LOCK_SECONDS = 300 // an admin edit lock younger than this blocks an UNDO

// Must match src/utilities/formIds.ts.
type Rec = { id: number; title: string }
const RECORDS: readonly Rec[] = [
  { id: 1, title: 'Book An Appointment' },
  { id: 2, title: 'Personal Consultation' },
]
const CONFIRMATION_TYPE = 'redirect'
const REDIRECT_URL = '/thank-you'

// Tables that hang off a form record (questions and emails).
const CHILD_TABLES = [
  'forms_emails',
  'forms_blocks_checkbox',
  'forms_blocks_country',
  'forms_blocks_email',
  'forms_blocks_message',
  'forms_blocks_number',
  'forms_blocks_select',
  'forms_blocks_state',
  'forms_blocks_text',
  'forms_blocks_textarea',
] as const
// Tables whose rows point at a form record (an UNDO must not orphan them).
const USERS_OF_FORMS: readonly (readonly [string, string])[] = [
  ['form_submissions', 'form_id'],
  ['pages_blocks_form_block', 'form_id'],
  ['_pages_v_blocks_form_block', 'form_id'],
  ['pages_blocks_two_column_feature', 'column_a_embed_form_id'],
  ['pages_blocks_two_column_feature', 'column_b_embed_form_id'],
  ['_pages_v_blocks_two_column_feature', 'column_a_embed_form_id'],
  ['_pages_v_blocks_two_column_feature', 'column_b_embed_form_id'],
]

const APPLY = process.env.APPLY === '1'
const UNDO = process.env.UNDO
const RECORD_ROOT = process.env.RECORD_DIR || path.join(os.homedir(), 'momh-page-apply-records')

function fail(msg: string): never {
  console.error(`STOPPED: ${msg}`)
  process.exit(1)
}

// ── guards, before anything is loaded or connected ─────────────────────
for (const k of ['VERCEL', 'VERCEL_ENV', 'VERCEL_URL', 'AWS_LAMBDA_FUNCTION_NAME']) {
  if (process.env[k])
    fail(`${k} is set; run this on a developer's machine, not on Vercel. Nothing was written.`)
}
if (UNDO !== undefined && !UNDO.trim()) fail('UNDO is set but empty. Nothing was written.')

let parsed: URL
try {
  parsed = new URL(process.env.DATABASE_URI || '')
} catch {
  fail('DATABASE_URI is unset or unparseable. Nothing was written.')
}
if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
  fail(
    `DATABASE_URI is a ${parsed.protocol} address; only postgres:// is accepted. Nothing was written.`,
  )
}
const dbHost = parsed.hostname
const dbPort = parsed.port || '5432'
const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
// pg takes host, port and dbname from the query string ahead of the URL's
// own, so the name printed (and confirmed) would not be the database written.
for (const k of parsed.searchParams.keys()) {
  if (!ALLOWED_PARAMS.has(k))
    fail(`DATABASE_URI sets ${k} in its query string. Nothing was written.`)
}
if (!dbHost || dbHost.startsWith('/') || dbHost.toLowerCase().startsWith('%2f')) {
  fail('DATABASE_URI names no network host. Nothing was written.')
}
if (!dbName) fail('DATABASE_URI names no database. Nothing was written.')
console.log(`database: ${dbName} on ${dbHost}:${dbPort}`)
console.log(
  `mode: ${UNDO ? `undo ${path.resolve(UNDO)}` : 'create the form records'}, ${APPLY ? 'WRITING' : 'dry run, nothing is written'}`,
)
if (APPLY && process.env.CONFIRM_DB !== dbName) {
  fail(`APPLY=1 needs CONFIRM_DB=${dbName} (the database above). Nothing was written.`)
}

// ── which records ──────────────────────────────────────────────────────
const byId = new Map<number, Rec>(RECORDS.map((r) => [r.id, r]))
let wanted: Rec[] = [...RECORDS]
if (UNDO) {
  const file = path.join(path.resolve(UNDO), 'record.json')
  let record: {
    script?: unknown
    database?: unknown
    host?: unknown
    port?: unknown
    ids?: unknown
  }
  try {
    record = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (err) {
    fail(`cannot read ${file}: ${(err as Error).message}. Nothing was written.`)
  }
  if (record.script !== SCRIPT) fail(`${file} is not a record of this script. Nothing was written.`)
  if (record.database !== dbName || record.host !== dbHost || record.port !== dbPort) {
    fail(
      `${file} was made on ${String(record.database)} on ${String(record.host)}:${String(record.port)}, not this database. Nothing was written.`,
    )
  }
  const ids = record.ids
  if (
    !Array.isArray(ids) ||
    !ids.length ||
    new Set(ids).size !== ids.length ||
    ids.some((i) => !byId.has(i))
  ) {
    fail(`${file} does not list a valid set of records. Nothing was written.`)
  }
  wanted = ids.map((i: number) => byId.get(i) as Rec)
}
const ids = wanted.map((r) => r.id)

// ── connect (pg directly: Payload is never loaded) ─────────────────────
const repo = process.cwd()
if (!fs.existsSync(path.join(repo, 'src', 'payload.config.ts')))
  fail(`run this from the MOMH repo root (now in ${repo})`)
const requireFromRepo = createRequire(path.join(repo, 'package.json'))
const pgEntry = createRequire(requireFromRepo.resolve('@payloadcms/db-postgres')).resolve('pg')
const pg = (await import(pathToFileURL(pgEntry).href)).default

type Client = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pg rows are untyped
  query: (sql: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }>
  end: () => Promise<void>
}
const open = async (ifFails = 'Nothing was written.'): Promise<Client> => {
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
const close = (c: Client) => {
  void c.end().catch(() => {})
}

type Row = {
  id: number
  title: string
  submit_button_label: string | null
  confirmation_type: string | null
  confirmation_message: unknown
  redirect_url: string | null
}
/** '' when the row is exactly the record this script makes, else what differs. */
const differs = (row: Row, want: Rec): string => {
  const bad: string[] = []
  if (row.title !== want.title) bad.push(`title ${JSON.stringify(row.title)}`)
  if (row.confirmation_type !== CONFIRMATION_TYPE)
    bad.push(`confirmation ${JSON.stringify(row.confirmation_type)}`)
  if (row.redirect_url !== REDIRECT_URL) bad.push(`redirect ${JSON.stringify(row.redirect_url)}`)
  if (row.submit_button_label !== null)
    bad.push(`button label ${JSON.stringify(row.submit_button_label)}`)
  if (row.confirmation_message !== null) bad.push('a confirmation message')
  return bad.join(', ')
}
const readForms = async (c: Client, which: number[]): Promise<Map<number, Row>> =>
  new Map(
    (
      await c.query(
        'select id, title, submit_button_label, confirmation_type::text as confirmation_type, confirmation_message, redirect_url from forms where id = any($1::int[])',
        [which],
      )
    ).rows.map((r: Row) => [r.id, r]),
  )
const childCounts = async (c: Client, which: number[]): Promise<string[]> => {
  const found: string[] = []
  for (const t of CHILD_TABLES) {
    const rows = (
      await c.query(
        `select _parent_id as id, count(*)::int as n from ${t} where _parent_id = any($1::int[]) group by 1`,
        [which],
      )
    ).rows
    for (const r of rows) found.push(`form ${r.id} has ${r.n} row(s) in ${t}`)
  }
  return found
}

const client = await open()

// ── read and decide, before any write ──────────────────────────────────
const problems: string[] = []
const todo: Rec[] = []
let already = 0
try {
  for (const t of [
    'forms',
    'form_submissions',
    'form_submissions_submission_data',
    ...CHILD_TABLES,
  ]) {
    const reg = (await client.query('select to_regclass($1)::text as t', [`public.${t}`])).rows[0]
      ?.t
    if (!reg) fail(`${dbName} has no ${t} table; is it the right database? Nothing was written.`)
  }
  const rows = await readForms(client, ids)
  problems.push(...(await childCounts(client, ids)))

  if (!UNDO) {
    for (const want of wanted) {
      const row = rows.get(want.id)
      if (!row) todo.push(want)
      else if (differs(row, want))
        problems.push(`form ${want.id} already exists with ${differs(row, want)}`)
      else already++
    }
    const titleClash = (
      await client.query(
        'select id, title from forms where title = any($1::text[]) and not (id = any($2::int[]))',
        [wanted.map((r) => r.title), ids],
      )
    ).rows
    for (const r of titleClash)
      problems.push(`another form (id ${r.id}) is already called ${JSON.stringify(r.title)}`)
  } else {
    for (const want of wanted) {
      const row = rows.get(want.id)
      if (!row) continue // already deleted
      if (differs(row, want))
        problems.push(`form ${want.id} has changed since it was created (${differs(row, want)})`)
      else todo.push(want)
    }
    for (const [table, col] of USERS_OF_FORMS) {
      const reg = (await client.query('select to_regclass($1)::text as t', [`public.${table}`]))
        .rows[0]?.t
      if (!reg) continue
      const used = (
        await client.query(
          `select ${col} as id, count(*)::int as n from ${table} where ${col} = any($1::int[]) group by 1`,
          [ids],
        )
      ).rows
      for (const u of used)
        problems.push(`form ${u.id} is used by ${u.n} row(s) in ${table}; it cannot be deleted`)
    }
    const locked = (
      await client.query(
        `select distinct r.forms_id as id
           from payload_locked_documents_rels r
           join payload_locked_documents l on l.id = r.parent_id
          where r.forms_id = any($1::int[])
            and l.updated_at > now() - make_interval(secs => $2)`,
        [ids, LOCK_SECONDS],
      )
    ).rows
    for (const l of locked)
      problems.push(`form ${l.id} has an admin edit lock under ${LOCK_SECONDS / 60} minutes old`)
  }
} catch (err) {
  close(client)
  fail(`could not read the form records: ${(err as Error).message}. Nothing was written.`)
}
if (problems.length) {
  close(client)
  for (const p of problems) console.error(`  ${p}`)
  fail(`${problems.length} problem(s) above. Nothing was written.`)
}

for (const r of todo) {
  console.log(
    UNDO
      ? `form ${r.id}  ${r.title}: delete`
      : `form ${r.id}  ${r.title}: create (after submit go to ${REDIRECT_URL}, no questions, no emails)`,
  )
}
console.log(
  `${todo.length} to ${UNDO ? 'delete' : 'create'}, ${UNDO ? wanted.length - todo.length : already} already done, ${wanted.length} on the list.`,
)
if (!todo.length) {
  close(client)
  console.log('Nothing to do.')
  process.exit(0)
}
if (!APPLY) {
  close(client)
  console.log(
    `Dry run: nothing was written. To make the change: APPLY=1 CONFIRM_DB=${dbName} (and the same command).`,
  )
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
        {
          script: SCRIPT,
          database: dbName,
          host: dbHost,
          port: dbPort,
          when: new Date().toISOString(),
          ids: todo.map((r) => r.id),
          records: todo,
        },
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

const todoIds = todo.map((r) => r.id)
try {
  await client.query('begin')
  await client.query(`set local lock_timeout = '15s'`)
  // If this machine drops off the network, the server lets go of the table itself.
  await client.query(`set local idle_in_transaction_session_timeout = '30s'`)
  // Holds off a form being made in the admin at the same moment (it would
  // take the same number). Reading forms stays possible meanwhile.
  await client.query('lock table forms in share row exclusive mode')
  const now = await readForms(client, todoIds)
  if (!UNDO) {
    for (const r of todo) {
      if (now.has(r.id)) throw new Error(`form ${r.id} appeared while this script was running`)
      const res = await client.query(
        `insert into forms (id, title, submit_button_label, confirmation_type, confirmation_message, redirect_url)
         values ($1, $2, null, $3::enum_forms_confirmation_type, null, $4)`,
        [r.id, r.title, CONFIRMATION_TYPE, REDIRECT_URL],
      )
      if (res.rowCount !== 1) throw new Error(`form ${r.id} was not created`)
    }
    // Next form made in the admin continues after the highest number in use.
    await client.query(`select setval('forms_id_seq', (select max(id) from forms), true)`)
  } else {
    // Row locks first: a save that points a page or an enquiry at one of
    // these records waits for them (and one already in progress finishes
    // first). Then look again for anything using them, because a page link
    // made after the check above would otherwise be emptied by the delete.
    await client.query('select id from forms where id = any($1::int[]) order by id for update', [
      todoIds,
    ])
    for (const [table, col] of USERS_OF_FORMS) {
      const reg = (await client.query('select to_regclass($1)::text as t', [`public.${table}`]))
        .rows[0]?.t
      if (!reg) continue
      const used = (
        await client.query(
          `select count(*)::int as n from ${table} where ${col} = any($1::int[])`,
          [todoIds],
        )
      ).rows[0]?.n
      if (used)
        throw new Error(`a form is now used by ${used} row(s) in ${table}; it cannot be deleted`)
    }
    // Emails or questions added to a record during the run would be
    // deleted with it (ON DELETE CASCADE), so they stop the undo too.
    const kids = await childCounts(client, todoIds)
    if (kids.length) throw new Error(kids.join('; '))
    for (const r of todo) {
      const row = now.get(r.id)
      if (!row || differs(row, r))
        throw new Error(`form ${r.id} changed while this script was running`)
      const res = await client.query('delete from forms where id = $1 and title = $2', [
        r.id,
        r.title,
      ])
      if (res.rowCount !== 1) throw new Error(`form ${r.id} was not deleted`)
    }
  }
  const after = await readForms(client, todoIds)
  for (const r of todo) {
    const row = after.get(r.id)
    if (UNDO ? row : !row || differs(row, r))
      throw new Error(`form ${r.id} did not read back as expected`)
  }
  const children = await childCounts(client, todoIds)
  if (children.length) throw new Error(children.join('; '))
} catch (err) {
  // Wait briefly: on a dead connection this never answers, and leaving ends the
  // transaction anyway, because nothing was committed.
  await Promise.race([
    client.query('rollback').catch(() => {}),
    new Promise((r) => setTimeout(r, 5000)),
  ])
  close(client)
  // A record of a run that changed nothing must not be there for a later UNDO.
  if (recordDir) fs.rmSync(recordDir, { recursive: true, force: true })
  fail(`${(err as Error).message}. Rolled back: nothing was written.`)
}
try {
  await client.query('commit')
} catch (err) {
  close(client)
  fail(
    `the connection failed during the commit (${(err as Error).message}), so the result is not known. Run the dry run to see where it stands.`,
  )
}
close(client)

// ── read back on a new connection ──────────────────────────────────────
const unread = `The change WAS committed, but it could not be read back. Run the dry run to see where it stands.${recordDir ? ` To undo: UNDO=${recordDir}` : ''}`
const check = await open(unread)
let final: Map<number, Row>
let next: { last_value: string; is_called: boolean }
try {
  final = await readForms(check, todoIds)
  next = (await check.query('select last_value::text as last_value, is_called from forms_id_seq'))
    .rows[0]
} catch (err) {
  fail(`${(err as Error).message}. ${unread}`)
}
close(check)
const wrong = todo.filter((r) =>
  UNDO ? final.has(r.id) : !final.has(r.id) || differs(final.get(r.id) as Row, r),
)
if (wrong.length)
  fail(
    `committed, but ${wrong.length} record(s) read back differently: ${wrong.map((r) => r.id).join(', ')}.`,
  )

console.log(`Done: ${todo.length} form record(s) ${UNDO ? 'deleted' : 'created'} and read back.`)
if (!UNDO) {
  console.log(
    `Id counter: next form made in the admin gets ${Number(next.last_value) + (next.is_called ? 1 : 0)}.`,
  )
  console.log(`To undo: UNDO=${recordDir} (dry run; add APPLY=1 CONFIRM_DB=${dbName}).`)
  console.log(
    'Next: merge the PR, then deploy main with vercel deploy --prod (its build runs the migration).',
  )
}
process.exit(0)
