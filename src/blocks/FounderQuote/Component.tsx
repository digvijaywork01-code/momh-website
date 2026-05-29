'use client'

/**
 * FounderQuoteBlock — 50/50 portrait + quote panel on desktop, two
 * vertically stacked full-svh sections on mobile.
 *
 * Desktop renders a single <section> with portrait on one side and
 * the editorial content panel on the other (50/50 split). Mobile
 * renders TWO independent top-level <section data-snap-section>
 * siblings — portrait gets its own full-svh snap target, the
 * editorial content gets its own.
 *
 * The sibling pattern on mobile is intentional. The previous nested
 * implementation (one parent section with two `scroll-snap-align`
 * children) worked perfectly on Android/Blink but iOS WebKit
 * (Safari, Chrome, Firefox on iPhone — all WebKit) silently ignored
 * the inner snap targets and skipped portrait → next block, missing
 * the content entirely. Top-level sibling sections are the only
 * scroll-snap pattern WebKit handles reliably with mandatory snap;
 * every other working block on the site uses it.
 *
 * Visual + animation parity is preserved across both layouts — the
 * portrait gets the same gentle zoom-in, the content gets the same
 * cascade (icon → eyebrow → title → quote → signature → attribution
 * → role) in both markups. Animations are scoped per breakpoint via
 * `gsap.matchMedia`, so only the currently-visible markup runs.
 */

import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

import type { FounderQuoteBlock as FounderQuoteBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useNoScrollAnimations } from '@/utilities/useNoScrollAnimations'
import { cn } from '@/utilities/ui'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

type BgKey = NonNullable<FounderQuoteBlockProps['backgroundColor']>

const bgClass: Record<BgKey, string> = {
  cream: 'bg-cream',
  ivory: 'bg-ivory',
}

/* Inner editorial content panel — used by BOTH the mobile content
 * section and the desktop content column. Marks each animatable
 * element with `data-cascade` so the entrance animation can grab
 * them via querySelector inside whichever content wrap is currently
 * visible per breakpoint — saves maintaining two parallel sets of
 * per-element refs. */
type ContentPanelProps = {
  icon: FounderQuoteBlockProps['icon']
  eyebrow?: string | null
  title?: string | null
  quote: FounderQuoteBlockProps['quote']
  signature: FounderQuoteBlockProps['signature']
  attribution?: string | null
  attributionRole?: string | null
}

const ContentPanel: React.FC<ContentPanelProps> = ({
  icon,
  eyebrow,
  title,
  quote,
  signature,
  attribution,
  attributionRole,
}) => (
  <>
    {/* Floral icon — PDF p3 renders the icon at ~88px tall on a
        945pt-tall page. Smaller on mobile (~32px) so the icon reads
        as a delicate signature ornament rather than a section marker. */}
    {icon && typeof icon === 'object' && icon.url && (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        data-cascade
        src={icon.url}
        alt={icon.alt || ''}
        className="w-8 h-8 md:w-14 md:h-14 lg:w-20 lg:h-20 object-contain mb-2 lg:mb-6"
      />
    )}

    {/* PDF-exact: all colors here are the founder colorway (#A60B1A).
        Sizes use the founder-* fluid type tokens. */}
    {eyebrow && (
      <p
        data-cascade
        className="font-script font-normal text-founder-eyebrow uppercase text-founder-red mb-2 lg:mb-4"
      >
        {eyebrow}
      </p>
    )}

    {title && (
      <h2
        data-cascade
        className="font-display font-medium text-founder-title uppercase text-founder-red mb-4 lg:mb-12"
      >
        {title}
      </h2>
    )}

    {/* Quote with large decorative curly marks anchored to corners. */}
    <div data-cascade className="relative max-w-2xl mx-auto px-12 md:px-16">
      <span
        aria-hidden="true"
        className="absolute left-0 -top-12 font-display text-[5em] md:text-[7em] leading-none text-founder-red select-none"
      >
        &ldquo;
      </span>
      <div className="font-body text-founder-quote !leading-tight text-founder-red text-justify">
        <RichText data={quote} enableGutter={false} enableProse={false} />
      </div>
      <span
        aria-hidden="true"
        className="absolute right-0 -bottom-16 font-display text-[5em] md:text-[7em] leading-none text-founder-red select-none"
      >
        &rdquo;
      </span>
    </div>

    {signature && typeof signature === 'object' && (
      <div
        data-cascade
        className="relative w-32 h-12 md:w-48 md:h-20 mt-2 lg:mt-10 mb-1 lg:mb-2"
      >
        <Media fill loading="eager" imgClassName="object-contain" resource={signature} />
      </div>
    )}

    {attribution && (
      <p
        data-cascade
        className="font-display font-normal text-founder-attribution uppercase text-founder-red mt-3 lg:mt-6"
      >
        {attribution}
      </p>
    )}

    {attributionRole && (
      <p
        data-cascade
        className="font-body font-light italic text-founder-role uppercase text-founder-red/80 mt-1"
      >
        {attributionRole}
      </p>
    )}
  </>
)

