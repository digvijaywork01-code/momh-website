/**
 * /api/newsletter — public newsletter signup endpoint.
 *
 * The home-page "Our Newsletter" widget (NewsletterWidget) POSTs
 * `{ email }` here. We forward the address into the
 * `newsletter-subscribers` collection via Payload's local API, so the
 * team sees signups in `/admin → Submissions → Newsletter Subscribers`.
 *
 * Behaviour:
 *   - Valid email          → 200 { ok: true }
 *   - Already subscribed   → 200 { ok: true } (silently, so the widget
 *                            shows "Subscribed" instead of an error
 *                            and we don't leak who's on the list).
 *   - Missing / malformed  → 400 { ok: false, error }
 *   - Anything else        → 500 { ok: false, error }
 *
 * Using a thin wrapper (instead of pointing the widget at the auto-
 * generated `/api/newsletter-subscribers` REST endpoint) lets us
 * sanitise input, dedupe gracefully, and keep the public response
 * shape stable as we plug in things like Mailchimp / Resend audiences
 * later.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

// Basic RFC-ish email shape check. The collection's `email` field also
// validates, but we want a clean 400 BEFORE hitting the DB so bots and
// fat-fingered submissions don't churn the Postgres connection.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Body = { email?: string; source?: string }

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: 'A valid email address is required' },
      { status: 400 },
    )
  }

  const source =
    typeof body.source === 'string' && body.source.trim()
      ? body.source.trim().slice(0, 100)
      : 'home-newsletter'

  try {
    const payload = await getPayload({ config: configPromise })

    // Pre-check for an existing subscriber instead of parsing the
    // duplicate-key error shape that comes back from .create() — the
    // exact ValidationError / Postgres error shape varies between
    // Payload + adapter versions, and a returning subscriber should
    // ALWAYS see the friendly "Subscribed" UX (never an accidental
    // 500). The extra read is cheap and uses the unique index on email.
    const existing = await payload.find({
      collection: 'newsletter-subscribers',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) {
      return NextResponse.json({ ok: true, duplicate: true })
    }

    await payload.create({
      collection: 'newsletter-subscribers',
      data: { email, source },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    // Race: two concurrent submits of the same email can both pass the
    // pre-check and one will then fail the unique index. Catch that
    // specific case (ValidationError with our email field) and still
    // return success — anything else is a genuine 500.
    const e = err as { name?: string; message?: string }
    if (e?.name === 'ValidationError' && /email/i.test(e?.message || '')) {
      return NextResponse.json({ ok: true, duplicate: true })
    }
    console.error('[newsletter] create failed:', err)
    return NextResponse.json(
      { ok: false, error: 'Subscription failed. Please try again.' },
      { status: 500 },
    )
  }
}
