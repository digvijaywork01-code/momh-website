/**
 * /api/newsletter — public newsletter signup endpoint.
 *
 * The newsletter widget (src/components/NewsletterWidget.tsx, on the home
 * page and on Craft Your Jewellery) POSTs `{ email, _hp, _t }` here. We
 * save the address into the `newsletter-subscribers` collection via
 * Payload's local API, so the team sees signups in
 * `/admin → Newsletter Subscribers`.
 *
 * Checks, in the same order as the SS site's form spam gate
 * (src/utilities/formGuards.ts):
 *   1. Origin / Referer must be our own site          → 403
 *   2. Hidden trap box `_hp` must be empty             → 400
 *   3. Signed time pass `_t` must be genuine and
 *      3 s to 30 min old (from /api/form-token)        → 400
 *   4. Email must be a well-formed address             → 400 'Please enter a valid email address.'
 *   5. Email domain must not be a throwaway service    → 400
 *   6. Already subscribed                              → 200 { ok: true } (no hint, so
 *                                                        nobody can probe who is on the list)
 *   7. Save                                            → 200 { ok: true }
 *   8. New subscriber only: the team notice and the visitor's thank-you
 *      email, as on the SS site, sent right after the answer
 *      (src/utilities/newsletterEmails.ts); a send failure never changes it.
 * Each sign-up is also mirrored into the Twenty CRM (src/utilities/twentyCrm.ts),
 * as on the SS site; a CRM failure never changes the answer.
 * Every spam refusal (1, 2, 3, 5) answers with the same visitor line; the
 * real reason goes only to the server log, with the IP.
 *
 * Public `create` on the collection is closed (staff only), so this route
 * is the only way in for visitors and these checks cannot be skipped.
 */

import { after, NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { isValidEmail } from '@/utilities/emailFormat'
import { sendNewsletterEmails } from '@/utilities/newsletterEmails'
import {
  checkFormToken,
  emailDomain,
  isAllowedOrigin,
  isDisposableEmail,
  isHoneypotFilled,
  requestIp,
} from '@/utilities/formGuards'
import { syncNewsletterSignupToCRM } from '@/utilities/twentyCrm'
import { clientIp, withinRateLimit } from '@/utilities/rateLimit'
import { verifyRecaptcha } from '@/utilities/recaptcha'

// The two emails run after the answer (after()), but inside this limit.
export const maxDuration = 30

const GENERIC_ERROR = 'Subscription failed. Please refresh the page and try again.'
const EMAIL_ERROR = 'Please enter a valid email address.'
const TOO_MANY =
  'Too many sign-ups have been sent from your connection just now. Please try again later.'

// Which box a sign-up came from. Anything else is replaced, not refused.
const SOURCES = ['home-newsletter', 'craft-your-jewellery-newsletter'] as const
const DEFAULT_SOURCE = 'home-newsletter'

type Body = { email?: unknown; source?: unknown; _hp?: unknown; _t?: unknown; _rc?: unknown }

const refuse = (status: number, error: string) =>
  NextResponse.json({ ok: false, error }, { status })

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const ip = requestIp(req.headers)

  // 1. Origin / Referer, before the body is read.
  const origin = req.headers.get('origin') ?? ''
  const referer = req.headers.get('referer') ?? ''
  if (!isAllowedOrigin(origin, referer)) {
    console.warn('[newsletter] spam blocked: origin', { origin, referer, ip })
    return refuse(403, GENERIC_ERROR)
  }

  // 1b. A cap per connection (src/utilities/rateLimit.ts); every send from
  // here on counts, refused or not. Fails open if the count cannot be read.
  let payload: Awaited<ReturnType<typeof getPayload>>
  try {
    payload = await getPayload({ config: configPromise })
  } catch (err) {
    console.error('[newsletter] create failed:', err)
    return refuse(500, GENERIC_ERROR)
  }
  if (!(await withinRateLimit(payload, 'newsletter', req.headers))) {
    console.warn('[newsletter] spam blocked: rate limit', { ip })
    return refuse(429, TOO_MANY)
  }

  // A body that is not JSON, or is JSON null / a non-object, reads as {}.
  const raw: unknown = await req.json().catch(() => ({}))
  const body: Body = raw && typeof raw === 'object' ? (raw as Body) : {}

  // 2. Hidden trap box.
  if (isHoneypotFilled(body._hp)) {
    console.warn('[newsletter] spam blocked: honeypot', { ip })
    return refuse(400, GENERIC_ERROR)
  }

  // 3. Signed time pass.
  const token = checkFormToken(body._t)
  if (!token.ok) {
    console.warn(`[newsletter] spam blocked: ${token.reason}`, {
      ...(token.elapsed !== undefined ? { elapsed: token.elapsed } : {}),
      ip,
    })
    return refuse(400, GENERIC_ERROR)
  }

  // 3b. Google reCAPTCHA v3 (src/utilities/recaptcha.ts). Skipped while the
  // secret is not set; allowed (and logged) if Google cannot be reached.
  const captcha = await verifyRecaptcha(body._rc, 'newsletter', clientIp(req.headers))
  if (!captcha.ok) {
    console.warn(`[newsletter] spam blocked: recaptcha ${captcha.reason}`, {
      ...(captcha.score !== undefined ? { score: captcha.score } : {}),
      ip,
    })
    return refuse(400, GENERIC_ERROR)
  }
  if (captcha.outcome !== 'passed') console.warn(`[newsletter] recaptcha ${captcha.outcome}`)

  // 4. Email shape. Trimmed and lower-cased, so one address is one row.
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !isValidEmail(email)) {
    return refuse(400, EMAIL_ERROR)
  }

  // 5. Throwaway email domain.
  if (isDisposableEmail(email)) {
    console.warn('[newsletter] spam blocked: disposable email', { domain: emailDomain(email), ip })
    return refuse(400, GENERIC_ERROR)
  }

  const source =
    typeof body.source === 'string' && (SOURCES as readonly string[]).includes(body.source)
      ? body.source
      : DEFAULT_SOURCE

  try {
    const isSubscribed = async () =>
      (
        await payload.find({
          collection: 'newsletter-subscribers',
          where: { email: { equals: email } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
      ).docs.length > 0

    // 6. Already on the list: same answer as a new sign-up. The CRM is
    // asked again: a person still missing from it (the CRM was down at the
    // first sign-up) is added now; anyone already in it is left unchanged
    // (src/utilities/twentyCrm.ts). A new subscriber is sent by the
    // collection's afterChange hook instead.
    if (await isSubscribed()) {
      await syncNewsletterSignupToCRM(email, payload.logger)
      return NextResponse.json({ ok: true })
    }

    // 7. Save. overrideAccess because public create is closed.
    let saved: { id: number | string; createdAt?: string }
    try {
      saved = await payload.create({
        collection: 'newsletter-subscribers',
        data: { email, source },
        overrideAccess: true,
      })
    } catch (err) {
      // Two sign-ups of the same address at once: one of them hits the
      // unique index. If the address is on the list now, that is success
      // (the request that saved it sends the emails).
      if (await isSubscribed()) return NextResponse.json({ ok: true })
      throw err
    }

    // 8. New subscriber: team notice + thank-you, after the answer.
    after(() => sendNewsletterEmails({ id: saved.id, email, createdAt: saved.createdAt }))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[newsletter] create failed:', err)
    return refuse(500, GENERIC_ERROR)
  }
}
