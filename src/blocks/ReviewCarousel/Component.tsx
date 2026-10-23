import React from 'react'

import type { ReviewCarouselBlock as ReviewCarouselBlockProps } from '@/payload-types'

import { ReviewSlides, type Review } from './ReviewSlides'

/** Stable in-page anchor from the heading text, as Text Section makes it: "Visitor Reviews" -> "visitor-reviews". */
const toAnchor = (text: string): string =>
  text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** The page adds the quote marks, so any an editor typed at either end are dropped. */
const cleanQuote = (quote: string): string =>
  quote
    .trim()
    .replace(/^["“”„]+\s*/, '')
    .replace(/\s*["“”„]+$/, '')

/**
 * Visitor reviews, one at a time (Testimonials page, /testimonials; option C
 * of the review designs shown on 21 Oct 2026, chosen by the user in place of
 * the PDF's card grid).
 *
 * The heading is Text Section's own (same classes, same column, same anchor
 * rule, same gap below it), so it matches the page's other headings. Below
 * it, a light band (the site's offwhite) runs the full width of the window
 * and shows one review at a time (ReviewSlides).
 *
 * Spacing: the gap above the heading is the Divider's, as for a Text Section.
 * Below the band the section pads 32px / 48px (md+), as a Text Section does,
 * plus the part of a last text line that sits below its baseline (0.4202em of
 * the body size). The Divider measures its gap from a text baseline, so this
 * puts the band's bottom edge where that baseline would be, and the lotus
 * sits the usual gap below it.
 *
 * Reviews with no words or no name are left out; with none left the block
 * draws nothing.
 */
export const ReviewCarouselBlock: React.FC<ReviewCarouselBlockProps> = ({ heading, reviews }) => {
  const items: Review[] = (Array.isArray(reviews) ? reviews : [])
    .map((review, index) => ({
      id: review.id ?? String(index),
      quote: cleanQuote(review.quote ?? ''),
      author: review.author?.trim() ?? '',
      details: review.details?.trim() || undefined,
    }))
    .filter((review) => review.quote && review.author)
  if (items.length === 0) return null

  const title = heading?.trim()

  return (
    <section className="review-carousel w-full text-ink [--pp-vw:min(1vw,19.2px)] pb-[calc(2rem_+_0.4202*var(--fs-body))] md:pb-[calc(3rem_+_0.4202*var(--fs-body))]">
      {title && (
        <div className="px-9 md:px-12 lg:px-0">
          {/* Text Section's column, so a long heading wraps as theirs do. */}
          <div className="mx-auto w-full max-w-2xl lg:max-w-[min(max(672px,59.39vw),1140.3px)]">
            <h2
              id={toAnchor(title)}
              className="review-carousel-heading text-section-heading editorial-display text-display text-brand-red text-center mb-[max(18px,calc(5.052*var(--pp-vw)_-_0.1952*var(--fs-display)_-_1.0798*var(--fs-body)))] scroll-mt-[14svh] lg:scroll-mt-32"
            >
              {title}
            </h2>
          </div>
        </div>
      )}
      <ReviewSlides reviews={items} label={title || 'Visitor reviews'} />
    </section>
  )
}

export default ReviewCarouselBlock
