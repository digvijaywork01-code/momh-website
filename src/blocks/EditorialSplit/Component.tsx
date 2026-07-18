'use client'

/**
 * EditorialSplitBlock — 60/40 split section with image one side and content
 * the other. Handles all the editorial sections of the MOMH landing page
 * (About, Craftsmanship, Architecture, Events, Collection, Gallery, Craft).
 *
 * Layout variants:
 *  - imagePosition: image on left or right (content goes opposite)
 *  - iconPosition: decorative icon at top of content column, aligned L/C/R
 *  - backgroundColor: ivory | cream | black | emerald | maroon
 *
 * Entrance animation: when the section first enters the viewport, the
 * image slowly zooms out from 1.08x while content elements (icon, eyebrow,
 * headline, body, featured line, CTA) cascade up from below in a staggered
 * timeline. Plays once per visit; under prefers-reduced-motion all elements
 * render in their final state with no animation.
 */

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'

import type { EditorialSplitBlock as EditorialSplitBlockProps, Page, Post } from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { EditorialCta } from '@/components/EditorialCta'
import { ExpandableText } from '@/components/ExpandableText'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useNoScrollAnimations } from '@/utilities/useNoScrollAnimations'
import { isCtaTargetLive } from '@/utilities/validRoutes'
import { cn } from '@/utilities/ui'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

type BgKey = NonNullable<EditorialSplitBlockProps['backgroundColor']>

const bgClass: Record<BgKey, string> = {
  ivory: 'bg-ivory text-ink',
  cream: 'bg-cream text-ink',
  black: 'bg-black text-offwhite',
  emerald: 'bg-emerald text-offwhite',
  maroon: 'bg-maroon text-offwhite',
  navy: 'bg-navy text-offwhite',
}

const isDarkBg = (bg: BgKey): boolean =>
  bg === 'black' || bg === 'emerald' || bg === 'maroon' || bg === 'navy'

/** Icon horizontal alignment within the content column. STACKED layouts
 *  always use `justify-start` (left) so the icon reads naturally above the
 *  left-aligned text stack. In the SIDE-BY-SIDE layout it applies the
 *  editor's chosen position at the `sbs:` breakpoint — the SAME breakpoint
 *  that right-aligns the content (sbs:items-end) — so the icon tracks the
 *  text alignment. (Was `lg:`, which left the icon stuck on the left at
 *  720–1023px side-by-side viewports like the Surface Duo landscape, where
 *  the content is already right-aligned.) */
const iconAlignClass: Record<'left' | 'center' | 'right', string> = {
  left: 'justify-start sbs:justify-start',
  center: 'justify-start sbs:justify-center',
  right: 'justify-start sbs:justify-end',
}

type TopSpacingKey = NonNullable<EditorialSplitBlockProps['topSpacing']>
type BottomSpacingKey = NonNullable<EditorialSplitBlockProps['bottomSpacing']>

/** Top-spacing variants — render a white gap above the section.
 *  `none` keeps the home-page edge-to-edge layout; `sm`/`md`/`lg`
 *  open up air between stacked panels (e.g. the 3 panels on the
 *  /thank-you confirmation page). */
const topSpacingClass: Record<TopSpacingKey, string> = {
  none: '',
  sm: 'mt-6',
  md: 'mt-10',
  lg: 'mt-16',
}

/** Bottom-spacing variants — same scale as `topSpacingClass`. Use
 *  on the LAST panel before the footer so the page doesn't slam
 *  straight into the global chrome. */
const bottomSpacingClass: Record<BottomSpacingKey, string> = {
  none: '',
  sm: 'mb-6',
  md: 'mb-10',
  lg: 'mb-16',
}

