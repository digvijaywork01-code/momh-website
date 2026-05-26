'use client'

/**
 * EditorialCarousel — Embla-driven horizontal image carousel.
 *
 * Used by the CarouselBlock (Craft Your Jewellery, Museum Guidelines) to
 * slide a row of editorial images. Optional autoplay. Drag-to-scroll always
 * enabled. Prev/next arrow buttons rendered as small red-circle icons that
 * echo the EditorialCta arrow language.
 *
 * The "peek" effect (current slide + half of the next visible) is achieved
 * by sizing each slide's CSS flex-basis based on `slidesPerView`. Embla
 * itself doesn't have a slidesPerView prop — it reads layout from CSS, which
 * keeps the carousel responsive without extra JS.
 */

import React, { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'

import type { Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

type Slide = { image: MediaType | number; alt?: string | null }

type Props = {
  slides: Slide[]
  /** How many slides should fit in the visible area. 1 = full-width slides;
   *  1.1 = current + 10% peek of next (the editorial peek look). */
  slidesPerView?: number
  autoplay?: boolean
  autoplayInterval?: number
  loop?: boolean
  /** Which edge the active slide hugs.
   *  - `start` (default): active slide flush LEFT, peek on the RIGHT.
   *  - `end`: active slide flush RIGHT, peek on the LEFT. */
  align?: 'start' | 'end' | 'center'
  /** Show the prev/next arrow buttons below the carousel. Defaults to
   *  false on the PYV carousels which rely on autoplay + drag and have
   *  no chrome below the slides. */
  showArrows?: boolean
  className?: string
  /** Optional className applied to each slide's image wrapper (e.g. to set
   *  aspect-ratio). Defaults to a 4/5 portrait that matches the PDF spec. */
  slideClassName?: string
}

const Arrow: React.FC<{ direction: 'prev' | 'next'; onClick: () => void; disabled?: boolean }> = ({
  direction,
  onClick,
  disabled,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={direction === 'prev' ? 'Previous slide' : 'Next slide'}
    className={cn(
      'inline-flex items-center justify-center w-9 h-9 rounded-full bg-brand-red text-white shrink-0',
      'transition-transform duration-200 hover:scale-110 disabled:opacity-40 disabled:hover:scale-100',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2',
    )}
  >
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(direction === 'prev' && 'rotate-180')}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  </button>
)

export const EditorialCarousel: React.FC<Props> = ({
  slides,
  // 1.15 → ~87% slide + ~13% next-slide peek BEFORE the 24px gap is
  // subtracted; with the gap visible, the peek lands around 10% of
  // the slide width — exactly the PDF spec.
  slidesPerView = 1.15,
  autoplay = true,
  autoplayInterval = 4000,
  loop = true,
  align = 'start',
  showArrows = false,
  className,
  slideClassName,
}) => {
  // Honour reduced-motion: kill autoplay and the slide transition feel.
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const plugins = autoplay && !prefersReducedMotion
    ? [Autoplay({ delay: autoplayInterval, stopOnInteraction: false, stopOnMouseEnter: true })]
    : []

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop,
      align,
      dragFree: false,
      containScroll: loop ? false : 'trimSnaps',
    },
    plugins,
  )

  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  // Each slide's flex-basis = 100% / slidesPerView. With slidesPerView=1.5,
  // that's ~66.67% — leaves 33.33% to peek the next slide.
  const slideBasis = `${100 / slidesPerView}%`

  return (
    <div className={cn('relative w-full', className)}>
      {/* Viewport — overflow:hidden contains the slide track. */}
      <div ref={emblaRef} className="overflow-hidden">
        {/* Track — no flex gap. The gap is instead implemented as
            asymmetric padding INSIDE each slide so the visible image
            shrinks by the padding amount, leaving a visible breath
            between consecutive images:
              - align='start' → pr-6: padding on the right side of
                each image, so each image's LEFT edge stays flush with
                the column edge (50%vw for the active slide).
              - align='end'   → pl-6: padding on the left, keeping each
                image's RIGHT edge flush at the column edge.
            Using flex `gap` instead breaks for Embla's loop clones
            (the cloned slide on the opposite side has no DOM-adjacent
            sibling, so the flex gap doesn't apply to that boundary).
            The padding approach works uniformly across original slides
            and clones. */}
        <div className="flex">
          {slides.map((slide, idx) => {
            const resource = typeof slide.image === 'object' ? slide.image : null
            return (
              <div
                key={idx}
                className={cn(
                  'shrink-0 grow-0',
                  align === 'end' ? 'pl-6' : 'pr-6',
                )}
                style={{ flexBasis: slideBasis }}
              >
                <div
                  className={cn(
                    'relative w-full overflow-hidden bg-cream',
                    slideClassName || 'aspect-[4/5]',
                  )}
                >
                  {resource && (
                    <Media
                      fill
                      loading="eager"
                      imgClassName="absolute inset-0 w-full h-full object-cover"
                      resource={resource}
                      alt={slide.alt || (typeof resource === 'object' ? resource?.alt || '' : '')}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showArrows && (
        // Arrows sit just below the carousel, right-aligned. Off by
        // default — the PYV carousels rely on autoplay + drag and
        // have no UI chrome under the slides per PDF spec.
        <div className="mt-6 flex justify-end gap-3">
          <Arrow direction="prev" onClick={scrollPrev} disabled={!loop && !canPrev} />
          <Arrow direction="next" onClick={scrollNext} disabled={!loop && !canNext} />
        </div>
      )}
    </div>
  )
}

export default EditorialCarousel
