/**
 * STOP-GAP gate for callers without a login. Temporary.
 *
 * Why it exists: this site runs Payload 3.48.0. Until the upgrade to
 * Payload 3.93.0 or later ships, a caller with no login must not reach
 * Payload's REST API or the admin server function, apart from the few calls
 * the admin login page itself needs. It is a stop-gap for these advisories:
 *   GHSA-xx6w-jxg9-2wh8, GHSA-v49j-62m6-pgrr  (query filters from outsiders)
 *   GHSA-r488-j9vj-wx3q                        (form submissions from outsiders)
 *   GHSA-hp5w-3hxx-vmwf                        (password recovery)
 *
 * It is NOT a fix. A caller WITH a login is not restricted here, with one
 * exception: a request that another website made the browser send (see
 * comesFromAnotherSite below).
 *
 * Used by (and only by):
 *   src/app/(payload)/api/[...slug]/route.ts          REST catch-all
 *   src/app/(payload)/layout.tsx                      admin server function
 *   src/app/(payload)/admin/[[...segments]]/page.tsx  admin pages (other-site rule only)
 * GraphQL is switched off in src/app/(payload)/api/graphql/route.ts.
 *
 * NOT touched by this gate (separate route files, they keep working for
 * visitors): /api/email-forwarding, /api/newsletter, /api/form-token,
 * /api/consultation-upload.
 *
 * REMOVE this file and its three call sites in the same release that
 * upgrades Payload to 3.93.0 or later. Every other place to undo then
 * carries the word STOP-GAP: search the repository for it.
 */
import type { SanitizedConfig } from 'payload'

import { executeAuthStrategies, getPayload } from 'payload'

type Config = Promise<SanitizedConfig> | SanitizedConfig

type RestHandler = (
  request: Request,
  args: { params: Promise<{ slug: string[] }> },
) => Promise<Response>

/**
 * The only REST calls a caller WITHOUT a login may still make, written as
 * "METHOD path" where path is what follows /api/. Exact match only.
 *
 * Left out on purpose:
 * - users/forgot-password and users/reset-password (GHSA-hp5w-3hxx-vmwf).
 *   Until the upgrade, an editor who forgets a password asks another editor
 *   to set a new one in /admin > Users.
 * - users/logout and users/refresh-token. Payload refuses both without a
 *   login anyway, and the admin treats that refusal and this gate's refusal
 *   the same way. Left out, their request bodies are never read for a
 *   caller without a login.
 *
 * users/first-register creates the very first admin user. Only a database
 * with no user yet needs it (a fresh local copy), so it is open in
 * development and closed in every production build (GHSA-97rh-rhh2-7vjv is
 * about that endpoint).
 */
const OPEN_WITHOUT_LOGIN: ReadonlySet<string> = new Set([
  'GET access', // permission list the admin reads; looks up no document
  'GET users/init', // "does a first user exist?"
  'GET users/me', // session check on every admin page; answers { user: null }
  'POST users/login',
  // Visitors' enquiries (Book An Appointment, Personal Consultation). Open
  // again since Payload 3.94.2, which fixes GHSA-r488-j9vj-wx3q; the spam
  // hook in src/plugins/index.ts guards it.
  'POST form-submissions',
  ...(process.env.NODE_ENV === 'production' ? [] : ['POST users/first-register']),
])

/**
 * Local copies only. Without BLOB_READ_WRITE_TOKEN the Blob adapter is off
 * (src/payload.config.ts) and every page image is read from
 * /api/media/file/<name>. Next's image optimizer asks for that address with
 * no cookie at all, so without this a local copy shows no CMS images, even
 * to a logged-in editor. Production always has the token: there this stays
 * closed. The matching read rule is in src/collections/Media.ts.
 */
const servesLocalMediaFiles = (): boolean => !process.env.BLOB_READ_WRITE_TOKEN

/**
 * True when the request carries no valid Payload login. This is the same
 * check, with the same options, that Payload runs for every request.
 */
export const hasNoLogin = async (config: Config, headers: Headers): Promise<boolean> => {
  const payload = await getPayload({ config, cron: true })
  const { user } = await executeAuthStrategies({ headers, payload })

  return !user
}

/**
 * True when the browser says that ANOTHER website made it send this request
 * (a link, a redirect or a script on some other site). Browsers set the
 * Sec-Fetch-Site header themselves; a web page cannot change it.
 *
 * Why it matters: the login cookie travels with such a request when it is a
 * plain page navigation. A link or redirect on another website, opened in a
 * browser where an editor is signed in, would otherwise arrive here with the
 * editor's login and with whatever query the other site chose.
 *
 * Not affected: the admin's own calls say "same-origin"; an address typed by
 * hand, a bookmark, or a link opened from a mail or chat program says
 * "none"; scripts and server-side tools send no such header. Not covered, by
 * design: a link opened from outside the browser.
 */
export const comesFromAnotherSite = (headers: Headers): boolean =>
  headers.get('sec-fetch-site')?.trim().toLowerCase() === 'cross-site'

// Same status and body as Payload's own "Forbidden" answer, so the admin
// treats it the way it treats an expired session today.
const refuse = (reason: 'cross-site' | 'no-login'): Response =>
  Response.json(
    { errors: [{ message: 'You are not allowed to perform this action.' }] },
    { headers: { 'X-Stopgap-Gate': reason }, status: 403 },
  )

/**
 * Wraps one REST handler of the catch-all route. Callers with a login pass
 * straight through. Callers without one reach only OPEN_WITHOUT_LOGIN.
 */
export const gateRest =
  (config: Config, handler: RestHandler): RestHandler =>
  async (request, args) => {
    if (comesFromAnotherSite(request.headers)) {
      return refuse('cross-site')
    }

    const { slug } = await args.params
    // Payload picks the endpoint from exactly these two values (see
    // @payloadcms/next dist/routes/rest/index.js), so the gate and Payload
    // always judge the same thing.
    const call = `${request.method.toUpperCase()} ${(slug ?? []).join('/')}`
    // A POST carrying one of these headers is served by Payload as a GET
    // whose query string is the request body. Only the logged-in admin
    // uses that, so with either header present nothing is open.
    const asksForMethodOverride =
      request.headers.has('X-Payload-HTTP-Method-Override') ||
      request.headers.has('X-HTTP-Method-Override')
    const isLocalMediaFile =
      servesLocalMediaFiles() &&
      request.method === 'GET' &&
      slug?.length === 3 &&
      slug[0] === 'media' &&
      slug[1] === 'file'
    const openWithoutLogin =
      (OPEN_WITHOUT_LOGIN.has(call) || isLocalMediaFile) && !asksForMethodOverride

    if (!openWithoutLogin && (await hasNoLogin(config, request.headers))) {
      return refuse('no-login')
    }

    return handler(request, args)
  }
