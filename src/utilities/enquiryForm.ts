/**
 * Shared client-side pieces for the two hand-built enquiry forms
 * (AppointmentForm, ConsultationForm). Same flow as the SS site's
 * Book an Appointment form (components/appointment/AppointmentForm.tsx):
 *
 *   1. On load, fetch a signed time pass from /api/form-token.
 *   2. The browser's own checks run (the forms no longer use noValidate),
 *      then the form's validate(): a red line under each box at fault.
 *   3. Save first: POST /api/form-submissions with the form's record
 *      number, the answers, the hidden trap box (_hp) and the pass (_t).
 *      The spam checks in src/plugins/index.ts run there.
 *   4. Then POST /api/email-forwarding with only the saved submission's id;
 *      its answer does not change what the visitor sees (the enquiry is
 *      already saved), as on the SS site.
 *
 * Client-safe: no secrets, no server imports.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type React from 'react'

export const INIT_ERROR = 'Could not initialise the form. Please refresh the page and try again.'
export const NOT_READY = 'Form is still initialising. Please wait a moment and try again.'
// Shown inside the forms' "Sorry — {message}. Please try again or email us…" line.
export const SUBMIT_FAILED = 'Submission failed'
// Same line, when the server's per-connection cap (src/utilities/rateLimit.ts)
// was reached.
export const TOO_MANY_SENDS =
  'too many forms have been sent from your connection just now. Please wait a few minutes'

/** SS rule: digits, '+', spaces and '-' only; anything else is removed as you type. */
export const sanitizePhone = (raw: string): string => raw.replace(/[^0-9+\s-]/g, '')

/** SS rule: a phone number needs at least 10 digits. */
export const countDigits = (value: string): number => (value.match(/\d/g) || []).length
export const MIN_PHONE_DIGITS = 10

/**
 * onChange for an uncontrolled phone box: applies the typing filter in
 * place (also to paste and autofill) without making the input controlled.
 */
export const filterPhoneInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
  const clean = sanitizePhone(e.target.value)
  if (clean !== e.target.value) e.target.value = clean
}

/**
 * A form value as text: '' for a missing entry (the database never takes
 * null). Spaces at either end are removed, as the server does, so an
 * answer of only spaces counts as empty; line breaks are sent as one
 * character each, so a box's maxLength is the length the server counts.
 */
export const formValue = (fd: FormData, name: string): string => {
  const v = fd.get(name)
  return typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim() : ''
}

// One pass request shared by every form on the page (the home page renders
// the newsletter widget twice: phone carousel copy + desktop copy). A pass
// can be used for 30 minutes, so sharing is safe; it is reused only while
// under 5 minutes old, so a later client-side visit fetches a fresh one. A
// failed request is forgotten, so the next form to mount tries again.
const PASS_REUSE_MS = 5 * 60 * 1000
// The server accepts a pass from 3 seconds to 30 minutes old
// (src/utilities/formGuards.ts). A form left open longer than this asks
// for a new pass when it is sent; 20 + the 5 minutes of sharing stays
// inside 30.
const PASS_REFRESH_MS = 20 * 60 * 1000
const PASS_MIN_AGE_MS = 3500

type Pass = { token: string; arrivedAt: number }
let sharedPass: { at: number; promise: Promise<Pass> } | null = null
const getPass = (): Promise<Pass> => {
  if (!sharedPass || Date.now() - sharedPass.at > PASS_REUSE_MS) {
    const promise = fetch('/api/form-token')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { token?: unknown }) =>
        typeof d?.token === 'string'
          ? { token: d.token, arrivedAt: Date.now() }
          : Promise.reject(new Error('no token')),
      )
    const entry = { at: Date.now(), promise }
    sharedPass = entry
    promise.catch(() => {
      if (sharedPass === entry) sharedPass = null
    })
  }
  return sharedPass.promise
}

/**
 * The signed time pass, fetched when the form mounts (shared, see getPass).
 * `token` says whether the form is ready; call `freshToken()` when the form
 * is sent and use what it returns: the same pass, or a new one if this one
 * is getting old. Either way it first waits out the rest of the server's
 * 3-second minimum, so a quick visitor (an autofilled newsletter box sent
 * straight after the page loads) is never refused. null if a new pass
 * could not be fetched.
 */
