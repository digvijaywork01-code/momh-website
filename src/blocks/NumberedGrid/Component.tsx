'use client'

/**
 * NumberedGridBlock — see config.ts for why this block exists.
 *
 * Two presentations over one item shape (image + optional number + caption):
 *   - grid:     every item visible, 2 or 3 columns
 *   - carousel: `columns` cards per slide, paging a whole slide at a time
 *
 * Optionally the whole thing sits in one half of the section with a heading +
 * body column in the other, which is how the PDF's "FROM FLUX TO FIRE"
 * section reads.
 *
 * Captions are rendered only when supplied. The six making-of step images
 * carry their number and caption burned into the artwork, so those items
 * leave both fields blank and nothing is drawn over them.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'

import type { NumberedGridBlock as NumberedGridBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { cn } from '@/utilities/ui'

type ColumnsKey = NonNullable<NumberedGridBlockProps['columns']>
type SpacingKey = NonNullable<NumberedGridBlockProps['topSpacing']>
type TextPosKey = NonNullable<NumberedGridBlockProps['textPosition']>

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Grid track counts. Mobile always stacks to a single column so a 26%-wide
 *  square doesn't become a thumbnail on a 390px screen. */
const gridColsClass: Record<ColumnsKey, string> = {
  '1': 'grid-cols-1',
  '2': 'grid-cols-1 sbs:grid-cols-2',
  '3': 'grid-cols-1 md:grid-cols-2 sbs:grid-cols-3',
  '4': 'grid-cols-1 md:grid-cols-2 sbs:grid-cols-4',
}

/** Tile shapes. 'landscape' (3:2) is the FLUX/COLOUR/FIRE single-image
 *  carousel — one wide frame per slide balances the text column beside it. */
const aspectClass: Record<string, string> = {
  square: 'aspect-square',
  portrait: 'aspect-[3/5]',
  landscape: 'aspect-[3/2]',
}

/** Carousel slide widths — the same 1 / 2 / N progression expressed as flex
 *  bases, since Embla sizes slides itself rather than via a grid. */
const slideBasisClass: Record<ColumnsKey, string> = {
  '1': 'basis-full',
  '2': 'basis-full sbs:basis-1/2',
  '3': 'basis-full md:basis-1/2 sbs:basis-1/3',
  '4': 'basis-full md:basis-1/2 sbs:basis-1/4',
}

/** Grid inset. The PDF insets each grid differently — the technique row runs
 *  ~88% of the artboard, the image pair ~79%, the tall making-of grid ~67% —
 *  so this is an editor choice rather than a single hard-coded measure. */
const maxWidthClass: Record<string, string> = {
  bleed: '',
  full: '',
  // vw, not %, so these are measured against the VIEWPORT the way the PDF's
  // spans are — a percentage would be taken from the already-padded content
  // box and land ~8 points narrow.
  wide: 'sbs:max-w-[88.7vw] sbs:mx-auto',
  medium: 'sbs:max-w-[78.7vw] sbs:mx-auto',
  narrow: 'sbs:max-w-[67vw] sbs:mx-auto',
}

const topSpacingClass: Record<SpacingKey, string> = {
  none: '', sm: 'pt-[2.5vw]', md: 'pt-[4.5vw]', lg: 'pt-[6vw]',
}
const bottomSpacingClass: Record<SpacingKey, string> = {
  none: '', sm: 'pb-[2.5vw]', md: 'pb-[4.5vw]', lg: 'pb-[6vw]',
}

/** One cell: square image, then the optional number + caption beneath it.
 *  The PDF sets both at 30px on a 1921 artboard (1.56vw = text-hero-body) with
 *  the number italic in brand red above a plain caption. Futura PT is not
 *  licensed to this site, so both render in Gill Sans (`font-body`) — note
 *  `font-sans` is a dead utility in this repo. */
