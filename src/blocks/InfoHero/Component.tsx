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

import type {
  InfoHeroBlock as InfoHeroBlockProps,
  Media as MediaType,
  SectionIntroBlock,
} from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { Card } from '@/components/ui/card'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { richTextHasText } from '@/utilities/richTextHasText'
import { cn } from '@/utilities/ui'

/**
 * Render the last word of a plain-text headline as the italic <em> accent,
 * in brand red: the site's heading rule (A Homage to *Jaipur*, The Art &
 * *Craftsmanship*). The headline field is plain text (not richText), so this
 * is the lightweight equivalent of accentLastWord for the Lexical headings.
 * `*word*` markers an editor typed elsewhere are dropped; only the last word
 * is accented.
 */
const renderEmphasis = (text: string): React.ReactNode => {
  const plain = text.replace(/\*/g, '')
  const match = plain.match(/^([\s\S]*?)(\S+)(\s*)$/)
  if (!match) return plain
  const [, before, word, after] = match
  return (
    <>
      {before}
      <em className="italic">{word}</em>
      {after}
    </>
  )
}

const isVideoResource = (resource: unknown): boolean => {
  return (
    typeof resource === 'object' &&
    resource !== null &&
    'mimeType' in resource &&
    typeof (resource as MediaType).mimeType === 'string' &&
    (resource as MediaType).mimeType!.startsWith('video/')
  )
}

export const InfoHeroBlock: React.FC<
  InfoHeroBlockProps & {
    /** Render variant forwarded by RenderBlocks (NOT a CMS field).
     *  'banner-title' = the Art & Craftsmanship banner: the whole title in
     *  italic serif with the accent word in brand red. Default (undefined)
     *  keeps the home cards hero and the About statement band untouched. */
    variant?: 'banner-title'
    /** Set by RenderBlocks' infoHeroTextAtBottom (NOT a CMS field), for a
     *  hero without cards: the title and its line sit at the bottom instead
     *  of the centre, at the bottom-left from 768px (lined up with the
     *  header logo, as on the banner pages) and at the bottom centre on
     *  phones. */
    textAtBottom?: boolean
    /** Set by RenderBlocks' infoHeroWholePhotoOnPhone (NOT a CMS field), for
     *  a photo hero without cards: on phones the hero takes the photo's own
     *  shape instead of the full screen, so the photo is neither cropped nor
     *  zoomed, and its title and line use the smaller phone sizes of the
     *  banner pages' title (28px / 14px) to fit it; 22px / 13px under 360px,
     *  where the photo is too short for those to clear the header's logo. */
    wholePhotoOnPhone?: boolean
    /** Set by RenderBlocks' introOnHero (NOT a CMS field): the next title
     *  block's heading as a small line above the title (`eyebrow`) and its
     *  first sentence under it (`body`), styled as on the banner pages (in
     *  the phone sizes of wholePhotoOnPhone when that is on). Screens only:
     *  print shows that title block whole instead. */
    intro?: { eyebrow?: string | null; body?: SectionIntroBlock['body'] | null }
  }
