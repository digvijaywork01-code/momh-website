import React from 'react'

import type { DividerBlock as DividerBlockProps } from '@/payload-types'

import { cn } from '@/utilities/ui'

/**
 * Spacing presets. Tailwind only generates classes it can see written out,
 * so every option is spelled in full here.
 *
 * The divider sits in an EVEN white gap, the same above and below:
 *   above = last text baseline -> top of the art
 *   below = bottom of the art  -> top of the next heading's capitals
 *
 * Mobile & tablet (below lg): --divider-gap-m is that gap: Large = 48px on
 * phones and 56px on tablets (768px+, so it meets the 56px desktop floor
 * at 1024 without a jump). Medium = 3/4, Small = 1/2, None = no spacing of
 * its own. The block above ends with 32px of padding (48px from md), which
 * the top margin allows for.
 *
 * Desktop (lg+): --divider-gap is that gap. Large = 64px at a 1400px
 * laptop (4.5714vw), never below 56px, and frozen at its 1920 size (87.8px)
 * above that, like the type. Medium = 3/4 of it, Small = 1/2, None = no
 * spacing of its own.
 * The block above (TextSection, or SectionIntro with "tight bottom") already
 * ends with 48px of padding, plus the part of its last line below the
 * baseline (0.4202em of the body size). --divider-mt is the top margin that
 * leaves exactly the gap; it can be negative (pulling the divider up into
 * that padding), but only directly under a Text Section. Elsewhere it is
 * floored at 0. Large is never negative, so it is even under either block. Below the art,
 * the heading's capitals start 0.1678em below its line top (Gill Sans Light
 * at line-height 1.05, cap height 0.687em), so that is subtracted.
 * --pp-vw is 1vw frozen at 19.2px above 1920, where the type stops growing.
 */
type Spacing = NonNullable<DividerBlockProps['desktopSpacing']>

const mobileSpacing: Record<Spacing, string> = {
  large:
    'pt-0 [--divider-mt:calc(var(--divider-gap-m)_-_2rem_-_0.4202*var(--fs-body))] md:[--divider-mt:calc(var(--divider-gap-m)_-_3rem_-_0.4202*var(--fs-body))] pb-[max(0px,calc(var(--divider-gap-m)_-_0.1678*var(--fs-display)))]',
  medium:
    'pt-0 [--divider-mt:calc(0.75*var(--divider-gap-m)_-_2rem_-_0.4202*var(--fs-body))] md:[--divider-mt:calc(0.75*var(--divider-gap-m)_-_3rem_-_0.4202*var(--fs-body))] pb-[max(0px,calc(0.75*var(--divider-gap-m)_-_0.1678*var(--fs-display)))]',
  small:
    'pt-0 [--divider-mt:calc(0.5*var(--divider-gap-m)_-_2rem_-_0.4202*var(--fs-body))] md:[--divider-mt:calc(0.5*var(--divider-gap-m)_-_3rem_-_0.4202*var(--fs-body))] pb-[max(0px,calc(0.5*var(--divider-gap-m)_-_0.1678*var(--fs-display)))]',
  none: 'pt-0 pb-0 [--divider-mt:0px]',
}

const desktopSpacing: Record<Spacing, string> = {
  large:
    'lg:pt-0 lg:[--divider-mt:calc(var(--divider-gap)_-_3rem_-_0.4202*var(--fs-body))] lg:pb-[max(0px,calc(var(--divider-gap)_-_0.1678*var(--fs-display)))]',
  medium:
    'lg:pt-0 lg:[--divider-mt:calc(0.75*var(--divider-gap)_-_3rem_-_0.4202*var(--fs-body))] lg:pb-[max(0px,calc(0.75*var(--divider-gap)_-_0.1678*var(--fs-display)))]',
  small:
    'lg:pt-0 lg:[--divider-mt:calc(0.5*var(--divider-gap)_-_3rem_-_0.4202*var(--fs-body))] lg:pb-[max(0px,calc(0.5*var(--divider-gap)_-_0.1678*var(--fs-display)))]',
  none: 'lg:pt-0 lg:pb-0 lg:[--divider-mt:0px]',
}

/** Show on: desktop = 1024px and wider (lg), mobile = under 1024px. */
const showOnClass = {
  all: 'flex',
  desktop: 'hidden lg:flex',
  mobile: 'flex lg:hidden',
} as const

/**
 * Gold lotus divider (Privacy Policy PDF).
 *
 * Tablets and up (md+) draw the PDF artwork at its artboard proportion:
 * 778.836pt of a 1920pt artboard = 40.5644vw wide (frozen at 778.8px above
 * 1920), so hairline length, taper, the gaps either side of the lotus and
 * the lotus size all scale together. Like the text column (672px minimum),
 * it never drops below the PDF's ratio to that column: 0.683 x 672 = 459px.
 * Phones (below md) use a compact version: 56px lotus, 72px hairlines,
 * 1.5px thick (drawn 1:1 at 255px).
 *
 * RenderBlocks adds no space between blocks, so the divider owns the gap
 * above and below its art (presets above). Decorative only.
 */
export const DividerBlock: React.FC<DividerBlockProps> = ({
  showOn = 'all',
  desktopSpacing: desktop = 'large',
  mobileSpacing: mobile = 'large',
}) => {
  return (
    <div
      className={cn(
        'lotus-divider w-full justify-center',
        '[--pp-vw:min(1vw,19.2px)] [--divider-gap:max(56px,4.5714*var(--pp-vw))]',
        '[--divider-gap-m:48px] md:[--divider-gap-m:56px]',
        // The pull-up only happens under a Text Section, whose padding it was
        // measured against; under any other block it is floored at 0, so the
        // art can never slide under an image or other content.
        'mt-[max(0px,var(--divider-mt))] [.text-section+&]:mt-[var(--divider-mt)]',
        showOnClass[showOn || 'all'],
        mobileSpacing[mobile || 'large'],
        desktopSpacing[desktop || 'large'],
      )}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/momh-assets/divider/lotus-divider.svg"
        alt=""
        width={779}
        height={61}
        className="hidden md:block w-[min(max(459px,40.5644vw),778.8px)] h-auto"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/momh-assets/divider/lotus-divider-mobile.svg"
        alt=""
        width={255}
        height={36}
        className="block md:hidden w-[255px] h-auto"
      />
    </div>
  )
}

export default DividerBlock
