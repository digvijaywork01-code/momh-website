/**
 * /api/email-forwarding — sends customer confirmation + owner notification
 * emails after a form is submitted.
 *
 * Same pattern as the SS site (House of Sunita Shekhawat): the Payload
 * form-builder plugin persists the submission via `/api/form-submissions`,
 * and immediately after a successful POST the client calls this route to
 * dispatch the two emails. Persistence and email delivery are decoupled
 * so a Resend outage never blocks the form submission itself.
 *
 * Two HTML templates live here:
 *   1. Customer confirmation — a small, editorial "thank you" branded for
 *      the Museum of Meenakari Heritage. No data is echoed back; this is
 *      a warm acknowledgement that the enquiry has landed.
 *   2. Owner notification — a clean table of `field: value` pairs sent to
 *      info@momhindia.org. Intentionally simple so the team can scan
 *      enquiries quickly from any inbox / mobile preview.
 *
 * Hand-rolled forms (AppointmentForm, ConsultationForm) post directly
 * to this endpoint with a synthetic `submissionData` array; the generic
 * <FormBlock> posts after its successful `/api/form-submissions` call.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Lazy-init: the Resend constructor throws if called with no API key,
// which happens during `next build` (Vercel statically analyses route
// files before env vars are resolved). Construct on first request
// instead so a missing key produces a clean runtime error rather than
// a build failure.
let _resend: Resend | null = null
const getResend = (): Resend => {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')
  }
  return _resend
}

// Operational addresses.
const OWNER_EMAILS = ['info@momhindia.org']
const FROM_ADDRESS = 'Museum of Meenakari Heritage <no-reply@momhindia.org>'

// MOMH brand palette — sourced from src/styles/tokens.css and
// tailwind.config.mjs. Hex values are inlined (not CSS variables) because
// email clients don't evaluate `var()` references.
const BRAND = {
  red: '#a60b1a',      // --color-founder-red — editorial accent
  ink: '#1a1a1a',      // body text
  muted: '#6b6b6b',    // secondary text
  rule: '#e8e3da',     // hairline dividers
  bg: '#fffefa',       // --color-ivory — page background
  card: '#ffffff',     // email card background
}

// Email-safe type stack. Cormorant + Gill Sans are the site's actual
// faces; both fall back cleanly to Georgia / Helvetica which most mail
// clients render natively (Gmail, Outlook, Apple Mail, etc.).
const TYPE = {
  serif: "'Cormorant', 'Cormorant Garamond', Georgia, 'Times New Roman', serif",
  sans: "'Gill Sans', 'GillSans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
}

// HTML-escape any user-supplied value before interpolating into markup.
// Without this, a malicious submission body could inject markup into
// either the customer or owner email.
const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const extractNameParts = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/)
  const firstName = parts[0] || ''
  const lastName = parts.slice(1).join(' ') || ''
  return { firstName, lastName }
}

// Human-readable label for snake / camel cased field names. Falls back
// to a Title Case version of the raw name if no explicit mapping exists.
const formatFieldName = (fieldName: string): string => {
  const map: Record<string, string> = {
    firstname: 'First Name',
    lastname: 'Last Name',
    'first name': 'First Name',
    'last name': 'Last Name',
    name: 'Full Name',
    fullname: 'Full Name',
    email: 'Email',
    emailaddress: 'Email Address',
    'email address': 'Email Address',
    phone: 'Phone Number',
    phonenumber: 'Phone Number',
    'phone number': 'Phone Number',
    contact: 'Contact Number',
    contactnumber: 'Contact Number',
    'contact number': 'Contact Number',
    city: 'City',
    country: 'Country',
    occupation: 'Occupation',
    groupsize: 'Group Size',
    'group size': 'Group Size',
    hearaboutus: 'How they heard about us',
    'hear about us': 'How they heard about us',
    queries: 'Queries / Comments',
    queriescomments: 'Queries / Comments',
    'queries comments': 'Queries / Comments',
    comments: 'Comments',
    message: 'Message',
    messagedetails: 'Message',
    'message details': 'Message',
    purpose: 'Purpose of Visit',
    visitdate: 'Preferred Date',
    'visit date': 'Preferred Date',
    location: 'Preferred Location',
    recaptchatoken: 'Verification Token',
  }
  const key = fieldName.toLowerCase().trim()
  if (map[key]) return map[key]
  return fieldName
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// Shared editorial wordmark — used at the top of both emails. Renders as
// an HTML table for max email-client compatibility (flexbox is a no-go
// in Outlook etc.).
const renderHeader = (eyebrow: string) => `
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
const renderFooter = () => `
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

// ── Customer confirmation ────────────────────────────────────────────
// Sent to whoever filled out the form. Warm, editorial, no echo of the
// submitted data (keeps the email looking like a museum acknowledgement
// rather than a transactional receipt).
const generateCustomerEmailHTML = (
  firstName: string,
  lastName: string,
  formType: string,
) => {
  const safeFirst = escapeHtml(firstName).trim()
  const safeLast = escapeHtml(lastName).trim()
  const greeting = safeFirst
    ? `Dear ${safeFirst}${safeLast ? ' ' + safeLast : ''},`
    : 'Dear Guest,'

  const isAppointment = formType === 'appointment'
  const isConsultation = formType === 'consultation'

  const title = 'Thank you for writing to the Museum'
  const eyebrow = isAppointment
    ? 'Visit Enquiry Received'
    : isConsultation
      ? 'Consultation Enquiry Received'
      : 'Enquiry Received'

  const body = isAppointment
    ? `<p style="margin:0 0 18px;">Thank you for your interest in visiting the Museum of Meenakari Heritage. A member of our team will be in touch shortly to confirm your visit and share what to expect on the day.</p>
       <p style="margin:0 0 18px;">In the meantime, you can read more about the Museum, its architecture and current exhibits on our website.</p>
       <p style="margin:0;">Should you wish to reach us directly, our details are below.</p>`
    : isConsultation
      ? `<p style="margin:0 0 18px;">Thank you for writing to us about a private consultation. Our atelier team will be in touch shortly to begin the conversation about your piece.</p>
       <p style="margin:0 0 18px;">A bespoke commission begins with listening — to the occasion, the wearer, the story you would like the jewel to carry. We look forward to that conversation.</p>
       <p style="margin:0;">Should you wish to reach us in the meantime, our details are below.</p>`
      : `<p style="margin:0 0 18px;">Thank you for writing to the Museum of Meenakari Heritage. A member of our team will be in touch shortly to assist with your enquiry.</p>
       <p style="margin:0;">Should you wish to reach us in the meantime, our details are below.</p>`

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0; padding:0; background:${BRAND.bg}; -webkit-font-smoothing:antialiased; -webkit-text-size-adjust:none;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${BRAND.bg}" style="background:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px; width:100%; background:${BRAND.card};">
          ${renderHeader(eyebrow)}
          <tr>
            <td style="padding:0 48px 40px; font-family:${TYPE.sans}; font-size:16px; line-height:1.7; color:${BRAND.ink};">
              <p style="margin:0 0 18px;">${greeting}</p>
              ${body}
              <p style="margin:30px 0 0; font-family:${TYPE.serif}; font-style:italic; color:${BRAND.ink}; font-size:18px;">With warm regards,</p>
              <p style="margin:4px 0 0; font-family:${TYPE.serif}; color:${BRAND.ink}; font-size:18px;">The Museum of Meenakari Heritage</p>
            </td>
          </tr>
          ${renderFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Owner notification ──────────────────────────────────────────────
// Simple two-column table of every submitted field. No editorial flourish
// beyond the brand wordmark — the team needs to scan these quickly.
const generateOwnerEmailHTML = (
  data: Record<string, unknown>,
  formType: string,
) => {
  const fields =
    (data.submissionData as Array<{ field: string; value: unknown }>) || []

  const formLabel =
    formType === 'appointment'
      ? 'Visit Appointment Enquiry'
      : formType === 'consultation'
        ? 'Private Consultation Enquiry'
        : formType === 'newsletter'
          ? 'Newsletter Subscription'
          : 'Contact Enquiry'

  // Skip internal spam-protection markers from the owner-visible table.
  const visibleFields = fields.filter(
    (f) => f.field !== '_hp' && f.field !== '_t' && f.field !== 'recaptchaToken',
  )

  const fieldRows = visibleFields
    .map((field, idx) => {
      const label = escapeHtml(formatFieldName(field.field))
      const rawValue = field.value == null ? '' : String(field.value)
      const safeValue = escapeHtml(rawValue).replace(/\r?\n/g, '<br />')
      const isLast = idx === visibleFields.length - 1
      const borderBottom = isLast ? '' : `border-bottom:1px solid ${BRAND.rule};`
      return `
              <tr>
                <td valign="top" style="padding:14px 16px 14px 0; ${borderBottom} font-family:${TYPE.sans}; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${BRAND.red}; width:38%; vertical-align:top;">${label}</td>
                <td valign="top" style="padding:14px 0; ${borderBottom} font-family:${TYPE.sans}; font-size:15px; line-height:1.6; color:${BRAND.ink};">${safeValue || '&mdash;'}</td>
              </tr>`
    })
    .join('')

  const submittedAt = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(formLabel)}</title>
</head>
<body style="margin:0; padding:0; background:${BRAND.bg}; -webkit-font-smoothing:antialiased; -webkit-text-size-adjust:none;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${BRAND.bg}" style="background:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px; width:100%; background:${BRAND.card};">
          ${renderHeader('New Enquiry')}
          <tr>
            <td align="center" style="padding:0 48px 6px;">
              <div style="font-family:${TYPE.serif}; font-size:22px; line-height:1.3; letter-spacing:1px; color:${BRAND.ink};">${escapeHtml(formLabel)}</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 48px 28px; font-family:${TYPE.sans}; font-size:12px; color:${BRAND.muted};">
              ${escapeHtml(submittedAt)} &nbsp;·&nbsp; IST
            </td>
          </tr>
          <tr>
            <td style="padding:0 48px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid ${BRAND.rule};">
                ${fieldRows}
              </table>
            </td>
          </tr>
          ${renderFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Origin allowlist ────────────────────────────────────────────────
// Defense in depth alongside the formSubmissionOverrides hook: a bot
// that hits this route directly (skipping /api/form-submissions) still
// gets a 403 if it isn't coming from one of our domains.
const ALLOWED_ORIGINS = ['https://momhindia.org', 'https://www.momhindia.org']
const VERCEL_PREVIEW_RE = /^https:\/\/[a-z0-9-]+\.vercel\.app$/
const LOCALHOST_RE = /^http:\/\/localhost(:\d+)?$/

const safeUrlOrigin = (input: string): string => {
  try {
    return input ? new URL(input).origin : ''
  } catch {
    return ''
  }
}

const isAllowedOrigin = (origin: string, referer: string): boolean => {
  const refererOrigin = safeUrlOrigin(referer)
  for (const candidate of [origin, refererOrigin]) {
    if (!candidate) continue
    if (ALLOWED_ORIGINS.includes(candidate)) return true
    if (VERCEL_PREVIEW_RE.test(candidate)) return true
    if (LOCALHOST_RE.test(candidate)) return true
  }
  return false
}

// ── Handler ──────────────────────────────────────────────────────────
//
// Expected body shape (same as SS):
//   {
//     form?: number | string,      // Payload Form ID when from FormBlock; absent for hand-rolled forms
//     formType?: string,           // explicit hint from hand-rolled forms: 'appointment' | 'consultation' | etc.
//     submissionData: Array<{ field: string, value: unknown }>
//   }
//
// The endpoint never throws back to the caller — email failures are
// logged and a generic 200 is returned so submissions never appear to
// "fail" because of a Resend hiccup. The form data is already safely
// persisted in /api/form-submissions before this route is called.
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') ?? ''
    const referer = request.headers.get('referer') ?? ''
    if (!isAllowedOrigin(origin, referer)) {
      console.warn('email-forwarding rejected: bad origin', { origin, referer })
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const data = await request.json()

    if (!data?.submissionData || !Array.isArray(data.submissionData)) {
      return NextResponse.json(
        { message: 'Missing or malformed submissionData' },
        { status: 400 },
      )
    }

    // Look up the customer's email — try field-name first, then a
    // shape-based fallback (anything that looks like name@host.tld).
    const emailField = data.submissionData.find(
      (item: { field: string; value: unknown }) => {
        const fieldName = String(item.field || '').toLowerCase()
        if (fieldName.includes('email') || fieldName.includes('mail')) return true
        const v = item.value
        if (typeof v === 'string' && /.+@.+\..+/.test(v)) return true
        return false
      },
    )
    const customerEmail =
      emailField && typeof emailField.value === 'string'
        ? emailField.value.trim()
        : ''

    // Pull a name for the personalised greeting. Try a `name` field
    // first; otherwise stitch first + last together.
    let fullName = ''
    const fullNameField = data.submissionData.find(
      (item: { field: string; value: unknown }) => {
        const n = String(item.field || '').toLowerCase()
        return (
          n === 'name' || n === 'fullname' || n === 'full name'
        )
      },
    )
    if (fullNameField && typeof fullNameField.value === 'string') {
      fullName = fullNameField.value
    } else {
      const first = data.submissionData.find(
        (item: { field: string; value: unknown }) =>
          /first/.test(String(item.field || '').toLowerCase()),
      )
      const last = data.submissionData.find(
        (item: { field: string; value: unknown }) =>
          /last/.test(String(item.field || '').toLowerCase()),
      )
      const a = first && typeof first.value === 'string' ? first.value : ''
      const b = last && typeof last.value === 'string' ? last.value : ''
      fullName = [a, b].filter(Boolean).join(' ').trim()
    }
    const { firstName, lastName } = extractNameParts(fullName)

    // Resolve form type. Hand-rolled forms pass `formType` directly;
    // the generic FormBlock passes `form` (Payload ID) which we map.
    let formType: 'appointment' | 'consultation' | 'newsletter' | 'contact' = 'contact'
    if (typeof data.formType === 'string') {
      const t = data.formType.toLowerCase()
      if (t === 'appointment' || t === 'consultation' || t === 'newsletter') {
        formType = t
      }
    }

    // Customer confirmation. Skipped silently if no email was captured
    // (e.g. a hand-rolled form without an email field — owner still
    // gets the notification below).
    if (customerEmail) {
      const customerSubject = 'Thank you for writing to the Museum of Meenakari Heritage'
      try {
        await getResend().emails.send({
          from: FROM_ADDRESS,
          to: customerEmail,
          subject: customerSubject,
          html: generateCustomerEmailHTML(firstName, lastName, formType),
        })
      } catch (emailError) {
        console.error('momh email-forwarding: customer email failed', emailError)
      }
    }

    const ownerSubject =
      formType === 'appointment'
        ? 'New enquiry · Visit appointment'
        : formType === 'consultation'
          ? 'New enquiry · Private consultation'
          : formType === 'newsletter'
            ? 'New subscription · Newsletter'
            : 'New enquiry · Contact form'

    for (const ownerEmail of OWNER_EMAILS) {
      try {
        await getResend().emails.send({
          from: FROM_ADDRESS,
          to: ownerEmail,
          subject: ownerSubject,
          html: generateOwnerEmailHTML(data, formType),
        })
      } catch (emailError) {
        console.error(
          `momh email-forwarding: owner email to ${ownerEmail} failed`,
          emailError,
        )
      }
    }

    return NextResponse.json({
      ok: true,
      customerEmailed: Boolean(customerEmail),
      ownersNotified: OWNER_EMAILS.length,
    })
  } catch (error) {
    console.error('momh email-forwarding: unexpected error', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    )
  }
}
