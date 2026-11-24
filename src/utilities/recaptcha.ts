import { isAllowedOrigin } from './formGuards'

/**
 * Server check of a Google reCAPTCHA v3 token (the invisible kind that
 * gives each visitor a score from 0.0, a bot, to 1.0, a person).
 *
 * The three public forms get a token from Google when they are sent
 * (src/utilities/recaptchaClient.ts) and the server asks Google about it
 * here. Refused: no token, a token Google rejects (fake, reused, older than
 * 2 minutes), a token made for another form or another website, or a score
 * below RECAPTCHA_MIN_SCORE (default 0.5).
 *
 * Settings (Vercel env):
 *   RECAPTCHA_SECRET_KEY            the v3 key pair's secret (server only)
 *   NEXT_PUBLIC_RECAPTCHA_SITE_KEY  the v3 key pair's site key (browser)
 *   RECAPTCHA_MIN_SCORE             optional, 0.0 to 1.0, default 0.5
 * Until BOTH keys are set the check is skipped and logged, so the forms
 * keep working before the keys exist (the site key also has to be in the
 * build, so redeploy after adding it).
 *
 * If Google cannot be reached, the send is allowed and logged: an outage
 * at Google must not lose real enquiries (the other spam checks still run).
 * The same when Google says our secret is wrong: that is a setup mistake,
 * not the visitor's, so it is logged as an error and the send goes ahead.
 *
 * Local testing only: RECAPTCHA_VERIFY_URL points the check at a fake
 * Google; it is ignored in production.
 */

export type RecaptchaAction = 'appointment' | 'consultation' | 'newsletter'

export type RecaptchaResult =
  | { ok: true; outcome: 'passed'; score: number }
  | { ok: true; outcome: 'skipped' | 'unavailable' | 'misconfigured' }
  | { ok: false; reason: string; score?: number }

// Google's answers that mean our secret is wrong, not the visitor's token.
const SETUP_ERRORS = new Set(['missing-input-secret', 'invalid-input-secret'])

const GOOGLE_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'
const TIMEOUT_MS = 5000
// Google's tokens are about 500 to 2,000 characters.
const MAX_TOKEN_LENGTH = 4000

const minScore = (): number => {
  const raw = process.env.RECAPTCHA_MIN_SCORE?.trim()
  const n = raw ? Number(raw) : NaN
  return n >= 0 && n <= 1 ? n : 0.5
}

const verifyUrl = (): string =>
  process.env.NODE_ENV !== 'production' && process.env.RECAPTCHA_VERIFY_URL
    ? process.env.RECAPTCHA_VERIFY_URL
    : GOOGLE_VERIFY_URL

/** Google reports the page's host name, without a port. */
const isOurHost = (hostname: unknown): boolean =>
  typeof hostname === 'string' &&
  hostname !== '' &&
  (isAllowedOrigin(`https://${hostname}`, '') || isAllowedOrigin(`http://${hostname}`, ''))

export const verifyRecaptcha = async (
  token: unknown,
  action: RecaptchaAction,
  ip?: string | null,
): Promise<RecaptchaResult> => {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret || !process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY)
    return { ok: true, outcome: 'skipped' }

  if (typeof token !== 'string' || token.length === 0) return { ok: false, reason: 'missing' }
  if (token.length > MAX_TOKEN_LENGTH) return { ok: false, reason: 'too long' }

  const body = new URLSearchParams({ secret, response: token })
  if (ip) body.set('remoteip', ip)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let data: {
    success?: unknown
    score?: unknown
    action?: unknown
    hostname?: unknown
    'error-codes'?: unknown
  }
  try {
    const res = await fetch(verifyUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) return { ok: true, outcome: 'unavailable' }
    data = await res.json()
  } catch {
    return { ok: true, outcome: 'unavailable' }
  } finally {
    clearTimeout(timer)
  }

  if (data?.success !== true) {
    const list: unknown[] = Array.isArray(data?.['error-codes']) ? data['error-codes'] : []
    if (list.some((c) => typeof c === 'string' && SETUP_ERRORS.has(c))) {
      console.error('[recaptcha] Google refused our secret key; check RECAPTCHA_SECRET_KEY', list)
      return { ok: true, outcome: 'misconfigured' }
    }
    const codes = list.join(',')
    return { ok: false, reason: `rejected by Google${codes ? ` (${codes})` : ''}` }
  }
  const score = typeof data.score === 'number' ? data.score : NaN
  if (data.action !== action) return { ok: false, reason: 'wrong action', score }
  if (!isOurHost(data.hostname)) return { ok: false, reason: 'wrong site', score }
  if (!(score >= minScore())) return { ok: false, reason: 'low score', score }
  return { ok: true, outcome: 'passed', score }
}
