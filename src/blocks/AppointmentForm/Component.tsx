'use client'

/**
 * AppointmentFormBlock — visit-booking enquiry form (PDF p6).
 *
 * Layout matches `/book-an-appointment` PDF p6 exactly:
 *   1. Personal Details section header
 *   2. Row: First Name * | Last Name *
 *   3. Row: Email Address * | Phone Number *
 *   4. Row: City * | Country *
 *   5. Row: Occupation * | Group Size *
 *   6. How did you hear about the Museum? * (textarea)
 *   7. Any queries or comments? * (textarea)
 *   8. reCAPTCHA widget
 *   9. Submit button (red filled rectangular)
 *  10. FAQ link line — "Have a specific query in mind? Find
 *      answers in our Frequently Asked Questions."
 *
 * Field styling mirrors `ConsultationForm`: thin grey box border,
 * no rounded corners, Gill Sans labels above inputs, focus shifts
 * the border to brand-red.
 *
 * Submission pattern mirrors `ConsultationForm` too — POSTs FormData
 * to `endpoint`, on success redirects to the shared `/thank-you`
 * confirmation page (configurable via `successRedirect`).
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ReCAPTCHA from 'react-google-recaptcha'

import type { AppointmentFormBlock as AppointmentFormBlockProps } from '@/payload-types'

import { cn } from '@/utilities/ui'

type BgKey = NonNullable<AppointmentFormBlockProps['backgroundColor']>

const bgClass: Record<BgKey, string> = {
  ivory: 'bg-ivory text-ink',
  cream: 'bg-cream text-ink',
  white: 'bg-white text-ink',
}

/** reCAPTCHA site key — same key the previous standalone form used.
 *  Hardcoded here rather than env-driven to match the existing
 *  behaviour (env-driven keys would require wiring + docs to be
 *  worth swapping in). If the site key needs to rotate, change this
 *  one constant. */
const RECAPTCHA_SITE_KEY = '6LexzY4rAAAAAEP1XpZegtgjiB6-6dbwx95vMchH'

const Asterisk: React.FC = () => (
  <span className="text-brand-red ml-0.5" aria-hidden="true">
    *
  </span>
)

type FieldLabelProps = {
  htmlFor: string
  label: string
  required?: boolean
}

const FieldLabel: React.FC<FieldLabelProps> = ({ htmlFor, label, required }) => (
  <label
    htmlFor={htmlFor}
    className="block font-body text-sm md:text-base text-ink mb-2"
    style={{ fontWeight: 500 }}
  >
    {label}
    {required && <Asterisk />}
  </label>
)

/** Shared input styling — thin grey box, no rounded corners, focus
 *  shifts the border to brand-red. Same look as `ConsultationForm`. */
const inputClass =
  'w-full px-4 py-3 bg-white border border-warm-gray/40 rounded-none font-body text-base text-ink ' +
  'focus:outline-none focus:border-brand-red focus:ring-0 transition-colors duration-150'

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <h3
    className="font-body text-lg md:text-xl text-ink mb-6"
    style={{ fontWeight: 600 }}
  >
    {title}
  </h3>
)

/**
 * Resolves the editor-configured `faqLink` group into an `href` +
 * `newTab` flag. Falls back to `/faq` if the config is missing or
 * the `reference` target couldn't be resolved (e.g. unpublished).
 */
const resolveFaqHref = (
  faqLink: AppointmentFormBlockProps['faqLink'],
): { href: string; newTab: boolean } => {
  const newTab = Boolean(faqLink?.newTab)
  if (faqLink?.type === 'reference' && faqLink.reference) {
    const ref = faqLink.reference
    if (
      ref &&
      typeof ref === 'object' &&
      'value' in ref &&
      ref.value &&
      typeof ref.value === 'object' &&
      'slug' in ref.value &&
      typeof ref.value.slug === 'string'
    ) {
      const slug = ref.value.slug
      const collection = 'relationTo' in ref ? ref.relationTo : 'pages'
      const href = collection === 'posts' ? `/posts/${slug}` : `/${slug}`
      return { href, newTab }
    }
  }
  if (faqLink?.type === 'custom' && faqLink.url) {
    return { href: faqLink.url, newTab }
  }
  return { href: '/faq', newTab }
}

