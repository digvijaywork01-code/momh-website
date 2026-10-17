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

/*
 * The 'faq-page' variant's own styles (the /faq page, FAQ PDF). The question
 * size (--faq-q) and the question -> answer gap (--faq-qa-gap) are set on the
 * FAQ block's section (src/blocks/FAQ/Component.tsx) and inherited here.
 */

/**
 * Row: a line between questions, with Book An Appointment's spacing around
 * it: 20px from the answer to the line, 28px from the line to the next
 * question (that page's row py-5 plus its question's py-2). The line is that
 * page's border-warm-gray/30 (the user's choice, 12 Oct; the PDF has none).
 * Only between questions, never under a group's last one, so the gaps above
 * each group heading and above the buttons stay exactly as the FAQ block and
 * the page set them.
 */
const PAGE_ROW_CLASSES = [
  'group faq-item--page',
  '[.faq-item--page+&]:mt-[20px] [.faq-item--page+&]:pt-[28px]',
  '[.faq-item--page+&]:border-t [.faq-item--page+&]:border-t-warm-gray/30',
].join(' ')

/**
 * Question: the chevron sits at the top of the row (items-start, not the
 * standard row's items-center) and is centred on the question's FIRST line
 * (see the chevron below), so it stays right when a long question wraps on a
 * phone. Font size before line height, so cn's class merge keeps both.
 */
const PAGE_QUESTION_CLASSES = [
  'faq-item--page__q flex items-start justify-between gap-[16px] cursor-pointer list-none',
  'text-[length:var(--faq-q)] leading-[1.25]',
].join(' ')

/**
 * Chevron: the PDF's filled chevron, 12 x 7.65px below lg, from lg scaling
 * with the screen up to the PDF's 19 x 12.12 at 1920. Its centre sits 0.427em
 * above the question's baseline, as in the PDF: the line box centre is 0.329em
 * above the baseline, hence 0.625em (half the 1.25 line) - 0.098em = 0.527em
 * from the line's top to the chevron's centre.
 */
const PAGE_CHEVRON_CLASSES = [
  'faq-item--page__chev',
  '[--faq-chev-w:12px] [--faq-chev-h:7.65px]',
  'lg:[--faq-chev-w:clamp(12px,_0.99vw,_19px)] lg:[--faq-chev-h:clamp(7.65px,_0.631vw,_12.12px)]',
  'w-[var(--faq-chev-w)] h-[var(--faq-chev-h)] mt-[calc(0.527em_-_var(--faq-chev-h)_/_2)]',
  'shrink-0 inline-flex text-brand-red transition-transform duration-300 ease-out group-open:rotate-180',
].join(' ')

/**
 * Answer clip: the overflow-hidden wrapper (it clips the open/close
 * animation) would cut the focus ring of a link at the start or end of a
 * line. 4px of room each side; the padding puts the text back exactly where
 * it was.
 */
const PAGE_CLIP_CLASSES = 'faq-item--page__clip overflow-hidden -mx-[4px] px-[4px]'

/**
 * Answer: --faq-qa-gap below the question; justified from 768 up. From lg it
 * stops 78.5px short of the column's right edge at 1920 (the chevron plus its
 * 59.5px gap), as in the PDF, scaling with the screen.
 */
const PAGE_ANSWER_CLASSES = [
  'faq-item--page__a pt-[var(--faq-qa-gap)] md:text-justify lg:pr-[min(4.09vw,78.5px)]',
  'font-body text-body text-warm-gray/90',
].join(' ')

type Props = {
  question: string
  /** Lexical JSON. Rendered with enableProse=false so site typography wins. */
  answer: unknown
  className?: string
  /** 'faq-page' = the /faq page look (FAQ PDF): large question, larger
   *  filled chevron, justified answer, a line only BETWEEN questions. Sizes,
   *  gaps and the line live in the PAGE_*_CLASSES above.
   *  Unset = the standard row, as on Book An Appointment. */
  variant?: 'faq-page'
  /** Render the row already open (the /faq page shows every answer). The
   *  /faq page closes them again on phones before the first paint (an inline
   *  script in the route), so the server's `open` may differ from the DOM at
   *  hydration; that one attribute's warning is suppressed. */
  defaultOpen?: boolean
}

export const FaqItem: React.FC<Props> = ({ question, answer, className, variant, defaultOpen }) => {
  const page = variant === 'faq-page'
  return (
    <details
      open={defaultOpen || undefined}
      {...(defaultOpen ? { suppressHydrationWarning: true } : {})}
      className={
        page
          ? cn(PAGE_ROW_CLASSES, className)
          : cn(
              'group border-b border-warm-gray/30 py-5 transition-colors',
              // `open:` Tailwind variant lets the heading + chevron react to state.
              className,
            )
      }
    >
      <summary
        className={page ? cn(
          PAGE_QUESTION_CLASSES,
          'font-body text-warm-gray',
          '[&::-webkit-details-marker]:hidden [&::marker]:hidden',
        ) : cn(
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
        {page ? (
          // The PDF's filled chevron (19 x 12.12 at 1920), pointing down when
          // closed and flipped up when open, as on the standard row.
          <span aria-hidden="true" className={PAGE_CHEVRON_CLASSES}>
            <svg viewBox="0 0 19.002 12.12" width="100%" height="100%" fill="currentColor">
              <path d="M16.988 0 9.501 7.88 2.015 0 0 2.12 9.501 12.12 19.002 2.12Z" />
            </svg>
          </span>
        ) : (
        /* Red chevron — rotates 0 → 45deg on open to read as a "close" cross-ish hint.
            Inline SVG so the stroke stays sharp at every viewport size. */
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
        )}
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
        {/* /faq: the clip box gets 4px of room each side (text unmoved) so a
            focused link at the start or end of a line keeps its whole ring. */}
        <div className={page ? PAGE_CLIP_CLASSES : 'overflow-hidden'}>
          <div
            className={
              page
                ? PAGE_ANSWER_CLASSES
                : 'pt-4 font-body text-body text-warm-gray/90'
            }
          >
            <RichText data={answer as never} enableGutter={false} enableProse={false} />
          </div>
        </div>
      </div>
    </details>
  )
}

export default FaqItem
