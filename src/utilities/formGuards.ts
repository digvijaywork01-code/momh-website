/**
 * Spam checks shared by every public MOMH form. SERVER ONLY.
 *
 * The rules are the ones the SS site (sunitashekhawat.com) runs on its
 * forms: the form-submissions hook in its payload.config.ts and its
 * stand-alone /api/unsubscribe-feedback route. Used by:
 *   - the form-submissions hook in src/plugins/index.ts
 *     (Book An Appointment, Personal Consultation);
 *   - /api/email-forwarding (origin check);
 *   - /api/newsletter (the newsletter sign-up).
 *
 * Never import this file from a client component: it reads PAYLOAD_SECRET
 * and loads the ~121k-domain throwaway-email list.
 */

import crypto from 'node:crypto'
import disposableDomains from 'disposable-email-domains'

// ── Origin / Referer allowlist ──────────────────────────────────────────
// Forgeable, but stops direct-API bots that don't bother spoofing.

const ALLOWED_ORIGINS: readonly string[] = ['https://momhindia.org', 'https://www.momhindia.org']
// Preview sites and a developer's own machine, accepted everywhere except
// the live site (Vercel sets VERCEL_ENV to "production" there). Anyone can
// put a page on *.vercel.app, so on the live site only the two addresses
// above count.
const VERCEL_PREVIEW_RE = /^https:\/\/[a-z0-9-]+\.vercel\.app$/
const LOCALHOST_RE = /^http:\/\/localhost(:\d+)?$/
const acceptsTestOrigins = (): boolean => process.env.VERCEL_ENV !== 'production'

const safeUrlOrigin = (input: string): string => {
  try {
    return input ? new URL(input).origin : ''
  } catch {
    return ''
  }
}

export const isAllowedOrigin = (origin: string, referer: string): boolean => {
  const refererOrigin = safeUrlOrigin(referer)
  for (const candidate of [origin, refererOrigin]) {
    if (!candidate) continue
    if (ALLOWED_ORIGINS.includes(candidate)) return true
    if (!acceptsTestOrigins()) continue
    if (VERCEL_PREVIEW_RE.test(candidate)) return true
    if (LOCALHOST_RE.test(candidate)) return true
  }
  return false
}

// ── Honeypot ────────────────────────────────────────────────────────────
// The hidden `website_url` box. Any non-empty value means a bot filled it.

export const isHoneypotFilled = (hp: unknown): boolean => Boolean(hp) && String(hp).length > 0

// ── Signed time pass from /api/form-token ───────────────────────────────
// Format `<timestamp>.<base64url HMAC-SHA256(timestamp, PAYLOAD_SECRET)>`.
// Valid when the signature matches and the pass is 3 s to 30 min old.

export const TOKEN_MIN_MS = 3_000
export const TOKEN_MAX_MS = 30 * 60 * 1000

export type TokenCheck =
  | { ok: true }
  | { ok: false; reason: 'token shape' | 'token signature' | 'token age'; elapsed?: number | null }

export const checkFormToken = (token: unknown): TokenCheck => {
  const secret = process.env.PAYLOAD_SECRET || ''
  const tokenStr = String(token ?? '')
  const dotIdx = tokenStr.indexOf('.')
  if (!secret || dotIdx < 0) return { ok: false, reason: 'token shape' }

  const tsPart = tokenStr.slice(0, dotIdx)
  const sigPart = tokenStr.slice(dotIdx + 1)
  const expectedSig = crypto.createHmac('sha256', secret).update(tsPart).digest('base64url')
  const sigBuf = Buffer.from(sigPart)
  const expectedBuf = Buffer.from(expectedSig)
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return { ok: false, reason: 'token signature' }
  }

  const renderedAt = Number(tsPart)
  const elapsed = Date.now() - renderedAt
  if (
    !Number.isFinite(renderedAt) ||
    renderedAt <= 0 ||
    elapsed < TOKEN_MIN_MS ||
    elapsed > TOKEN_MAX_MS
  ) {
    return { ok: false, reason: 'token age', elapsed: Number.isFinite(elapsed) ? elapsed : null }
  }
  return { ok: true }
}

// ── Throwaway email domains ─────────────────────────────────────────────
// Built once at module load: Set lookup instead of scanning ~121k domains.

const DISPOSABLE_DOMAINS = new Set<string>(disposableDomains as string[])

/** The lower-cased, trimmed text after the first '@' ('' if none). */
export const emailDomain = (email: string): string =>
  email.split('@')[1]?.toLowerCase().trim() ?? ''

export const isDisposableEmail = (email: string): boolean => {
  const domain = emailDomain(email)
  return Boolean(domain) && DISPOSABLE_DOMAINS.has(domain)
}

// ── Logging helper ──────────────────────────────────────────────────────

export const requestIp = (headers: Headers | undefined | null): string =>
  headers?.get?.('x-forwarded-for') ?? 'unknown'
