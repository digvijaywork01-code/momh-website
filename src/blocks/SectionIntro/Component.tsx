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
    ).filter((el): el is HTMLElement => el !== null)
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

      <div className="max-w-2xl mx-auto text-center">

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
          // Inner-page intro display — bigger than the home page's
          // EditorialSplit headlines because the section is centered
          // and has nothing else competing for visual weight. Matches
          // the PDF's "Plan Your Visit" treatment at ~64px on a
          // 1920-wide artboard. Italic words (em/i) render in brand
          // red to match the PDF's red emphasis (e.g. "*Visit*").
          className="editorial-display text-[2.5rem] md:text-[3.5rem] lg:text-[4rem] leading-tight mb-6 [&_em]:text-brand-red [&_i]:text-brand-red"
        >
          <RichText data={headline} enableGutter={false} enableProse={false} />
        </div>

        {body && (
          <div ref={bodyRef} className="font-body text-body opacity-95">
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
              <div ref={ctaRef} className="mt-8 flex justify-center">
                <Link
                  href={href}
                  {...targetProps}
                  className={cn(
                    'inline-flex items-center justify-center px-8 py-3 font-body uppercase whitespace-nowrap',
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
