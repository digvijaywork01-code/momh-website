'use client'

/**
 * NewsletterWidget — inline email-input + SUBSCRIBE button.
 *
 * Originally lived inside `src/blocks/TwoColumnFeature/Component.tsx`
 * for the home-page "Our Newsletter" column on PDF p12. Extracted here
 * so the new `NewsletterFeature` block (PDF p3 of Craft Your Jewellery)
 * can reuse the same UX without duplicating form handling.
 *
 * Layout: a single-row label + underline-only input + outlined
 * SUBSCRIBE button stacked beneath. Light- and dark-bg variants are
 * driven by the `dark` prop so the widget reads correctly on cream,
 * ivory, maroon, emerald, and black backgrounds.
 *
 * Validation (same rules as the SS site's newsletter form):
 *   - the browser's own required + email check, then our email-shape
 *     check (src/utilities/emailFormat.ts, the same rule as the server);
 *   - a signed time pass fetched from /api/form-token when the widget
 *     mounts, and a hidden trap box (`website_url`) for bots. Both are
 *     checked by /api/newsletter;
 *   - an invisible reCAPTCHA v3 check (src/utilities/recaptchaClient.ts):
 *     Google's script loads when the visitor first clicks into the email
 *     box; Google's notice sits under the button (once the keys are set);
 *   - one error line under the button when anything fails.
 */

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/utilities/ui'
import { isValidEmail } from '@/utilities/emailFormat'
import { HONEYPOT_STYLE, useFormToken } from '@/utilities/enquiryForm'
import {
  RECAPTCHA_FAILED,
  RECAPTCHA_SITE_KEY,
  getRecaptchaToken,
  loadRecaptcha,
} from '@/utilities/recaptchaClient'
import { RecaptchaNotice } from '@/components/RecaptchaNotice'

const INIT_ERROR = 'Could not initialise the form. Please refresh the page and try again.'
const NOT_READY = 'Form is still initialising. Please wait a moment and try again.'
const EMAIL_ERROR = 'Please enter a valid email address.'
const GENERIC_ERROR = 'Subscription failed. Please refresh the page and try again.'
const CAPTCHA_ERROR = `Sorry, ${RECAPTCHA_FAILED}. Please try again.`

type Props = {
  inputLabel: string
  buttonLabel: string
  endpoint: string
  dark: boolean
  /**
   * Put the error line in the normal flow instead of floating it under the
   * button. Needed inside a box that clips at the button's bottom edge
   * (the home page's phone carousel), where a floating line would be cut
   * off. The panel then grows by the line while an error shows.
   */
  errorInFlow?: boolean
  /**
   * The parent shows Google's reCAPTCHA notice itself, so the widget leaves
   * it out. The home page's phone carousel does this: it clips at the
   * button's bottom edge and has no room under it, so its notice sits
   * under the carousel's dots (src/blocks/TwoColumnFeature/Component.tsx).
   */
  noticeElsewhere?: boolean
}

