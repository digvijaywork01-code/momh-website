/**
 * /api/form-token — issues a fresh, server-signed HMAC token bound to
 * the moment the visitor loads a form.
 *
 * Paired with the formSubmissionOverrides hook in src/plugins/index.ts,
 * which verifies the signature and that the token is between 3 seconds
 * and 30 minutes old. The two together stop the simplest scripted-bot
 * attacks: a bot can't pre-generate a valid token (no SECRET), reuse
 * a stale one (expires after 30 min), or submit instantly (rejected
 * under 3 s).
 *
 * `dynamic = 'force-dynamic'` + `Cache-Control: no-store` because every
 * visitor needs a freshly-issued token — caching this response would
 * defeat the protection.
 */

import { NextResponse } from 'next/server'
import crypto from 'node:crypto'

export const dynamic = 'force-dynamic'

export async function GET() {
  const SECRET = process.env.PAYLOAD_SECRET
  if (!SECRET) {
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 500 },
    )
  }

  const ts = Date.now()
  const sig = crypto
    .createHmac('sha256', SECRET)
    .update(String(ts))
    .digest('base64url')

  return NextResponse.json(
    { token: `${ts}.${sig}` },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    },
  )
}
