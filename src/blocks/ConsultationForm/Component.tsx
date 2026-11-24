'use client'

/**
 * ConsultationFormBlock — multi-section bespoke-jewellery enquiry form.
 *
 * Layout matches PDF p4 exactly:
 *   1. Personal Details: First Name * | Last Name
 *                        Email Address * | Phone Number/WhatsApp *
 *                        City *          | Country *
 *   2. Your Requirement: What would you like to create? * | Is this for *
 *                        Preferred timeline *
 *   3. Your Design Idea: free-text + reference image upload
 *   4. Preference:       Budget range
 *   5. Consultation Preference: contact channel + free-text notes
 *   + Submit Enquiry (red filled rectangular button)
 *
 * Group headers (Personal Details, Your Requirement, etc.) sit above
 * each section, with a hairline divider between groups. Fields use
 * Gill Sans labels above underline-bordered inputs (no boxed inputs
 * per PDF — the box-style rendered in pdftoppm above is a default
 * fallback when the real Adobe Illustrator file's form fields aren't
 * being rendered; the actual designed style is borderless underlined).
 *
 * Wait — looking at the PDF render again: fields DO have a thin grey
 * box around them. So `border` + `rounded-none` per the PDF. Keeping
 * the boxed style.
 *
 * Validation and submission follow the SS site's Book an Appointment
 * form (see src/utilities/enquiryForm.ts): browser checks, a red line
 * under each box at fault, a phone filter + at least 10 digits, a signed
 * time pass, a hidden trap box and an invisible reCAPTCHA v3 check
 * (src/utilities/recaptchaClient.ts). The enquiry is saved in Form
 * Submissions first, then emailed. A red star only on compulsory boxes.
 */

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import type { ConsultationFormBlock as ConsultationFormBlockProps } from '@/payload-types'

import { cn } from '@/utilities/ui'
import {
  CONSULTATION_FIELDS_AFTER_IMAGE,
  CONSULTATION_FIELDS_BEFORE_IMAGE,
  FORM_IDS,
} from '@/utilities/formIds'
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
  uploadReferenceFile,
  useFormToken,
} from '@/utilities/enquiryForm'
import { isEmailTooLong } from '@/utilities/emailFormat'
import { RECAPTCHA_FAILED, getRecaptchaToken, loadRecaptcha } from '@/utilities/recaptchaClient'
import { RecaptchaNotice } from '@/components/RecaptchaNotice'
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_ACCEPT,
  UPLOAD_SIZE_ERROR,
  UPLOAD_TYPE_ERROR,
  uploadContentType,
} from '@/utilities/uploadRules'

// Every answer this form saves, in order. Compulsory ones carry the red
// line shown under the box when it is left empty (SS validate()). The
// reference image goes in between, only when one was chosen: it is
// uploaded straight to S3 first (src/utilities/enquiryForm.ts
// uploadReferenceFile) and the enquiry stores its S3 key and file name.
const REQUIRED = {
  firstName: 'Please enter your first name.',
  email: 'Please enter your email.',
  phone: 'Please enter your phone number.',
  city: 'Please enter your city.',
  country: 'Please enter your country.',
  creation: 'Please select what you would like to create.',
  recipient: 'Please select who this is for.',
  timeline: 'Please select a timeline.',
} as const
type RequiredName = keyof typeof REQUIRED
type ErrorName = RequiredName | 'referenceImage'

/** '' when the picked file can be uploaded, else the message to show. */
const fileProblem = (file: File): string => {
  if (!uploadContentType(file)) return UPLOAD_TYPE_ERROR
  if (file.size < 1 || file.size > MAX_UPLOAD_BYTES) return UPLOAD_SIZE_ERROR
  return ''
}
// Every field this form saves, in order (the lists the spam hook allows).
const FIELDS_BEFORE_IMAGE = CONSULTATION_FIELDS_BEFORE_IMAGE
const FIELDS_AFTER_IMAGE = CONSULTATION_FIELDS_AFTER_IMAGE

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? <p className="mt-1 text-sm text-brand-red font-body">{message}</p> : null

type BgKey = NonNullable<ConsultationFormBlockProps['backgroundColor']>

const bgClass: Record<BgKey, string> = {
  ivory: 'bg-ivory text-ink',
  cream: 'bg-cream text-ink',
  white: 'bg-white text-ink',
}

