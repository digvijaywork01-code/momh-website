'use client'

/**
 * CarouselBlock — text panel + horizontal Embla carousel of images.
 *
 * Two-column 40/60 layout (text / carousel), order swaps via `imagePosition`.
 * Optional `notePanel` renders below the main two-column row as a small
 * centered text panel (used for the ACCESSIBILITY note on the Museum
 * Guidelines instance).
 *
 * Entrance cascade animates the text side; the carousel fades in alongside.
 */

import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

import type { CarouselBlock as CarouselBlockProps, Media, Page, Post } from '@/payload-types'

import RichText from '@/components/RichText'
import { EditorialCta } from '@/components/EditorialCta'
import { EditorialCarousel } from '@/components/EditorialCarousel'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useNoScrollAnimations } from '@/utilities/useNoScrollAnimations'
import { cn } from '@/utilities/ui'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

type BgKey = NonNullable<CarouselBlockProps['backgroundColor']>

const bgClass: Record<BgKey, string> = {
  ivory: 'bg-ivory text-ink',
  cream: 'bg-cream text-ink',
  black: 'bg-black text-offwhite',
  emerald: 'bg-emerald text-offwhite',
  maroon: 'bg-maroon text-offwhite',
}

const isDarkBg = (bg: BgKey): boolean =>
  bg === 'black' || bg === 'emerald' || bg === 'maroon'

const resolveLinkHref = (link: CarouselBlockProps['ctaLink'] | null | undefined): string | null => {
  if (!link) return null
  if (link.type === 'custom') return link.url || null
  if (link.type === 'reference' && link.reference) {
    const { relationTo, value } = link.reference
    if (typeof value === 'object' && value && 'slug' in value) {
      const slug = (value as Page | Post).slug
      if (!slug) return null
      return relationTo === 'pages' ? `/${slug}` : `/${relationTo}/${slug}`
    }
  }
  return null
}

