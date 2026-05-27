'use client'

/**
 * ImageBannerBlock — full-bleed photographic banner.
 *
 * Used at the top + bottom of the Plan Your Visit page (haveli exterior
 * shots, no text overlay). Sets the header theme so the nav bar reads
 * correctly against the image. Marked `data-snap-section` so the
 * smooth-scroll snap manager treats it as a discrete editorial moment.
 */

import React, { useEffect, useRef } from 'react'

import type { ImageBannerBlock as ImageBannerBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useNoScrollAnimations } from '@/utilities/useNoScrollAnimations'
import { cn } from '@/utilities/ui'

type HeightKey = NonNullable<ImageBannerBlockProps['height']>

const heightClass: Record<HeightKey, string> = {
  screen: 'h-svh',
  tall: 'h-[80svh]',
  medium: 'h-[60svh]',
  // 'natural' is handled separately below — it sets aspect-ratio
  // from the image's intrinsic dimensions so the full image is
  // visible with no crop, regardless of viewport height.
  natural: '',
}

export const ImageBannerBlock: React.FC<ImageBannerBlockProps> = ({
  image,
  headerTheme = 'dark',
  height = 'screen',
  caption,
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const noScrollAnim = useNoScrollAnimations()
  const sectionRef = useRef<HTMLElement | null>(null)

  // Push the header theme when this section enters viewport so the nav bar
  // stays legible against the image. Same pattern as EditorialSplit etc.
  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHeaderTheme(headerTheme === 'light' ? 'light' : 'dark')
          }
        })
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [headerTheme, setHeaderTheme])

  const imgObj = typeof image === 'object' && image ? image : null
  const h = (height || 'screen') as HeightKey

  // `height: 'natural'` → set the section's aspect-ratio from the
  // image's own width/height so the full image renders with no crop.
  // Falls back gracefully if the image dims aren't populated.
  const naturalAspect =
    h === 'natural' && imgObj && imgObj.width && imgObj.height
      ? `${imgObj.width} / ${imgObj.height}`
      : undefined
  const naturalStyle = naturalAspect ? { aspectRatio: naturalAspect } : undefined

  return (
    <section
      ref={sectionRef}
      className={cn('relative w-full bg-ink', heightClass[h])}
      style={naturalStyle}
      data-theme={headerTheme === 'light' ? 'light' : 'dark'}
      // Skip snap on no-anim pages so the snap manager (if ever installed
      // by a future code path) wouldn't observe this section.
      {...(noScrollAnim ? {} : { 'data-snap-section': true })}
      aria-label={imgObj?.alt || 'Image banner'}
    >
      {imgObj && (
        <Media
          fill
          loading="eager"
          // 'natural' container already matches the image aspect, so
          // any fit mode gives the same result; sticking with cover
          // keeps behaviour identical to the other modes.
          imgClassName="absolute inset-0 w-full h-full object-cover"
          resource={imgObj}
        />
      )}
      {caption && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-body italic text-eyebrow text-offwhite/80">
          {caption}
        </p>
      )}
    </section>
  )
}

export default ImageBannerBlock