type RequiredAsterisk = () => React.ReactNode

const Asterisk: RequiredAsterisk = () => (
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
 *  shifts the border to brand-red. */
const inputClass =
  'w-full px-4 py-3 bg-white border border-warm-gray/40 rounded-none font-body text-base text-ink ' +
  'focus:outline-none focus:border-brand-red focus:ring-0 transition-colors duration-150 ' +
  // When the browser's own check scrolls to an empty box, stop 128px short
  // of the top so its label stays visible below the fixed MOMH logo.
  // Changes only where the page scrolls to, never the layout.
  'scroll-mt-32'

const selectClass = inputClass + ' appearance-none pr-10 cursor-pointer'

type SectionHeaderProps = { title: string }
const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
  <h3 className="font-body text-lg md:text-xl text-ink mb-6" style={{ fontWeight: 600 }}>
    {title}
  </h3>
)

/** Hairline divider between form groups. Lives outside each group so
 *  the spacing is symmetric above/below. */
const GroupDivider: React.FC = () => (
  <div className="border-t border-warm-gray/25 my-12 lg:my-14" aria-hidden="true" />
)

/** Chevron icon used inside select dropdowns. Pure SVG so it scales
 *  cleanly and matches the brand greyscale. */
const ChevronDown: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray/70"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const UploadIcon: React.FC = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="text-ink"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

