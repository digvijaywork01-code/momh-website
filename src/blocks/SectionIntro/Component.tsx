'use client'

/**
 * SectionIntroBlock — centered editorial intro panel.
 *
 * Italic eyebrow + display headline + short body, all centered. Optional
 * hairline divider sits above the eyebrow (used on the "Plan Your Visit"
 * section to separate it from the haveli hero image above).
 *
 * Entrance cascade: eyebrow → headline → body, all fading up.
 */

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'

import type {
  SectionIntroBlock as SectionIntroBlockProps,
  Page,
  Post,
} from '@/payload-types'

import RichText from '@/components/RichText'
import { EditorialCta } from '@/components/EditorialCta'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useNoScrollAnimations } from '@/utilities/useNoScrollAnimations'
import { cn } from '@/utilities/ui'

const resolveLinkHref = (link: SectionIntroBlockProps['ctaLink'] | null | undefined): string | null => {
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

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

type BgKey = NonNullable<SectionIntroBlockProps['backgroundColor']>

const bgClass: Record<BgKey, string> = {
  cream: 'bg-cream text-ink',
  ivory: 'bg-ivory text-ink',
  white: 'bg-white text-ink',
  black: 'bg-black text-offwhite',
  emerald: 'bg-emerald text-offwhite',
  maroon: 'bg-maroon text-offwhite',
}

const isDarkBg = (bg: BgKey): boolean =>
  bg === 'black' || bg === 'emerald' || bg === 'maroon'

export const SectionIntroBlock: React.FC<SectionIntroBlockProps> = ({
  eyebrow,
  headline,
  body,
  backgroundColor = 'cream',
  showTopDivider = false,
  tightBottom = false,
  headingStyle = 'display',
  ctaLabel,
  ctaStyle,
  ctaLink,
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const noScrollAnim = useNoScrollAnimations()
  const sectionRef = useRef<HTMLElement | null>(null)
  const dividerRef = useRef<HTMLDivElement | null>(null)
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null)
  const headlineRef = useRef<HTMLDivElement | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const ctaRef = useRef<HTMLDivElement | null>(null)

  const bg = (backgroundColor || 'cream') as BgKey
  const dark = isDarkBg(bg)
  const sectionCaps = headingStyle === 'section-caps'

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

  useEffect(() => {
    if (prefersReducedMotion() || noScrollAnim) return
    const section = sectionRef.current
    if (!section) return

    const els = (
      [
        dividerRef.current,
        eyebrowRef.current,
        headlineRef.current,
        bodyRef.current,
        ctaRef.current,
      ] as (HTMLElement | null)[]
    ).filter((el): el is NonNullable<typeof el> => el !== null)
    if (els.length === 0) return

    gsap.set(els, { y: 30, opacity: 0 })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
        toggleActions: 'play reset play reset',
      },
    })
    tl.to(els, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.1 }, 0)

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className={cn(
        // Top padding stays generous; bottom padding can be halved
        // via `tightBottom` so the intro doesn't leave a cavernous
        // gap before a form / info block whose own top padding
        // already provides the breathing room.
        'w-full min-h-[40vh] pt-20 md:pt-28 px-6 md:px-12 flex flex-col items-center justify-center',
        tightBottom ? 'pb-8 md:pb-12' : 'pb-20 md:pb-28',
        bgClass[bg],
      )}
      data-theme={dark ? 'dark' : 'light'}
      {...(noScrollAnim ? {} : { 'data-snap-section': true })}
      aria-label={eyebrow || undefined}
    >
      {/* Full-width hairline divider above the intro — per PDF p2 the
          rule spans nearly edge-to-edge of the content area, NOT a
          short centered line. Lives outside the max-w-2xl text column
          so it can reach the section's outer padding.
          MOBILE ONLY: hidden on lg+ via `lg:hidden` so the desktop
          intro headline rises ~80px (the divider's mb-20) closer to
          the top of the section — without the rule, the eyebrow +
          "Plan Your *Visit*" headline lands within the initial
          viewport on a 1080-tall display, instead of being pushed
          below the fold by the divider + its bottom margin. The
          divider still serves its editorial purpose on mobile where
          the section starts immediately under the top banner and
          benefits from the visual delimiter. */}
      {showTopDivider && (
        <div
          ref={dividerRef}
          className={cn(
            'w-full max-w-6xl h-px mb-16 lg:mb-20 lg:hidden',
            dark ? 'bg-offwhite/40' : 'bg-warm-gray/40',
          )}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'mx-auto text-center',
          // PDF measures the closing statement at 42.5% of the artboard;
          // max-w-2xl wrapped it a line early. Only the section-caps
          // treatment widens — every other SectionIntro is untouched.
          sectionCaps ? 'max-w-2xl sbs:max-w-[42.5vw]' : 'max-w-2xl',
        )}
      >

        {eyebrow && (
          <p
            ref={eyebrowRef}
            className="font-script italic text-eyebrow opacity-90 mb-3"
          >
            {eyebrow}
          </p>
        )}

        <div
          ref={headlineRef}
          // Two treatments:
          //  - 'display' (default, unchanged): inner-page intro display,
          //    bigger than the home page's EditorialSplit headlines because
          //    the section is centered with nothing competing for visual
          //    weight. Matches the PDF's "Plan Your Visit" at ~64px on a
          //    1920-wide artboard. Italic words render in brand red.
          //  - 'section-caps': the Founder's Vision closing statement —
          //    Cormorant Light capitals at the PDF's 40px/1921 = 2.08vw,
          //    with a short maroon rule underneath (rendered below).
          // NOTE: `leading-tight` must sit AFTER the text-size utilities in
          // each branch. cn() runs tailwind-merge, which treats font-size as
          // conflicting with line-height — hoisting `leading-tight` to a
          // shared prefix made the later text-[...] classes strip it, which
          // silently changed the headline leading on every existing page.
          className={cn(
            sectionCaps
              ? 'section-caps text-[1.4rem] md:text-[1.7rem] lg:text-[2.08vw] leading-tight mb-5'
              : 'editorial-display text-[2.5rem] md:text-[3.5rem] lg:text-[4rem] leading-tight mb-6 [&_em]:text-brand-red [&_i]:text-brand-red',
          )}
        >
          <RichText data={headline} enableGutter={false} enableProse={false} />
        </div>

        {/* Short centred rule under a section-caps heading. The PDF draws
            it at 124px on a 1921 artboard (6.45vw) in the same maroon as
            the heading rules on the editorial bands. */}
        {sectionCaps && (
          <div
            className="mx-auto w-[6.45vw] min-w-[80px] h-px bg-[#8e1e24] mb-5"
            aria-hidden="true"
          />
        )}

        {body && (
          <div
            ref={bodyRef}
            className={cn(
              'font-body opacity-95',
              // The PDF sets the closing paragraph at 30px (= text-hero-body)
              // and justifies it, with the last line centred.
              sectionCaps
                ? 'text-hero-body text-justify [text-align-last:center]'
                : 'text-body',
            )}
          >
            <RichText data={body} enableGutter={false} enableProse={false} />
          </div>
        )}

        {/* Optional CTA below the body. Renders in one of three styles:
              - filled-red:  solid brand-red rectangular button (PDF
                "Book Your Personal Consultation" on Craft Your Jewellery)
              - outlined:    transparent border-only rectangular button
              - arrow:       italic Cormorant CTA with a red-circle arrow
                             (matches the EditorialCta used on home page) */}
        {ctaLabel &&
          (() => {
            const href = resolveLinkHref(ctaLink)
            if (!href) return null
            const style = (ctaStyle || 'filled-red') as
              | 'filled-red'
              | 'outlined'
              | 'arrow'
            const targetProps = ctaLink?.newTab
              ? { rel: 'noopener noreferrer' as const, target: '_blank' as const }
              : {}

            if (style === 'arrow') {
              return (
                <div ref={ctaRef} className="mt-8 flex justify-center">
                  <EditorialCta
                    label={ctaLabel}
                    href={href}
                    arrowPosition="right"
                    newTab={Boolean(ctaLink?.newTab)}
                    className={dark ? 'text-offwhite' : 'text-ink'}
                  />
                </div>
              )
            }

            // Rectangular button (filled-red OR outlined).
            const filled = style === 'filled-red'
            return (
              <div ref={ctaRef} className="mt-8 flex justify-center w-full max-w-full">
                <Link
                  href={href}
                  {...targetProps}
                  className={cn(
                    // Mobile: smaller horizontal padding (px-6) + allow
                    // the label to wrap so long CTAs like "Book Your
                    // Personal Consultation" don't push the button (and
                    // its containing block) past the 375px viewport on
                    // iPhone SE. `text-center` keeps wrapped labels
                    // visually centered. `max-w-full` is the hard cap
                    // so the button can never exceed its parent width.
                    // lg+: original generous padding + nowrap (plenty
                    // of horizontal room on desktop, the editorial
                    // single-line CTA is intentional).
                    'inline-flex items-center justify-center px-6 py-3 lg:px-8 font-body uppercase text-center max-w-full lg:whitespace-nowrap',
                    'text-sm md:text-base tracking-wider transition-colors duration-200',
                    filled
                      ? 'bg-brand-red text-white border border-brand-red hover:bg-brand-red/90'
                      : dark
                        ? 'border border-offwhite/60 text-offwhite hover:bg-offwhite hover:text-ink'
                        : 'border border-warm-gray/60 text-warm-gray hover:bg-warm-gray hover:text-cream',
                  )}
                  style={{ fontWeight: 400, letterSpacing: '0.08em' }}
                >
                  {ctaLabel}
                </Link>
              </div>
            )
          })()}
      </div>
    </section>
  )
}

export default SectionIntroBlock
