'use client'

/**
 * EditorialCta — the signature MOMH call-to-action.
 *
 * Renders italic Cormorant text + a red filled circle with white arrow icon.
 * Used across every editorial section: "Explore Our Story", "Book Your
 * Consultation", "View All Events", "Read Full Article", etc.
 *
 * Arrow position is configurable (right by default; left for the Collection
 * section per PDF page 8).
 */

import React from 'react'
import Link from 'next/link'
import { cn } from '@/utilities/ui'

type ArrowPosition = 'left' | 'right'

type Props = {
  label: string
  href: string
  arrowPosition?: ArrowPosition
  newTab?: boolean
  className?: string
}

const Arrow: React.FC<{ className?: string }> = ({ className }) => (
  // Pulled tighter: 16px circle hugging the 12px arrow with just 2px
  // of red showing on each side — the arrow itself is the focal element,
  // the circle reads as a thin red halo behind it.
  <span
    aria-hidden="true"
    className={cn(
      'inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-red text-white shrink-0 transition-transform group-hover:translate-x-1',
      className,
    )}
  >
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  </span>
)

export const EditorialCta: React.FC<Props> = ({
  label,
  href,
  arrowPosition = 'right',
  newTab = false,
  className,
}) => {
  const targetProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}

  return (
    // PDF spec for "Explore Our Story", "View All Events", "Read Full
    // Article", "Book Your Consultation" etc: GillSans-LightItalic at
    // 24pt — `font-body` resolves to Gill Sans, `italic` applies the
    // style. Font-size + weight are applied via `style` because
    // tailwind-merge sees `text-cta` (font-size token) and `text-offwhite`
    // (color token, passed in via `className`) as both being `text-*`
    // utilities and strips one — using inline style here bypasses the
    // dedup so the CTA always renders at the correct 24px on desktop.
    <Link
      href={href}
      {...targetProps}
      style={{ fontSize: 'var(--fs-cta)', fontWeight: 300 }}
      className={cn(
        'group inline-flex items-center gap-3 font-body italic whitespace-nowrap',
        'hover:underline underline-offset-4',
        className,
      )}
    >
      {arrowPosition === 'left' && <Arrow />}
      <span>{label}</span>
      {arrowPosition === 'right' && <Arrow />}
    </Link>
  )
}

export default EditorialCta