export const ConsultationFormBlock: React.FC<ConsultationFormBlockProps> = ({
  submitLabel,
  // `endpoint` is retained on the block schema for backward compat but
  // unused: enquiries are saved through /api/form-submissions and then
  // emailed by /api/email-forwarding.
  endpoint: _endpoint,
  successRedirect,
  backgroundColor,
}) => {
  const bg = (backgroundColor || 'ivory') as BgKey
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<ErrorName, string>>>({})
  const [notice, setNotice] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const { token, tokenError, freshToken } = useFormToken()
  // Google's script, ready before the visitor sends (this page is the form).
  useEffect(() => {
    void loadRecaptcha()
  }, [])
  // The last file S3 confirmed it stored. If the enquiry is then refused
  // and the visitor presses the button again with the same file, its key
  // is reused instead of uploading the file a second time.
  const storedFile = useRef<{ id: string; key: string } | null>(null)

  const redirectTarget = successRedirect || '/thank-you'

  // Runs only after the browser's own checks pass (starred boxes filled,
  // email shape, an option picked in each starred dropdown). Empty boxes
  // are re-checked here as a backup, and the phone needs at least 10
  // digits (SS rules).
  // Returns the names of the boxes with a problem ([] when all is well).
  const validate = (fd: FormData): string[] => {
    const next: Partial<Record<ErrorName, string>> = {}
    for (const [name, message] of Object.entries(REQUIRED) as [RequiredName, string][]) {
      if (!formValue(fd, name)) next[name] = message
    }
    const phone = formValue(fd, 'phone')
    if (phone && countDigits(phone) < MIN_PHONE_DIGITS)
      next.phone = 'Please enter at least 10 digits.'
    // The browser lets any length through; the server refuses an address
    // longer than any real one, so say so here, under the email box.
    const email = formValue(fd, 'email')
    if (email && isEmailTooLong(email)) next.email = 'Please enter a valid email address.'
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

      // Optional reference image: upload it to S3 first. It never blocks
      // the enquiry: if the upload fails, the enquiry is saved without it
      // and the team's email says the file did not arrive.
      const image = fd.get('referenceImage')
      const imageFields: Array<{ field: string; value: string }> = []
      if (image instanceof File && image.size > 0 && !fileProblem(image)) {
        const id = `${image.name}|${image.size}|${image.lastModified}`
        let key: string | null
        if (storedFile.current?.id === id) {
          key = storedFile.current.key
        } else {
          const upload = await uploadReferenceFile({
            file: image,
            contentType: uploadContentType(image),
            honeypot,
            token: pass,
          })
          // stored: false means S3's answer could not be read; the key is
          // kept and the email step checks whether the file is there.
          key = upload?.key ?? null
          storedFile.current = upload?.stored ? { id, key: upload.key } : null
        }
        imageFields.push(
          { field: 'referenceImage', value: key ?? '' },
          { field: 'referenceImageName', value: image.name.slice(0, 200) },
        )
        if (!key) {
          imageFields.push({
            field: 'referenceImageNote',
            value: 'The file did not upload. Please ask the visitor to send it by email.',
          })
        }
      }

      const fields = [
        ...FIELDS_BEFORE_IMAGE.map((name) => ({ field: name, value: formValue(fd, name) })),
        ...imageFields,
        ...FIELDS_AFTER_IMAGE.map((name) => ({ field: name, value: formValue(fd, name) })),
      ]
      // Asked for last: Google's token is single-use and lasts 2 minutes,
      // and the upload above can take a while.
      const recaptchaToken = await getRecaptchaToken('consultation')
      if (recaptchaToken === null) throw new Error(RECAPTCHA_FAILED)
      await submitEnquiry({
        formId: FORM_IDS.consultation,
        fields,
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
      className={cn('w-full py-12 lg:py-16 px-6 md:px-12 lg:px-20', bgClass[bg])}
      data-theme="light"
      aria-label="Personal consultation enquiry form"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-4xl mx-auto"
        encType="multipart/form-data"
      >
        {/* ── 1. Personal Details ─────────────────────────────── */}
        <SectionHeader title="Personal Details" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <FieldLabel htmlFor="firstName" label="First Name" required />
            <input id="firstName" name="firstName" type="text" required className={inputClass} />
            <FieldError message={errors.firstName} />
          </div>
          <div>
            <FieldLabel htmlFor="lastName" label="Last Name" />
            <input id="lastName" name="lastName" type="text" className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor="email" label="Email Address" required />
            <input id="email" name="email" type="email" required className={inputClass} />
            <FieldError message={errors.email} />
          </div>
          <div>
            <FieldLabel htmlFor="phone" label="Phone Number/WhatsApp" required />
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              onChange={filterPhoneInput}
              className={inputClass}
            />
            <FieldError message={errors.phone} />
          </div>
          <div>
            <FieldLabel htmlFor="city" label="City" required />
            <input id="city" name="city" type="text" required className={inputClass} />
            <FieldError message={errors.city} />
          </div>
          <div>
            <FieldLabel htmlFor="country" label="Country" required />
            <input id="country" name="country" type="text" required className={inputClass} />
            <FieldError message={errors.country} />
          </div>
        </div>

        <GroupDivider />

        {/* ── 2. Your Requirement ─────────────────────────────── */}
        <SectionHeader title="Your Requirement" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <FieldLabel htmlFor="creation" label="What would you like to create?" required />
            <div className="relative">
              <select
                id="creation"
                name="creation"
                required
                defaultValue=""
                className={selectClass}
              >
                <option value="" disabled>
                  Select an option
                </option>
                <option value="Necklace">Necklace</option>
                <option value="Earrings">Earrings</option>
                <option value="Ring">Ring</option>
                <option value="Bracelet / Bangle">Bracelet / Bangle</option>
                <option value="Pendant">Pendant</option>
                <option value="Bridal set">Bridal set</option>
                <option value="Other / Not sure">Other / Not sure</option>
              </select>
              <ChevronDown />
            </div>
            <FieldError message={errors.creation} />
          </div>
          <div>
            <FieldLabel htmlFor="recipient" label="Is this for" required />
            <div className="relative">
              <select
                id="recipient"
                name="recipient"
                required
                defaultValue=""
                className={selectClass}
              >
                <option value="" disabled>
                  Select an option
                </option>
                <option value="Myself">Myself</option>
                <option value="A gift">A gift</option>
                <option value="A wedding / engagement">A wedding / engagement</option>
                <option value="An heirloom">An heirloom</option>
                <option value="Other">Other</option>
              </select>
              <ChevronDown />
            </div>
            <FieldError message={errors.recipient} />
          </div>
          <div>
            <FieldLabel
              htmlFor="timeline"
              label="Preferred timeline to get the final product"
              required
            />
            <div className="relative">
              <select
                id="timeline"
                name="timeline"
                required
                defaultValue=""
                className={selectClass}
              >
                <option value="" disabled>
                  Select an option
                </option>
                <option value="Less than 3 months">Less than 3 months</option>
                <option value="3 to 6 months">3 to 6 months</option>
                <option value="6 to 8 months (standard)">6 to 8 months (standard)</option>
                <option value="Flexible">Flexible</option>
              </select>
              <ChevronDown />
            </div>
            <FieldError message={errors.timeline} />
          </div>
        </div>

        <GroupDivider />

        {/* ── 3. Your Design Idea ─────────────────────────────── */}
        <SectionHeader title="Your Design Idea" />
        <div className="flex flex-col gap-6">
          <div>
            <FieldLabel htmlFor="designIdea" label="Tell us about the piece you have in mind" />
            <input id="designIdea" name="designIdea" type="text" className={inputClass} />
          </div>
          <div>
            <FieldLabel
              htmlFor="referenceImage"
              label="Upload reference image / sketch (optional)"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'w-full flex items-center justify-center gap-3 py-8 px-4',
                'border border-dashed border-warm-gray/50 bg-white',
                'font-body text-base text-ink hover:bg-warm-gray/5 transition-colors duration-150',
                'cursor-pointer',
              )}
            >
              <UploadIcon />
              <span>{fileName || 'Upload'}</span>
            </button>
            <input
              ref={fileInputRef}
              id="referenceImage"
              name="referenceImage"
              type="file"
              accept={UPLOAD_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                const problem = f ? fileProblem(f) : ''
                // A file we cannot take is let go straight away, so the
                // visitor is never stuck with it: the box shows "Upload"
                // again and the red line says why.
                if (problem) e.target.value = ''
                setFileName(f && !problem ? f.name : null)
                setErrors((prev) => ({ ...prev, referenceImage: problem || undefined }))
              }}
            />
            <FieldError message={errors.referenceImage} />
          </div>
        </div>

        <GroupDivider />

        {/* ── 4. Preference ───────────────────────────────────── */}
        <SectionHeader title="Preference" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="md:col-span-2">
            <FieldLabel htmlFor="budget" label="Budget range" />
            <div className="relative md:max-w-[calc(50%-1rem)]">
              <select id="budget" name="budget" defaultValue="" className={selectClass}>
                <option value="" disabled>
                  Select an option
                </option>
                <option value="Under ₹2 lakh">Under ₹2 lakh</option>
                <option value="₹2 - 5 lakh">₹2 – 5 lakh</option>
                <option value="₹5 - 10 lakh">₹5 – 10 lakh</option>
                <option value="₹10 - 25 lakh">₹10 – 25 lakh</option>
                <option value="₹25 lakh+">₹25 lakh+</option>
                <option value="Prefer to discuss">Prefer to discuss</option>
              </select>
              <ChevronDown />
            </div>
          </div>
        </div>

        <GroupDivider />

        {/* ── 5. Consultation Preference ──────────────────────── */}
        <SectionHeader title="Consultation Preference" />
        <div className="flex flex-col gap-6">
          <div className="md:max-w-[calc(50%-1rem)]">
            <FieldLabel htmlFor="contactChannel" label="Preferred way to connect" />
            <div className="relative">
              <select
                id="contactChannel"
                name="contactChannel"
                defaultValue="Phone"
                className={selectClass}
              >
                <option value="Phone">Phone</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
                <option value="In person at MoMH">In person at MoMH</option>
              </select>
              <ChevronDown />
            </div>
          </div>
          <div>
            <FieldLabel
              htmlFor="additionalNotes"
              label="Anything else you would like us to know?"
            />
            <textarea id="additionalNotes" name="additionalNotes" rows={5} className={inputClass} />
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

        {/* Submit + status ─────────────────────────────────────── */}
        <div className="mt-12 flex flex-col items-start gap-3">
          <button
            type="submit"
            disabled={status === 'submitting'}
            className={cn(
              'inline-flex items-center justify-center px-8 py-3 font-body uppercase',
              'bg-brand-red text-white border border-brand-red',
              'text-sm md:text-base tracking-wider',
              'hover:bg-brand-red/90 transition-colors duration-200',
              'disabled:opacity-60',
            )}
            style={{ fontWeight: 400, letterSpacing: '0.08em' }}
          >
            {status === 'submitting' ? 'Submitting…' : submitLabel || 'Submit Enquiry'}
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
          <RecaptchaNotice className="text-ink/80" />
        </div>
      </form>
    </section>
  )
}

export default ConsultationFormBlock
