'use client'

/**
 * TwoColumnFeatureBlock — two independently-configurable, independently-
 * optional columns side-by-side.
 *
 * Each column can be a "promo" (image + text + CTA), a "form" (embedded
 * Payload form), or a "newsletter" (inline email input + subscribe
 * button matching PDF page 12 right column). When only one column is
 * enabled, it spans the full width.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import useEmblaCarousel from 'embla-carousel-react'

import type {
  TwoColumnFeatureBlock as TwoColumnFeatureBlockProps,
  Page,
  Post,
} from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { EditorialCta } from '@/components/EditorialCta'
import { NewsletterWidget } from '@/components/NewsletterWidget'
import { FormBlock } from '@/blocks/Form/Component'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { cn } from '@/utilities/ui'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

type BgKey = NonNullable<TwoColumnFeatureBlockProps['backgroundColor']>
type Column = NonNullable<TwoColumnFeatureBlockProps['columnA']>
type CtaLink = NonNullable<Column['ctaLink']>

const bgClass: Record<BgKey, string> = {
  cream: 'bg-cream text-warm-gray', // Blogs+Newsletter uses warm-gray (#4F4C49) per PDF
  ivory: 'bg-ivory text-warm-gray',
  black: 'bg-black text-offwhite',
  emerald: 'bg-emerald text-offwhite',
  maroon: 'bg-maroon text-offwhite',
}

const isDarkBg = (bg: BgKey): boolean =>
  bg === 'black' || bg === 'emerald' || bg === 'maroon'

const resolveLinkHref = (link: CtaLink | null | undefined): string | null => {
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

const Column: React.FC<{ column: Column; dark: boolean }> = ({ column, dark }) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null)
  const headlineRef = useRef<HTMLDivElement | null>(null)
  const imageWrapRef = useRef<HTMLDivElement | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const ctaRef = useRef<HTMLDivElement | null>(null)

  // Staggered entrance — eyebrow → headline → image (zoom) → body → CTA.
  useEffect(() => {
    if (prefersReducedMotion()) return
    const root = ref.current
    if (!root) return

    const contentEls = [
      eyebrowRef.current,
      headlineRef.current,
      bodyRef.current,
      ctaRef.current,
    ].filter((el): el is NonNullable<typeof el> => Boolean(el))
    gsap.set(contentEls, { y: 35, opacity: 0 })
    // Scale the inner <img>, not the wrapper — wrapper scale paints
    // outside its layout box and bleeds into adjacent sections.
    const innerImg = imageWrapRef.current?.querySelector('img') as HTMLImageElement | null
    if (innerImg) {
      gsap.set(innerImg, { scale: 1.06 })
    }
    if (imageWrapRef.current) {
      gsap.set(imageWrapRef.current, { opacity: 0.88 })
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: 'top 75%',
        // Replay the column cascade on every entry (down or up).
        // `reset` on leave fires while the section is off-screen so
        // the jump-to-hidden state is invisible.
        toggleActions: 'play reset play reset',
      },
    })

    if (innerImg) {
      tl.to(
        innerImg,
        { scale: 1, duration: 1.4, ease: 'power2.out' },
        0,
      )
    }
    if (imageWrapRef.current) {
      tl.to(
        imageWrapRef.current,
        { opacity: 1, duration: 1.4, ease: 'power2.out' },
        0,
      )
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

  return (
    <div ref={ref} className="flex flex-col">
      {column.eyebrow && (
        <p ref={eyebrowRef} className="font-script italic text-eyebrow opacity-90 mb-2">
          {column.eyebrow}
        </p>
      )}

      {column.headline && (
        <div ref={headlineRef} className="editorial-display text-display mb-4">
          <RichText data={column.headline} enableGutter={false} enableProse={false} />
        </div>
      )}

      {column.image && typeof column.image === 'object' && (() => {
        // Mobile (< lg): NATURAL aspect (no 5/2 crop) at full column
        // width — matches the body copy width below so the image and
        // description align flush as one editorial block. Visitors
        // were previously seeing a flat banner crop that erased the
        // composition's context.
        // Desktop (lg+): original aspect-[5/2] flat banner spanning
        // the full column — that crop reads correctly in the wide
        // editorial side-by-side grid.
        // The `--mobile-aspect` custom property carries the image's
        // own width/height so Tailwind's `aspect-[var(...)]` resolves
        // to the natural ratio on mobile. `lg:aspect-[5/2]` overrides
        // at desktop via the higher media-query specificity.
        const img = column.image as { width?: number; height?: number }
        const mobileAspect = img.width && img.height ? `${img.width}/${img.height}` : '1/1'
        return (
          <div
            ref={imageWrapRef}
            className="relative mb-4 w-full overflow-hidden aspect-[var(--mobile-aspect)] lg:aspect-[5/2]"
            style={{ ['--mobile-aspect' as string]: mobileAspect } as React.CSSProperties}
          >
            <Media fill loading="eager" imgClassName="object-cover" resource={column.image} />
          </div>
        )
      })()}

      {column.body && (
        // Body sized to match the CardGrid description (18 / 18 / 20px
        // Gill Sans Light, leading-relaxed, opacity 0.9) so the
        // editorial body type reads consistently across the two
        // adjacent home-page sections (MoMH In *News* → Our *Blogs* /
        // Our *Newsletter*). Headline above stays at the bigger
        // `editorial-display text-display` size on purpose.
        <div
          ref={bodyRef}
          className="font-body font-light text-[1.125rem] md:text-[1.125rem] lg:text-[1.25rem] leading-relaxed mb-4 opacity-90"
        >
          <RichText data={column.body} enableGutter={false} enableProse={false} />
        </div>
      )}

      {column.type === 'promo' && column.ctaLabel && (() => {
        const href = resolveLinkHref(column.ctaLink as CtaLink | null | undefined)
        return href ? (
          <div ref={ctaRef}>
            <EditorialCta
              label={column.ctaLabel}
              href={href}
              arrowPosition={'right'}
              newTab={Boolean(column.ctaLink?.newTab)}
              className="mt-auto"
            />
          </div>
        ) : null
      })()}

      {column.type === 'form' && column.embedForm && typeof column.embedForm === 'object' && (
        <div className="mt-2">
          {/* Reuse the existing Form block component for consistent submission flow. */}
          {/* @ts-expect-error — Form's relationship value is FormType when populated. */}
          <FormBlock enableIntro={false} form={column.embedForm} />
        </div>
      )}

      {column.type === 'newsletter' && (
        <NewsletterWidget
          inputLabel={column.newsletterInputLabel || 'Email Address:'}
          buttonLabel={column.newsletterButtonLabel || 'SUBSCRIBE'}
          endpoint={column.newsletterEndpoint || ''}
          dark={dark}
        />
      )}
    </div>
  )
}

