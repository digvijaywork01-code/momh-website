'use client'

/**
 * NewsletterFeatureBlock — 50/50 split: full-bleed image + coloured
 * panel with newsletter signup form.
 *
 * The image column has NO padding — it bleeds to the section edge.
 * The form column is solid `panelBackgroundColor` (maroon by default
 * per PDF p3 of Craft Your Jewellery) with white text + the shared
 * `NewsletterWidget` underneath the headline/body.
 *
 * Stacks vertically below `lg` with the image on top.
 */

import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

import type { NewsletterFeatureBlock as NewsletterFeatureBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { NewsletterWidget } from '@/components/NewsletterWidget'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useNoScrollAnimations } from '@/utilities/useNoScrollAnimations'
import { cn } from '@/utilities/ui'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

type BgKey = NonNullable<NewsletterFeatureBlockProps['panelBackgroundColor']>

const panelBgClass: Record<BgKey, string> = {
  maroon: 'bg-maroon text-offwhite',
  emerald: 'bg-emerald text-offwhite',
  black: 'bg-black text-offwhite',
  cream: 'bg-cream text-ink',
  ivory: 'bg-ivory text-ink',
}

const isDarkPanel = (bg: BgKey): boolean =>
  bg === 'maroon' || bg === 'emerald' || bg === 'black'

export const NewsletterFeatureBlock: React.FC<NewsletterFeatureBlockProps> = ({
  image,
  imagePosition = 'left',
  panelBackgroundColor = 'maroon',
  eyebrow,
  headline,
  body,
  inputLabel,
  buttonLabel,
  endpoint,
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const noScrollAnim = useNoScrollAnimations()
  const sectionRef = useRef<HTMLElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const imageWrapRef = useRef<HTMLDivElement | null>(null)

  const panelBg = (panelBackgroundColor || 'maroon') as BgKey
  const dark = isDarkPanel(panelBg)
  const imageFirst = imagePosition === 'left'
  const imgObj = typeof image === 'object' && image ? image : null

  // Match header theme to the panel side (the dominant chrome) when
  // this section enters the viewport.
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

  // Simple entrance: panel content fades up, image fades from a small
  // opacity dip. Skipped on no-anim pages + prefers-reduced-motion.
  useEffect(() => {
    if (prefersReducedMotion() || noScrollAnim) return
    const section = sectionRef.current
    if (!section) return
    if (panelRef.current) gsap.set(panelRef.current, { y: 35, opacity: 0 })
    if (imageWrapRef.current) gsap.set(imageWrapRef.current, { opacity: 0.85 })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
        toggleActions: 'play reset play reset',
      },
    })
    if (imageWrapRef.current) {
      tl.to(imageWrapRef.current, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 0)
    }
    if (panelRef.current) {
      tl.to(panelRef.current, { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out' }, 0.15)
    }
    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [noScrollAnim])

  return (
    <section
      ref={sectionRef}
      className={cn(
        // No vertical padding on the section — the two columns fill
        // edge-to-edge so the image bleeds cleanly. Both columns set
        // their own internal padding where needed.
        'w-full flex flex-col',
        imageFirst ? 'lg:flex-row' : 'lg:flex-row-reverse',
      )}
      data-theme={dark ? 'dark' : 'light'}
      {...(noScrollAnim ? {} : { 'data-snap-section': true })}
      aria-label="Newsletter signup"
    >
      {/* Image column — sized to the image's natural aspect so the
          full picture shows with no crop. The panel column matches
          this height via flex stretch and centres its content within.
          (Earlier this column used a min-h-[60vh] + object-cover
          combo, which clipped the artisan-tools image because its
          ~1:1 source aspect got forced into a wider container.) */}
      <div
        ref={imageWrapRef}
        className="lg:w-1/2 relative aspect-[4/3] lg:aspect-auto overflow-hidden bg-warm-gray/10"
        style={
          imgObj && imgObj.width && imgObj.height
            ? { aspectRatio: `${imgObj.width} / ${imgObj.height}` }
            : undefined
        }
      >
        {imgObj && (
          <Media
            fill
            loading="eager"
            imgClassName="absolute inset-0 w-full h-full object-cover"
            resource={imgObj}
          />
        )}
      </div>

      {/* Panel column — coloured background fills the entire half.
          Content (eyebrow → headline → body → form) anchors to the
          BOTTOM of the column. With the image column setting the
          section height via aspectRatio, this leaves a tall block
          of solid colour above the content — matches the PDF p3
          treatment where the form sits in the lower half of the
          maroon panel. */}
      <div
        ref={panelRef}
        className={cn(
          'lg:w-1/2 flex flex-col justify-end',
          'py-16 lg:py-20 px-6 md:px-12 lg:px-20',
          panelBgClass[panelBg],
        )}
      >
        <div className="max-w-xl">
          {eyebrow && (
            <p className="font-script italic text-eyebrow opacity-90 mb-3">
              {eyebrow}
            </p>
          )}

          <div
            className={cn(
              'editorial-display text-[2rem] md:text-[2.5rem] lg:text-[3rem] leading-tight mb-4',
              // Italic emphasis stays in the inherited light/cream tone
              // (PDF shows "Newsletter" in the same offwhite as the
              // surrounding "Our", just italic).
            )}
          >
            <RichText data={headline} enableGutter={false} enableProse={false} />
          </div>

          {body && (
            <div className="font-body text-body opacity-95 leading-relaxed">
              <RichText data={body} enableGutter={false} enableProse={false} />
            </div>
          )}

          <NewsletterWidget
            inputLabel={inputLabel || 'Email Address:'}
            buttonLabel={buttonLabel || 'SUBSCRIBE'}
            endpoint={endpoint || ''}
            dark={dark}
          />
        </div>
      </div>
    </section>
  )
}

export default NewsletterFeatureBlock
