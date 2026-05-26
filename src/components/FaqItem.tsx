'use client'

/**
 * FaqItem — single expandable Q&A row built on native <details>/<summary>.
 *
 * Why native:
 *  - Accessibility for free: <details> is keyboard-operable, screen-reader-
 *    friendly, and respects `prefers-reduced-motion` automatically.
 *  - No JS runtime cost — no React state for open/close.
 *  - Works without hydration (server-rendered open state is preserved).
 *
 * The smooth open/close transition is done via CSS grid-template-rows
 * 0fr → 1fr trick, which the browser interpolates without a layout flash
 * (vs. max-height tricks which can over-shoot).
 */

import React from 'react'
import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

type Props = {
  question: string
  /** Lexical JSON. Rendered with enableProse=false so site typography wins. */
  answer: unknown
  className?: string
}

export const FaqItem: React.FC<Props> = ({ question, answer, className }) => {
  return (
    <details
      className={cn(
        'group border-b border-warm-gray/30 py-5 transition-colors',
        // `open:` Tailwind variant lets the heading + chevron react to state.
        className,
      )}
    >
      <summary
        className={cn(
          'flex items-center justify-between gap-4 cursor-pointer list-none py-2',
          // PDF spec: questions render at ~24-26px on a 1920 viewport —
          // larger than body text so the FAQ rows read as headings, not
          // paragraph runs. `text-xl md:text-2xl` lands at 20/24px.
          'font-body text-xl md:text-2xl text-warm-gray',
          // Remove the default disclosure triangle in WebKit + Firefox.
          '[&::-webkit-details-marker]:hidden [&::marker]:hidden',
        )}
      >
        <span className="flex-1">{question}</span>
        {/* Red chevron — rotates 0 → 45deg on open to read as a "close" cross-ish hint.
            Inline SVG so the stroke stays sharp at every viewport size. */}
        <span
          aria-hidden="true"
          className={cn(
            'shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full',
            'text-brand-red transition-transform duration-300 ease-out',
            'group-open:rotate-180',
          )}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </summary>

      {/* Answer wrapper — grid-template-rows 0fr → 1fr is the smoothest
          height transition because the browser interpolates the fractional
          row directly. The inner div clamps overflow during the animation. */}
      <div
        className={cn(
          'grid grid-rows-[0fr] group-open:grid-rows-[1fr]',
          'transition-[grid-template-rows] duration-300 ease-out',
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-4 font-body text-body text-warm-gray/90">
            <RichText data={answer as never} enableGutter={false} enableProse={false} />
          </div>
        </div>
      </div>
    </details>
  )
}

export default FaqItem