// `NewsletterWidget` is now extracted to `src/components/NewsletterWidget.tsx`
// so it can be reused by the new `NewsletterFeature` block. The original
// definition lived inline here for the home-page p12 newsletter column.

/**
 * Mobile-only Embla carousel that swaps between the two columns
 * (Our Blogs ↔ Our Newsletter on the home page). Without this, the
 * two columns stack vertically and the block overflows the
 * "one block per screen" rule on the home page. Hidden on lg+ via
 * `lg:hidden` so the desktop side-by-side grid takes over.
 */
const MobileColumnCarousel: React.FC<{
  columns: Array<Column>
  dark: boolean
}> = ({ columns, dark }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    dragFree: false,
    containScroll: 'trimSnaps',
  })
  const [selected, setSelected] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelected(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  const scrollTo = useCallback(
    (idx: number) => emblaApi?.scrollTo(idx),
    [emblaApi],
  )

  return (
    <div className="lg:hidden">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {columns.map((col, i) => (
            <div key={i} className="shrink-0 grow-0 basis-full">
              <Column column={col} dark={dark} />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination dots — only render when there's more than one
          column. Matches the look of the CardGrid mobile dots. */}
      {columns.length > 1 && (
        <div
          role="tablist"
          aria-label="Column carousel pagination"
          className="flex items-center justify-center gap-2 mt-6"
        >
          {columns.map((_, i) => {
            const isActive = i === selected
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to column ${i + 1}`}
                onClick={() => scrollTo(i)}
                className={cn(
                  'transition-all duration-200 rounded-full',
                  isActive ? 'w-6 h-2' : 'w-2 h-2',
                  dark
                    ? isActive
                      ? 'bg-offwhite'
                      : 'bg-offwhite/40'
                    : isActive
                      ? 'bg-warm-gray'
                      : 'bg-warm-gray/30',
                )}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export const TwoColumnFeatureBlock: React.FC<TwoColumnFeatureBlockProps> = ({
  backgroundColor,
  columnA,
  columnB,
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const sectionRef = useRef<HTMLDivElement | null>(null)

  const bg = (backgroundColor || 'cream') as BgKey
  const dark = isDarkBg(bg)

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

  const aOn = Boolean(columnA?.enabled)
  const bOn = Boolean(columnB?.enabled)
  const bothOn = aOn && bOn

  if (!aOn && !bOn) return null

  return (
    <section
      ref={sectionRef}
      className={cn(
        // Tight vertical padding so the content (image + body + CTA/
        // newsletter widget per column) fits in laptop-class viewports
        // (~800-900px content area after browser chrome). On taller
        // viewports the flex `justify-center` keeps everything visually
        // balanced with whitespace above and below.
        'w-full min-h-dvh flex flex-col justify-center py-10 lg:py-14 px-6 md:px-12 lg:px-20',
        bgClass[bg],
      )}
      data-theme={dark ? 'dark' : 'light'}
      data-snap-section
      aria-label="Two column feature"
    >
      {/* Mobile (< lg): carousel — one column per slide + dots.
          Skips the carousel entirely if only one column is enabled
          (renders that single column flat instead). */}
      {bothOn ? (
        <MobileColumnCarousel
          columns={[columnA as Column, columnB as Column]}
          dark={dark}
        />
      ) : (
        <div className="lg:hidden max-w-2xl mx-auto">
          {aOn && columnA && <Column column={columnA} dark={dark} />}
          {bOn && columnB && <Column column={columnB} dark={dark} />}
        </div>
      )}

      {/* Desktop (lg+): side-by-side editorial grid as before. */}
      <div
        className={cn(
          // Narrower than the section's outer padding so the cards
          // read as a centered editorial pair (~536px each at lg+).
          // PDF p12 has cards at ~550px on a 1920 page; max-w-6xl
          // (1152px) gets us there cleanly.
          'hidden lg:grid grid-cols-1 gap-12 lg:gap-20 max-w-6xl mx-auto',
          bothOn ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-2xl',
        )}
      >
        {aOn && columnA && <Column column={columnA} dark={dark} />}
        {bOn && columnB && <Column column={columnB} dark={dark} />}
      </div>
    </section>
  )
}

export default TwoColumnFeatureBlock