export const useFormToken = (): {
  token: string | null
  tokenError: boolean
  freshToken: () => Promise<string | null>
} => {
  const [pass, setPass] = useState<Pass | null>(null)
  const passRef = useRef<Pass | null>(null)
  const [tokenError, setTokenError] = useState(false)
  useEffect(() => {
    let cancelled = false
    getPass()
      .then((p) => {
        if (cancelled) return
        passRef.current = p
        setPass(p)
      })
      .catch(() => {
        if (!cancelled) setTokenError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const freshToken = useCallback(async (): Promise<string | null> => {
    const held = passRef.current
    if (held && Date.now() - held.arrivedAt < PASS_REFRESH_MS) {
      const wait = Math.min(PASS_MIN_AGE_MS, held.arrivedAt + PASS_MIN_AGE_MS - Date.now())
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
      return held.token
    }
    try {
      // The held pass is over 20 minutes old, so the shared one is past its
      // 5 minutes of reuse and this asks the server for a new one.
      const next = await getPass()
      const wait = next.arrivedAt + PASS_MIN_AGE_MS - Date.now()
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
      passRef.current = next
      setPass(next)
      setTokenError(false)
      return next.token
    } catch {
      return null
    }
  }, [])

  return { token: pass?.token ?? null, tokenError, freshToken }
}

/**
 * After validate() finds a problem, take the visitor to the first box (in
 * page order) with a red line. On a phone that box can be far above the
 * button, and nothing near the button would change. Focusing scrolls it into
 * view, and the boxes' scroll-mt-32 keeps its label below the fixed logo.
 */
export const focusFirstProblem = (form: HTMLFormElement, names: string[]): void => {
  const first = Array.from(form.elements).find(
    (el) =>
      (el instanceof HTMLInputElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement) &&
      el.type !== 'hidden' &&
      names.includes(el.name),
  ) as HTMLElement | undefined
  first?.focus()
}

/** Off-screen and out of the layout: people never see the trap box. */
export const HONEYPOT_STYLE: React.CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  width: 1,
  height: 1,
  opacity: 0,
}

/**
 * Save the enquiry, then ask for the emails. Throws Error(TOO_MANY_SENDS)
 * when the connection's cap is reached, Error(SUBMIT_FAILED) if the save is
 * refused otherwise or the network fails; the email step never throws.
 * `recaptchaToken` is '' when reCAPTCHA is not set up on the site.
 */
export const submitEnquiry = async ({
  formId,
  fields,
  honeypot,
  token,
  recaptchaToken,
}: {
  formId: number
  fields: Array<{ field: string; value: string }>
  honeypot: string
  token: string
  recaptchaToken: string
}): Promise<void> => {
  let res: Response
  try {
    res = await fetch('/api/form-submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form: formId,
        submissionData: [
          ...fields,
          // Spam-protection markers; the hook strips them before saving.
          { field: '_hp', value: honeypot },
          { field: '_t', value: token },
          ...(recaptchaToken ? [{ field: '_rc', value: recaptchaToken }] : []),
        ],
      }),
    })
  } catch {
    throw new Error(SUBMIT_FAILED)
  }
  if (res.status === 429) throw new Error(TOO_MANY_SENDS)
  if (!res.ok) throw new Error(SUBMIT_FAILED)
  const created: { doc?: { id?: unknown }; id?: unknown } | null = await res
    .json()
    .catch(() => null)

  const submissionId = created?.doc?.id ?? created?.id
  try {
    await fetch('/api/email-forwarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId }),
    })
  } catch (emailErr) {
    // The enquiry is saved; a failed email step must not fail the form.
    console.error('Email forwarding failed:', emailErr)
  }
}

/**
 * Upload the Personal Consultation reference file straight to S3:
 * ask /api/consultation-upload for a one-file presigned POST (it runs the
 * same spam gate as the forms, including reCAPTCHA: `recaptchaToken` is a
 * fresh token for the action "upload", '' when reCAPTCHA is not set up),
 * then POST the file to S3 with the returned fields. Never throws.
 * Resolves with:
 *   { key, stored: true }   S3 said the file is stored.
 *   { key, stored: false }  No answer could be read (the bucket's CORS
 *                           rule, a dropped connection, the time limit):
 *                           the file may be there. The enquiry keeps the
 *                           key and the email step checks the bucket.
 *   null                    No link, or S3 refused the file: not stored.
 */
export const uploadReferenceFile = async ({
  file,
  contentType,
  honeypot,
  token,
  recaptchaToken,
}: {
  file: File
  contentType: string
  honeypot: string
  token: string
  recaptchaToken: string
}): Promise<{ key: string; stored: boolean } | null> => {
  let link: { url?: unknown; fields?: unknown; key?: unknown } | null
  try {
    const linkRes = await fetch('/api/consultation-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentType,
        size: file.size,
        _hp: honeypot,
        _t: token,
        ...(recaptchaToken ? { _rc: recaptchaToken } : {}),
      }),
    })
    if (!linkRes.ok) return null
    link = await linkRes.json().catch(() => null)
  } catch {
    return null
  }
  if (
    !link ||
    typeof link.url !== 'string' ||
    typeof link.key !== 'string' ||
    !link.fields ||
    typeof link.fields !== 'object'
  ) {
    return null
  }
  // S3 reads the policy fields first; the file must be the LAST part.
  const body = new FormData()
  for (const [name, value] of Object.entries(link.fields as Record<string, unknown>)) {
    body.append(name, String(value))
  }
  body.append('file', file)
  // A large photo on a slow phone connection can take a while; stop well
  // inside the link's 5 minutes (src/utilities/s3Upload.ts). A plain timer,
  // not AbortSignal.timeout, which iPhones before iOS 16 do not have (the
  // file was then never sent).
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4 * 60 * 1000)
  try {
    const s3Res = await fetch(link.url, { method: 'POST', body, signal: controller.signal })
    return s3Res.ok ? { key: link.key, stored: true } : null
  } catch {
    return { key: link.key, stored: false }
  } finally {
    clearTimeout(timer)
  }
}
