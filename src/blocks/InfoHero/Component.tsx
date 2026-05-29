'use client'

/**
 * InfoHeroBlock — full-bleed video/image hero with overlaid info cards.
 *
 * CMS-driven replacement for src/components/body/hero.tsx. Background can be
 * a video (autoplay muted loop) or an image; the Media component picks the
 * renderer from the mimeType of the uploaded asset.
 */

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'

import type { InfoHeroBlock as InfoHeroBlockProps, Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'
import { Card } from '@/components/ui/card'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { cn } from '@/utilities/ui'

const isVideoResource = (resource: unknown): boolean => {
  return (
    typeof resource === 'object' &&
    resource !== null &&
    'mimeType' in resource &&
    typeof (resource as MediaType).mimeType === 'string' &&
    (resource as MediaType).mimeType!.startsWith('video/')
  )
}

export const InfoHeroBlock: React.FC<InfoHeroBlockProps> = ({
  backgroundMedia,
  overlayDarkness,
  headline,
  subline,
  infoCards,
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  // Smooth-scroll to the next block. InfoHero is the first block on the
  // home page now, so it carries the down-arrow "scroll for more" cue
  // (relocated from the Hero, which used to be first). Falls back to a
  // one-viewport scroll if there's no next sibling.
  const scrollToNextBlock = () => {
    const el = sectionRef.current
    const next = el?.nextElementSibling as HTMLElement | null
    if (next?.scrollIntoView) {
      next.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })
    }
  }

  // The Hero+InfoHero pair used to share one viewport on mobile (50vh
  // each, InfoHero's data-snap-section removed so they snapped as a
  // single unit). That stacking-into-one-screen pattern doesn't fit
  // the brand's current "one swipe = one block" mobile rhythm — with
  // Hero now at full h-svh and mandatory scroll-snap, a 50svh InfoHero
  // without snap-section would be unreachable (the mandatory snap
  // would jump straight from Hero to Founder, skipping InfoHero
  // entirely). So: InfoHero is now its own full-svh snap target on
  // every breakpoint, no mobile attribute juggling needed.

  const overlayOpacity = Math.max(0, Math.min(100, overlayDarkness ?? 40)) / 100
  const isVideo = isVideoResource(backgroundMedia)

  return (
    <section
      /* Full viewport height on every breakpoint. The PDF's 1920/945
         aspect left a bottom gap on 1080-tall displays where the next
         section bled in during snap; `h-svh` keeps the section flush
         with the viewport. On mobile this used to be h-[50svh] to
         share a viewport with Hero, but mandatory scroll-snap requires
         every block to be its own full-screen snap target — half-
         viewport blocks get skipped over by hard flicks. The haveli
         background image crops a few pixels top/bottom via object-cover. */
      ref={sectionRef}
      className="relative w-full h-svh overflow-hidden text-offwhite"
      data-theme="dark"
      data-snap-section
      aria-label="Information hero"
    >
      {backgroundMedia && typeof backgroundMedia === 'object' && (
        <Media
          fill
          imgClassName="absolute inset-0 w-full h-full object-cover z-0"
          videoClassName="absolute inset-0 w-full h-full object-cover z-0"
          resource={backgroundMedia}
          priority={!isVideo}
        />
      )}

      <div
        className="absolute inset-0 z-10 bg-black"
        style={{ opacity: overlayOpacity }}
        aria-hidden="true"
      />

      {/* Desktop content — cards stack vertically at bottom-left of viewport.
          PDF p2 spec: cards left-aligned to x=110, buttons exactly 257×40 px
          in the brand red (#F1001C, now wired via tokens). No headline
          overlay on the home-page InfoHero — when `headline` is supplied
          (other pages), it renders as a centered overlay above the cards. */}
      <div className="hidden md:flex absolute inset-0 z-20 flex-col justify-end pb-24">
        {(headline || subline) && (
          <div className="px-[110px] mb-12 max-w-3xl">
            {headline && (
              <h1 className="font-display text-display text-offwhite drop-shadow-lg">
                {headline}
              </h1>
            )}
            {subline && (
              <p className="font-body text-body mt-2 text-offwhite/95 drop-shadow-md">
                {subline}
              </p>
            )}
          </div>
        )}
        {Array.isArray(infoCards) && infoCards.length > 0 && (
          <div className="pl-[110px] flex flex-col gap-8 items-start">
            {infoCards.map((card, i) => (
              <Card
                key={i}
                className="border-none p-0 flex flex-col items-start bg-transparent"
              >
                {/* PDF: card label is Gill Sans Regular (400) — slightly
                    heavier than the value below (Gill Sans Light 300). */}
                <span className="font-body text-body text-offwhite font-normal mb-1">
                  {card.label}
                </span>
                <span className="font-body text-body text-offwhite font-light mb-4">
                  {card.value}
                </span>
                {card.ctaLabel && card.ctaUrl && (
                  <Link
                    href={card.ctaUrl}
                    // Plain <a> styled as a button — bypassing the shadcn
                    // Button component which forces `text-sm font-medium`
                    // and tangles with our text-button token (its
                    // letterSpacing of 0.18em is for the SUBSCRIBE
                    // newsletter button only, not the Book-an-Appointment
                    // family).
                    className={cn(
                      'inline-flex items-center justify-center select-none',
                      'w-[257px] h-[40px] rounded-none bg-brand-red text-offwhite',
                      'font-body text-button font-normal',
                      'hover:bg-brand-red-dark transition-colors duration-300',
                    )}
                    style={{ letterSpacing: 'normal' }}
                  >
                    {card.ctaLabel}
                  </Link>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Mobile content */}
      <div className="md:hidden absolute inset-0 z-20 flex flex-col p-4">
        <div className="flex-grow flex flex-col justify-center mt-8">
          <h1 className="font-display text-display text-offwhite font-normal drop-shadow-lg">
            {headline}
          </h1>
          {subline && (
            <p className="font-body text-body mt-1 text-offwhite drop-shadow-md">
              {subline}
            </p>
          )}
        </div>
        {Array.isArray(infoCards) && infoCards.length > 0 && (
          <div className="flex-shrink-0">
            <div className="font-body text-offwhite text-body mb-6">
              {infoCards.map((card, i) => (
                <div key={i} className={i > 0 ? 'mt-4' : undefined}>
                  <p className="font-semibold">{card.label}</p>
                  <p>{card.value}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 w-2/5">
              {infoCards.map(
                (card, i) =>
                  card.ctaLabel &&
                  card.ctaUrl && (
                    <Link
                      key={i}
                      href={card.ctaUrl}
                      className={cn(
                        'inline-flex items-center justify-center select-none',
                        'w-full h-[40px] rounded-none bg-brand-red text-offwhite',
                        'font-body text-button font-normal',
                        'hover:bg-brand-red-dark transition-colors duration-300',
                      )}
                      style={{ letterSpacing: 'normal' }}
                    >
                      {card.ctaLabel}
                    </Link>
                  ),
              )}
            </div>
          </div>
        )}
      </div>

      {/* Scroll-down chevron — relocated from the Hero now that InfoHero
          is the first block (landing screen). Desktop-only (hidden
          md:flex): on a phone the info cards + CTAs fill the screen and
          natural touch scroll is the obvious affordance, plus a
          bottom-center button would crowd the stacked CTAs. Clicking
          smooth-scrolls to the next block (the Hero). z-30 sits above
          the z-20 content + z-10 overlay so it stays clickable. */}
      <button
        type="button"
        onClick={scrollToNextBlock}
        className="hidden md:flex absolute bottom-10 left-1/2 -translate-x-1/2 z-30 w-12 h-12 rounded-full border border-offwhite/60 items-center justify-center text-offwhite/80 hover:text-offwhite hover:border-offwhite transition-colors"
        aria-label="Scroll down"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </section>
  )
}

export default InfoHeroBlock