export const CarouselBlock: React.FC<CarouselBlockProps> = ({
  imagePosition = 'right',
  backgroundColor = 'ivory',
  eyebrow,
  headline,
  body,
  ctaLabel,
  ctaLink,
  images,
  slidesPerView,
  autoplay,
  autoplayInterval,
  notePanel,
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const noScrollAnim = useNoScrollAnimations()
  const sectionRef = useRef<HTMLElement | null>(null)
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null)
  const headlineRef = useRef<HTMLDivElement | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const ctaRef = useRef<HTMLDivElement | null>(null)
  const carouselWrapRef = useRef<HTMLDivElement | null>(null)
  const noteRef = useRef<HTMLDivElement | null>(null)

  const bg = (backgroundColor || 'ivory') as BgKey
  const dark = isDarkBg(bg)
  const imageFirst = imagePosition === 'left'

  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setHeaderTheme(dark ? 'dark' : 'light')
        })
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [dark, setHeaderTheme])

  useEffect(() => {
    if (prefersReducedMotion() || noScrollAnim) return
    const section = sectionRef.current
    if (!section) return

    const contentEls = (
      [
        eyebrowRef.current,
        headlineRef.current,
        bodyRef.current,
        ctaRef.current,
        noteRef.current,
      ] as (HTMLElement | null)[]
    ).filter((el): el is HTMLElement => el !== null)
    gsap.set(contentEls, { y: 35, opacity: 0 })
    if (carouselWrapRef.current) {
      gsap.set(carouselWrapRef.current, { opacity: 0.9 })
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
        toggleActions: 'play reset play reset',
      },
    })
    if (carouselWrapRef.current) {
      tl.to(carouselWrapRef.current, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 0)
    }
    tl.to(
      contentEls,
      { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out', stagger: 0.1 },
      0.2,
    )

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [])

  const ctaHref = resolveLinkHref(ctaLink)
  const slides = Array.isArray(images) ? images : []
  const noteEnabled = Boolean(notePanel?.enabled)

  return (
    <section
      ref={sectionRef}
      className={cn(
        // No vertical padding, no min-h-screen. Section sizes itself
        // exactly to the carousel image height so consecutive Carousel
        // blocks stack flush against each other (matches the PDF where
        // "Craft Your Jewellery" and "Museum Guidelines" touch with no
        // black/cream strip between them).
        'w-full flex flex-col',
        bgClass[bg],
      )}
      data-theme={dark ? 'dark' : 'light'}
      {...(noScrollAnim ? {} : { 'data-snap-section': true })}
      aria-label={undefined}
    >
      {/*
        Layout follows PDF p2 exactly: text column gets ~40% width with
        comfortable side padding; carousel column gets ~60% and BLEEDS to
        the outer page edge (no horizontal padding on the bleed side) so
        the image reads as the dominant visual. On mobile both stack.

        `flex` instead of grid here — we need asymmetric padding (only on
        the text side) which is cleaner with flex than negotiating
        col-gap on a grid.
      */}
      <div
        className={cn(
          'flex flex-col w-full',
          imageFirst ? 'lg:flex-row-reverse' : 'lg:flex-row',
        )}
      >
        {/* Text column — exactly 50%vw on lg+ so the image column's
            edge lands precisely on 50%vw (the active slide's flush
            edge per PDF spec). Text aligns AWAY from the image:
            image-left → text right-aligns; image-right → text
            left-aligns, so the body copy "leans into" the visual. */}
        <div
          className={cn(
            'flex flex-col justify-center lg:w-1/2 px-6 md:px-12 py-10 lg:py-0',
            imageFirst
              ? 'lg:pl-12 lg:pr-20 lg:items-end lg:text-right'
              : 'lg:pl-20 lg:pr-12 lg:items-start lg:text-left',
          )}
        >
          {eyebrow && (
            <p
              ref={eyebrowRef}
              className="font-script italic text-eyebrow opacity-90 mb-3"
            >
              {eyebrow}
            </p>
          )}

          <div
            ref={headlineRef}
            className="editorial-display text-[2.25rem] md:text-[3rem] lg:text-[3.75rem] leading-tight mb-6"
          >
            <RichText data={headline} enableGutter={false} enableProse={false} />
          </div>

          <div ref={bodyRef} className="font-body text-body opacity-95 mb-6 max-w-xl">
            <RichText data={body} enableGutter={false} enableProse={false} />
          </div>

          {ctaLabel && ctaHref && (
            <div ref={ctaRef}>
              <EditorialCta
                label={ctaLabel}
                href={ctaHref}
                arrowPosition="right"
                newTab={Boolean(ctaLink?.newTab)}
                className={dark ? 'text-offwhite' : 'text-ink'}
              />
            </div>
          )}

          {/* PDF p2 places the ACCESSIBILITY note INSIDE the right
              column under Explore More — same right-alignment as the
              Museum Guidelines body. Render notePanel here (within the
              text column) instead of as a separate centered row.

              Eyebrow is set in Gill Sans (font-body), NOT in Cormorant
              italic. PDF spec shows sans-serif, regular weight, wide
              letter-spacing — distinct from the italic eyebrows used
              on the home-page editorial sections. */}
          {noteEnabled && (notePanel?.eyebrow || notePanel?.body) && (
            <div
              ref={noteRef}
              className="mt-10 lg:mt-12 max-w-xl"
            >
              {notePanel?.eyebrow && (
                <p className="font-body font-normal text-eyebrow opacity-90 mb-3 tracking-[0.25em] uppercase">
                  {notePanel.eyebrow}
                </p>
              )}
              {notePanel?.body && (
                <div className="font-body text-body opacity-90 leading-relaxed">
                  <RichText data={notePanel.body} enableGutter={false} enableProse={false} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Carousel column — exactly 50%vw on lg+, hugging the page
            edge on its outer side. Active slide aligns to the EDGE
            that meets the 50%vw seam between the two columns:
              - image-right → active slide flush LEFT (peek on right)
              - image-left  → active slide flush RIGHT (peek on left) */}
        <div
          ref={carouselWrapRef}
          className="lg:w-1/2"
        >
          {slides.length > 0 && (
            <EditorialCarousel
              slides={slides as { image: number | Media; alt?: string | null }[]}
              slidesPerView={slidesPerView || 1.1}
              align={imageFirst ? 'end' : 'start'}
              autoplay={autoplay !== false}
              autoplayInterval={autoplayInterval || 4000}
              slideClassName="aspect-[3/4] lg:aspect-[4/5]"
            />
          )}
        </div>
      </div>
    </section>
  )
}

export default CarouselBlock