export const NewsletterWidget: React.FC<Props> = ({
  inputLabel,
  buttonLabel,
  // `endpoint` (the block's "Submit URL" box) is kept on the block schemas
  // for backward compat but no longer used: every sign-up goes to
  // /api/newsletter, where the spam checks run, as the Book An Appointment
  // and Personal Consultation forms do.
  endpoint: _endpoint,
  dark,
  errorInFlow = false,
  noticeElsewhere = false,
}) => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  // Hidden trap box: people never see it, bots fill it in.
  const [honeypot, setHoneypot] = useState('')
  // Server-signed time pass from /api/form-token, shared by every form on
  // the page. /api/newsletter refuses any sign-up without a valid one that
  // is 3 s to 30 min old.
  const { token, tokenError, freshToken } = useFormToken()
  // Google's script loads when the visitor first uses the form, not for
  // every visitor of the page.
  const captchaStarted = useRef(false)
  const startCaptcha = () => {
    if (captchaStarted.current) return
    captchaStarted.current = true
    void loadRecaptcha()
  }

  const inkClass = dark ? 'text-offwhite' : 'text-warm-gray'
  const borderClass = dark ? 'border-offwhite/60' : 'border-warm-gray/60'

  // After a successful subscribe:
  //   • clear the input straight away so the visitor sees the form is
  //     "fresh" again (and another email could be added if they want);
  //   • leave "Subscribed" + the disabled button in place for 3 seconds
  //     as confirmation, then revert to idle so the SUBSCRIBE label +
  //     active button come back.
  // The setTimeout is cleaned up on unmount / on any status change so a
  // mid-window unmount or a stale tick doesn't fire a setState on a
  // gone component (or jump backwards over a fresh submit).
  useEffect(() => {
    if (status !== 'success') return
    setEmail('')
    const t = setTimeout(() => setStatus('idle'), 3000)
    return () => clearTimeout(t)
  }, [status])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || status === 'submitting') return
    setErrorMessage('')
    startCaptcha()
    if (!token) {
      setErrorMessage(tokenError ? INIT_ERROR : NOT_READY)
      return
    }
    if (!isValidEmail(email.trim())) {
      setErrorMessage(EMAIL_ERROR)
      return
    }
    // Always the in-house route, so every sign-up passes the spam checks and
    // lands in `/admin → Newsletter Subscribers` (never a URL from the CMS).
    const target = '/api/newsletter'
    try {
      setStatus('submitting')
      const pass = await freshToken()
      if (!pass) {
        setErrorMessage(GENERIC_ERROR)
        setStatus('error')
        return
      }
      const recaptchaToken = await getRecaptchaToken('newsletter')
      if (recaptchaToken === null) {
        setErrorMessage(CAPTCHA_ERROR)
        setStatus('error')
        return
      }
      const res = await fetch(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          _hp: honeypot,
          _t: pass,
          ...(recaptchaToken ? { _rc: recaptchaToken } : {}),
        }),
      })
      if (res.ok) {
        setStatus('success')
        return
      }
      const data = (await res.json().catch(() => null)) as { error?: unknown } | null
      setErrorMessage(typeof data?.error === 'string' && data.error ? data.error : GENERIC_ERROR)
      setStatus('error')
    } catch {
      setErrorMessage(GENERIC_ERROR)
      setStatus('error')
    }
  }

  const shownError = errorMessage || (tokenError ? INIT_ERROR : '')

  return (
    <form onSubmit={handleSubmit} className={cn('relative flex flex-col gap-6 mt-4', inkClass)}>
      <label
        className="flex items-baseline gap-2 font-body italic"
        // PDF spec: GillSans-LightItalic at 24pt for the "Email Address:" label.
        style={{ fontSize: 'var(--fs-cta, 24px)', fontWeight: 300 }}
      >
        <span className="shrink-0 whitespace-nowrap">{inputLabel}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={startCaptcha}
          aria-label={inputLabel}
          className={cn(
            'flex-1 bg-transparent border-0 border-b outline-none focus:outline-none focus:ring-0',
            'font-body not-italic',
            borderClass,
          )}
          style={{ fontSize: 'var(--fs-cta, 24px)', fontWeight: 300 }}
        />
      </label>

      <button
        type="submit"
        disabled={status === 'submitting' || status === 'success'}
        className={cn(
          'self-start inline-flex items-center justify-center font-body uppercase',
          'px-8 py-2 border rounded-none transition-colors duration-300',
          'disabled:opacity-60',
          borderClass,
          inkClass,
          dark ? 'hover:bg-offwhite hover:text-maroon' : 'hover:bg-warm-gray hover:text-cream',
        )}
        style={{
          fontSize: 'var(--fs-button, 20px)',
          fontWeight: 400,
          letterSpacing: '0.18em',
        }}
      >
        {status === 'success' ? 'Subscribed' : status === 'submitting' ? '...' : buttonLabel}
      </button>

      {/* Spam protection: do not remove. Checked by /api/newsletter.
          Off-screen and out of the layout, so nothing moves. */}
      <input
        type="text"
        name="website_url"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={HONEYPOT_STYLE}
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
      />

      {/* Under the button, 8px below it and out of the flow (absolute), so
          the email box and button never move: the panels centre or
          bottom-align this form, so any line added to the flow moved
          everything around it. First Google's reCAPTCHA notice (once the
          keys are set; nothing at all before that), then the error line
          when something went wrong. Darker red on light panels so the small
          text stays readable on cream (5.6:1). */}
      {((RECAPTCHA_SITE_KEY && !noticeElsewhere) || (shownError && !errorInFlow)) && (
        <div className="absolute left-0 right-0 top-full mt-2 flex flex-col gap-2">
          {!noticeElsewhere && <RecaptchaNotice className={inkClass} />}
          {shownError && !errorInFlow && (
            <p
              role="alert"
              className={cn('font-body text-sm', dark ? 'text-offwhite' : 'text-brand-red-dark')}
            >
              {shownError}
            </p>
          )}
        </div>
      )}

      {/* The error line in the flow (errorInFlow), 8px under the button
          (-mt-4 turns the form's 24px gap into 8px), for a box that clips
          at the button's bottom edge. */}
      {shownError && errorInFlow && (
        <p
          role="alert"
          className={cn('font-body text-sm -mt-4', dark ? 'text-offwhite' : 'text-brand-red-dark')}
        >
          {shownError}
        </p>
      )}
    </form>
  )
}

export default NewsletterWidget
