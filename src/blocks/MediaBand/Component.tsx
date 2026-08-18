'use client'

/**
 * MediaBandBlock — see config.ts for why this block exists.
 *
 * Renders one media panel at a chosen width, aligned left / centre / right
 * within the page, optionally on a black plate and/or inside a 1px maroon
 * hairline. Mobile collapses every width to full and every alignment to
 * centre, because a 60%-wide flush-left image on a 390px screen is just a
 * small picture with a useless margin.
 */

import React, { useEffect, useRef } from 'react'

import type { MediaBandBlock as MediaBandBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { cn } from '@/utilities/ui'

type WidthKey = NonNullable<MediaBandBlockProps['width']>
type AlignKey = NonNullable<MediaBandBlockProps['align']>
type AspectKey = NonNullable<MediaBandBlockProps['aspectRatio']>
type SpacingKey = NonNullable<MediaBandBlockProps['topSpacing']>

/** Panel width. Mobile is always full-bleed; the split applies from `sbs`
 *  (the same tall-landscape breakpoint EditorialSplit uses). */
const widthClass: Record<WidthKey, string> = {
  half: 'w-full sbs:w-1/2',
  'three-fifths': 'w-full sbs:w-[60%]',
  'seven-tenths': 'w-full sbs:w-[70%]',
  full: 'w-full',
}

/** Horizontal placement of the panel inside the page. */
const alignClass: Record<AlignKey, string> = {
  left: 'mr-auto',
  center: 'mx-auto',
  right: 'ml-auto',
}

const aspectClass: Record<AspectKey, string> = {
  natural: '',
  square: 'aspect-square',
  wide: 'aspect-video',
}

const topSpacingClass: Record<SpacingKey, string> = {
  none: '',
  sm: 'pt-[2.5vw]',
  md: 'pt-[4.5vw]',
  lg: 'pt-[6vw]',
}

const bottomSpacingClass: Record<SpacingKey, string> = {
  none: '',
  sm: 'pb-[2.5vw]',
  md: 'pb-[4.5vw]',
  lg: 'pb-[6vw]',
}

const isVideoResource = (resource: unknown): boolean =>
  typeof resource === 'object' &&
  resource !== null &&
  'mimeType' in resource &&
  typeof (resource as { mimeType?: string }).mimeType === 'string' &&
  Boolean((resource as { mimeType?: string }).mimeType?.startsWith('video/'))

export const MediaBandBlock: React.FC<MediaBandBlockProps> = ({
  media,
  width = 'three-fifths',
  align = 'center',
  aspectRatio = 'natural',
  frame = 'none',
  panelBackground = 'none',
  topSpacing = 'md',
  bottomSpacing = 'md',
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const sectionRef = useRef<HTMLElement | null>(null)

  // These bands sit on the page's own light background, so the nav has to
  // go dark-on-light while one is on screen — same IntersectionObserver
  // contract every other block honours.
  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setHeaderTheme('light')
        })
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [setHeaderTheme])

  const mediaObj = typeof media === 'object' && media ? media : null
  if (!mediaObj) return null

  const aspect = (aspectRatio || 'natural') as AspectKey
  const isVideo = isVideoResource(mediaObj)

  // 'natural' reads the file's intrinsic dimensions. Video docs carry none
  // (Payload only measures images), so a video left on 'natural' would
  // collapse to zero height — fall back to square, which is what the one
  // video this block was built for actually is.
  const naturalAspect =
    aspect === 'natural' && mediaObj.width && mediaObj.height
      ? `${mediaObj.width} / ${mediaObj.height}`
      : undefined
  const needsFallback = aspect === 'natural' && !naturalAspect

  return (
    <section
      ref={sectionRef}
      className={cn(
        'relative w-full',
        topSpacingClass[(topSpacing || 'md') as SpacingKey],
        bottomSpacingClass[(bottomSpacing || 'md') as SpacingKey],
      )}
      data-theme="light"
      aria-label={mediaObj.alt || (isVideo ? 'Video' : 'Image')}
    >
      <div
        className={cn(
          'relative overflow-hidden',
          widthClass[(width || 'three-fifths') as WidthKey],
          alignClass[(align || 'center') as AlignKey],
          aspectClass[aspect],
          needsFallback && 'aspect-square',
          frame === 'hairline' && 'border border-[#8e1e24]',
          panelBackground === 'black' && 'bg-black',
        )}
        style={naturalAspect ? { aspectRatio: naturalAspect } : undefined}
      >
        <Media
          fill
          loading="eager"
          imgClassName="absolute inset-0 w-full h-full object-cover"
          videoClassName="absolute inset-0 w-full h-full object-cover"
          resource={mediaObj}
        />
      </div>
    </section>
  )
}

export default MediaBandBlock