const GridItem: React.FC<{
  item: NonNullable<NumberedGridBlockProps['items']>[number]
  /** Tile shape — 'portrait' is the Architecture mosaic's 3:5 (measured
   *  460x768 = 0.599 in the PDF; the supplied photos are 0.596). */
  aspect?: NonNullable<NumberedGridBlockProps['itemAspect']>
}> = ({ item, aspect = 'square' }) => {
  const img = typeof item.image === 'object' && item.image ? item.image : null
  if (!img) return null
  const hasCaption = Boolean(item.number || item.caption)
  return (
    <figure className="m-0">
      <div
        className={cn(
          'relative w-full overflow-hidden',
          aspectClass[aspect] ?? 'aspect-square',
        )}
      >
        <Media
          fill
          loading="eager"
          imgClassName="absolute inset-0 w-full h-full object-cover"
          resource={img}
        />
      </div>
      {hasCaption && (
        <figcaption className="mt-3 font-body">
          {item.number && (
            <span className="block italic text-brand-red text-hero-body leading-tight">
              {item.number}
            </span>
          )}
          {item.caption && (
            <span className="block text-hero-body leading-tight">{item.caption}</span>
          )}
        </figcaption>
      )}
    </figure>
  )
}

/** Overlay card — the SSJ "How It Is Made" treatment, re-skinned to this
 *  site's tokens: a clean photo with a large thin numeral, italic caption
 *  and justified description in offwhite laid straight over it, exactly as
 *  the PDF's baked step labels sit. (The reference's dark tint and
 *  hover-fade reveal were both dropped per design direction.) Phones get
 *  the photo with the text stacked below (overlaid long copy is cramped on
 *  a phone). One copy of the text, re-flowed with CSS — a duplicated
 *  mobile/desktop DOM would read as repeated sections to crawlers. */
