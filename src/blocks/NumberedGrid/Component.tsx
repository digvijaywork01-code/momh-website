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
  '2': 'grid-cols-1 sbs:grid-cols-2',
  '3': 'grid-cols-1 md:grid-cols-2 sbs:grid-cols-3',
}

/** Carousel slide widths — the same 1 / 2 / N progression expressed as flex
 *  bases, since Embla sizes slides itself rather than via a grid. */
const slideBasisClass: Record<ColumnsKey, string> = {
  '2': 'basis-full sbs:basis-1/2',
  '3': 'basis-full md:basis-1/2 sbs:basis-1/3',
}

/** Grid inset. The PDF insets each grid differently — the technique row runs
 *  ~88% of the artboard, the image pair ~79%, the tall making-of grid ~67% —
 *  so this is an editor choice rather than a single hard-coded measure. */
const maxWidthClass: Record<string, string> = {
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
}> = ({ item }) => {
  const img = typeof item.image === 'object' && item.image ? item.image : null
  if (!img) return null
  const hasCaption = Boolean(item.number || item.caption)
  return (
    <figure className="m-0">
      <div className="relative w-full aspect-square overflow-hidden">
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

export const NumberedGridBlock: React.FC<NumberedGridBlockProps> = ({
  items,
  layout = 'grid',
  columns = '3',
  textPosition = 'none',
  maxWidth = 'wide',
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
  const textPos = (textPosition || 'none') as TextPosKey
  const hasText = textPos !== 'none'
  const list = Array.isArray(items) ? items : []

  // Autoplay is a self-driven UI affordance, so it only answers to
  // prefers-reduced-motion — the same contract ProcessCarousel uses.
  const reduced = prefersReducedMotion()
  const wantsAutoplay = isCarousel && autoplay === true && !reduced
  // Page a whole slide at a time so the techniques read 3 / 3 / 1 rather than
  // creeping forward one card. The step MUST track how many cards are actually
  // visible at the current breakpoint — a fixed step of 3 while only one card
  // shows would leave cards 2, 3, 5 and 6 unreachable from the dots. These
  // queries mirror the `slideBasisClass` breakpoints exactly.
  const SBS = '(min-width: 640px) and (orientation: landscape) and (min-height: 480px)'
  const breakpoints: Record<string, { slidesToScroll: number }> =
    cols === '3'
      ? { '(min-width: 768px)': { slidesToScroll: 2 }, [SBS]: { slidesToScroll: 3 } }
      : { [SBS]: { slidesToScroll: 2 } }
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
      breakpoints,
      ...(wantsAutoplay ? {} : { containScroll: 'trimSnaps' as const }),
      active: isCarousel,
    },
    wantsAutoplay
      ? [Autoplay({ delay: autoplayInterval || 5000, stopOnInteraction: false, stopOnMouseEnter: true })]
      : [],
  )

  const [snaps, setSnaps] = useState<number[]>([])
  const [selected, setSelected] = useState(0)
  useEffect(() => {
    if (!emblaApi || !isCarousel) return
    const sync = () => {
      setSnaps(emblaApi.scrollSnapList())
      setSelected(emblaApi.selectedScrollSnap())
    }
    sync()
    emblaApi.on('select', sync).on('reInit', sync)
    return () => {
      emblaApi.off('select', sync).off('reInit', sync)
    }
  }, [emblaApi, isCarousel])
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi])

  if (!list.length) return null

  // The PDF uses a tight 28px gutter for the 3-up that sits beside text, and
  // ~80px for the standalone grids. Expressed in vw so it tracks the artboard.
  const gutter = hasText ? '1.5vw' : '4.2vw'

  const grid = isCarousel ? (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex" style={{ marginLeft: `-${gutter}` }}>
          {list.map((item, i) => (
            <div
              key={i}
              className={cn('shrink-0 grow-0 min-w-0', slideBasisClass[cols])}
              style={{ paddingLeft: gutter }}
            >
              <GridItem item={item} />
            </div>
          ))}
        </div>
      </div>
      {snaps.length > 1 && (
        <div className="mt-8 flex justify-center gap-3">
          {snaps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
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
  ) : (
    <div className={cn('grid', gridColsClass[cols])} style={{ gap: gutter }}>
      {list.map((item, i) => (
        <GridItem key={i} item={item} />
      ))}
    </div>
  )

  return (
    <section
      ref={sectionRef}
      className={cn(
        'relative w-full bg-ivory text-ink px-8 md:px-16 sbs:px-[5.5vw]',
        topSpacingClass[(topSpacing || 'md') as SpacingKey],
        bottomSpacingClass[(bottomSpacing || 'md') as SpacingKey],
      )}
      data-theme="light"
    >
      {hasText ? (
        <div
          className={cn(
            'flex flex-col sbs:flex-row sbs:items-center gap-[5vw]',
            textPos === 'left' ? 'sbs:flex-row' : 'sbs:flex-row-reverse',
          )}
        >
          <div className="sbs:w-[61%]">{grid}</div>
          <div className={cn('sbs:w-[34%]', textPos === 'left' ? '' : 'sbs:text-right')}>
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
