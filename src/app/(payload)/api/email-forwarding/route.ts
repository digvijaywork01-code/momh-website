/**
 * /api/email-forwarding — sends customer confirmation + owner notification
 * emails after a form is submitted.
 *
 * Same pattern as the SS site (House of Sunita Shekhawat): the form saves
 * the enquiry first through `/api/form-submissions` (where the spam checks
 * in src/plugins/index.ts run), and only then calls this route with the
 * saved submission's id. This route builds both emails from the STORED
 * record, so a caller can choose neither the recipient nor the content.
 * Saving and emailing are decoupled, so a Resend outage never loses an
 * enquiry: it is in the admin under Form Submissions either way.
 *
 * Two HTML templates live here:
 *   1. Customer confirmation — a small, editorial "thank you" branded for
 *      the Museum of Meenakari Heritage. No data is echoed back; this is
 *      a warm acknowledgement that the enquiry has landed.
 *   2. Owner notification — a clean table of `field: value` pairs sent to
 *      info@momhindia.org. Intentionally simple so the team can scan
 *      enquiries quickly from any inbox / mobile preview.
 *
 * Personal Consultation: the visitor's reference file stays in the private
 * S3 bucket, and the team email carries it as an attachment (the sales team
 * reads enquiries in the mailbox, not the admin), plus a 7-day view link.
 *
 * The checks run before the answer; the emails are sent right after it
 * (next/server after()), team email first, so the visitor goes straight to
 * the thank-you page and never waits for a large email to send.
 *
 * Callers: AppointmentForm, ConsultationForm and the generic <FormBlock>,
 * each right after its successful `/api/form-submissions` call, with
 * `{ submissionId }` only.
 */