const OverlayCard: React.FC<{
  item: NonNullable<NumberedGridBlockProps['items']>[number]
  index: number
  aspect?: NonNullable<NumberedGridBlockProps['itemAspect']>
}> = ({ item, index, aspect = 'square' }) => {
  const img = typeof item.image === 'object' && item.image ? item.image : null
  if (!img) return null
  const num = item.number || String(index + 1)
  // With a description the caption rides the numeral's TOP and the body fills
  // the space beneath (the reference layout). Without one, that two-row grid
  // would strand the caption up there — so the numeral stops spanning and the
  // caption bottom-aligns beside it, padded up ~12px so its baseline sits on
  // the numeral's.
  const hasDesc = Boolean(item.description)
  return (
    <div
      className="relative w-full overflow-hidden"
      aria-label={item.caption ? `${num}: ${item.caption}` : undefined}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden',
          aspectClass[aspect] ?? 'aspect-square',
        )}
      >
        <Media
          fill
          loading="eager"
          imgClassName="absolute inset-0 w-full h-full object-cover"
          resource={img}
        />
      </div>
      <div className="px-6 pt-5 pb-12 md:absolute md:inset-0 md:z-10 md:flex md:items-end md:px-[2.6vw] md:pt-0 md:pb-[2.4vw]">
        <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-2.5 md:grid-cols-[auto_minmax(0,24rem)] md:items-end md:gap-x-5 md:gap-y-0">
          <span
            className={cn(
              'col-start-1 row-start-1 md:self-end font-body font-light text-brand-red md:text-offwhite text-[34px] md:text-[clamp(52px,6.5vw,100px)] leading-none select-none',
              hasDesc && 'md:row-span-2',
            )}
          >
            {num}.
          </span>
          {item.caption && (
            <h3
              className={cn(
                'col-start-2 row-start-1 font-body font-medium italic text-ink md:text-offwhite text-2xl md:text-3xl leading-tight',
                hasDesc ? 'md:mb-2' : 'md:self-end md:pb-3',
              )}
            >
              {item.caption}
            </h3>
          )}
          {item.description && (
            <div className="col-span-2 col-start-1 row-start-2 md:col-span-1 md:col-start-2 font-body text-ink md:text-offwhite/90 text-base md:text-lg leading-relaxed md:text-justify">
              <RichText data={item.description} enableGutter={false} enableProse={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const NumberedGridBlock: React.FC<NumberedGridBlockProps> = ({
  items,
  layout = 'grid',
  columns = '3',
  cardStyle = 'plain',
  textPosition = 'none',
  maxWidth = 'wide',
  itemAspect = 'square',
  mobileLayout = 'stack',
  headline,
  body,
  autoplay = false,
  autoplayInterval,
  topSpacing = 'md',
  bottomSpacing = 'md',
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setHeaderTheme('light')),
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [setHeaderTheme])

  const cols = (columns || '3') as ColumnsKey
  const isCarousel = layout === 'carousel'
  // Overlay cards ignore `columns`: the reference design is always 1-up on
  // phones and a gapless pair from md up, paging a whole pair at a time.
  const overlay = isCarousel && cardStyle === 'overlay'
  // A grid can opt into presenting as a one-per-slide carousel on PHONES
  // only (< md). Tablets and up always keep the grid — the stack that
  // motivated this (12 portrait tiles single-file on a 390px screen) only
  // exists below the 2-column breakpoint.
  const mobileCarousel = !isCarousel && mobileLayout === 'carousel'
  const textPos = (textPosition || 'none') as TextPosKey
  const hasText = textPos !== 'none'
  const list = Array.isArray(items) ? items : []

  // Autoplay is a self-driven UI affordance, so it only answers to
  // prefers-reduced-motion — the same contract ProcessCarousel uses.
  const reduced = prefersReducedMotion()
  const wantsAutoplay = (isCarousel || mobileCarousel) && autoplay === true && !reduced
  // Overlay pairs page a whole pair at a time (the reference behaviour),
  // switching at plain `md` to mirror their `md:basis-1/2` slide width.
  // PLAIN carousels advance ONE card per step instead: with a short set
  // (the techniques carousel is 4 cards at 3-up) a whole-view jump leaves
  // Embla unable to wrap seamlessly, so the loop dies at the last page —
  // single-card movement keeps the filmstrip looping continuously, and
  // gives every card its own dot.
  const breakpoints: Record<string, { slidesToScroll: number }> = overlay
    ? { '(min-width: 768px)': { slidesToScroll: 2 } }
    : {}
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      // Loop only when it drives itself. Autoplay against a non-looping
      // carousel walks to the last page and stops dead, which reads as a
      // broken component; without autoplay, trimSnaps is the better
      // behaviour because it stops the last page over-scrolling into a gap.
      // (Embla ignores containScroll while looping, hence the swap.)
      loop: wantsAutoplay,
      align: 'start',
      slidesToScroll: 1,
      // The phone carousel never changes its per-slide count, so it needs
      // no breakpoint map.
      breakpoints: isCarousel ? breakpoints : {},
      ...(wantsAutoplay ? {} : { containScroll: 'trimSnaps' as const }),
      // Also live for a grid presenting as a phone carousel — the instance
      // sits in a `md:hidden` wrapper, so at tablet+ it simply measures a
      // hidden container and does nothing.
      active: isCarousel || mobileCarousel,
      // A slower glide for the full-bleed phone gallery — Embla's duration
      // is a speed factor (default 25, higher = slower/softer). The
      // techniques carousel keeps the default feel.
      ...(mobileCarousel ? { duration: 42 } : {}),
    },
    wantsAutoplay
      ? [Autoplay({ delay: autoplayInterval || 5000, stopOnInteraction: false, stopOnMouseEnter: true })]
      : [],
  )

  const [snaps, setSnaps] = useState<number[]>([])
  const [selected, setSelected] = useState(0)
  useEffect(() => {
    if (!emblaApi || (!isCarousel && !mobileCarousel)) return
    const sync = () => {
      setSnaps(emblaApi.scrollSnapList())
      setSelected(emblaApi.selectedScrollSnap())
    }
    sync()
    emblaApi.on('select', sync).on('reInit', sync)
    return () => {
      emblaApi.off('select', sync).off('reInit', sync)
    }
  }, [emblaApi, isCarousel, mobileCarousel])
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi])
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  if (!list.length) return null

  // Embla silently refuses to loop when the slides can't cover the viewport
  // roughly twice over — 4 technique cards at 3-up are only 133% of the view,
  // so `loop: true` was being deactivated and autoplay bounced 1 → 2 → 1.
  // Rendering the set twice gives the engine room to wrap seamlessly; the
  // clones are aria-hidden and the dots below collapse to the real count.
  const needsClones =
    isCarousel && !overlay && wantsAutoplay && list.length < Number(cols) * 2
  const slidesList = needsClones ? [...list, ...list] : list
  const realCount = list.length
  const dotCount = needsClones ? realCount : snaps.length
  const activeDot = needsClones ? selected % realCount : selected

  // Gutters, all measured from the PDFs and expressed in vw so they track
  // the artboard: the edge-to-edge mosaic packs at 1.25vw (24-36px), a grid
  // beside a text column at 1.5vw (28px), standalone grids at 4.2vw (~80px).
  const isBleed = !hasText && maxWidth === 'bleed'
  const gutter = isBleed ? '1.25vw' : hasText ? '1.5vw' : '4.2vw'

  const grid = overlay ? (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        {/* Gapless pair — adjacent cards butt together like the reference. */}
        <div className="flex items-start">
          {list.map((item, i) => (
            <div key={i} className="shrink-0 grow-0 min-w-0 basis-full md:basis-1/2">
              <OverlayCard item={item} index={i} aspect={itemAspect ?? 'square'} />
            </div>
          ))}
        </div>
      </div>
      {/* Frosted prev/next — desktop only; touch swipes. */}
      {list.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous slide"
            className="hidden md:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 lg:w-14 lg:h-14 rounded-full border border-offwhite/45 bg-white/10 backdrop-blur-sm text-offwhite hover:bg-brand-red hover:border-brand-red items-center justify-center transition-all duration-300 ease-out hover:scale-105"
          >
            <svg width="17" height="17" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 1.5L3.5 7l5.5 5.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next slide"
            className="hidden md:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 lg:w-14 lg:h-14 rounded-full border border-offwhite/45 bg-white/10 backdrop-blur-sm text-offwhite hover:bg-brand-red hover:border-brand-red items-center justify-center transition-all duration-300 ease-out hover:scale-105"
          >
            <svg width="17" height="17" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M5 1.5L10.5 7L5 12.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
      {/* Pill dots — over the image bottom on desktop, in the stacked text
          zone on phones (whose cards reserve pb-12 for them). */}
      {snaps.length > 1 && (
        <div className="absolute bottom-4 md:bottom-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
          {snaps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === selected}
              className={cn(
                'h-1.5 rounded-full transition-all duration-500 ease-out',
                i === selected
                  ? 'w-7 bg-brand-red'
                  : 'w-1.5 bg-ink/30 hover:bg-ink/55 md:bg-offwhite/50 md:hover:bg-offwhite/80',
              )}
            />
          ))}
        </div>
      )}
    </div>
  ) : isCarousel ? (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex" style={{ marginLeft: `-${gutter}` }}>
          {slidesList.map((item, i) => (
            <div
              key={i}
              className={cn('shrink-0 grow-0 min-w-0', slideBasisClass[cols])}
              style={{ paddingLeft: gutter }}
              {...(i >= realCount ? { 'aria-hidden': true } : {})}
            >
              <GridItem item={item} aspect={itemAspect ?? 'square'} />
            </div>
          ))}
        </div>
      </div>
      {/* Text-beside carousels (the FLUX single-image band) trade the dots
          for one red-circle next arrow sitting at the right end of the
          number + caption row below the image — the site's EditorialCta
          arrow language. Standalone carousels (techniques) keep the dots. */}
      {hasText && list.length > 1 ? (
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Next slide"
          className="absolute bottom-3 right-0 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-red bg-transparent text-brand-red transition-transform duration-200 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      ) : (
        dotCount > 1 && (
          <div className="mt-8 flex justify-center gap-3">
            {Array.from({ length: dotCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === activeDot}
                className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  i === activeDot ? 'bg-brand-red' : 'bg-ink/25 hover:bg-ink/40',
                )}
              />
            ))}
          </div>
        )
      )}
    </div>
  ) : mobileCarousel ? (
    <>
      {/* Phone: one tile per swipe, with dots. */}
      <div className="md:hidden relative">
        <div className="overflow-hidden" ref={emblaRef}>
          {/* No gutter: adjacent photos butt edge-to-edge, so the glide
              reads as one continuous filmstrip rather than cards. */}
          <div className="flex">
            {list.map((item, i) => (
              <div key={i} className="shrink-0 grow-0 min-w-0 basis-full">
                <GridItem item={item} aspect={itemAspect ?? 'square'} />
              </div>
            ))}
          </div>
        </div>
        {snaps.length > 1 && (
          <div className="mt-6 flex justify-center gap-2.5">
            {snaps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === selected}
                className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  i === selected ? 'bg-brand-red' : 'bg-ink/25 hover:bg-ink/40',
                )}
              />
            ))}
          </div>
        )}
      </div>
      {/* Tablet and up: the grid, exactly as without the option. */}
      <div className={cn('hidden md:grid', gridColsClass[cols])} style={{ gap: gutter }}>
        {list.map((item, i) => (
          <GridItem key={i} item={item} aspect={itemAspect ?? 'square'} />
        ))}
      </div>
    </>
  ) : (
    <div className={cn('grid', gridColsClass[cols])} style={{ gap: gutter }}>
      {list.map((item, i) => (
        <GridItem key={i} item={item} aspect={itemAspect ?? 'square'} />
      ))}
    </div>
  )

  return (
    <section
      ref={sectionRef}
      className={cn(
        'relative w-full bg-ivory text-ink',
        // The mosaic runs truly edge-to-edge; every other mode keeps the
        // section's own padding.
        isBleed ? 'px-0' : 'px-8 md:px-16 sbs:px-[5.5vw]',
        topSpacingClass[(topSpacing || 'md') as SpacingKey],
        bottomSpacingClass[(bottomSpacing || 'md') as SpacingKey],
      )}
      data-theme="light"
    >
      {hasText ? (
        <div
          className={cn(
            // Vertically centred against the image column (design direction
            // settled here after trying top- and bottom-anchored).
            'flex flex-col sbs:flex-row sbs:items-center gap-[5vw]',
            textPos === 'left' ? 'sbs:flex-row' : 'sbs:flex-row-reverse',
          )}
        >
          {/* 45/55 — the image column a touch narrower than the text column
              (was 50-50; before that 61/34 for the old 3-up grid). */}
          <div className="sbs:flex-[45] sbs:min-w-0">{grid}</div>
          <div className={cn('sbs:flex-[55] sbs:min-w-0', textPos === 'left' ? '' : 'sbs:text-right')}>
            {headline && (
              <>
                <div className="section-caps text-[1.4rem] md:text-[1.7rem] sbs:text-[2.08vw] leading-tight mb-4">
                  <RichText data={headline} enableGutter={false} enableProse={false} />
                </div>
                <div
                  className={cn(
                    'w-[8.6vw] min-w-[100px] h-px bg-[#8e1e24] mb-6',
                    textPos === 'right' ? 'sbs:ml-auto' : '',
                  )}
                  aria-hidden="true"
                />
              </>
            )}
            {body && (
              <div
                className={cn(
                  'font-body text-hero-body text-justify',
                  textPos === 'right' ? 'sbs:[text-align-last:right]' : 'sbs:[text-align-last:left]',
                )}
              >
                <RichText data={body} enableGutter={false} enableProse={false} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={cn(maxWidthClass[(maxWidth || 'wide') as string] ?? '')}>{grid}</div>
      )}
    </section>
  )
}

export default NumberedGridBlock
