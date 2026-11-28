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
 *   8. Submit button (red filled rectangular), with Google's
 *      reCAPTCHA notice under it once reCAPTCHA v3 is set up
 *   9. FAQ link line — "Have a specific query in mind? Find
 *      answers in our Frequently Asked Questions."
 *
 * Field styling mirrors `ConsultationForm`: thin grey box border,
 * no rounded corners, Gill Sans labels above inputs, focus shifts
 * the border to brand-red.
 *
 * Validation and submission follow the SS site's Book an Appointment
 * form (see src/utilities/enquiryForm.ts): browser checks, a red line
 * under each box at fault, a phone filter + at least 10 digits, a signed
 * time pass, a hidden trap box and an invisible reCAPTCHA v3 check
 * (src/utilities/recaptchaClient.ts; it replaced the old "I'm not a
 * robot" tick box, whose answer was never checked). The enquiry is saved in Form
 * Submissions first, then emailed; on success the visitor goes to the
 * shared `/thank-you` page (configurable via `successRedirect`).
 */

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import type { AppointmentFormBlock as AppointmentFormBlockProps } from '@/payload-types'

import { cn } from '@/utilities/ui'
import { APPOINTMENT_FIELD_NAMES, FORM_IDS, maxLengthOf } from '@/utilities/formIds'
import {
  HONEYPOT_STYLE,
  INIT_ERROR,
  MIN_PHONE_DIGITS,
  NOT_READY,
  SUBMIT_FAILED,
  countDigits,
  filterPhoneInput,
  focusFirstProblem,
  formValue,
  submitEnquiry,
  useFormToken,
} from '@/utilities/enquiryForm'
import { isValidEmail } from '@/utilities/emailFormat'
import { RECAPTCHA_FAILED, getRecaptchaToken, loadRecaptcha } from '@/utilities/recaptchaClient'
import { RecaptchaNotice } from '@/components/RecaptchaNotice'

type BgKey = NonNullable<AppointmentFormBlockProps['backgroundColor']>

const bgClass: Record<BgKey, string> = {
  ivory: 'bg-ivory text-ink',
  cream: 'bg-cream text-ink',
  white: 'bg-white text-ink',
}

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
    // lg+: the PDF's 17px #212121 label at 1920, never below the 16px used today.
    className="block font-body text-sm md:text-base text-ink mb-2 lg:mb-[0.6vw] lg:text-[length:max(1rem,0.885vw)] lg:text-[#212121]"
    style={{ fontWeight: 500 }}
  >
    {label}
    {required && <Asterisk />}
  </label>
)

// Every answer this form saves, in order, with the red line shown under
// the box when it is left empty (SS validate()).
type FieldName = (typeof APPOINTMENT_FIELD_NAMES)[number]
const MESSAGES: Record<FieldName, string> = {
  firstName: 'Please enter your first name.',
  lastName: 'Please enter your last name.',
  email: 'Please enter your email.',
  phone: 'Please enter your phone number.',
  city: 'Please enter your city.',
  country: 'Please enter your country.',
  occupation: 'Please enter your occupation.',
  groupSize: 'Please enter your group size.',
  hearAboutUs: 'Please tell us how you heard about the Museum.',
  queriesComments: 'Please enter your queries or comments.',
}
// Every field this form saves, in order (the list the spam hook allows).
const FIELDS = APPOINTMENT_FIELD_NAMES.map((name) => [name, MESSAGES[name]] as const)

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? <p className="mt-1 text-sm text-brand-red font-body">{message}</p> : null

/** Shared input styling — thin grey box, no rounded corners, focus
 *  shifts the border to brand-red. Same look as `ConsultationForm`.
 *  lg+: the Book An Appointment PDF's lighter #D4D4D4 border. */
const inputClass =
  'w-full px-4 py-3 bg-white border border-warm-gray/40 rounded-none font-body text-base text-ink ' +
  'focus:outline-none focus:border-brand-red focus:ring-0 transition-colors duration-150 ' +
  'lg:border-[#D4D4D4] ' +
  // When the browser's own check scrolls to an empty box, stop 128px short
  // of the top so its label stays visible below the fixed MOMH logo.
  // Changes only where the page scrolls to, never the layout.
  'scroll-mt-32'

/** lg+ box heights from the PDF (1920 artboard): inputs 62px, both
 *  textareas 173px, with floors so 1024-1440 never shrink too far. The
 *  textareas turn block so no inline descender gap sits under them. */
