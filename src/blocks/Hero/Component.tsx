'use client'

/**
 * HeroBlock — full-bleed editorial hero.
 *
 * Renders the background image, eyebrow, display headline, body, and a
 * scroll-down chevron. Sets header theme to "dark" on mount so the nav
 * reads correctly over the dark image.
 *
 * Scroll behaviour:
 *  - One-shot text cascade on MOUNT (not scroll-tied). Words start
 *    translated down 32px / opacity 0 / blurred 6px; on mount they
 *    rise + fade + sharpen in a staggered cascade (eyebrow first,
 *    headline second, body trails). Total ~1.8s. Plays once per page
 *    load — no replay on re-scroll.
 *  - The section is a normal full-viewport (h-svh) block. One
 *    natural scroll advances past it and the next block comes up — no
 *    pin, no scrub. Clicking anywhere on the hero (or the chevron)
 *    smoothly scrolls to the next sibling block as a convenience.
 *  - Under prefers-reduced-motion the cascade is skipped; text renders
 *    at its natural opacity instantly.
 *
 * NOTE: a previous version pinned the section for 100vh of scroll
 * while a scrubbed text reveal + Ken-Burns bg animation played. The
 * pin was removed (page felt "stuck") but the elegant word-by-word
 * reveal was kept — just rebound from scroll-scrub to mount-trigger.
 */

