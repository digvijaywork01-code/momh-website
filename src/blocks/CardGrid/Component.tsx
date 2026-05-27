'use client'

/**
 * CardGridBlock — generic reusable row of cards.
 *
 * Desktop (lg+): 2 / 3 / 4 column CSS grid based on the `columns`
 * field. Each card animates in via useFadeUp.
 *
 * Mobile (< lg): renders the same cards inside an Embla carousel —
 * one card per slide, swipeable, with pagination dots below. This
 * keeps the home-page "one section per screen" rule (a 3-card
 * stacked column would overflow the viewport by a long way) while
 * preserving all the editorial content. The desktop grid markup
 * remains in place for ≥lg viewports.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'

import type { CardGridBlock as CardGridBlockProps, Page, Post } from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { EditorialCta } from '@/components/EditorialCta'
import { useFadeUp } from '@/components/motion/hooks/useFadeUp'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { cn } from '@/utilities/ui'

type BgKey = NonNullable<CardGridBlockProps['backgroundColor']>
type Card = CardGridBlockProps['cards'][number]
type CardLink = NonNullable<Card['ctaLink']>

const bgClass: Record<BgKey, string> = {
  ivory: 'bg-ivory text-ink',
  cream: 'bg-cream text-ink',
  black: 'bg-black text-press-cream', // Press News uses press-cream (#EAD3B8) per PDF
  emerald: 'bg-emerald text-offwhite',
  maroon: 'bg-maroon text-offwhite',
}

const isDarkBg = (bg: BgKey): boolean =>
  bg === 'black' || bg === 'emerald' || bg === 'maroon'

const columnsClass: Record<'2' | '3' | '4', string> = {
  '2': 'lg:grid-cols-2',
  '3': 'lg:grid-cols-3',
  '4': 'lg:grid-cols-4',
}

const resolveLinkHref = (link: CardLink | null | undefined): string | null => {
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

/**
 * Single-card markup. Extracted so the mobile carousel and the
 * desktop grid render the exact same content from one source.
 */
const CardArticle: React.FC<{ card: Card }> = ({ card }) => {
  const href = resolveLinkHref(card.ctaLink as CardLink | null | undefined)
  return (
    <article className="flex flex-col h-full">
      {card.image && typeof card.image === 'object' && (
        <div className="relative aspect-[4/3] mb-6 overflow-hidden">
          <Media
            fill
            loading="eager"
            imgClassName="object-contain"
            resource={card.image}
          />
        </div>
      )}
      {/* Card title (e.g. "Mint Lounge") — Gill Sans Regular (400).
          On mobile the title matches the body summary's size and is
          distinguished only by weight (400 vs 300). On desktop the
          title sits one step above (22px vs 20px) so the editorial
          hierarchy reads without the title feeling heavy. */}
      <h3 className="font-body font-normal text-[1.125rem] md:text-[1.25rem] lg:text-[1.375rem] leading-tight mb-3">
        {card.title}
      </h3>
      {/* Card summary — Gill Sans Light (300), one step smaller than
          the title so the hierarchy is preserved. Mobile 18px →
          desktop 20px. */}
      <p className="font-body font-light text-[1.125rem] md:text-[1.125rem] lg:text-[1.25rem] leading-relaxed mb-4 opacity-90">
        {card.summary}
      </p>
      {card.ctaLabel && href && (
        <EditorialCta
          label={card.ctaLabel}
          href={href}
          arrowPosition={card.ctaArrowPosition || 'right'}
          newTab={Boolean(card.ctaLink?.newTab)}
          className="mt-auto"
        />
      )}
    </article>
  )
}

/**
 * Mobile-only Embla carousel wrapper. Renders ONE card per slide
 * (no peek — full-width slide), with pagination dots beneath.
 * Lives behind `lg:hidden` so the desktop grid takes over above
 * the breakpoint.
 */
const MobileCardCarousel: React.FC<{ cards: readonly Card[]; dark: boolean }> = ({
  cards,
  dark,
}) => {
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
      {/* Viewport — overflow-hidden contains the slide track. */}
      <div ref={emblaRef} className="overflow-hidden">
        {/* Track — flex row of slides. */}
        <div className="flex">
          {cards.map((card, i) => (
            <div
              key={i}
              // Full-width slide, no peek. `shrink-0 grow-0 basis-full`
              // is the standard Embla single-slide-per-view recipe.
              className="shrink-0 grow-0 basis-full"
            >
              <CardArticle card={card} />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination dots */}
      {cards.length > 1 && (
        <div
          role="tablist"
          aria-label="Card carousel pagination"
          className="flex items-center justify-center gap-2 mt-6"
        >
          {cards.map((_, i) => {
            const isActive = i === selected
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to card ${i + 1}`}
                onClick={() => scrollTo(i)}
                className={cn(
                  'transition-all duration-200 rounded-full',
                  isActive ? 'w-6 h-2' : 'w-2 h-2',
                  // Contrast against the section background.
                  dark
                    ? isActive
                      ? 'bg-offwhite'
                      : 'bg-offwhite/40'
                    : isActive
                      ? 'bg-ink'
                      : 'bg-ink/30',
                )}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export const CardGridBlock: React.FC<CardGridBlockProps> = ({
  eyebrow,
  headline,
  columns,
  backgroundColor,
  cards,
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const headlineRef = useRef<HTMLDivElement | null>(null)

  const bg = (backgroundColor || 'ivory') as BgKey
  const dark = isDarkBg(bg)
  const colKey = (columns || '3') as '2' | '3' | '4'

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

  useFadeUp(headlineRef)

  return (
    <section
      ref={sectionRef}
      className={cn(
        // Tight vertical padding so the headline + 3-card row fits in
        // laptop-class viewports (~800-900px). On taller screens flex
        // justify-center keeps the layout vertically centered.
        'w-full min-h-svh flex flex-col justify-center py-10 lg:py-14 px-6 md:px-12 lg:px-20',
        bgClass[bg],
      )}
      data-theme={dark ? 'dark' : 'light'}
      data-snap-section
      aria-label="Card grid"
    >
      <div ref={headlineRef} className="max-w-3xl mb-8 lg:mb-10">
        {eyebrow && (
          <p className="font-script italic text-eyebrow opacity-90 mb-2">
            {eyebrow}
          </p>
        )}
        <div className="editorial-display text-display">
          <RichText data={headline} enableGutter={false} enableProse={false} />
        </div>
      </div>

      {/* Mobile (< lg): Embla carousel, one card per slide + dots. */}
      <MobileCardCarousel cards={cards ?? []} dark={dark} />

      {/* Desktop (lg+): 2 / 3 / 4 column CSS grid as before. */}
      <div
        className={cn(
          'hidden lg:grid gap-10 md:gap-12 lg:gap-14',
          columnsClass[colKey],
        )}
      >
        {cards?.map((card, i) => (
          <CardArticle key={i} card={card} />
        ))}
      </div>
    </section>
  )
}

export default CardGridBlock
