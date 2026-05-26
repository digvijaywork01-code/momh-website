'use client'

/**
 * ExpandableText — mobile-only "Read More" collapse.
 *
 * Wraps long-form body / quote content. On mobile (< lg breakpoint)
 * the wrapped content is line-clamped to `mobileLineClamp` lines and
 * a small italic "Read More" toggle appears beneath. Tapping the
 * toggle expands the content inline; tapping again collapses.
 *
 * On lg+ desktop the wrapper is a no-op — the toggle is hidden, the
 * content renders at its natural full height. The editorial reading
 * flow on a wide screen doesn't suffer from the same below-the-fold
 * crop that mobile portrait viewports do.
 *
 * The line-clamp itself is applied via the `.expandable-text-clamp`
 * class defined in `globals.css`, which:
 *   - applies `display: -webkit-box; -webkit-line-clamp: var(--clamp-lines)`
 *     on mobile,
 *   - drops the clamp at the `lg` breakpoint so desktop reads full text.
 * The per-instance line count is passed via the `--clamp-lines` CSS
 * custom property on the wrapper.
 */

import React, { useState } from 'react'

import { cn } from '@/utilities/ui'

type Props = {
  children: React.ReactNode
  /** Lines to show in the collapsed state on mobile. Default 4. */
  mobileLineClamp?: number
  /** Optional className applied to the outer wrapper. */
  className?: string
  /** Label shown when the content is collapsed. Default "Read More". */
  readMoreLabel?: string
  /** Label shown when the content is expanded. Default "Read Less". */
  readLessLabel?: string
  /** Extra className applied to the toggle button. Defaults to an
   *  editorial italic underline. */
  toggleClassName?: string
}

export const ExpandableText: React.FC<Props> = ({
  children,
  mobileLineClamp = 4,
  className,
  readMoreLabel = 'Read More',
  readLessLabel = 'Read Less',
  toggleClassName,
}) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={className}>
      <div
        // Collapsed (mobile): `.expandable-text-clamp` truncates to N
        // lines with an ellipsis.
        // Expanded (mobile): `.expandable-text-scroll` keeps the same
        // vertical footprint but scrolls internally, so the block's
        // overall height stays stable and the CTA / sibling content
        // below the toggle doesn't get pushed down.
        // Both rules are no-ops at lg+ (desktop renders full content
        // with no clamp and no scroll cage).
        className={expanded ? 'expandable-text-scroll' : 'expandable-text-clamp'}
        // `--clamp-lines` is the per-instance line count used by BOTH
        // the clamp rule (number of visible lines) and the scroll rule
        // (max-height = lines × line-height). Cast to any because
        // React's CSSProperties type doesn't list custom props.
        style={{ ['--clamp-lines' as string]: mobileLineClamp } as React.CSSProperties}
      >
        {children}
      </div>
      {/* Toggle is mobile-only — desktop always renders full content
          so no toggle is needed. */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'lg:hidden mt-3 font-script italic text-sm underline underline-offset-4',
          'text-current opacity-80 hover:opacity-100 transition-opacity',
          'focus:outline-none focus-visible:ring-1 focus-visible:ring-current',
          toggleClassName,
        )}
        aria-expanded={expanded}
      >
        {expanded ? readLessLabel : readMoreLabel}
      </button>
    </div>
  )
}

export default ExpandableText
