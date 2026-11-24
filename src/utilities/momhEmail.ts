/**
 * The pieces every MOMH email shares, used by /api/email-forwarding
 * (enquiries) and /api/newsletter (sign-ups): the Resend client, the
 * sender and team addresses, the brand look (header, footer, colours,
 * type) and a retry-safe send. Server only: never import it from a
 * client component.
 */

import { Resend, type CreateEmailOptions } from 'resend'

// Lazy-init on first request (env vars are not resolved while `next build`
// analyses route files). With no RESEND_API_KEY the client is null and the
// sends below are skipped, as on the SS site, instead of calling Resend with
// a made-up key.
let _resend: Resend | null | undefined
export const getResend = (): Resend | null => {
  if (_resend === undefined) {
    _resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  }
  return _resend
}

// Operational addresses.
export const OWNER_EMAILS = ['info@momhindia.org']
export const FROM_ADDRESS = 'Museum of Meenakari Heritage <no-reply@momhindia.org>'

// MOMH brand palette — sourced from src/styles/tokens.css and
// tailwind.config.mjs. Hex values are inlined (not CSS variables) because
// email clients don't evaluate `var()` references.
export const BRAND = {
  red: '#a60b1a', // --color-founder-red — editorial accent
  ink: '#1a1a1a', // body text
  muted: '#6b6b6b', // secondary text
  rule: '#e8e3da', // hairline dividers
  bg: '#fffefa', // --color-ivory — page background
  card: '#ffffff', // email card background
}

// Email-safe type stack. Cormorant + Gill Sans are the site's actual
// faces; both fall back cleanly to Georgia / Helvetica which most mail
// clients render natively (Gmail, Outlook, Apple Mail, etc.).
export const TYPE = {
  serif: "'Cormorant', 'Cormorant Garamond', Georgia, 'Times New Roman', serif",
  sans: "'Gill Sans', 'GillSans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
}

// HTML-escape any user-supplied value before interpolating into markup.
// Without this, a malicious submission body could inject markup into
// either the customer or owner email.
export const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

// Shared editorial wordmark — used at the top of both emails. Renders as
// an HTML table for max email-client compatibility (flexbox is a no-go
// in Outlook etc.).
export const renderHeader = (eyebrow: string) => `
        <tr>
          <td height="3" bgcolor="${BRAND.red}" style="height:3px; line-height:3px; font-size:0;">&nbsp;</td>
        </tr>
        <tr>
          <td align="center" style="padding:48px 32px 14px;">
            <div style="font-family:${TYPE.sans}; font-size:10px; letter-spacing:4px; color:${BRAND.red}; text-transform:uppercase;">Jaipur · Est. 2026</div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 32px 4px;">
            <div style="font-family:${TYPE.serif}; font-size:18px; line-height:1.25; letter-spacing:3px; color:${BRAND.ink}; text-transform:uppercase;">Museum of</div>
            <div style="font-family:${TYPE.serif}; font-size:30px; line-height:1.15; letter-spacing:4px; color:${BRAND.ink}; text-transform:uppercase; margin-top:6px; font-weight:400;">Meenakari Heritage</div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 32px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="56" height="1" bgcolor="${BRAND.red}" style="height:1px; line-height:1px; font-size:0;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:14px 48px 28px;">
            <div style="font-family:${TYPE.sans}; font-size:11px; letter-spacing:3px; color:${BRAND.muted}; text-transform:uppercase;">${escapeHtml(eyebrow)}</div>
          </td>
        </tr>
`

// Shared footer — operational details + a quiet sign-off.
export const renderFooter = () => `
        <tr>
          <td style="padding:0 48px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td height="1" bgcolor="${BRAND.rule}" style="height:1px; line-height:1px; font-size:0;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 48px 6px; font-family:${TYPE.sans}; font-size:13px; line-height:1.7; color:${BRAND.muted};">
            <a href="mailto:info@momhindia.org" style="color:${BRAND.muted}; text-decoration:none;">info@momhindia.org</a>
            &nbsp;·&nbsp;
            <a href="https://momhindia.org" style="color:${BRAND.muted}; text-decoration:none;">momhindia.org</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:6px 48px 8px; font-family:${TYPE.sans}; font-size:12px; line-height:1.7; color:${BRAND.muted};">
            E141, Sardar Patel Marg, Jaipur, Rajasthan
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:6px 48px 36px; font-family:${TYPE.sans}; font-size:10px; letter-spacing:3px; color:${BRAND.red}; text-transform:uppercase;">
            A Living Archive of Meenakari
          </td>
        </tr>
`

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * No answer (network), a Resend 5xx, the per-second limit, or the same key
 * still being processed (Resend: concurrent_idempotent_requests).
 */
const isTemporary = (error: { statusCode?: number | null; name?: string }): boolean =>
  error.statusCode == null ||
  error.statusCode >= 500 ||
  error.name === 'rate_limit_exceeded' ||
  error.name === 'concurrent_idempotent_requests'

/**
 * Send one email with a retry-safe key: a temporary failure is retried once,
 * a second later, with the SAME key and the same content, so Resend never
 * delivers it twice. Resolves with null when sent, else the last error.
 */
export const sendOnce = async (
  resend: Resend,
  email: CreateEmailOptions,
  idempotencyKey: string,
): Promise<{ statusCode?: number | null; name?: string; message?: string } | null> => {
  const attempt = async () => {
    try {
      const { error } = await resend.emails.send(email, { idempotencyKey })
      return error ?? null
    } catch (err) {
      return { statusCode: null, name: 'thrown', message: String(err) }
    }
  }
  let error = await attempt()
  if (error && isTemporary(error)) {
    await sleep(1000)
    error = await attempt()
  }
  // Resend has already accepted an email under this key in the last 24 h
  // (a repeat call for the same enquiry): nothing more to send.
  if (error?.name === 'invalid_idempotent_request') {
    console.warn('momh email: already sent under this key', { idempotencyKey })
    return null
  }
  return error
}
