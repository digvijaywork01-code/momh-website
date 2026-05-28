'use client'

/**
 * FounderQuoteBlock — 50/50 portrait + quote panel.
 *
 * The quote text is wrapped with large curly quote marks (a left mark before
 * the quote, right mark after). The content panel uses cream or ivory bg per
 * the schema's backgroundColor field.
 */

import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

import type { FounderQuoteBlock as FounderQuoteBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { cn } from '@/utilities/ui'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

type BgKey = NonNullable<FounderQuoteBlockProps['backgroundColor']>

const bgClass: Record<BgKey, string> = {
  cream: 'bg-cream',
  ivory: 'bg-ivory',
}

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
  const sectionRef = useRef<HTMLDivElement | null>(null)
  // Per-element refs for the entrance cascade.
  const portraitWrapRef = useRef<HTMLDivElement | null>(null)
  // Content panel ref — on mobile this is its own snap target, so the
  // editorial cascade has its own ScrollTrigger anchored to this wrap
  // (fires when content scrolls in, not when portrait scrolls in).
  const contentWrapRef = useRef<HTMLDivElement | null>(null)
  const iconRef = useRef<HTMLImageElement | null>(null)
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const quoteWrapRef = useRef<HTMLDivElement | null>(null)
  const signatureRef = useRef<HTMLDivElement | null>(null)
  const attributionRef = useRef<HTMLParagraphElement | null>(null)
  const attributionRoleRef = useRef<HTMLParagraphElement | null>(null)

  const bg = (backgroundColor || 'cream') as BgKey
  const portraitFirst = portraitPosition === 'left'

  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHeaderTheme('light')
          }
        })
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [setHeaderTheme])

  // Entrance animations — split into TWO independent triggers so they
  // fire when each visual panel actually enters the viewport:
  //
  //  Portrait timeline (image zoom + opacity wash-in) is bound to the
  //  portrait wrap. On mobile, where portrait is its own h-svh snap
  //  target, this fires when the visitor swipes INTO the portrait. On
  //  desktop, portrait + content are side-by-side, so portrait's wrap
  //  enters the viewport simultaneously with content's wrap; both
  //  timelines fire together — same effect as the old single-timeline.
  //
  //  Content cascade (icon → eyebrow → title → quote → signature →
  //  attribution → role) is bound to the content wrap. On mobile this
  //  means the cascade plays the moment the visitor swipes INTO the
  //  content viewport (after they leave portrait), not while they're
  //  still looking at the portrait — so the editorial reveal stays
  //  intentional, not pre-played and invisible.
  useEffect(() => {
    if (prefersReducedMotion()) return
    const section = sectionRef.current
    if (!section) return

    const contentEls = [
      iconRef.current,
      eyebrowRef.current,
      titleRef.current,
      quoteWrapRef.current,
      signatureRef.current,
      attributionRef.current,
      attributionRoleRef.current,
    ].filter((el): el is NonNullable<typeof el> => Boolean(el))
    gsap.set(contentEls, { y: 40, opacity: 0 })
    // Scale the inner <img>, not the wrapper — wrapper's scale paint
    // extends beyond its layout box and bleeds into the previous
    // section. Scaling the img stays clipped by the wrapper's
    // overflow-hidden.
    const innerPortraitImg = portraitWrapRef.current?.querySelector('img') as HTMLImageElement | null
    if (innerPortraitImg) {
      gsap.set(innerPortraitImg, { scale: 1.06 })
    }
    if (portraitWrapRef.current) {
      gsap.set(portraitWrapRef.current, { opacity: 0.88 })
    }

    // Portrait timeline — fires when portrait wrap enters viewport.
    const portraitTl = gsap.timeline({
      scrollTrigger: {
        trigger: portraitWrapRef.current || section,
        start: 'top 70%',
        toggleActions: 'play reset play reset',
      },
    })
    if (innerPortraitImg) {
      portraitTl.to(
        innerPortraitImg,
        { scale: 1, duration: 1.6, ease: 'power2.out' },
        0,
      )
    }
    if (portraitWrapRef.current) {
      portraitTl.to(
        portraitWrapRef.current,
        { opacity: 1, duration: 1.6, ease: 'power2.out' },
        0,
      )
    }

    // Content cascade — fires when content wrap enters viewport.
    // (On mobile, content is its own h-svh snap target — this fires
    // when the visitor lands on the content viewport, not earlier.)
    const contentTl = gsap.timeline({
      scrollTrigger: {
        trigger: contentWrapRef.current || section,
        start: 'top 70%',
        toggleActions: 'play reset play reset',
      },
    })
    contentTl.to(
      contentEls,
      { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.1 },
      0,
    )

    return () => {
      portraitTl.scrollTrigger?.kill()
      portraitTl.kill()
      contentTl.scrollTrigger?.kill()
      contentTl.kill()
    }
  }, [])

  // Same pattern as EditorialSplit: portrait column's WIDTH is computed
  // from `section height × portrait aspect-ratio`. Cream content panel
  // takes whatever's left (flex-1). Image fills its column edge-to-edge
  // with no crop and no L/R gap.
  const portraitObj = typeof portrait === 'object' && portrait ? portrait : null
  const portraitW = portraitObj?.width ?? 1
  const portraitH = portraitObj?.height ?? 1
  const portraitAspect = `${portraitW} / ${portraitH}`

  return (
    <section
      ref={sectionRef}
      /* Full viewport height on lg+ (was `aspect-[1920/945]` = 945px,
         which left a viewport-bottom gap on 1080-tall displays where
         the next section bled in during snap). With `h-svh` the
         section fills the viewport exactly; the portrait column's
         aspect-ratio still drives its width, so the 50/50 split
         (portrait_w ≈ 960 at vh=1080) is preserved on a 1920-wide
         viewport. */
      // `min-h-svh` (not `h-svh`) so the section grows when
      // content needs more vertical room. On 6.5"+ phones (812vh+)
      // and desktops, the portrait (40vh) + content stack
      // (icon, eyebrow, title, quote, signature, attribution, role)
      // fits cleanly in one viewport and the block lands at exactly
      // 100vh. On smaller phones like iPhone SE (375×667), the same
      // content needs ~800px; `min-h-svh` lets the block stretch
      // to ~120vh instead of bleeding the bottom of the quote into
      // the next section's background. The snap manager still
      // anchors transitions to each section's TOP, so the visitor
      // scrolls a tiny extra distance on small phones — far better
      // than seeing the founder's attribution overlap with the next
      // editorial split.
      // SEPARATE mobile vs desktop sizing on purpose:
      //   - Mobile (<lg): `min-h-svh` — at least one visible viewport,
      //     can grow when content needs more room on smaller phones.
      //   - Desktop (lg+): `lg:h-screen` — EXPLICIT height required so
      //     the inner flex-row's `h-full` and the portrait column's
      //     `lg:h-full` actually resolve to a real number. With only
      //     `min-h-*` the h-full chain collapses to content height and
      //     the portrait wrapper renders 0×0 (image invisible). h-screen
      //     gives the chain its anchor.
      className={cn('w-full min-h-svh lg:h-screen', bgClass[bg])}
      data-theme="light"
      data-snap-section
      aria-label={eyebrow ? `${eyebrow} ${title}` : 'Founder quote'}
    >
      {/*
        `h-full` on mobile (instead of just lg:h-full) so the inner
        flex column fills the section's full viewport height. Without
        it, the column's height collapses to its content and the
        content panel's `flex-1 justify-center` has no parent height
        to grow into — the eyebrow + title + quote + signature stack
        lands directly under the 40vh portrait with no vertical
        centring. With h-full, the content panel fills the remaining
        ~60vh below the portrait and `justify-center` actually
        centres the editorial stack inside that space.
      */}
      <div className="flex flex-col lg:flex-row h-full">
        {/* Portrait column — h-full of (aspect-ratio-locked) section,
            width auto-computed from `height × portrait aspect`. */}
        <div
          ref={portraitWrapRef}
          data-mobile-snap-target
          className={cn(
            // Mobile: full viewport. Portrait is its OWN snap target
            // on small screens — "one swipe = portrait, next swipe =
            // content." The brand reference (Musee Atelier) treats
            // founder spreads exactly this way: portrait alone fills
            // the phone screen, swipe lands on the editorial copy.
            // `snap-start snap-always` makes it a forced snap point;
            // the section's own snap-align at the same y-position is
            // harmless (browsers de-duplicate overlapping snap points).
            // lg+: full section height per the editorial 50/50 split
            // (aspect-ratio drives width from h-full).
            'relative shrink-0 overflow-hidden',
            'w-full h-svh snap-start snap-always',
            'lg:w-auto lg:h-full',
            portraitFirst ? 'order-1' : 'order-1 lg:order-2',
          )}
          style={{ aspectRatio: portraitAspect }}
        >
          {portraitObj && (
            <Media
              fill
              loading="eager"
              // `object-top` so the crop happens from the BOTTOM of
              // the portrait (legs / chair) rather than the center —
              // preserves the founder's head + face when the image
              // box is shorter than the image's natural aspect
              // (especially on mobile where the column is capped at
              // 40vh). Without this, the default object-position
              // (center) would cut off her head on a 40vh-capped box.
              imgClassName="absolute inset-0 w-full h-full object-cover object-top"
              resource={portraitObj}
            />
          )}
        </div>

        {/* Cream content panel — vertically centered around the quote. */}
        <div
          ref={contentWrapRef}
          data-mobile-snap-target
          className={cn(
            // Mobile: own full-viewport snap target. Now that the
            // portrait has its own svh above, the content panel
            // gets a whole second svh to itself — generous breathing
            // room (py-12 instead of py-4) and proper vertical
            // centering on the editorial stack.
            // lg+: flex-1 fills the horizontal remainder beside the
            // portrait; height comes from the parent section's
            // h-screen via flex stretch.
            'flex flex-col items-center justify-center text-center px-6 md:px-16',
            'h-svh py-12 snap-start snap-always',
            'lg:h-auto lg:flex-1 lg:py-12',
            portraitFirst ? 'order-2' : 'order-2 lg:order-1',
          )}
        >
          {/* Floral icon — PDF p3 renders the icon at ~88px tall on a
              945pt-tall page. Sized smaller than the EditorialSplit
              icons so it reads as a delicate signature ornament rather
              than a section-marker glyph. */}
          {icon && typeof icon === 'object' && icon.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={iconRef}
              src={icon.url}
              alt={icon.alt || ''}
              // Smaller floral marker on mobile (40px) — leaves room
              // for the quote without sacrificing the icon's role as
              // a delicate section ornament. lg+ keeps the original
              // ~80px treatment per PDF p3.
              className="w-8 h-8 md:w-14 md:h-14 lg:w-20 lg:h-20 object-contain mb-2 lg:mb-6"
            />
          )}

          {/* PDF-exact: all colors here are the founder colorway (#A60B1A).
              Sizes use the founder-* fluid type tokens (23/36/34/36/20 at 1920).
              Weights match PDF:
                eyebrow  → Cormorant Regular   (font-normal 400)
                title    → MenoBanner-Regular  (font-normal 400)
                quote    → GillSans-Light      (font-light 300, body default)
                attrib.  → MenoBanner-Light    (font-light 300)
                role     → GillSans-LightItalic(font-light 300, body default) */}
          {eyebrow && (
            <p
              ref={eyebrowRef}
              className="font-script font-normal text-founder-eyebrow uppercase text-founder-red mb-2 lg:mb-4"
            >
              {eyebrow}
            </p>
          )}

          {/* PDF spec: MenoBanner-Regular 36pt. We're falling back to
              Cormorant (Adobe Fonts kit for MenoBanner isn't wired yet
              — see TODO in tokens.css). Cormorant's "Regular" 400 is
              visually thinner than MenoBanner's 400, so we render at
              Cormorant Medium (500) to approximate MenoBanner Regular's
              heft. When MenoBanner loads, this same `font-medium` will
              render as MenoBanner Medium — which is also OK (very close
              to MenoBanner Regular in MenoBanner's own weight axis). */}
          {title && (
            <h2
              ref={titleRef}
              className="font-display font-medium text-founder-title uppercase text-founder-red mb-4 lg:mb-12"
            >
              {title}
            </h2>
          )}

          {/* Quote with large decorative curly marks anchored to corners. */}
          <div ref={quoteWrapRef} className="relative max-w-2xl mx-auto px-12 md:px-16">
            <span
              aria-hidden="true"
              className="absolute left-0 -top-12 font-display text-[5em] md:text-[7em] leading-none text-founder-red select-none"
            >
              &ldquo;
            </span>
            {/* Quote body — PDF: GillSans-Light 34pt, NOT italic.
                Only "MUSEUM DIRECTOR & FOUNDER" is italic on this page.
                `!leading-tight` (1.25) overrides the text-founder-quote
                token's default 1.5 line-height for a tighter editorial
                feel that matches the PDF spacing. */}
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
              ref={signatureRef}
              // Mobile: tighter top margin (mt-4) to claw back ~24px
              // so the attribution stays inside the viewport. lg+:
              // original mt-10 for the airy editorial layout.
              className="relative w-32 h-12 md:w-48 md:h-20 mt-2 lg:mt-10 mb-1 lg:mb-2"
            >
              <Media fill loading="eager" imgClassName="object-contain" resource={signature} />
            </div>
          )}

          {/* PDF spec: MenoBanner-Light 36pt. With Cormorant fallback,
              we render at `font-normal` (400) — one step lighter than
              the title above so the Light/Regular hierarchy is
              preserved, while still matching MenoBanner-Light's visual
              heft (Cormorant 400 ≈ MenoBanner 300 in stroke contrast). */}
          {attribution && (
            <p
              ref={attributionRef}
              className="font-display font-normal text-founder-attribution uppercase text-founder-red mt-3 lg:mt-6"
            >
              {attribution}
            </p>
          )}

          {attributionRole && (
            // PDF: GillSans-LightItalic — the only italic span on page 3.
            // `font-body` (Gill Sans), `font-light` (300), `italic`.
            <p
              ref={attributionRoleRef}
              className="font-body font-light italic text-founder-role uppercase text-founder-red/80 mt-1"
            >
              {attributionRole}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default FounderQuoteBlock
