'use client'

/**
 * QuestionPanelBlock — image (40%) + coloured panel (60%) "Have a
 * Question?" vignette.
 *
 * Layout (matches PDF p5 Museum Guidelines, bottom panel):
 *   - 40/60 row: image takes ~40% of the row, coloured panel ~60%.
 *     Image is the smaller half — the cream panel is the dominant
 *     visual element, full of negative space.
 *   - Image sized to its natural aspect (no crop)
 *   - Panel uses `justify-between` to push the icon to the UPPER
 *     portion and the text cluster (headline → body → email) to the
 *     LOWER portion, with significant empty space between them. This
 *     matches the PDF's airy composition — the icon "floats" in the
 *     upper third and the text sits anchored toward the bottom.
 *   - All content (icon, headline, body, email) is left-aligned at
 *     the same x position. On image-left layouts the cluster sits
 *     well inside the panel (significant left padding offsets it
 *     from the image seam). On image-right layouts it mirrors.
 *   - Italic emphasis in the headline ("*Question?*") renders in
 *     brand red.
 *
 * No CTA button — just an optional Email: link.
 */

import React, { useEffect, useRef } from 'react'

import type { QuestionPanelBlock as QuestionPanelBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { cn } from '@/utilities/ui'

type BgKey = NonNullable<QuestionPanelBlockProps['panelBackgroundColor']>
type TopSpacingKey = NonNullable<QuestionPanelBlockProps['topSpacing']>
type BottomSpacingKey = NonNullable<QuestionPanelBlockProps['bottomSpacing']>

const panelBgClass: Record<BgKey, string> = {
  cream: 'bg-cream text-ink',
  ivory: 'bg-ivory text-ink',
  maroon: 'bg-maroon text-offwhite',
  emerald: 'bg-emerald text-offwhite',
  black: 'bg-black text-offwhite',
}

/** Top-spacing variants — same scale as EditorialSplit's
 *  `topSpacingClass`. Renders a white gap above the section. */
const topSpacingClass: Record<TopSpacingKey, string> = {
  none: '',
  sm: 'mt-6',
  md: 'mt-10',
  lg: 'mt-16',
}

/** Bottom-spacing variants — use on the LAST panel before the footer
 *  so the page doesn't slam straight into the global chrome. */
const bottomSpacingClass: Record<BottomSpacingKey, string> = {
  none: '',
  sm: 'mb-6',
  md: 'mb-10',
  lg: 'mb-16',
}

const isDarkPanel = (bg: BgKey): boolean =>
  bg === 'maroon' || bg === 'emerald' || bg === 'black'

export const QuestionPanelBlock: React.FC<QuestionPanelBlockProps> = ({
  image,
  imagePosition = 'left',
  panelBackgroundColor = 'cream',
  topSpacing = 'none',
  bottomSpacing = 'none',
  icon,
  headline,
  body,
  email,
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const sectionRef = useRef<HTMLElement | null>(null)

  const panelBg = (panelBackgroundColor || 'cream') as BgKey
  const dark = isDarkPanel(panelBg)
  const imageFirst = imagePosition === 'left'
  const imgObj = typeof image === 'object' && image ? image : null
  const iconObj = typeof icon === 'object' && icon ? icon : null

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

  return (
    <section
      ref={sectionRef}
      className={cn(
        'w-full flex flex-col',
        imageFirst ? 'lg:flex-row' : 'lg:flex-row-reverse',
        topSpacingClass[topSpacing as TopSpacingKey],
        bottomSpacingClass[bottomSpacing as BottomSpacingKey],
      )}
      data-theme={dark ? 'dark' : 'light'}
      aria-label="Have a question"
    >
      {/* Image column — 40% of row, natural aspect (no crop). The
          panel column flex-stretches to match this height on lg+. */}
      <div
        className="lg:w-2/5 relative aspect-[4/3] lg:aspect-auto overflow-hidden bg-warm-gray/10"
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

      {/* Panel column — coloured bg fills the remaining 60% of the
          row. `justify-between` spreads the icon (top) and text
          cluster (bottom) apart, recreating the PDF's airy composition
          with negative space between them. Generous top/bottom padding
          keeps the icon and the email line off the panel edges. */}
      <div
        className={cn(
          'lg:w-3/5 flex flex-col justify-between',
          // Vertical padding: the top padding is intentionally larger
          // than the bottom — the PDF positions the icon ~30-40% from
          // the top (not pinned to the very top edge) and the email
          // line close to the bottom. Heavier `lg:pt-32` (8rem) +
          // lighter `lg:pb-16` (4rem) recreates that.
          'pt-20 pb-12 lg:pt-32 lg:pb-16 px-6 md:px-12',
          // Horizontal padding: heavy on BOTH sides so the content
          // cluster sits in the middle-left area of the panel (not
          // glued to the image seam, not flush with the outer
          // viewport edge). Matches PDF p5 where the icon and text
          // start about a third of the way into the cream panel.
          imageFirst
            ? 'lg:pl-32 lg:pr-20 lg:items-start lg:text-left'
            : 'lg:pl-20 lg:pr-32 lg:items-end lg:text-right',
          panelBgClass[panelBg],
        )}
      >
        {/* Icon — pushed to the TOP of the panel (after pt-32) by
            being the first justify-between child. Larger than the
            EditorialSplit panel icons higher on the page (this block
            has nothing else competing for visual weight). */}
        {iconObj?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconObj.url}
            alt={iconObj.alt || ''}
            className={cn(
              'h-16 w-16 lg:h-24 lg:w-24 object-contain',
              imageFirst ? 'self-start' : 'self-end',
            )}
          />
        ) : (
          // Empty spacer so justify-between still pushes the text
          // cluster to the bottom when no icon is provided.
          <div aria-hidden />
        )}

        {/* Text cluster — pushed to the BOTTOM of the panel (the
            second + last justify-between child). All elements share
            the same horizontal x position via the wrapper's
            `items-start` / `items-end` (set on the parent). */}
        <div
          className={cn(
            'max-w-xl w-full flex flex-col',
            imageFirst ? 'items-start text-left' : 'items-end text-right',
          )}
        >
          {/* Headline — bigger than the EditorialSplit panels above
              (which use `text-display`, 36-48px). Here it carries
              the full visual weight of the cream panel, so we scale
              up to ~64px on desktop. `editorial-display` keeps plain
              words in Gill Sans Light and italic words in Cormorant
              Italic; `[&_em]:text-brand-red` paints "*Question?*"
              in brand red. */}
          <div
            className={cn(
              'editorial-display leading-tight mb-6',
              'text-[2.25rem] md:text-[2.75rem] lg:text-[3.5rem] xl:text-[4rem]',
              '[&_em]:text-brand-red [&_i]:text-brand-red',
            )}
          >
            <RichText data={headline} enableGutter={false} enableProse={false} />
          </div>

          {body && (
            <div className="font-body text-body opacity-90 leading-relaxed mb-4">
              <RichText data={body} enableGutter={false} enableProse={false} />
            </div>
          )}

          {/* Email line — italic "Email:" label + plain-mailto link.
              Matches the PDF exactly (italic "Email:" label, then the
              address in regular weight). */}
          {email && (
            <p className="font-body text-body opacity-95">
              <span className="italic">Email:</span>{' '}
              <a
                href={`mailto:${email}`}
                className="underline underline-offset-4 hover:opacity-100"
              >
                {email}
              </a>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default QuestionPanelBlock
