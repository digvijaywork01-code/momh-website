'use client'

/**
 * BulletListBlock — two-column section: image + bulleted list with a
 * red caps eyebrow.
 *
 * Used twice on `/museum-guidelines` (ESSENTIALS + EXPERIENCE).
 * Eyebrow uses Gill Sans regular caps with wide letter-spacing (matches
 * the ACCESSIBILITY label on PYV + step labels on CYJ ProcessCarousel).
 * Bullets render as `•` markers in front of each item text.
 */

import React from 'react'

import type { BulletListBlock as BulletListBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

type BgKey = NonNullable<BulletListBlockProps['backgroundColor']>

const bgClass: Record<BgKey, string> = {
  ivory: 'bg-ivory text-ink',
  cream: 'bg-cream text-ink',
  white: 'bg-white text-ink',
}

export const BulletListBlock: React.FC<BulletListBlockProps> = ({
  imagePosition = 'right',
  backgroundColor = 'ivory',
  image,
  eyebrow,
  items,
}) => {
  const bg = (backgroundColor || 'ivory') as BgKey
  const imageFirst = imagePosition === 'left'
  const imgObj = typeof image === 'object' && image ? image : null
  const itemList = Array.isArray(items) ? items : []

  return (
    <section
      // No horizontal padding on the section — the image bleeds to
      // the viewport edge on its side. Tight vertical padding so
      // ESSENTIALS and EXPERIENCE sit close together per PDF p5
      // (the two BulletList blocks form a paired editorial spread,
      // not two distant sections).
      className={cn(
        'w-full py-8 lg:py-10',
        bgClass[bg],
      )}
      data-theme="light"
      aria-label={eyebrow || 'Bullet list'}
    >
      <div
        className={cn(
          // Flex row so columns can have asymmetric padding. Stacks
          // vertically (column, image first) on mobile.
          'flex flex-col lg:flex-row w-full',
          imageFirst ? 'lg:flex-row' : 'lg:flex-row-reverse',
        )}
      >
        {/* Image column — flush to the OUTER viewport edge on its
            side (no padding on the bleed side). Takes 50% of the
            section width on lg+. */}
        <div
          className="relative w-full lg:w-1/2 overflow-hidden bg-warm-gray/10"
          style={
            imgObj && imgObj.width && imgObj.height
              ? { aspectRatio: `${imgObj.width} / ${imgObj.height}` }
              : { aspectRatio: '4 / 5' }
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

        {/* Text column — padded on both sides on mobile, with extra
            padding away from the image edge (toward the page centre)
            on lg+ so the bullet list stays readable and doesn't
            jam right up against the image. */}
        <div
          className={cn(
            'flex flex-col w-full lg:w-1/2',
            'px-6 md:px-10 py-10 lg:py-0 lg:flex lg:justify-center',
            // image-right (default) → text on left, padded heavier on
            // the LEFT (toward the page edge) so the bullets sit at
            // a comfortable distance from the image seam at 50%vw.
            // image-left → mirror.
            imageFirst ? 'lg:pl-16 lg:pr-20' : 'lg:pl-20 lg:pr-16',
          )}
        >
          <div className="max-w-xl">
            {eyebrow && (
              <p
                className={cn(
                  'font-body font-normal uppercase mb-8 lg:mb-10',
                  'text-[1.5rem] md:text-[1.75rem] lg:text-[2rem]',
                  'tracking-[0.2em] text-brand-red',
                )}
              >
                {eyebrow}
              </p>
            )}

            {/* Bullet list — manual `•` markers + indent for the text
                column. Each `<li>` is wrapped in flex so the marker
                stays at the top-left of multi-line items. */}
            <ul className="flex flex-col gap-4 font-body text-body opacity-95">
              {itemList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 leading-relaxed">
                  <span className="text-ink/70 shrink-0 select-none" aria-hidden="true">
                    •
                  </span>
                  <div className="flex-1">
                    <RichText
                      data={item.text}
                      enableGutter={false}
                      enableProse={false}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default BulletListBlock
