'use client'

/**
 * ProcessCarouselBlock — centered single-card walkthrough carousel.
 *
 * Used by Craft Your Jewellery for the INSPIRATION → DESIGN →
 * DEVELOPMENT sequence. Single slide visible at a time, full image up
 * top, red step label + body below, pagination dots at the bottom.
 *
 * One static section bg (no per-slide colour change) — the calmer
 * editorial choice per design direction.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import Fade from 'embla-carousel-fade'

import type { ProcessCarouselBlock as ProcessCarouselBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useNoScrollAnimations } from '@/utilities/useNoScrollAnimations'
import { cn } from '@/utilities/ui'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// `backgroundColor` is kept on the schema for forward-compatibility,
// but the component no longer paints the section bg — per design
// direction the carousel images bleed full viewport width on a
// background-less section. Text colour follows the inherited page
// theme (light = dark ink, dark = light offwhite).
export const ProcessCarouselBlock: React.FC<ProcessCarouselBlockProps> = ({
  slides,
  autoplay,
  autoplayInterval,
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const noScrollAnim = useNoScrollAnimations()
  const sectionRef = useRef<HTMLElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  // Section has no explicit bg — assume the surrounding ivory/cream
  // pages so the header theme stays "light" (dark text on light bg).
  const dark = false

  // Autoplay is independent of `noScrollAnim` — that flag governs
  // SCROLL-driven motion (entrance cascades, smooth scroll, snap), not
  // self-driven UI like a carousel. Autoplay only respects
  // `prefers-reduced-motion` (a11y). Same for the Fade transition
  // (always on unless reduced-motion is set — falling back to default
  // slide motion isn't appropriate here either, so we keep slides
  // visible-but-stacked and the fade just doesn't animate).
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const wantsAutoplay = autoplay !== false && !reduced

  // `Fade` is Embla's official cross-fade transition (plugin added in
  // v8.5). Replaces the default left/right slide with a stacked fade
  // — slides occupy the same position and dissolve into each other,
  // giving a more cinematic editorial feel. Combined with the
  // GSAP-driven per-slide entrance below (label slides up, body
  // delays in, image gets a slow Ken-Burns scale), the carousel reads
  // as a series of distinct chapters rather than a horizontal scroller.
  const plugins = [
    Fade(),
    ...(wantsAutoplay
      ? [Autoplay({ delay: autoplayInterval || 5000, stopOnInteraction: false, stopOnMouseEnter: true })]
      : []),
  ]

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      dragFree: false,
      // Fade plugin works best with `duration` set explicitly — this
      // controls how long the cross-fade takes.
      duration: 30,
    },
    plugins,
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const slideList = Array.isArray(slides) ? slides : []

  // Refs to every slide's text elements so we can drive GSAP entrance
  // animations per-slide on each carousel change. Each array index
  // corresponds to the slide index.
  const labelRefs = useRef<(HTMLParagraphElement | null)[]>([])
  const bodyRefs = useRef<(HTMLDivElement | null)[]>([])

  // Track which slide is active. The select handler ALSO drives the
  // per-slide entrance animation: label slides up + fades in, body
  // follows ~0.15s later. The image stays still — only the text gets
  // the per-slide entrance treatment (per user direction; the earlier
  // Ken-Burns image scale read as restless).
  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap()
      setSelectedIndex(idx)

      if (reduced) return

      // Reset every slide's text first so the previously-active slide
      // doesn't keep its end-state when it returns via loop.
      labelRefs.current.forEach((el) => {
        if (el) gsap.set(el, { y: 24, opacity: 0 })
      })
      bodyRefs.current.forEach((el) => {
        if (el) gsap.set(el, { y: 16, opacity: 0 })
      })

      // Animate the active slide's text in.
      const label = labelRefs.current[idx]
      const body = bodyRefs.current[idx]
      const tl = gsap.timeline()
      if (label) tl.to(label, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, 0)
      if (body) tl.to(body, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 0.15)
    }
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, reduced])

  const scrollTo = useCallback(
    (idx: number) => emblaApi?.scrollTo(idx),
    [emblaApi],
  )
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  // Header theme on viewport entry — matches the section bg's contrast.
  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHeaderTheme(dark ? 'dark' : 'light')
          }
        })
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [dark, setHeaderTheme])

  // Entrance cascade — card fades up on viewport entry. Skipped on
  // no-scroll-anim pages and under prefers-reduced-motion.
  useEffect(() => {
    if (prefersReducedMotion() || noScrollAnim) return
    const card = cardRef.current
    if (!card) return
    gsap.set(card, { y: 30, opacity: 0 })
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: 'top 75%',
        toggleActions: 'play reset play reset',
      },
    })
    tl.to(card, { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out' })
    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [noScrollAnim])

  return (
    <section
      ref={sectionRef}
      // No background colour, no horizontal padding — the image inside
      // each slide bleeds the entire viewport width. Vertical padding
      // keeps the step label + body from bumping into adjacent blocks.
      className="w-full py-16 lg:py-20"
      data-theme={dark ? 'dark' : 'light'}
      {...(noScrollAnim ? {} : { 'data-snap-section': true })}
      aria-label="Process"
    >
      <div ref={cardRef} className="w-full">
        {/* Viewport — clips the slide track. Full width, no max-w. */}
        <div ref={emblaRef} className="overflow-hidden">
          {/* Track — flex row, each slide takes 100% of the viewport. */}
          <div className="flex">
            {slideList.map((slide, idx) => {
              const resource =
                typeof slide.image === 'object' ? slide.image : null
              return (
                <div
                  key={idx}
                  className="shrink-0 grow-0 w-full"
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Image — full viewport width, ~16:5 aspect
                        (3.2:1 — flat editorial banner). Matches the
                        natural crop of the supplied source files
                        (7990 × 2537 ≈ 3.15:1). Was 16:10 (1.6:1)
                        which left no vertical room for the step
                        label + body text to fit alongside the image
                        in one viewport view; the flatter crop frees
                        ~450px of column height on a 1440 viewport. */}
                    {resource && (
                      <div className="relative w-full aspect-[16/5] overflow-hidden">
                        <Media
                          fill
                          loading="eager"
                          imgClassName="absolute inset-0 w-full h-full object-cover"
                          resource={resource}
                          alt={
                            (typeof resource === 'object' ? resource?.alt : '') ||
                            slide.stepLabel
                          }
                        />
                        {/* Prev / Next nav — overlay on the image at
                            mid-height, left + right edges. Only rendered
                            when there's more than one slide. The buttons
                            are siblings of the slide, NOT inside it, in
                            terms of behaviour — clicking still drives
                            Embla via `scrollPrev` / `scrollNext`. */}
                        {slideList.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={scrollPrev}
                              aria-label="Previous step"
                              className={cn(
                                'absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10',
                                'h-11 w-11 md:h-12 md:w-12 flex items-center justify-center rounded-full',
                                'bg-black/40 hover:bg-black/60 text-offwhite transition-colors duration-200',
                                'backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offwhite',
                              )}
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <polyline points="15 18 9 12 15 6" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={scrollNext}
                              aria-label="Next step"
                              className={cn(
                                'absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10',
                                'h-11 w-11 md:h-12 md:w-12 flex items-center justify-center rounded-full',
                                'bg-black/40 hover:bg-black/60 text-offwhite transition-colors duration-200',
                                'backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offwhite',
                              )}
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Text content — constrained to a readable column
                        below the full-bleed image. Bumped outer width
                        from max-w-3xl → max-w-5xl so the description
                        (max-w-3xl inside) can actually use its full
                        intended line length. Horizontal padding lives
                        here so the text never touches the viewport
                        edges even though the image does. */}
                    <div className="w-full max-w-5xl mx-auto px-6 md:px-12">
                      {/* Step label — Gill Sans (sans-serif), regular
                          weight, red, all caps, with wide letter-
                          spacing. PDF uses Gill Sans for the step
                          labels (NOT Cormorant — that's reserved for
                          the editorial display headlines). Same font
                          treatment as the ACCESSIBILITY label on
                          Plan Your Visit. */}
                      <p
                        ref={(el) => {
                          labelRefs.current[idx] = el
                        }}
                        className={cn(
                          // Tighter top margin on lg+ so the whole
                          // slide (image + label + body + dots) fits
                          // in one viewport view.
                          'mt-6 lg:mt-8 font-body font-normal text-[1.5rem] md:text-[1.75rem] lg:text-[2rem]',
                          'tracking-[0.2em] uppercase text-brand-red',
                        )}
                      >
                        {slide.stepLabel}
                      </p>

                      {/* Body — wider container (max-w-3xl / 768px)
                          plus a small bump above the inherited
                          `text-body` token. 20 / 21 / 22px sits 1px
                          above the body default on desktop — just
                          enough presence without making the whole
                          carousel overflow the viewport once the
                          banner image + step label + dots are added. */}
                      <div
                        ref={(el) => {
                          bodyRefs.current[idx] = el
                        }}
                        className={cn(
                          'mt-3 max-w-3xl mx-auto font-body opacity-95 leading-relaxed',
                          'text-[1.25rem] md:text-[1.3125rem] lg:text-[1.375rem]',
                          dark ? 'text-offwhite/95' : 'text-ink/95',
                        )}
                      >
                        <RichText
                          data={slide.body}
                          enableGutter={false}
                          enableProse={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pagination dots — clickable, with the active dot enlarged. */}
        {slideList.length > 1 && (
          <div className="mt-8 flex justify-center gap-3">
            {slideList.map((_, idx) => {
              const active = idx === selectedIndex
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollTo(idx)}
                  aria-label={`Go to step ${idx + 1}`}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    active
                      ? 'w-6 bg-brand-red'
                      : 'w-2 bg-warm-gray/40 hover:bg-warm-gray/70',
                  )}
                />
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default ProcessCarouselBlock
