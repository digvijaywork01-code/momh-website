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

  // Staggered entrance timeline — portrait zooms gently out while the
  // content panel cascades up: icon → eyebrow → title → quote →
  // signature → attribution → role. Fires once when the section enters
  // the viewport.
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

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 70%',
        // Replay the cascade on every entry (down or up). `reset` on
        // leave fires while the section is off-screen, so the jump-
        // to-hidden state is invisible.
        toggleActions: 'play reset play reset',
      },
    })

    if (innerPortraitImg) {
      tl.to(
        innerPortraitImg,
        { scale: 1, duration: 1.6, ease: 'power2.out' },
        0,
      )
    }
    if (portraitWrapRef.current) {
      tl.to(
        portraitWrapRef.current,
        { opacity: 1, duration: 1.6, ease: 'power2.out' },
        0,
      )
    }
    tl.to(
      contentEls,
      { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.1 },
      0.25,
    )

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
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
         the next section bled in during snap). With `h-screen` the
         section fills the viewport exactly; the portrait column's
         aspect-ratio still drives its width, so the 50/50 split
         (portrait_w ≈ 960 at vh=1080) is preserved on a 1920-wide
         viewport. */
      // `min-h-screen` (not `h-screen`) so the section grows when
      // content needs more vertical room. On 6.5"+ phones (812vh+)
      // and desktops, the portrait (40vh) + content stack
      // (icon, eyebrow, title, quote, signature, attribution, role)
      // fits cleanly in one viewport and the block lands at exactly
      // 100vh. On smaller phones like iPhone SE (375×667), the same
      // content needs ~800px; `min-h-screen` lets the block stretch
      // to ~120vh instead of bleeding the bottom of the quote into
      // the next section's background. The snap manager still
      // anchors transitions to each section's TOP, so the visitor
      // scrolls a tiny extra distance on small phones — far better
      // than seeing the founder's attribution overlap with the next
      // editorial split.
      className={cn('w-full min-h-screen', bgClass[bg])}
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
          className={cn(
            // Mobile: cap the founder portrait at 40vh (~325px on a
            // 812 viewport). Bigger than the EditorialSplit images
            // (30vh) because this image is a portrait of the founder
            // — at 30vh her head was being cropped above the chin.
            // Combined with `object-top` on the img, the crop stays
            // below her shoulders. The remaining 60vh still fits the
            // eyebrow + title + 4-line clamped quote + Read More +
            // signature + attribution, keeping the home-page "one
            // block per screen" rule.
            // lg+: full section height per the editorial 50/50 split.
            'relative shrink-0 w-full lg:w-auto max-h-[40vh] lg:max-h-none lg:h-full overflow-hidden',
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

        {/* Cream content panel — fills remaining horizontal space,
            vertically centered around the quote. */}
        <div
          className={cn(
            // Mobile: very tight vertical padding (py-4) so the
            // quote block (eyebrow + title + 3-line clamped quote +
            // Read More + signature + attribution) fits in one
            // viewport view alongside the 40vh capped portrait.
            // lg+: keep generous padding.
            'flex-1 flex flex-col items-center justify-center text-center px-6 md:px-16 py-4 lg:py-12',
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
