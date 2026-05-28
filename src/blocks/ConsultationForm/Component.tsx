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
 */

import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import type { ConsultationFormBlock as ConsultationFormBlockProps } from '@/payload-types'

import { cn } from '@/utilities/ui'

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
  'focus:outline-none focus:border-brand-red focus:ring-0 transition-colors duration-150'

const selectClass = inputClass + ' appearance-none pr-10 cursor-pointer'

type SectionHeaderProps = { title: string }
const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
  <h3
    className="font-body text-lg md:text-xl text-ink mb-6"
    style={{ fontWeight: 600 }}
  >
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
  // unused — submissions now route through /api/email-forwarding for
  // the customer + owner email pair.
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

  const redirectTarget = successRedirect || '/thank-you'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'submitting') return

    // Build the `{ field, value }` payload shape expected by
    // /api/email-forwarding. File uploads (reference image) aren't
    // attached to the email yet — the file name is forwarded as text
    // so the owner knows one was provided. Persisting the file itself
    // requires a Payload-managed upload, which is a separate task.
    const formEl = e.currentTarget
    const fd = new FormData(formEl)
    const submissionData: Array<{ field: string; value: string }> = []
    for (const [key, value] of fd.entries()) {
      if (value instanceof File) {
        if (value.size > 0) {
          submissionData.push({ field: key, value: value.name })
        }
      } else {
        submissionData.push({ field: key, value })
      }
    }

    try {
      setStatus('submitting')
      const res = await fetch('/api/email-forwarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: 'consultation',
          submissionData,
        }),
      })
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
      aria-label="Personal consultation enquiry form"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-4xl mx-auto"
        encType="multipart/form-data"
        noValidate
      >
        {/* ── 1. Personal Details ─────────────────────────────── */}
        <SectionHeader title="Personal Details" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <FieldLabel htmlFor="firstName" label="First Name" required />
            <input id="firstName" name="firstName" type="text" required className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor="lastName" label="Last Name" />
            <input id="lastName" name="lastName" type="text" className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor="email" label="Email Address" required />
            <input id="email" name="email" type="email" required className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor="phone" label="Phone Number/WhatsApp" required />
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
          </div>
        </div>

        <GroupDivider />

        {/* ── 3. Your Design Idea ─────────────────────────────── */}
        <SectionHeader title="Your Design Idea" />
        <div className="flex flex-col gap-6">
          <div>
            <FieldLabel htmlFor="designIdea" label="Tell us about the piece you have in mind" />
            <input
              id="designIdea"
              name="designIdea"
              type="text"
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel
              htmlFor="referenceImage"
              label="Upload reference image / sketch (optional)"
              required
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
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                setFileName(f ? f.name : null)
              }}
            />
          </div>
        </div>

        <GroupDivider />

        {/* ── 4. Preference ───────────────────────────────────── */}
        <SectionHeader title="Preference" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="md:col-span-2">
            <FieldLabel htmlFor="budget" label="Budget range" />
            <div className="relative md:max-w-[calc(50%-1rem)]">
              <select
                id="budget"
                name="budget"
                defaultValue=""
                className={selectClass}
              >
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
            <textarea
              id="additionalNotes"
              name="additionalNotes"
              rows={5}
              className={inputClass}
            />
          </div>
        </div>

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
              Sorry — {errorMessage || 'something went wrong'}. Please try again or email
              us at info@momhindia.org.
            </p>
          )}
        </div>
      </form>
    </section>
  )
}

export default ConsultationFormBlock