const resolveLinkHref = (
  link: EditorialSplitBlockProps['ctaLink'] | undefined | null,
): string | null => {
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

export const EditorialSplitBlock: React.FC<EditorialSplitBlockProps> = ({
  image,
  imagePosition = 'right',
  backgroundColor = 'ivory',
  topSpacing = 'none',
  bottomSpacing = 'none',
  icon,
  iconPosition = 'left',
  eyebrow,
  headline,
  body,
  featuredLine,
  ctaLabel,
  ctaArrowPosition,
  ctaStyle,
  ctaLink,
  contactEmail,
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  // On inner pages that opt out of scroll-driven motion (NO_ANIM_PATHS),
  // skip the entrance cascade entirely. Otherwise the gsap.set below
  // pins all content to opacity 0 and waits for ScrollTrigger to fire,
  // which silently never happens on snap-free pages — visitors see
  // empty coloured panels with no headline / body / CTA.
  const noScrollAnim = useNoScrollAnimations()
  const sectionRef = useRef<HTMLDivElement | null>(null)
  // Per-element refs so each piece of the content column can be animated
  // with its own delay/distance on the entrance timeline.
  const imageWrapRef = useRef<HTMLDivElement | null>(null)
  const iconRef = useRef<HTMLDivElement | null>(null)
  // Mobile uses a SEPARATE inline icon (lg:hidden, smaller, stacked
  // above the eyebrow). It needs its own ref so the entrance cascade
  // animates the mobile icon too — without this, the desktop iconRef
  // animates an `hidden` element on mobile and the visible mobile
  // icon never gets the y/opacity reveal.
  const mobileIconRef = useRef<HTMLImageElement | null>(null)
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null)
  const headlineRef = useRef<HTMLDivElement | null>(null)
  // `bodyWrapRef` is the outer wrapper that contains the entire body
  // ExpandableText (clamp/scroll cage + Read More button). Animating
  // this outer wrapper guarantees the whole body block, including
  // the mobile Read More toggle and the optional featured line, gets
  // the same y/opacity reveal as the rest of the cascade.
  const bodyWrapRef = useRef<HTMLDivElement | null>(null)
  const ctaRef = useRef<HTMLDivElement | null>(null)

  const bg = (backgroundColor || 'ivory') as BgKey
  const dark = isDarkBg(bg)

  // Set header theme based on this section's background when it enters viewport.
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

  // Staggered entrance timeline — fires once when the section enters
  // the viewport. Image zooms gently out from 1.08 (slow backdrop)
  // while content elements cascade up from below in sequence:
  // icon → eyebrow → headline → body → featuredLine → CTA. Pairs
  // with the smooth section-snap transition so each block "delivers"
  // its content with intent rather than appearing all at once.
  useEffect(() => {
    if (prefersReducedMotion()) return
    // On NO_ANIM pages, skip the entrance cascade so content renders
    // at its natural opacity. Without this guard, `gsap.set(opacity: 0)`
    // below pins everything hidden and ScrollTrigger never fires on
    // snap-free pages.
    if (noScrollAnim) return
    const section = sectionRef.current
    if (!section) return

    // Initial hidden state — set immediately so first-paint shows the
    // pre-animation state, not a flash of fully-visible content before
    // ScrollTrigger fires.
    const contentEls = [
      iconRef.current,
      mobileIconRef.current,
      eyebrowRef.current,
      headlineRef.current,
      bodyWrapRef.current,
      ctaRef.current,
    ].filter((el): el is NonNullable<typeof el> => Boolean(el))
    gsap.set(contentEls, { y: 40, opacity: 0 })
    // Scale the inner <img>, NOT the wrapper. Scaling the wrapper makes
    // its painted area extend beyond its layout box, which bleeds into
    // the previous section's viewport from below (the wrapper's
    // overflow-hidden clips children but not the wrapper's own scale-
    // expanded paint area). Scaling the img keeps the bleed contained
    // because the wrapper still clips its child overflow.
    const innerImg = imageWrapRef.current?.querySelector('img') as HTMLImageElement | null
    if (innerImg) {
      gsap.set(innerImg, { scale: 1.08 })
    }
    if (imageWrapRef.current) {
      gsap.set(imageWrapRef.current, { opacity: 0.85 })
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        // Fire once the section is comfortably within the viewport so
        // the user sees the entrance, not the pre-state.
        start: 'top 70%',
        // `play reset play reset` replays the cascade every time the
        // section enters the viewport — including when scrolling back
        // UP from below. The `reset` on leave fires while the section
        // is fully out of view (above or below the viewport), so the
        // jump-to-hidden state is invisible to the user. The next
        // entry plays a fresh animation:
        //   onEnter        (scroll down into section): play
        //   onLeave        (scroll down past section): reset to start
        //   onEnterBack    (scroll up into section):   play
        //   onLeaveBack    (scroll up past section):   reset to start
        toggleActions: 'play reset play reset',
      },
    })

    // Image starts immediately — img scales back to 1.0 inside its
    // overflow-hidden wrapper while the wrapper itself fades to full
    // opacity. Splitting these onto two targets keeps the scale-from-
    // 1.08 effect contained (no bleed into adjacent sections).
    if (innerImg) {
      tl.to(
        innerImg,
        { scale: 1, duration: 1.6, ease: 'power2.out' },
        0,
      )
    }
    if (imageWrapRef.current) {
      tl.to(
        imageWrapRef.current,
        { opacity: 1, duration: 1.6, ease: 'power2.out' },
        0,
      )
    }
    // Content cascade — each element delayed 0.12s from the previous,
    // 0.9s duration with a snappy power3.out (entrance-y feel).
    tl.to(
      contentEls,
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
      },
      0.25,
    )

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [noScrollAnim])

  const ctaHref = resolveLinkHref(ctaLink)

  // The image column's WIDTH is computed from `section height × image
  // natural aspect`. That keeps the image at full block height with no
  // crop and no L/R gap inside the column — the content column flexes
  // to fill whatever horizontal space remains. Below `lg`, the layout
  // stacks vertically and the image takes full width naturally.
  const imageFirst = imagePosition === 'left'
  const imgObj = typeof image === 'object' && image ? image : null
  const imgW = imgObj?.width ?? 1
  const imgH = imgObj?.height ?? 1
  const imageAspect = `${imgW} / ${imgH}`

  // Mobile description line-clamp — adaptive to image height.
  // Below lg, the image stacks ABOVE the content and inherits the
  // section's full width. Its height = viewport-width ÷ aspect-ratio.
  // For landscape shots (aspect ≥ 1) the image is short enough that
  // the full content stack (icon + eyebrow + headline + 3-line body
  // + CTA) still fits the single-viewport `min-h-svh` section.
  // For SQUARE / PORTRAIT images (aspect < 1) the image consumes
  // half-or-more of the viewport, so a 3-line body overflows past
  // the fold — drop to 2 lines to reclaim ~27px and keep the whole
  // block visible in one screen. Desktop (lg+) is unaffected because
  // ExpandableText is a no-op above the breakpoint.
  const mobileBodyLineClamp = imgW / imgH < 1 ? 2 : 3

  return (
    <section
      ref={sectionRef}
      className={cn(
        // Both mobile and desktop: pin section to exactly one
        // viewport-height so only the current block is visible on
        // screen at a time (the next block sits cleanly below the
        // fold, never peeks). Mobile sizing tweaks below (image
        // capped at 30vh, body line-clamped, tight padding) ensure
        // the content stack actually fits in that one viewport
        // without cropping.
        // Mobile + ALL PORTRAIT viewports (incl. iPad Pro 12.9" @ 1024×1366) +
        // short LANDSCAPE phones (<480px tall): min-h-svh — STACKED, image on
        // top, content below.
        // TALL LANDSCAPE (`sbs` = ≥640px AND landscape AND ≥480px tall — from the
        // Surface Duo single screen @ 720×540 up through every iPad / Surface
        // Pro / desktop): h-screen, so the side-by-side split's columns fill the
        // viewport. `sbs` requires landscape, so any PORTRAIT (incl. the 12.9")
        // STAYS stacked; short landscape phones do too (<480px tall).
        'w-full min-h-svh sbs:h-screen',
        bgClass[bg],
        topSpacingClass[topSpacing as TopSpacingKey],
        bottomSpacingClass[bottomSpacing as BottomSpacingKey],
      )}
      data-theme={dark ? 'dark' : 'light'}
      data-snap-section
      aria-label={typeof eyebrow === 'string' ? eyebrow : undefined}
    >
      <div className="flex flex-col sbs:flex-row min-h-svh">
        {/* Image column — height matches section, width = height × image
            aspect-ratio. On lg+ the column sits beside the content column;
            below lg it sits above with full width. */}
        <div
          ref={imageWrapRef}
          className={cn(
            // Mobile: cap image at 45vh so the icon + eyebrow +
            // headline + clamped body + Read More + CTA all fit in
            // the remaining ~55vh, keeping the whole section to
            // exactly one viewport. Without this cap, portrait/square
            // images (aspect < 1) push the content stack past the
            // fold and the block ends up 110-127vh tall on small
            // phones like iPhone SE — the visible "blocks
            // overflowing 100vh" complaint. `object-cover` on the
            // <img> (already set below) crops the image cleanly
            // top-and-bottom to fit the 45vh box; the natural
            // aspect-ratio inline style is overridden by the explicit
            // h-[45svh] at this breakpoint.
            // lg+: full-viewport height per the editorial 60/40 split,
            // unchanged.
            // STACKED (portrait tablets + short landscape phones): phones (<md)
            // keep the 40svh image; PORTRAIT tablets get md:h-[60svh] — a taller
            // strip above the bottom-aligned content.
            // SIDE-BY-SIDE (`sbs` = tall landscape, incl. Surface Duo 720×540):
            // the image fills the column height (sbs:!h-screen — `!` so it beats
            // md:h-[60svh] in the 768–1023 landscape band) and is width-CAPPED at
            // 55vw, so square/wide images can't balloon to 60–80% and crush the
            // content column. The cap holds through the 12.9" (1366×1024) and
            // Surface Pro 7 (1368×912) landscapes.
            // Desktop (`wide`: ≥1280 AND aspect ≥151/100): aspect-based width
            // (wide:!w-auto) — `!` beats the cap regardless of CSS source order.
            'relative shrink-0 w-full sbs:w-[55vw] wide:!w-auto h-[40svh] md:h-[60svh] sbs:!h-screen',
            // overflow:hidden contains the 1.08 scale during entrance so
            // the image doesn't bleed past the column edge.
            'overflow-hidden',
            imageFirst ? 'order-1' : 'order-1 sbs:order-2',
          )}
          style={{ aspectRatio: imageAspect }}
        >
          {imgObj && (
            <Media
              fill
              // `loading="eager"` so the image decodes at initial page
              // render, not when the section enters viewport. Lazy
              // decoding of a ~1920×1890 hero image blocks the main
              // thread for 30-60ms during scroll, exactly when the
              // section is ~80% visible (lazy load triggers there).
              // Eager loading shifts that cost to the initial page
              // load — every subsequent snap-scroll runs on already-
              // decoded textures with no main-thread blocks.
              loading="eager"
              imgClassName="absolute inset-0 w-full h-full object-cover"
              resource={imgObj}
            />
          )}
        </div>

        {/* Content column — fills whatever horizontal space remains.
            DESKTOP: text aligns AWAY from the image (image-left → text
            on the right, image-right → text on the left).
            MOBILE: image stacks ABOVE content, so the desktop "away
            from the image" rule no longer applies — text reads more
            naturally LEFT-aligned in both orientations. The `lg:`
            prefix gates the right-alignment to desktop only. */}
        <div
          className={cn(
            // Mobile: tighter vertical padding (py-8) so the
            // content stack fits in one viewport view alongside
            // the capped 35vh image. lg+: original generous padding
            // for the editorial 60/40 spec.
            'flex-1 flex flex-col px-8 md:px-16 sbs:!px-24 py-8 sbs:py-20',
            // Mobile: always left-aligned. Desktop: alignment depends
            // on whether the image sits on the left or right of the
            // editorial split.
            'order-2 text-left items-start',
            imageFirst
              ? 'sbs:text-right sbs:items-end'
              : 'sbs:order-1 sbs:text-left sbs:items-start',
          )}
        >
          {/* Decorative icon — pinned to top, left/center/right per
              iconPosition. DESKTOP ONLY (hidden below lg). On mobile
              the icon sits inside the content stack just above the
              eyebrow instead, where it reads as a delicate section
              marker introducing the column rather than a floating
              ornament at the top of the column. */}
          {icon && typeof icon === 'object' && icon.url && (
            <div
              ref={iconRef}
              className={cn(
                // Desktop ornament — only in LANDSCAPE ≥1024. At ≥1024 PORTRAIT
                // (12.9") it stays hidden and the inline mobile icon shows
                // instead, matching the stacked smaller-tablet layout.
                'hidden sbs:flex w-full',
                iconAlignClass[iconPosition || 'left'],
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={icon.url}
                alt={icon.alt || ''}
                className="w-14 h-14 md:w-16 md:h-16 lg:w-[72px] lg:h-[72px] object-contain"
              />
            </div>
          )}

          {/* Content stack — pushed to bottom of the column, aligned to outer edge.
              All sizes locked to the PDF spec via fluid clamps (see tokens.css). */}
          {/* `mt-auto` bottom-anchors the content stack at EVERY breakpoint —
              phone (image dominant, text low), tablet, and desktop all share
              the same low-content editorial rhythm. (An earlier tablet-only
              `md:mt-0` top-align was reverted per design review: the default
              bottom alignment reads better in the side-by-side.) */}
          <div className={cn('mt-auto max-w-2xl w-full', imageFirst ? 'sbs:ml-auto' : '')}>
            {/* Mobile-only icon — sits directly above the eyebrow.
                Smaller than the desktop icon (32px vs 56-72px) so it
                reads as a subtle marker rather than a dominant
                ornament inside the compact mobile content stack. */}
            {icon && typeof icon === 'object' && icon.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={mobileIconRef}
                src={icon.url}
                alt={icon.alt || ''}
                className="sbs:hidden w-8 h-8 object-contain mb-3"
              />
            )}

            {eyebrow && (
              <p
                ref={eyebrowRef}
                className="font-script italic text-eyebrow opacity-90 mb-3"
              >
                {eyebrow}
              </p>
            )}

            <div ref={headlineRef} className="editorial-display text-display mb-6">
              <RichText
                data={headline}
                enableGutter={false}
                enableProse={false}
              />
            </div>

            {/* Body + optional featured line wrapped together inside
                one ExpandableText so the mobile Read More toggle
                hides BOTH (the featured line — e.g. "Upcoming: An
                Era of Enamel at MOMH, September 7, 2025" — used to
                stay visible because it was rendered as a separate
                sibling). Wrapping them as one block means the clamp
                truncates across both; expanding shows the whole
                paragraph + featured line together. Desktop (lg+) is
                unchanged: ExpandableText is a no-op above the
                breakpoint, so both lines render in full. */}
            <div
              ref={bodyWrapRef}
              className={cn(
                'mb-6 max-w-xl',
                // Push to outer edge on the side-by-side (image-left layout) —
                // mobile + ALL portrait (incl. 12.9") stack left-aligned.
                imageFirst ? 'sbs:ml-auto' : '',
              )}
            >
              <ExpandableText mobileLineClamp={mobileBodyLineClamp}>
                <div className="font-body text-body">
                  <RichText
                    data={body}
                    enableGutter={false}
                    enableProse={false}
                  />
                </div>
                {featuredLine && (
                  <div className="font-body text-body mt-4">
                    <RichText
                      data={featuredLine}
                      enableGutter={false}
                      enableProse={false}
                    />
                  </div>
                )}
              </ExpandableText>
            </div>

            {/* CTA — three visual styles supported:
                  - 'arrow'      (default, home-page editorial pattern): italic Cormorant + red-circle arrow
                  - 'filled-red': solid brand-red rectangular button (Museum Guidelines "Book An Appointment")
                  - 'outlined':   transparent border-only rectangular button
                The arrow style stays default so existing home-page
                blocks render unchanged.

                `isCtaTargetLive(ctaHref)` auto-hides buttons whose internal
                target doesn't exist yet (e.g. /about, /architecture,
                /collections were seeded but never built — they 404). The
                CTA data stays in the CMS; the button just doesn't render
                until the page exists. External links + same-page anchors
                always render. See src/utilities/validRoutes.ts. */}
            {ctaLabel && ctaHref && isCtaTargetLive(ctaHref) && (
              <div ref={ctaRef}>
                {(!ctaStyle || ctaStyle === 'arrow') && (
                  <EditorialCta
                    label={ctaLabel}
                    href={ctaHref}
                    arrowPosition={ctaArrowPosition || 'right'}
                    newTab={Boolean(ctaLink?.newTab)}
                    className={dark ? 'text-offwhite' : 'text-ink'}
                  />
                )}
                {(ctaStyle === 'filled-red' || ctaStyle === 'outlined') && (
                  <Link
                    href={ctaHref}
                    {...(ctaLink?.newTab
                      ? { rel: 'noopener noreferrer' as const, target: '_blank' as const }
                      : {})}
                    className={cn(
                      // Mobile: smaller padding + allow wrap so long CTA
                      // labels (e.g. "Book Your Personal Consultation")
                      // don't push the button past the 375px viewport.
                      // lg+: original padding + nowrap (plenty of room
                      // on desktop, single-line CTA is intentional).
                      'inline-flex items-center justify-center px-6 py-3 lg:px-8 font-body uppercase text-center max-w-full lg:whitespace-nowrap',
                      'text-sm md:text-base tracking-wider transition-colors duration-200',
                      ctaStyle === 'filled-red'
                        ? 'bg-brand-red text-white border border-brand-red hover:bg-brand-red/90'
                        : dark
                          ? 'border border-offwhite/60 text-offwhite hover:bg-offwhite hover:text-ink'
                          : 'border border-warm-gray/60 text-warm-gray hover:bg-warm-gray hover:text-cream',
                    )}
                    style={{ fontWeight: 400, letterSpacing: '0.08em' }}
                  >
                    {ctaLabel}
                  </Link>
                )}
              </div>
            )}

            {/* Optional contact email — renders below the CTA. Used
                for the "Have a Question?" panel on Museum Guidelines
                where the panel has no clickable CTA, just an address. */}
            {contactEmail && (
              <p className="mt-4 font-body text-body opacity-95">
                <span className="font-medium italic">Email:</span>{' '}
                <a
                  href={`mailto:${contactEmail}`}
                  className="underline underline-offset-4 hover:opacity-100"
                >
                  {contactEmail}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default EditorialSplitBlock