> = ({
  backgroundMedia,
  overlayDarkness,
  headline,
  subline,
  infoCards,
  variant,
  textAtBottom = false,
  wholePhotoOnPhone = false,
  intro,
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

  // Two layout personalities from one block:
  //  - WITH infoCards (the home landing hero): bottom-left cards stack,
  //    headline above them, scroll-down chevron. Unchanged.
  //  - WITHOUT cards (mid-page statement band, e.g. the About page's
  //    "A Homage to Jaipur"): headline + subline centred both axes,
  //    visible on mobile too, no chevron (it's not a landing screen,
  //    so a "scroll down" cue mid-page reads as clutter).
  const hasCards = Array.isArray(infoCards) && infoCards.length > 0
  const bannerTitle = variant === 'banner-title'
  const atBottom = textAtBottom && !hasCards
  const photo =
    backgroundMedia && typeof backgroundMedia === 'object' && !isVideo ? backgroundMedia : null
  const photoRatio =
    wholePhotoOnPhone && !hasCards && photo?.width && photo?.height
      ? `${photo.width} / ${photo.height}`
      : undefined

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
      className={cn(
        'relative w-full h-svh overflow-hidden text-offwhite',
        // Phones, wholePhotoOnPhone: the photo's own shape, full width, so it
        // is neither cropped nor zoomed (the ratio comes in --hero-ratio).
        photoRatio && '[@media_screen_and_(max-width:767.98px)]:!h-auto [@media_screen_and_(max-width:767.98px)]:aspect-[var(--hero-ratio)]',
      )}
      style={photoRatio ? ({ '--hero-ratio': photoRatio } as React.CSSProperties) : undefined}
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
          overlay on the home-page InfoHero. When the block has NO cards
          (statement-band variant, e.g. About's "A Homage to Jaipur"), the
          headline + subline centre on both axes instead. */}
      <div
        className={cn(
          'hidden md:flex absolute inset-0 z-20 flex-col',
          hasCards
            ? 'justify-end pb-24'
            : atBottom
              ? 'justify-end items-start px-10 pb-10 lg:pl-[max(70px,calc(50%_-_890px))] lg:pr-[70px] lg:pb-16'
              : 'items-center justify-center',
        )}
      >
        {(headline || subline) && (
          <div
            className={cn(
              'max-w-3xl',
              hasCards ? 'px-[110px] mb-12' : atBottom ? 'text-left' : 'px-8 text-center',
            )}
          >
            {intro?.eyebrow && (
              <p className="font-script italic text-eyebrow text-offwhite opacity-90 mb-2 drop-shadow-md print:hidden">
                {intro.eyebrow}
              </p>
            )}
            {headline && (
              <h1
                className={cn(
                  'text-offwhite drop-shadow-lg [&_em]:text-brand-red [&_i]:text-brand-red',
                  // PDF spec for the statement band: ~80px at 1920 (text-hero
                  // clamp), plain words Gill Sans Light, *accent* in Cormorant
                  // Regular Italic (.statement-display). Cards variant keeps
                  // its original display styling.
                  hasCards
                    ? 'font-display text-display'
                    : bannerTitle
                      ? 'banner-display text-hero'
                      : 'statement-display text-hero',
                )}
              >
                {headline ? renderEmphasis(headline) : headline}
              </h1>
            )}
            {subline && (
              <p
                // Template literal, NOT cn(): tailwind-merge cannot classify
                // the custom `text-body`/`text-hero-body` size tokens and
                // treats them as conflicting with the `text-offwhite/95`
                // colour, silently dropping it (caught by the regression
                // diff on /about). The Architecture PDF sets the banner
                // subline at 30px (text-hero-body); every other hero keeps
                // 24px (text-body).
                className={`font-body ${bannerTitle ? 'text-hero-body' : 'text-body'} mt-2 text-offwhite/95 drop-shadow-md`}
              >
                {subline}
              </p>
            )}
            {intro?.body && richTextHasText(intro.body) && (
              <div className="font-body text-body text-offwhite max-w-xl opacity-95 mt-3 drop-shadow-md print:hidden [&_a]:underline [&_a]:underline-offset-4">
                <RichText data={intro.body} enableGutter={false} enableProse={false} />
              </div>
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

      {/* Mobile content — statement-band variant (no cards) centres the
          text like the desktop treatment; the cards variant keeps its
          original left-aligned stack with the `mt-8` clearance under
          the fixed header. */}
      <div
        className={cn(
          'md:hidden absolute inset-0 z-20 flex flex-col',
          photoRatio ? 'px-4 pb-3 [@media(max-width:359.98px)]:pb-2' : 'p-4',
        )}
      >
        <div
          className={cn(
            'flex-grow flex flex-col',
            atBottom ? (photoRatio ? 'justify-end' : 'justify-end pb-6') : 'justify-center',
            hasCards ? 'mt-8' : 'items-center text-center px-2',
          )}
        >
          {intro?.eyebrow && (
            <p
              className={`font-script italic text-offwhite opacity-90 drop-shadow-md print:hidden ${photoRatio ? 'text-[0.875rem] leading-none mb-0.5' : 'text-eyebrow mb-1'}`}
            >
              {intro.eyebrow}
            </p>
          )}
          <h1
            className={cn(
              'text-offwhite drop-shadow-lg [&_em]:text-brand-red [&_i]:text-brand-red',
              hasCards
                ? 'font-display text-display font-normal'
                : photoRatio
                  ? `${bannerTitle ? 'banner-display' : 'statement-display'} text-[1.75rem] leading-[1.1] [@media(max-width:359.98px)]:text-[1.375rem]`
                  : bannerTitle
                    ? 'banner-display text-hero'
                    : 'statement-display text-hero',
            )}
          >
            {headline ? renderEmphasis(headline) : headline}
          </h1>
          {subline && (
            <p
              className={`font-body ${photoRatio ? 'text-[0.875rem] leading-snug max-w-[22rem] mt-0.5 [@media(max-width:359.98px)]:text-[0.8125rem]' : `${bannerTitle ? 'text-hero-body' : 'text-body'} mt-1`} text-offwhite drop-shadow-md`}
            >
              {subline}
            </p>
          )}
          {intro?.body && richTextHasText(intro.body) && (
            <div
              className={`font-body text-offwhite max-w-[22rem] opacity-95 drop-shadow-md print:hidden [&_a]:underline [&_a]:underline-offset-4 ${photoRatio ? 'text-[0.875rem] leading-snug mt-0.5 [@media(max-width:359.98px)]:text-[0.8125rem]' : 'text-body mt-2'}`}
            >
              <RichText data={intro.body} enableGutter={false} enableProse={false} />
            </div>
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
          the z-20 content + z-10 overlay so it stays clickable.

          Visibility treatment: a semi-opaque dark scrim (`bg-black/40`)
          guarantees the circle reads against the bright/busy haveli
          image, and a full-opacity 2px white ring + thicker arrow make
          it legible. (Static — no bounce animation.) */}
      {hasCards && (
      <button
        type="button"
        onClick={scrollToNextBlock}
        className="hidden md:flex absolute bottom-10 left-1/2 -translate-x-1/2 z-30 w-14 h-14 rounded-full border-2 border-offwhite bg-black/40 shadow-lg items-center justify-center text-offwhite hover:bg-black/60 transition-colors"
        aria-label="Scroll down"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      )}
    </section>
  )
}

export default InfoHeroBlock