export const FounderQuoteBlock: React.FC<FounderQuoteBlockProps> = ({
  portrait,
  portraitPosition = 'left',
  icon,
  eyebrow,
  title,
  quote,
  signature,
  attribution,
  attributionRole,
  backgroundColor,
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  // Inner pages skip the entrance cascade — same pattern as every
  // other animated block. Currently FounderQuote is only rendered on
  // the home page, but the guard is here for symmetry so the block
  // is safe to drop into any page without surprise animation.
  const noScrollAnim = useNoScrollAnimations()

  // Refs to all three sections + their content/portrait wrappers.
  // Both mobile sections and the desktop section are in the DOM at
  // all times (Tailwind's `lg:hidden` / `hidden lg:block` controls
  // visibility per breakpoint), so refs attach to all three.
  // Animations + IntersectionObserver pick the right targets at
  // runtime via `gsap.matchMedia` + the observer's per-element fire.
  const mobilePortraitSecRef = useRef<HTMLElement | null>(null)
  const mobileContentSecRef = useRef<HTMLElement | null>(null)
  const mobilePortraitWrapRef = useRef<HTMLDivElement | null>(null)
  const mobileContentWrapRef = useRef<HTMLDivElement | null>(null)
  const desktopSecRef = useRef<HTMLElement | null>(null)
  const desktopPortraitWrapRef = useRef<HTMLDivElement | null>(null)
  const desktopContentWrapRef = useRef<HTMLDivElement | null>(null)

  const bg = (backgroundColor || 'cream') as BgKey
  const portraitFirst = portraitPosition === 'left'

  // Header theme switches to "light" while ANY of the founder sections
  // are in view. We observe all three because only the breakpoint-
  // appropriate one has a layout box at any given moment — `display:
  // none` elements never intersect the viewport, so the observer
  // naturally fires only for the currently-visible section.
  useEffect(() => {
    const targets = [
      mobilePortraitSecRef.current,
      mobileContentSecRef.current,
      desktopSecRef.current,
    ].filter((el): el is HTMLElement => Boolean(el))
    if (targets.length === 0 || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setHeaderTheme('light')
        })
      },
      { threshold: 0.3 },
    )
    targets.forEach((t) => observer.observe(t))
    return () => observer.disconnect()
  }, [setHeaderTheme])

  // Entrance animations — scoped per breakpoint via `gsap.matchMedia`
  // so only the currently-visible markup runs its ScrollTriggers.
  // `mm.revert()` on teardown (and on breakpoint change) restores the
  // pre-animation state cleanly, so a window resize across the lg
  // boundary doesn't leave stale opacity/transform on hidden elements.
  //
  // Two timelines per breakpoint:
  //  - Portrait timeline: image zoom-in + opacity wash-in. Trigger is
  //    the portrait section (mobile) or the portrait wrap (desktop).
  //  - Content cascade: icon → eyebrow → title → quote → signature →
  //    attribution → role. Trigger is the content section (mobile) or
  //    the content wrap (desktop). On mobile they're two separate
  //    snap targets, so each cascade plays as the visitor lands on
  //    its respective viewport.
  useEffect(() => {
    if (prefersReducedMotion()) return
    if (noScrollAnim) return

    const mm = gsap.matchMedia()

    mm.add('(max-width: 1023px)', () => {
      const portraitSec = mobilePortraitSecRef.current
      const contentSec = mobileContentSecRef.current
      const portraitWrap = mobilePortraitWrapRef.current
      const contentWrap = mobileContentWrapRef.current
      if (!portraitSec || !contentSec || !portraitWrap || !contentWrap) return

      const portraitImg = portraitWrap.querySelector<HTMLImageElement>('img')
      const cascadeEls = Array.from(
        contentWrap.querySelectorAll<HTMLElement>('[data-cascade]'),
      )

      if (portraitImg) gsap.set(portraitImg, { scale: 1.06 })
      gsap.set(portraitWrap, { opacity: 0.88 })
      gsap.set(cascadeEls, { y: 40, opacity: 0 })

      const portraitTl = gsap.timeline({
        scrollTrigger: {
          trigger: portraitSec,
          start: 'top 70%',
          toggleActions: 'play reset play reset',
        },
      })
      if (portraitImg) {
        portraitTl.to(portraitImg, { scale: 1, duration: 1.6, ease: 'power2.out' }, 0)
      }
      portraitTl.to(portraitWrap, { opacity: 1, duration: 1.6, ease: 'power2.out' }, 0)

      const contentTl = gsap.timeline({
        scrollTrigger: {
          trigger: contentSec,
          start: 'top 70%',
          toggleActions: 'play reset play reset',
        },
      })
      contentTl.to(
        cascadeEls,
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.1 },
        0,
      )
    })

    mm.add('(min-width: 1024px)', () => {
      const sec = desktopSecRef.current
      const portraitWrap = desktopPortraitWrapRef.current
      const contentWrap = desktopContentWrapRef.current
      if (!sec || !portraitWrap || !contentWrap) return

      const portraitImg = portraitWrap.querySelector<HTMLImageElement>('img')
      const cascadeEls = Array.from(
        contentWrap.querySelectorAll<HTMLElement>('[data-cascade]'),
      )

      if (portraitImg) gsap.set(portraitImg, { scale: 1.06 })
      gsap.set(portraitWrap, { opacity: 0.88 })
      gsap.set(cascadeEls, { y: 40, opacity: 0 })

      const portraitTl = gsap.timeline({
        scrollTrigger: {
          trigger: portraitWrap,
          start: 'top 70%',
          toggleActions: 'play reset play reset',
        },
      })
      if (portraitImg) {
        portraitTl.to(portraitImg, { scale: 1, duration: 1.6, ease: 'power2.out' }, 0)
      }
      portraitTl.to(portraitWrap, { opacity: 1, duration: 1.6, ease: 'power2.out' }, 0)

      const contentTl = gsap.timeline({
        scrollTrigger: {
          trigger: contentWrap,
          start: 'top 70%',
          toggleActions: 'play reset play reset',
        },
      })
      contentTl.to(
        cascadeEls,
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.1 },
        0,
      )
    })

    return () => {
      mm.revert()
    }
  }, [noScrollAnim])

  const portraitObj = typeof portrait === 'object' && portrait ? portrait : null
  const portraitW = portraitObj?.width ?? 1
  const portraitH = portraitObj?.height ?? 1
  const portraitAspect = `${portraitW} / ${portraitH}`

  const contentProps: ContentPanelProps = {
    icon,
    eyebrow,
    title,
    quote,
    signature,
    attribution,
    attributionRole,
  }

  return (
    <>
      {/* ─── MOBILE: portrait section (top-level snap target) ───────
       *  Full-svh standalone section. Sibling — not nested child — of
       *  the content section below; this is the only scroll-snap
       *  pattern WebKit handles reliably under mandatory snap.
       *  Hidden on lg+ where the desktop 50/50 split takes over. */}
      <section
        ref={mobilePortraitSecRef}
        className={cn('lg:hidden w-full h-svh overflow-hidden', bgClass[bg])}
        data-theme="light"
        data-snap-section
        aria-label={eyebrow ? `${eyebrow} portrait` : 'Founder portrait'}
      >
        <div
          ref={mobilePortraitWrapRef}
          className="relative w-full h-svh overflow-hidden"
        >
          {portraitObj && (
            <Media
              fill
              loading="eager"
              // `object-top` so the crop happens from the BOTTOM of
              // the portrait (legs/chair) — preserves the founder's
              // head + face when the image box is more vertical than
              // the portrait's natural aspect.
              imgClassName="absolute inset-0 w-full h-full object-cover object-top"
              resource={portraitObj}
            />
          )}
        </div>
      </section>

      {/* ─── MOBILE: editorial content section (top-level snap target) ─
       *  Sibling to the portrait section above. Visitor swipes past
       *  the portrait and lands here cleanly. Hidden on lg+. */}
      <section
        ref={mobileContentSecRef}
        className={cn('lg:hidden w-full h-svh', bgClass[bg])}
        data-theme="light"
        data-snap-section
        aria-label={eyebrow ? `${eyebrow} note` : 'Founder note'}
      >
        <div
          ref={mobileContentWrapRef}
          className="flex flex-col items-center justify-center text-center px-6 h-svh py-12"
        >
          <ContentPanel {...contentProps} />
        </div>
      </section>

      {/* ─── DESKTOP: single section with 50/50 portrait + content ──
       *  Identical to the previous (pre-iOS-fix) implementation —
       *  portrait column's width auto-computed from `height × aspect`,
       *  content column fills the remaining horizontal space. Hidden
       *  on mobile so the two sibling sections above own that
       *  breakpoint. */}
      <section
        ref={desktopSecRef}
        className={cn('hidden lg:block w-full lg:h-screen', bgClass[bg])}
        data-theme="light"
        data-snap-section
        aria-label={eyebrow ? `${eyebrow} ${title}` : 'Founder quote'}
      >
        <div className="flex flex-row h-full">
          <div
            ref={desktopPortraitWrapRef}
            className={cn(
              'relative shrink-0 overflow-hidden lg:w-auto lg:h-full',
              portraitFirst ? 'order-1' : 'order-2',
            )}
            style={{ aspectRatio: portraitAspect }}
          >
            {portraitObj && (
              <Media
                fill
                loading="eager"
                imgClassName="absolute inset-0 w-full h-full object-cover object-top"
                resource={portraitObj}
              />
            )}
          </div>
          <div
            ref={desktopContentWrapRef}
            className={cn(
              'flex flex-col items-center justify-center text-center px-6 md:px-16 lg:flex-1 lg:py-12',
              portraitFirst ? 'order-2' : 'order-1',
            )}
          >
            <ContentPanel {...contentProps} />
          </div>
        </div>
      </section>
    </>
  )
}

export default FounderQuoteBlock