const textInputClass = cn(inputClass, 'lg:h-[max(2.75rem,3.229vw)]')
const textareaClass = cn(inputClass, 'lg:block lg:h-[max(7.5rem,9.01vw)]')

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <h3
    // lg+: the PDF's Gill Sans Regular 28px (1920) with 0.05em tracking.
    className="font-body font-semibold text-lg md:text-xl text-ink mb-6 lg:font-normal lg:text-[length:max(1.25rem,1.458vw)] lg:leading-[1.2] lg:tracking-[0.05em] lg:mb-[3.385vw]"
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
  // `endpoint` is retained on the block schema for backward compat but
  // no longer used: enquiries are saved through /api/form-submissions and
  // then emailed by /api/email-forwarding.
  endpoint: _endpoint,
  successRedirect,
  backgroundColor,
  faqLink,
}) => {
  const bg = (backgroundColor || 'ivory') as BgKey
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({})
  const [notice, setNotice] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const { token, tokenError, freshToken } = useFormToken()
  // Google's script, ready before the visitor sends (this page is the form).
  useEffect(() => {
    void loadRecaptcha()
  }, [])

  const { href: faqHref, newTab: faqNewTab } = resolveFaqHref(faqLink)
  const redirectTarget = successRedirect || '/thank-you'

  // Runs only after the browser's own checks pass (required boxes, email
  // shape, group size of at least 1). Empty boxes are re-checked here as a
  // backup, and the phone needs at least 10 digits (SS rules).
  // Returns the names of the boxes with a problem ([] when all is well).
  const validate = (fd: FormData): string[] => {
    const next: Partial<Record<FieldName, string>> = {}
    for (const [name, message] of FIELDS) {
      if (!formValue(fd, name)) next[name] = message
    }
    const phone = formValue(fd, 'phone')
    if (phone && countDigits(phone) < MIN_PHONE_DIGITS)
      next.phone = 'Please enter at least 10 digits.'
    // The browser's own email check lets through addresses the server
    // refuses (no dot after the "@", longer than any real one), so say so
    // here, under the email box. Same rule as the server (isValidEmail).
    const email = formValue(fd, 'email')
    if (email && !isValidEmail(email)) next.email = 'Please enter a valid email address.'
    setErrors(next)
    return Object.keys(next)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('idle')
    setErrorMessage(null)
    setNotice('')

    const form = e.currentTarget
    const fd = new FormData(form)
    const problems = validate(fd)
    if (problems.length) {
      focusFirstProblem(form, problems)
      return
    }

    // Without a valid pass the server refuses the enquiry.
    if (!token) {
      setNotice(tokenError ? INIT_ERROR : NOT_READY)
      return
    }

    try {
      setStatus('submitting')
      const pass = await freshToken()
      if (!pass) throw new Error(SUBMIT_FAILED)
      const recaptchaToken = await getRecaptchaToken('appointment')
      if (recaptchaToken === null) throw new Error(RECAPTCHA_FAILED)
      await submitEnquiry({
        formId: FORM_IDS.appointment,
        fields: FIELDS.map(([name]) => ({ field: name, value: formValue(fd, name) })),
        honeypot,
        token: pass,
        recaptchaToken,
      })
      router.push(redirectTarget)
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Submission failed')
    }
  }

  return (
    <section
      className={cn(
        // lg+ top / bottom space from the PDF (1920 artboard).
        'w-full py-12 lg:pt-[5vw] lg:pb-[4.74vw] px-6 md:px-12 lg:px-20',
        bgClass[bg],
      )}
      data-theme="light"
      aria-label="Book an appointment form"
    >
      <form
        onSubmit={handleSubmit}
        // lg+: the PDF's 1124px column (of 1920), never narrower than 768px.
        className="w-full max-w-4xl mx-auto lg:max-w-[max(48rem,58.54vw)]"
      >
        <SectionHeader title="Personal Details" />

        {/* Rows of paired fields — mobile stacks, md+ uses 2 cols.
            Same grid pattern as ConsultationForm. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 lg:gap-x-[1.25vw] lg:gap-y-[1.17vw]">
          <div>
            <FieldLabel htmlFor="firstName" label="First Name" required />
            <input
              id="firstName"
              name="firstName"
              maxLength={maxLengthOf('firstName')}
              type="text"
              required
              className={textInputClass}
            />
            <FieldError message={errors.firstName} />
          </div>
          <div>
            <FieldLabel htmlFor="lastName" label="Last Name" required />
            <input
              id="lastName"
              name="lastName"
              maxLength={maxLengthOf('lastName')}
              type="text"
              required
              className={textInputClass}
            />
            <FieldError message={errors.lastName} />
          </div>
          <div>
            <FieldLabel htmlFor="email" label="Email Address" required />
            <input
              id="email"
              name="email"
              maxLength={maxLengthOf('email')}
              type="email"
              required
              className={textInputClass}
            />
            <FieldError message={errors.email} />
          </div>
          <div>
            <FieldLabel htmlFor="phone" label="Phone Number" required />
            <input
              id="phone"
              name="phone"
              maxLength={maxLengthOf('phone')}
              type="tel"
              autoComplete="tel"
              required
              onChange={filterPhoneInput}
              className={textInputClass}
            />
            <FieldError message={errors.phone} />
          </div>
          <div>
            <FieldLabel htmlFor="city" label="City" required />
            <input
              id="city"
              name="city"
              maxLength={maxLengthOf('city')}
              type="text"
              required
              className={textInputClass}
            />
            <FieldError message={errors.city} />
          </div>
          <div>
            <FieldLabel htmlFor="country" label="Country" required />
            <input
              id="country"
              name="country"
              maxLength={maxLengthOf('country')}
              type="text"
              required
              className={textInputClass}
            />
            <FieldError message={errors.country} />
          </div>
          <div>
            <FieldLabel htmlFor="occupation" label="Occupation" required />
            <input
              id="occupation"
              name="occupation"
              maxLength={maxLengthOf('occupation')}
              type="text"
              required
              className={textInputClass}
            />
            <FieldError message={errors.occupation} />
          </div>
          <div>
            <FieldLabel htmlFor="groupSize" label="Group Size" required />
            <input
              id="groupSize"
              name="groupSize"
              type="number"
              min={1}
              required
              className={textInputClass}
            />
            <FieldError message={errors.groupSize} />
          </div>
        </div>

        {/* Two long-form textareas — stack full-width below the field
            grid (PDF shows them spanning the form's full content
            width, not the 2-col grid). */}
        <div className="mt-6 flex flex-col gap-6 lg:mt-[1.17vw] lg:gap-[1.17vw]">
          <div>
            <FieldLabel htmlFor="hearAboutUs" label="How did you hear about the Museum?" required />
            <textarea
              id="hearAboutUs"
              name="hearAboutUs"
              maxLength={maxLengthOf('hearAboutUs')}
              rows={4}
              required
              className={textareaClass}
            />
            <FieldError message={errors.hearAboutUs} />
          </div>
          <div>
            <FieldLabel htmlFor="queriesComments" label="Any queries or comments?" required />
            <textarea
              id="queriesComments"
              name="queriesComments"
              maxLength={maxLengthOf('queriesComments')}
              rows={5}
              required
              className={textareaClass}
            />
            <FieldError message={errors.queriesComments} />
          </div>
        </div>

        {/* Spam protection: do not remove. Checked by the form-submissions
            hook. Off-screen and out of the layout, so nothing moves. */}
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

        {/* Submit + status — left-aligned per PDF (NOT centred). */}
        <div className="mt-8 lg:mt-[1.3vw] flex flex-col items-start gap-3 lg:gap-[0.625vw]">
          <button
            type="submit"
            disabled={status === 'submitting'}
            className={cn(
              'inline-flex items-center justify-center px-8 py-3 font-body',
              // lg+: the PDF's 240x40 button, growing with the page above
              // 1920 and with a longer CMS label.
              'lg:min-w-[max(15rem,12.5vw)] lg:h-[max(2.5rem,2.083vw)] lg:px-[1.5vw] lg:py-0 lg:text-[length:max(1rem,0.833vw)]',
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
              Sorry — {errorMessage || 'something went wrong'}. Please try again or email us at
              info@momhindia.org.
            </p>
          )}
          {(notice || tokenError) && (
            <p className="text-sm text-brand-red font-body">{notice || INIT_ERROR}</p>
          )}
          <RecaptchaNotice className="text-ink/80 lg:text-[length:max(0.75rem,0.625vw)]" />

          {/* FAQ link line — italic + underlined "Frequently Asked
              Questions" link, plain Gill Sans surrounding it.
              lg+ (PDF): the link is #DD092B Cormorant italic (4.5:1-safe,
              unlike brand-red) and the full stop sits inside it. */}
          <p className="mt-4 lg:mt-[0.71vw] font-body text-sm md:text-base text-ink/90 lg:text-[length:max(1rem,0.885vw)] lg:text-[#212121]">
            Have a specific query in mind? Find answers in our{' '}
            <Link
              href={faqHref}
              {...(faqNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="italic underline underline-offset-4 hover:text-brand-red transition-colors lg:font-script lg:text-[1.2em] lg:text-[#DD092B] lg:hover:text-brand-red-dark"
            >
              Frequently Asked Questions<span className="hidden lg:inline">.</span>
            </Link>
            <span className="lg:hidden">.</span>
          </p>
        </div>
      </form>
    </section>
  )
}

export default AppointmentFormBlock