export const AppointmentFormBlock: React.FC<AppointmentFormBlockProps> = ({
  submitLabel,
  endpoint,
  successRedirect,
  backgroundColor,
  faqLink,
}) => {
  const bg = (backgroundColor || 'ivory') as BgKey
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)

  const { href: faqHref, newTab: faqNewTab } = resolveFaqHref(faqLink)
  const redirectTarget = successRedirect || '/thank-you'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'submitting') return

    if (!recaptchaToken) {
      setStatus('error')
      setErrorMessage('Please complete the reCAPTCHA before submitting.')
      return
    }

    const formEl = e.currentTarget
    const fd = new FormData(formEl)
    fd.append('recaptchaToken', recaptchaToken)

    if (!endpoint) {
      // No endpoint wired — skip the POST and go straight to the
      // confirmation page so the UX is still demonstrable end-to-end
      // (useful for staging / demos before Payload Forms is wired).
      router.push(redirectTarget)
      return
    }

    try {
      setStatus('submitting')
      const res = await fetch(endpoint, { method: 'POST', body: fd })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      router.push(redirectTarget)
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Submission failed.')
    }
  }

  return (
    <section
      className={cn(
        'w-full py-12 lg:py-16 px-6 md:px-12 lg:px-20',
        bgClass[bg],
      )}
      data-theme="light"
      aria-label="Book an appointment form"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-4xl mx-auto"
        noValidate
      >
        <SectionHeader title="Personal Details" />

        {/* Rows of paired fields — mobile stacks, md+ uses 2 cols.
            Same grid pattern as ConsultationForm. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <FieldLabel htmlFor="firstName" label="First Name" required />
            <input id="firstName" name="firstName" type="text" required className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor="lastName" label="Last Name" required />
            <input id="lastName" name="lastName" type="text" required className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor="email" label="Email Address" required />
            <input id="email" name="email" type="email" required className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor="phone" label="Phone Number" required />
            <input id="phone" name="phone" type="tel" required className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor="city" label="City" required />
            <input id="city" name="city" type="text" required className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor="country" label="Country" required />
            <input id="country" name="country" type="text" required className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor="occupation" label="Occupation" required />
            <input id="occupation" name="occupation" type="text" required className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor="groupSize" label="Group Size" required />
            <input
              id="groupSize"
              name="groupSize"
              type="number"
              min={1}
              required
              className={inputClass}
            />
          </div>
        </div>

        {/* Two long-form textareas — stack full-width below the field
            grid (PDF shows them spanning the form's full content
            width, not the 2-col grid). */}
        <div className="mt-6 flex flex-col gap-6">
          <div>
            <FieldLabel
              htmlFor="hearAboutUs"
              label="How did you hear about the Museum?"
              required
            />
            <textarea
              id="hearAboutUs"
              name="hearAboutUs"
              rows={4}
              required
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel
              htmlFor="queriesComments"
              label="Any queries or comments?"
              required
            />
            <textarea
              id="queriesComments"
              name="queriesComments"
              rows={5}
              required
              className={inputClass}
            />
          </div>
        </div>

        {/* reCAPTCHA — sits below the textareas, left-aligned. */}
        <div className="mt-8">
          <ReCAPTCHA
            sitekey={RECAPTCHA_SITE_KEY}
            onChange={(token) => setRecaptchaToken(token)}
            onExpired={() => setRecaptchaToken(null)}
          />
        </div>

        {/* Submit + status — left-aligned per PDF (NOT centred). */}
        <div className="mt-8 flex flex-col items-start gap-3">
          <button
            type="submit"
            disabled={status === 'submitting'}
            className={cn(
              'inline-flex items-center justify-center px-8 py-3 font-body',
              'bg-brand-red text-white border border-brand-red',
              'text-sm md:text-base',
              'hover:bg-brand-red/90 transition-colors duration-200',
              'disabled:opacity-60',
            )}
            style={{ fontWeight: 400, letterSpacing: '0.02em' }}
          >
            {status === 'submitting' ? 'Submitting…' : submitLabel || 'Book An Appointment'}
          </button>
          {status === 'error' && (
            <p className="text-sm text-brand-red font-body">
              Sorry — {errorMessage || 'something went wrong'}. Please try again or email
              us at info@momhindia.org.
            </p>
          )}

          {/* FAQ link line — italic + underlined "Frequently Asked
              Questions" link, plain Gill Sans surrounding it. */}
          <p className="mt-4 font-body text-sm md:text-base text-ink/90">
            Have a specific query in mind? Find answers in our{' '}
            <Link
              href={faqHref}
              {...(faqNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="italic underline underline-offset-4 hover:text-brand-red transition-colors"
            >
              Frequently Asked Questions
            </Link>
            .
          </p>
        </div>
      </form>
    </section>
  )
}

export default AppointmentFormBlock
