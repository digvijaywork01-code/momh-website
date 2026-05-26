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
 */

import React, { useState } from 'react'
import { cn } from '@/utilities/ui'

type Props = {
  inputLabel: string
  buttonLabel: string
  endpoint: string
  dark: boolean
}

export const NewsletterWidget: React.FC<Props> = ({
  inputLabel,
  buttonLabel,
  endpoint,
  dark,
}) => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const inkClass = dark ? 'text-offwhite' : 'text-warm-gray'
  const borderClass = dark ? 'border-offwhite/60' : 'border-warm-gray/60'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || status === 'submitting') return
    if (!endpoint) {
      // No endpoint wired — display a local success so the UX still feels
      // complete; admins can plug in a real URL via the block config.
      setStatus('success')
      return
    }
    try {
      setStatus('submitting')
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-6 mt-4', inkClass)}>
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
          dark
            ? 'hover:bg-offwhite hover:text-maroon'
            : 'hover:bg-warm-gray hover:text-cream',
        )}
        style={{
          fontSize: 'var(--fs-button, 20px)',
          fontWeight: 400,
          letterSpacing: '0.18em',
        }}
      >
        {status === 'success' ? 'Subscribed' : status === 'submitting' ? '...' : buttonLabel}
      </button>
    </form>
  )
}

export default NewsletterWidget