import { after, NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import {
  BRAND,
  FROM_ADDRESS,
  OWNER_EMAILS,
  TYPE,
  escapeHtml,
  getResend,
  renderFooter,
  renderHeader,
  sendOnce,
  sleep,
} from '@/utilities/momhEmail'
import { FORM_IDS } from '@/utilities/formIds'
import { isAllowedOrigin } from '@/utilities/formGuards'
import { createViewLink, readUpload } from '@/utilities/s3Upload'
import { isUploadType, safeFileName } from '@/utilities/uploadRules'

// The sends run after the answer (after()), but inside this limit: reading
// the uploaded file back from S3 and sending it to Resend can take a few
// seconds. 60 is allowed on every Vercel plan.
export const maxDuration = 60

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
    referenceimage: 'Reference Image',
    referenceimagename: 'Reference File Name',
    referenceimagenote: 'Upload Note',
  }
  const key = fieldName.toLowerCase().trim()
  if (map[key]) return map[key]
  return fieldName
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Customer confirmation ────────────────────────────────────────────
// Sent to whoever filled out the form. Warm, editorial, no echo of the
// submitted data (keeps the email looking like a museum acknowledgement
// rather than a transactional receipt).
const generateCustomerEmailHTML = (firstName: string, lastName: string, formType: string) => {
  const safeFirst = escapeHtml(firstName).trim()
  const safeLast = escapeHtml(lastName).trim()
  const greeting = safeFirst ? `Dear ${safeFirst}${safeLast ? ' ' + safeLast : ''},` : 'Dear Guest,'

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
// How the consultation's reference file shows in the team email.
type UploadDisplay =
  | { kind: 'attached'; name: string; href: string | null }
  | { kind: 'link'; href: string }
  | { kind: 'note'; text: string }

const FILE_NOT_ARRIVED = 'The file did not arrive. Please ask the visitor to send it by email.'

// Simple two-column table of every submitted field. No editorial flourish
// beyond the brand wordmark — the team needs to scan these quickly.
const generateOwnerEmailHTML = (
  data: Record<string, unknown>,
  formType: string,
  // Field name -> what to show instead of the stored value (the
  // consultation's uploaded reference file).
  display: Record<string, UploadDisplay> = {},
  // When the enquiry was saved. Using it (not the send time) keeps the
  // email identical if it is ever sent again under the same Resend key.
  savedAt?: string,
) => {
  const fields = (data.submissionData as Array<{ field: string; value: unknown }>) || []

  const formLabel =
    formType === 'appointment'
      ? 'Visit Appointment Enquiry'
      : formType === 'consultation'
        ? 'Private Consultation Enquiry'
        : formType === 'newsletter'
          ? 'Newsletter Subscription'
          : 'Contact Enquiry'

  // Skip internal spam-protection markers from the owner-visible table.
  // (The spam hook already strips them before saving; this is a backstop.)
  const visibleFields = fields.filter(
    (f) =>
      f.field !== '_hp' &&
      f.field !== '_t' &&
      f.field !== 'recaptchaToken' &&
      f.field !== 'g-recaptcha-response',
  )

  const fieldRows = visibleFields
    .map((field, idx) => {
      const label = escapeHtml(formatFieldName(field.field))
      const rawValue = field.value == null ? '' : String(field.value)
      const shown = display[field.field]
      const linkHtml = (href: string, text: string) =>
        `<a href="${escapeHtml(href)}" style="color:${BRAND.red};">${text}</a> (link works for 7 days)`
      const safeValue = !shown
        ? escapeHtml(rawValue).replace(/\r?\n/g, '<br />')
        : shown.kind === 'attached'
          ? `Attached to this email: ${escapeHtml(shown.name)}` +
            (shown.href ? `<br />${linkHtml(shown.href, 'Or view it online')}` : '')
          : shown.kind === 'link'
            ? linkHtml(shown.href, 'View the uploaded file')
            : escapeHtml(shown.text)
      const isLast = idx === visibleFields.length - 1
      const borderBottom = isLast ? '' : `border-bottom:1px solid ${BRAND.rule};`
      return `
              <tr>
                <td valign="top" style="padding:14px 16px 14px 0; ${borderBottom} font-family:${TYPE.sans}; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${BRAND.red}; width:38%; vertical-align:top;">${label}</td>
                <td valign="top" style="padding:14px 0; ${borderBottom} font-family:${TYPE.sans}; font-size:15px; line-height:1.6; color:${BRAND.ink};">${safeValue || '&mdash;'}</td>
              </tr>`
    })
    .join('')

  const savedTime = savedAt ? Date.parse(savedAt) : NaN
  const submittedAt = new Date(Number.isFinite(savedTime) ? savedTime : Date.now()).toLocaleString(
    'en-IN',
    {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  )

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

// ── Gate: only a fresh, real, saved submission ───────────────────────
//
// How recently a submission must have been saved for this route to act on
// it. Deliberately tight: Payload's postgres ids are SEQUENTIAL INTEGERS,
// so the id is not a secret and this window, not the id, is what stops
// someone replaying recent submissions. (Same value as the SS site.)
const SUBMISSION_MAX_AGE_MS = 60_000

// Best-effort replay guard. Serverless instances don't share memory and
// cold starts reset it, so the window above is the real bound; this just
// stops the cheap case of hammering one id against a warm instance.
const processedSubmissions = new Set<string>()

type StoredSubmission = {
  id: string | number
  form?: unknown
  submissionData?: unknown
  createdAt?: string
}

// ── Handler ──────────────────────────────────────────────────────────
//
// Body: { submissionId: number | string }. Anything else in the body is
// ignored. Order (as on the SS site): origin 403, id 400, replay 409,
// unknown id 404, older than 60 s 410, then build both emails from the
// stored record. Email failures do not change the answer: the enquiry is
// already saved.
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') ?? ''
    const referer = request.headers.get('referer') ?? ''
    if (!isAllowedOrigin(origin, referer)) {
      console.warn('email-forwarding rejected: bad origin', { origin, referer })
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json().catch(() => null)) as { submissionId?: unknown } | null
    const submissionId =
      typeof body?.submissionId === 'string' || typeof body?.submissionId === 'number'
        ? String(body.submissionId)
        : ''
    // Payload ids here are plain numbers. One spelling only ('0236' would
    // otherwise load the same enquiry past the replay guard below).
    if (!/^[1-9]\d{0,11}$/.test(submissionId)) {
      return NextResponse.json({ message: 'Missing submissionId' }, { status: 400 })
    }
    if (processedSubmissions.has(submissionId)) {
      console.warn('email-forwarding rejected: already processed', { submissionId })
      return NextResponse.json({ message: 'Already processed' }, { status: 409 })
    }

    const payload = await getPayload({ config: configPromise })
    let submission: StoredSubmission | null = null
    try {
      submission = (await payload.findByID({
        collection: 'form-submissions',
        id: submissionId,
        depth: 0,
        overrideAccess: true,
      })) as unknown as StoredSubmission
    } catch {
      // Unknown id, or one Payload cannot parse.
      submission = null
    }
    if (!submission) {
      console.warn('email-forwarding rejected: unknown submission', { submissionId })
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const createdAt = submission.createdAt ? Date.parse(submission.createdAt) : NaN
    const age = Number.isFinite(createdAt) ? Date.now() - createdAt : Infinity
    if (!(age >= 0 && age <= SUBMISSION_MAX_AGE_MS)) {
      console.warn('email-forwarding rejected: submission too old', {
        submissionId,
        ageMs: Number.isFinite(age) ? age : null,
      })
      return NextResponse.json({ message: 'Expired' }, { status: 410 })
    }
    processedSubmissions.add(submissionId)

    // Everything below reads from the STORED record only.
    const storedFormId =
      typeof submission.form === 'object' && submission.form !== null
        ? (submission.form as { id?: unknown }).id
        : submission.form
    const formId = typeof storedFormId === 'string' ? Number(storedFormId) : storedFormId
    const data: { submissionData: Array<{ field: string; value: unknown }> } = {
      submissionData: Array.isArray(submission.submissionData)
        ? (submission.submissionData as Array<{ field?: unknown; value?: unknown }>)
            .filter((f) => typeof f?.field === 'string')
            .map((f) => ({ field: f.field as string, value: f.value }))
        : [],
    }
    if (!formId || !Array.isArray(submission.submissionData)) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Which form, from the stored form number (src/utilities/formIds.ts).
    const formType: 'appointment' | 'consultation' | 'contact' =
      formId === FORM_IDS.appointment
        ? 'appointment'
        : formId === FORM_IDS.consultation
          ? 'consultation'
          : 'contact'

    // The visitor's email: the first stored field whose name contains
    // "email" or "mail".
    const emailField = data.submissionData.find((item) => {
      const fieldName = item.field.toLowerCase()
      return fieldName.includes('email') || fieldName.includes('mail')
    })
    const customerEmail =
      emailField && typeof emailField.value === 'string' ? emailField.value.trim() : ''

    // Name for the greeting: a `name` field first, else first + last.
    let fullName = ''
    const fullNameField = data.submissionData.find((item) => {
      const n = item.field.toLowerCase()
      return n === 'name' || n === 'fullname' || n === 'full name'
    })
    if (fullNameField && typeof fullNameField.value === 'string') {
      fullName = fullNameField.value
    } else {
      const first = data.submissionData.find((item) => /first/.test(item.field.toLowerCase()))
      const last = data.submissionData.find((item) => /last/.test(item.field.toLowerCase()))
      const a = first && typeof first.value === 'string' ? first.value : ''
      const b = last && typeof last.value === 'string' ? last.value : ''
      fullName = [a, b].filter(Boolean).join(' ').trim()
    }
    const { firstName, lastName } = extractNameParts(fullName)

    const ownerSubject =
      formType === 'appointment'
        ? 'New enquiry · Visit appointment'
        : formType === 'consultation'
          ? 'New enquiry · Private consultation'
          : 'New enquiry · Contact form'
    const storedId = submission.id
    const savedAt = submission.createdAt

    after(async () => {
      try {
        const resend = getResend()
        if (!resend) return

        // The consultation's uploaded reference file. It stays in the
        // private bucket; the team email carries it as an attachment plus a
        // 7-day view link.
        //  - A key whose file is not in the bucket (the upload broke off, a
        //    made-up key) gets a plain note.
        //  - If the file cannot be read back (network, settings), the email
        //    still gets the view link.
        //  - A key an earlier enquiry already named (a bot reusing one
        //    upload) gets the link only, so one upload never fills the
        //    mailbox many times over; a visitor's own retry is the
        //    exception (see below).
        const display: Record<string, UploadDisplay> = {}
        let attachment: { filename: string; content: string; contentType?: string } | null = null
        const upload = data.submissionData.find((f) => f.field === 'referenceImage')
        if (formType === 'consultation' && typeof upload?.value === 'string' && upload.value) {
          const key = upload.value
          // Attach the file only to the first enquiry that names it. One
          // exception: the same visitor sending again within 30 minutes (the
          // answer to their first try was lost, so that one was never
          // emailed) still gets the attachment.
          let firstUse = true
          try {
            const earlier = await payload.find({
              collection: 'form-submissions',
              where: {
                and: [{ 'submissionData.value': { equals: key } }, { id: { less_than: storedId } }],
              },
              depth: 0,
              limit: 2,
              sort: '-id',
              overrideAccess: true,
            })
            if (earlier.totalDocs === 1) {
              const prev = earlier.docs[0] as unknown as StoredSubmission
              const prevRows = Array.isArray(prev.submissionData)
                ? (prev.submissionData as Array<{ field?: unknown; value?: unknown }>)
                : []
              const prevEmail = prevRows.find((f) => {
                const n = String(f?.field ?? '').toLowerCase()
                return n.includes('email') || n.includes('mail')
              })?.value
              const prevAge = prev.createdAt ? Date.now() - Date.parse(prev.createdAt) : Infinity
              firstUse =
                Boolean(customerEmail) &&
                typeof prevEmail === 'string' &&
                prevEmail.trim().toLowerCase() === customerEmail.toLowerCase() &&
                prevAge >= 0 &&
                prevAge < 30 * 60 * 1000
            } else {
              firstUse = earlier.totalDocs === 0
            }
          } catch (countError) {
            console.error(
              'momh email-forwarding: could not check earlier use of the upload',
              countError,
            )
          }
          let file: Awaited<ReturnType<typeof readUpload>> | undefined
          if (firstUse) {
            try {
              file = await readUpload(key)
            } catch (readError) {
              console.error('momh email-forwarding: could not read the uploaded file', readError)
            }
          }
          if (file === null) {
            display.referenceImage = { kind: 'note', text: FILE_NOT_ARRIVED }
          } else {
            let href: string | null = null
            try {
              href = await createViewLink(key)
            } catch (linkError) {
              console.error('momh email-forwarding: upload view link failed', linkError)
            }
            if (file) {
              const visitorName = data.submissionData.find(
                (f) => f.field === 'referenceImageName',
              )?.value
              const filename = safeFileName(visitorName, key)
              attachment = {
                filename,
                content: file.bytes.toString('base64'),
                ...(isUploadType(file.contentType) ? { contentType: file.contentType } : {}),
              }
              display.referenceImage = { kind: 'attached', name: filename, href }
            } else if (href) {
              display.referenceImage = { kind: 'link', href }
            }
          }
        }

        // Without the attachment: the same email with the view link only,
        // used when the email with the file still fails after its retry.
        const displayWithoutFile: Record<string, UploadDisplay> = { ...display }
        const shown = display.referenceImage
        if (shown?.kind === 'attached') {
          if (shown.href) displayWithoutFile.referenceImage = { kind: 'link', href: shown.href }
          else delete displayWithoutFile.referenceImage
        }

        // Team first: near Resend's daily limit the last send goes to the
        // sales team rather than to the visitor's thank-you.
        for (const [i, ownerEmail] of OWNER_EMAILS.entries()) {
          const base = { from: FROM_ADDRESS, to: ownerEmail, subject: ownerSubject }
          const key = `momh-owner-${storedId}-${i}`
          let problem = await sendOnce(
            resend,
            {
              ...base,
              html: generateOwnerEmailHTML(data, formType, display, savedAt),
              ...(attachment ? { attachments: [attachment] } : {}),
            },
            key,
          )
          // Link-only copy only when Resend refused the email itself, never
          // for a 409 about its key (that could send the team a duplicate).
          if (problem && attachment && problem.statusCode !== 409) {
            console.error(
              `momh email-forwarding: owner email with attachment to ${ownerEmail} failed; sending without it`,
              problem,
            )
            await sleep(1000)
            problem = await sendOnce(
              resend,
              {
                ...base,
                html: generateOwnerEmailHTML(data, formType, displayWithoutFile, savedAt),
              },
              `${key}-nofile`,
            )
          }
          if (problem) {
            console.error(`momh email-forwarding: owner email to ${ownerEmail} failed`, problem)
          }
        }

        // Customer confirmation. Skipped if no email was stored.
        if (customerEmail) {
          const problem = await sendOnce(
            resend,
            {
              from: FROM_ADDRESS,
              to: customerEmail,
              subject: 'Thank you for writing to the Museum of Meenakari Heritage',
              html: generateCustomerEmailHTML(firstName, lastName, formType),
            },
            `momh-customer-${storedId}`,
          )
          if (problem) console.error('momh email-forwarding: customer email failed', problem)
        }
      } catch (sendError) {
        console.error('momh email-forwarding: unexpected error while sending', sendError)
      }
    })

    // The emails go out right after this answer (see after() above).
    return NextResponse.json({ ok: true, queued: true })
  } catch (error) {
    console.error('momh email-forwarding: unexpected error', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
