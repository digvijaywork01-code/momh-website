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
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  // On mobile, Hero + InfoHero together fit in one viewport (50vh
  // each). The desktop snap manager would otherwise treat each as
  // its own snap stop, forcing two swipes to traverse them. By
  // removing this section's `data-snap-section` attribute on mobile
  // only, the snap manager skips InfoHero on the snap list — a
  // single Hero → Founder snap scrolls past BOTH blocks together,
  // exactly the "scrolled together" behaviour we want on phones.
  // Desktop keeps the attribute (set in JSX below) so each h-screen
  // block remains its own editorial snap stop.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const sync = () => {
      const isMobile = window.matchMedia('(max-width: 1023px)').matches
      if (isMobile) {
        el.removeAttribute('data-snap-section')
      } else {
        el.setAttribute('data-snap-section', '')
      }
    }
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  const overlayOpacity = Math.max(0, Math.min(100, overlayDarkness ?? 40)) / 100
  const isVideo = isVideoResource(backgroundMedia)

  return (
    <section
      ref={ref}
      /* Full viewport height. The PDF's 1920/945 aspect was 945 tall
         and left a viewport-bottom gap on 1080-tall displays where
         the next section visibly bled in during snap. `h-screen`
         keeps the section flush with the viewport; the background
         haveli image crops a few pixels top/bottom via object-cover. */
      // Mobile: 50vh so the haveli + info cards fit in half a phone
      // screen, matching the Hero block above. lg+: original h-screen
      // for the full editorial info hero.
      className="relative w-full h-[50vh] lg:h-screen overflow-hidden text-offwhite"
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
    </section>
  )
}

export default InfoHeroBlock
