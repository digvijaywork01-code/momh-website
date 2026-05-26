'use client'

/**
 * VisitInfoBlock — "Getting Here" map + visit details panel.
 *
 * 60/40 split on lg+ (map / content), stacked on mobile. The map is a
 * static image upload (no third-party JS), optionally wrapped in a link
 * so visitors who tap can open the actual map.
 */

import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

import type { VisitInfoBlock as VisitInfoBlockProps } from '@/payload-types'

import Link from 'next/link'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useNoScrollAnimations } from '@/utilities/useNoScrollAnimations'
import { cn } from '@/utilities/ui'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

type BgKey = NonNullable<VisitInfoBlockProps['backgroundColor']>

const bgClass: Record<BgKey, string> = {
  ivory: 'bg-ivory text-ink',
  cream: 'bg-cream text-ink',
  black: 'bg-black text-offwhite',
  emerald: 'bg-emerald text-offwhite',
  maroon: 'bg-maroon text-offwhite',
}

const isDarkBg = (bg: BgKey): boolean =>
  bg === 'black' || bg === 'emerald' || bg === 'maroon'

export const VisitInfoBlock: React.FC<VisitInfoBlockProps> = ({
  mapImage,
  mapImageLink,
  mapPosition = 'left',
  headline,
  address,
  helperText,
  contactEmail,
  ctas,
  hours,
  hoursNote,
  backgroundColor = 'ivory',
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const noScrollAnim = useNoScrollAnimations()
  const sectionRef = useRef<HTMLElement | null>(null)
  const mapWrapRef = useRef<HTMLDivElement | null>(null)
  const headlineRef = useRef<HTMLDivElement | null>(null)
  const addressRef = useRef<HTMLDivElement | null>(null)
  const ctasRef = useRef<HTMLDivElement | null>(null)
  const hoursRef = useRef<HTMLDivElement | null>(null)

  const bg = (backgroundColor || 'ivory') as BgKey
  const dark = isDarkBg(bg)
  const mapFirst = mapPosition === 'left'
  const mapObj = typeof mapImage === 'object' && mapImage ? mapImage : null

  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setHeaderTheme(dark ? 'dark' : 'light')
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

    const contentEls = (
      [
        headlineRef.current,
        addressRef.current,
        ctasRef.current,
        hoursRef.current,
      ] as (HTMLElement | null)[]
    ).filter((el): el is NonNullable<typeof el> => el !== null)
    gsap.set(contentEls, { y: 35, opacity: 0 })
    if (mapWrapRef.current) gsap.set(mapWrapRef.current, { opacity: 0.85 })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
        toggleActions: 'play reset play reset',
      },
    })
    if (mapWrapRef.current) {
      tl.to(mapWrapRef.current, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 0)
    }
    tl.to(
      contentEls,
      { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out', stagger: 0.1 },
      0.2,
    )

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [])

  // Map wrapper: keep a 5/4 aspect ratio for the screenshot — a typical
  // Maps capture is roughly square-ish. Clickable when `mapImageLink` is set.
  const MapNode = mapObj ? (
    <div
      ref={mapWrapRef}
      // Square aspect on lg+ so the map reads as a balanced panel
      // alongside the address/hours column (which is also roughly the
      // same height once content fills it). The source map screenshot
      // is portrait — object-cover crops top/bottom evenly.
      className="relative w-full aspect-square overflow-hidden bg-warm-gray/10"
    >
      {mapImageLink ? (
        <a
          href={mapImageLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
          aria-label="Open map in Google Maps"
        >
          <Media
            fill
            loading="eager"
            imgClassName="absolute inset-0 w-full h-full object-cover"
            resource={mapObj}
          />
        </a>
      ) : (
        <Media
          fill
          loading="eager"
          imgClassName="absolute inset-0 w-full h-full object-cover"
          resource={mapObj}
        />
      )}
    </div>
  ) : null

  return (
    <section
      ref={sectionRef}
      className={cn(
        // No min-h-screen — section sizes to its content. The map +
        // content panel together already fill a comfortable editorial
        // beat; forcing 100vh leaves an awkward strip of empty
        // background below.
        'w-full flex items-center py-16 lg:py-20 px-6 md:px-10 lg:px-16',
        bgClass[bg],
      )}
      data-theme={dark ? 'dark' : 'light'}
      {...(noScrollAnim ? {} : { 'data-snap-section': true })}
      aria-label="Getting here"
    >
      {/* PDF p2 uses nearly the full page width for this block — map
          starts ~80px from the left edge, content panel ends ~80px from
          the right. Cap at max-w-screen-2xl (1536px) so the layout
          doesn't sprawl on ultrawide displays, and use a 12-column
          grid sized 7/5 (~58% map / 42% content) to match the PDF
          proportions where the map dominates. */}
      <div className="w-full max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 items-start">
        {/* Map column — 7/12 (~58%) on lg+, matches PDF dominance. */}
        <div className={cn('lg:col-span-7', mapFirst ? 'lg:order-1' : 'lg:order-2')}>
          {MapNode}
        </div>

        {/* Content panel — 5/12 (~42%) on lg+. */}
        <div
          className={cn(
            'lg:col-span-5 flex flex-col gap-6',
            mapFirst ? 'lg:order-2' : 'lg:order-1',
          )}
        >
          <div
            ref={headlineRef}
            // Italic words render in brand red to match the PDF's
            // "*Here*" emphasis treatment.
            className="editorial-display text-[2.25rem] md:text-[3rem] lg:text-[3.5rem] leading-tight [&_em]:text-brand-red [&_i]:text-brand-red"
          >
            <RichText data={headline} enableGutter={false} enableProse={false} />
          </div>

          <div ref={addressRef} className="font-body text-body opacity-95 leading-relaxed">
            <RichText data={address} enableGutter={false} enableProse={false} />
          </div>

          {(helperText || contactEmail) && (
            <div className="font-body text-body opacity-90 leading-relaxed">
              {helperText && <p>{helperText}</p>}
              {contactEmail && (
                <p>
                  Email:{' '}
                  <a
                    href={`mailto:${contactEmail}`}
                    className="underline underline-offset-4 hover:text-brand-red"
                  >
                    {contactEmail}
                  </a>
                </p>
              )}
            </div>
          )}

          {Array.isArray(ctas) && ctas.length > 0 && (
            // PDF p2: two rectangular buttons side-by-side, equal width.
            // First button = outlined (white bg, dark text, thin border).
            // Second button = filled red (red bg, white text).
            // Both are the same height (~44px) and share equal horizontal
            // weight — they read as a paired call to action, not as a
            // primary/secondary hierarchy. The italic-arrow EditorialCta
            // is reserved for the carousel/editorial sections.
            // Mobile: stack the two buttons full-width (BOOK AN
            // APPOINTMENT doesn't fit alongside GET DIRECTIONS in a
            // 50/50 split at 375px even with whitespace-nowrap, so the
            // text gets clipped). md+: revert to the side-by-side
            // paired layout from the PDF.
            <div ref={ctasRef} className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4 mt-2">
              {ctas.map((cta, i) => {
                const isFilled = i === 1
                const targetProps = cta.newTab
                  ? { rel: 'noopener noreferrer', target: '_blank' as const }
                  : {}
                return (
                  <Link
                    key={i}
                    href={cta.href}
                    {...targetProps}
                    className={cn(
                      'inline-flex items-center justify-center px-6 py-3 font-body uppercase tracking-wider',
                      'text-sm md:text-base whitespace-nowrap transition-colors duration-200',
                      isFilled
                        ? 'bg-brand-red text-white border border-brand-red hover:bg-brand-red/90'
                        : dark
                          ? 'border border-offwhite/60 text-offwhite hover:bg-offwhite hover:text-ink'
                          : 'border border-warm-gray/60 text-warm-gray hover:bg-warm-gray hover:text-cream',
                    )}
                    style={{ fontWeight: 400, letterSpacing: '0.08em' }}
                  >
                    {cta.label}
                  </Link>
                )
              })}
            </div>
          )}

          {Array.isArray(hours) && hours.length > 0 && (
            <div
              ref={hoursRef}
              className="mt-4 font-body text-body opacity-95"
            >
              {/* PDF p2: the hours table is split into TWO equal columns
                  that line up exactly with the two buttons above (Get
                  Directions / Book An Appointment). Day names align
                  with the left button's left edge; times align with
                  the right button's left edge. Using `grid-cols-2`
                  (50/50) + the same `gap-4` as the button row ensures
                  the columns mirror each other. */}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {hours.map((row, i) => (
                  <React.Fragment key={i}>
                    <dt className="font-medium">{row.day}</dt>
                    <dd className={cn(row.isClosed && 'uppercase tracking-wider')}>
                      {row.isClosed ? 'CLOSED' : row.hours}
                    </dd>
                  </React.Fragment>
                ))}
              </dl>
              {hoursNote && (
                <p className="mt-4 text-eyebrow italic opacity-80 leading-relaxed">
                  {hoursNote}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default VisitInfoBlock
