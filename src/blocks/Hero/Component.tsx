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
 *  - The section is a normal full-viewport (h-dvh) block. One
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
import { useHeaderTheme } from '@/providers/HeaderTheme'

export const HeroBlock: React.FC<HeroBlockProps> = ({
  backgroundImage,
  eyebrow,
  headline,
  body,
  showScrollIndicator,
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const sectionRef = useRef<HTMLElement | null>(null)
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null)
  const headlineRef = useRef<HTMLDivElement | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  // One-shot text cascade on mount. Each word starts slightly below
  // its final position, faded out, and soft-blurred. They rise + fade
  // + sharpen in sequence: eyebrow → headline → body. Pure entrance —
  // no ScrollTrigger, no pin, no scrub. Plays once per page load.
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

    const eyebrowSplit = splitWords(eyebrowRef.current)
    const headlineSplit = splitWords(headlineRef.current)
    const bodySplit = splitWords(bodyRef.current)

    const allWords: HTMLElement[] = [
      ...((eyebrowSplit?.words ?? []) as HTMLElement[]),
      ...((headlineSplit?.words ?? []) as HTMLElement[]),
      ...((bodySplit?.words ?? []) as HTMLElement[]),
    ]
    if (allWords.length === 0) {
      // Nothing to animate (no text on this hero variant) — bail
      // before scheduling a no-op timeline.
      return
    }

    // Initial hidden state — set synchronously so first paint shows
    // the pre-animation state, not a flash of fully-visible words
    // before the timeline starts.
    gsap.set(allWords, { y: 32, opacity: 0, filter: 'blur(6px)' })

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

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
    if (bodySplit?.words?.length) {
      tl.to(
        bodySplit.words,
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.7, stagger: 0.015 },
        0.9,
      )
    }

    return () => {
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
      /* Full viewport height — using `h-dvh` rather than the PDF's
         original `aspect-[1920/945]` because on a 1080-tall viewport
         the 945-tall section left a 135px gap at the bottom where the
         next section visibly bled in when snapped. `object-cover` on
         the background asset crops a few pixels top/bottom on tall
         viewports, which is a far cleaner visual than the bleed. */
      // Mobile: 50vh — the haveli/video opener doesn't need a full
      // phone screen to read; halving it lets the visitor see the
      // InfoHero cards on first scroll instead of having two
      // 100vh blocks stacked back-to-back.
      // lg+: original h-dvh for the full editorial entrance.
      className="relative w-full h-[50dvh] lg:h-dvh overflow-hidden text-offwhite cursor-pointer select-none focus:outline-none"
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
          /* Splits the difference between the tight 700 and the looser
             780 settings — enough room to breathe but still compact
             enough to read as an editorial pull-quote. */
          style={{ maxWidth: 'min(100%, 740px)' }}
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
          <div
            ref={bodyRef}
            // Mobile: cap body to ~3 lines (81px = 3 × 27px line
            // height) and clip overflow so the title + body stack
            // fits in the 50vh section ABOVE the bottom edge —
            // without this the 5-line body pushes the title up
            // behind the persistent top nav (logo + burger).
            // `line-clamp` doesn't work here because SplitType's
            // mount animation rewrites the body into inline-block
            // word-spans, which prevents `-webkit-box` line clamping
            // from truncating cleanly; a fixed max-height +
            // overflow-hidden clips deterministically regardless of
            // the inner structure. Desktop (md+): full body renders
            // in the editorial full-viewport hero, no truncation.
            className="font-body text-hero-body text-offwhite/90 max-h-[5.5rem] overflow-hidden md:max-h-none md:overflow-visible"
            style={{ maxWidth: 'min(100%, 1571px)' }}
          >
            <RichText
              data={body}
              enableGutter={false}
              enableProse={false}
            />
          </div>
        )}
      </div>

      {/* Scroll chevron — visual cue. The whole section is also clickable
          (see scrollToNextBlock on the parent). stopPropagation avoids
          double-firing the section's onClick when the chevron itself is
          clicked. */}
      {showScrollIndicator !== false && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            scrollToNextBlock()
          }}
          // Mobile: hide the chevron (`hidden md:flex`). On a phone
          // the hero is only 50vh + paired with InfoHero below, so
          // there's no need for a "scroll for more" indicator —
          // natural touch scroll handles it. Desktop still gets the
          // chevron as an editorial cue at the bottom of the
          // full-viewport hero.
          className="hidden md:flex absolute bottom-10 left-1/2 -translate-x-1/2 z-20 w-12 h-12 rounded-full border border-offwhite/60 items-center justify-center text-offwhite/80 hover:text-offwhite hover:border-offwhite transition-colors"
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
      )}
    </section>
  )
}

export default HeroBlock