import React, { useEffect, useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import SplitType from 'split-type'

import type { HeroBlock as HeroBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { ExpandableText } from '@/components/ExpandableText'
import { useHeaderTheme } from '@/providers/HeaderTheme'

export const HeroBlock: React.FC<HeroBlockProps> = ({
  backgroundImage,
  eyebrow,
  headline,
  body,
  // `showScrollIndicator` intentionally not destructured — the Hero's
  // scroll-down chevron was relocated to the InfoHero (now the first
  // block). The field remains in the schema for when/if the Hero
  // becomes the landing block again.
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const sectionRef = useRef<HTMLElement | null>(null)
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null)
  const headlineRef = useRef<HTMLDivElement | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  // Editorial text cascade — eyebrow → headline → body rise + fade +
  // sharpen in sequence. Driven by a ScrollTrigger so it fires when
  // the Hero scrolls INTO the viewport, NOT on mount.
  //
  // Why scroll-triggered, not mount-triggered: this block is no longer
  // guaranteed to be the first block on the page. The homepage order is
  // editable in the Payload admin, and the Hero now sits SECOND (after
  // the InfoHero). A mount-triggered cascade plays on page load while
  // the visitor is still looking at the first block — by the time they
  // scroll to the Hero, the reveal has already finished and they see
  // static text. Anchoring the timeline to `sectionRef` via
  // ScrollTrigger makes the cascade fire whenever the Hero enters the
  // viewport, regardless of its position in the page order. When the
  // Hero IS the first block (in view on load), the trigger's start
  // condition is already satisfied so it fires immediately — same felt
  // behaviour as the old mount cascade.
  //
  // Uses `useLayoutEffect` rather than `useEffect` so the SplitType
  // split + `gsap.set(...hidden)` run SYNCHRONOUSLY before the
  // browser's first paint of the hydrated DOM. With plain `useEffect`,
  // the words would paint at full opacity for one frame, then snap
  // to hidden, then animate in — a visible flicker. `'use client'`
  // means this never runs on the server, so the SSR warning that
  // sometimes accompanies `useLayoutEffect` doesn't apply.
  //
  // Respect prefers-reduced-motion: if set, leave the words at their
  // natural opacity (no hide-then-reveal) so the section is legible
  // immediately for visitors who've opted out of motion.
  useLayoutEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    const splits: SplitType[] = []
    const splitWords = (el: HTMLElement | null): SplitType | null => {
      if (!el) return null
      const split = new SplitType(el, { types: 'words' })
      splits.push(split)
      ;(split.words ?? []).forEach((w) => {
        ;(w as HTMLElement).style.display = 'inline-block'
        ;(w as HTMLElement).style.willChange = 'transform, opacity, filter'
      })
      return split
    }

    // Body is INTENTIONALLY not word-split. The body is wrapped in
    // <ExpandableText> so the visitor can tap Read More on mobile to
    // expand the description into a scrollable cage — and that
    // pattern relies on `-webkit-line-clamp` to count visible lines.
    // SplitType rewrites the body into inline-block word spans, which
    // breaks line-clamp's line-counting algorithm (each word becomes
    // its own laid-out box). So the eyebrow + headline get the
    // editorial word-by-word reveal, and the body fades in as a
    // single block — same visual rhythm at a slightly larger grain.
    const eyebrowSplit = splitWords(eyebrowRef.current)
    const headlineSplit = splitWords(headlineRef.current)

    const allWords: HTMLElement[] = [
      ...((eyebrowSplit?.words ?? []) as HTMLElement[]),
      ...((headlineSplit?.words ?? []) as HTMLElement[]),
    ]
    if (allWords.length === 0 && !bodyRef.current) {
      // Nothing to animate (no text on this hero variant) — bail
      // before scheduling a no-op timeline.
      return
    }

    // Initial hidden state — set synchronously so first paint shows
    // the pre-animation state, not a flash of fully-visible words
    // before the timeline starts.
    if (allWords.length) {
      gsap.set(allWords, { y: 32, opacity: 0, filter: 'blur(6px)' })
    }
    if (bodyRef.current) {
      gsap.set(bodyRef.current, { y: 20, opacity: 0 })
    }

    // ScrollTrigger-driven: the cascade plays when the Hero section
    // enters the viewport (`top 70%` matches the other editorial
    // blocks). `play reset play reset` replays the reveal each time
    // the visitor scrolls into the Hero — the `reset` on leave fires
    // while the section is off-screen so the jump-to-hidden state is
    // invisible. ScrollTrigger is registered globally by
    // SmoothScrollProvider, so no per-block import/registration here.
    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 70%',
        toggleActions: 'play reset play reset',
      },
    })

    if (eyebrowSplit?.words?.length) {
      tl.to(
        eyebrowSplit.words,
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.7, stagger: 0.04 },
        0,
      )
    }
    if (headlineSplit?.words?.length) {
      tl.to(
        headlineSplit.words,
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, stagger: 0.06 },
        0.2,
      )
    }
    if (bodyRef.current) {
      // Single-block fade-up for the body (no word split — see comment
      // above re: line-clamp interference).
      tl.to(
        bodyRef.current,
        { y: 0, opacity: 1, duration: 0.8 },
        0.9,
      )
    }

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
      splits.forEach((s) => s.revert())
    }
  }, [])

  // Clicking anywhere on the Hero advances to the next block.
  // Same scroll behaviour as the chevron — extracted so the click target
  // covers the full section but doesn't double-fire when the chevron itself
  // is clicked.
  const scrollToNextBlock = () => {
    const hero = sectionRef.current ?? document.querySelector('[data-hide-nav-when-visible]')
    const next = hero?.nextElementSibling as HTMLElement | null
    if (next?.scrollIntoView) {
      next.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })
    }
  }

  return (
    <section
      ref={sectionRef}
      onClick={scrollToNextBlock}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          scrollToNextBlock()
        }
      }}
      role="button"
      tabIndex={0}
      /* Full viewport height — using `h-svh` rather than the PDF's
         original `aspect-[1920/945]` because on a 1080-tall viewport
         the 945-tall section left a 135px gap at the bottom where the
         next section visibly bled in when snapped. `object-cover` on
         the background asset crops a few pixels top/bottom on tall
         viewports, which is a far cleaner visual than the bleed. */
      // Mobile: full svh too. The previous 50svh treatment was a
      // hold-over from when the next block was a short InfoHero with
      // peek-able cards — that block is gone, and with `mandatory`
      // section snap on mobile a 50svh Hero would share its viewport
      // with the next snap section (FounderQuote portrait), so the
      // visitor saw "half Hero + half Founder" in one frame. Full
      // h-svh + the section-snap means: one swipe = one block, every
      // block gets its own viewport. The Hero text reveal already
      // sizes its body around svh so this only grows the bottom
      // padding, not the content footprint.
      className="relative w-full h-svh overflow-hidden text-offwhite cursor-pointer select-none focus:outline-none"
      data-theme="dark"
      data-hide-nav-when-visible
      data-snap-section
      aria-label="Hero (click to continue)"
    >
      {/* Background image/video — full-bleed, behind content. */}
      {backgroundImage && typeof backgroundImage === 'object' && (
        <div className="absolute inset-0 -z-10 w-full h-full">
          <Media
            fill
            imgClassName="absolute inset-0 w-full h-full object-cover"
            videoClassName="absolute inset-0 w-full h-full object-cover"
            priority
            resource={backgroundImage}
          />
        </div>
      )}
      {/* Bottom gradient — always present for headline legibility. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-black/40" />

      {/* Content — anchored bottom-left, absolute-positioned so it overlays
          the full section regardless of section height. Max-widths match
          the PDF page-1 text-frame bounding boxes exactly. */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end px-8 md:px-16 lg:px-[120px] pb-[5%] pt-[5%]">
        {eyebrow && (
          <p
            ref={eyebrowRef}
            className="font-script italic text-eyebrow text-offwhite/85 mb-5"
            style={{ maxWidth: 'min(100%, 876px)' }}
          >
            {eyebrow}
          </p>
        )}

        <div
          ref={headlineRef}
          // Mobile: 40px floor (text-[2.5rem]) so the headline reads
          // as an editorial pull-quote without dominating the 50vh
          // mobile hero — at the previous 48px it was crowding the
          // body copy below into less than half the section height.
          // md+: full `text-hero` clamp (48px → 80px) for the wide
          // editorial entrance.
          className="font-display text-[2.5rem] leading-tight md:text-hero md:leading-[unset] mb-6"
          /* The headline font scales with the viewport
             (`--fs-hero: clamp(48px, 4.167vw, 80px)` — hits 80px at
             1920px wide), so the max-width has to scale too. A FIXED
             740px was fine on Mac laptops (~1440px, font ~60px → the
             intended 3-line break) but on large Windows monitors the
             font grows to 80px while the box stays 740px, forcing the
             title into 4–5 short lines — a cramped, narrow column.
             `clamp(740px, 51vw, 1000px)` keeps small laptops at 740px
             (≤~1450px → clamp floor, unchanged) and widens the box on
             larger screens (≈980px at 1920px) so the bigger font keeps
             the same airy 3-line layout. `min(100%, …)` still caps it
             to the content area on any width. */
          style={{ maxWidth: 'min(100%, clamp(740px, 51vw, 1000px))' }}
        >
          {headline && (
            <RichText
              data={headline}
              enableGutter={false}
              enableProse={false}
              className="text-offwhite"
            />
          )}
        </div>

        {body && (
          // Wrapper div carries the GSAP entrance fade (bodyRef) AND
          // the max-width constraint. ExpandableText (inside) provides
          // the mobile clamp + Read More UX — same pattern as the
          // EditorialSplit blocks so the homepage reads with a single
          // consistent "tap to expand long copy" behaviour everywhere.
          // On lg+ the clamp / toggle are auto-disabled by
          // ExpandableText's own breakpoint rule, so the full body
          // renders untruncated in the editorial wide-screen hero.
          //
          // mobileLineClamp={4} matches the EditorialSplit default
          // (visually equivalent to the previous hand-rolled 5.5rem
          // clip, plus one extra line of breathing room now that the
          // mobile Hero is full svh rather than the old 50svh).
          //
          // --fs-body is shadowed locally so ExpandableText's scroll-
          // cage formula (`lines * fs-body * 1.5`) sizes for the
          // hero-body type scale instead of the standard body scale
          // — otherwise the expanded cage would be ~30% too short on
          // mobile and the scroll affordance would feel cramped.
          <div
            ref={bodyRef}
            // The Hero section's `onClick={scrollToNextBlock}` covers
            // the entire viewport — without this guard, tapping the
            // Read More toggle (or even just selecting body text)
            // would scroll the user past the Hero before they could
            // read the expanded copy. stopPropagation contains taps
            // inside the body region to the body region.
            onClick={(e) => e.stopPropagation()}
            // onKeyDown on a non-button div is unusual, but the
            // parent section is `role="button"` with a Space/Enter
            // handler that ALSO scrolls — keyboard users hitting
            // Space to scroll an expanded body would jump to the
            // next block. Stop that too.
            onKeyDown={(e) => e.stopPropagation()}
            style={{
              maxWidth: 'min(100%, 1571px)',
              ['--fs-body' as string]: 'var(--fs-hero-body, 18px)',
            }}
          >
            <ExpandableText
              mobileLineClamp={4}
              className="font-body text-hero-body text-offwhite/90"
              toggleClassName="text-offwhite/85 hover:text-offwhite"
            >
              <RichText
                data={body}
                enableGutter={false}
                enableProse={false}
              />
            </ExpandableText>
          </div>
        )}
      </div>

      {/* Scroll-down chevron removed: the Hero is no longer the first
          block on the home page (the InfoHero is). A "scroll for more"
          cue belongs on the landing screen, so it's been relocated to
          InfoHero. The whole Hero section is still clickable to advance
          (see scrollToNextBlock on the parent <section>). The
          `showScrollIndicator` CMS field is left in the schema; if the
          Hero is ever moved back to first, the chevron can be restored
          here. */}
    </section>
  )
}

export default HeroBlock
