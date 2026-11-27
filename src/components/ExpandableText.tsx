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

import React, { useEffect, useRef, useState } from 'react'

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
  /** Phones (<768) only, opt-in: the element whose `margin-top: auto` is the
   *  spare room in a full-screen panel (EditorialSplit's content stack).
   *  The text then fills that room: in full, with no Read More, when it all
   *  fits; otherwise as many lines as fit (never fewer than
   *  `mobileLineClamp`) with Read More. Without it the clamp is fixed. */
  fillSpaceRef?: React.RefObject<HTMLElement | null>
}

/** How many of the text's lines end within `height` px of its top. Lines are
 *  read from the laid-out text (lines past a clamp are still laid out), so
 *  the gap between paragraphs counts as it really is. */
const linesWithin = (box: HTMLElement, height: number): number => {
  const top = box.getBoundingClientRect().top
  const bottoms = new Set<number>()
  // Text and line breaks only: a range over another element would also return
  // the element's own box (a paragraph's whole height) as if it were a line.
  // A <br> is read too, so a blank line (an empty paragraph renders as
  // <p><br></p>) counts as the line the clamp counts it as.
  const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: (n) =>
      n.nodeType === Node.TEXT_NODE || (n as Element).tagName === 'BR'
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP,
  })
  const range = document.createRange()
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const isText = node.nodeType === Node.TEXT_NODE
    // A line takes its full line height: the glyphs' box sits in the middle
    // of it, with half the leading below.
    const lh = parseFloat(getComputedStyle((isText ? node.parentElement : (node as Element)) ?? box).lineHeight) || 0
    if (isText) range.selectNodeContents(node)
    else range.selectNode(node)
    for (const r of range.getClientRects()) {
      if (r.height > 0) bottoms.add(Math.round(r.bottom + Math.max(0, (lh - r.height) / 2) - top))
    }
  }
  // Fragments of one line share a bottom (to the pixel); count each line once.
  const sorted = [...bottoms].sort((a, b) => a - b)
  let lines = 0
  let last = -Infinity
  for (const b of sorted) {
    if (b - last > 2) {
      if (b > height + 1) break
      lines++
      last = b
    }
  }
  return lines
}

export const ExpandableText: React.FC<Props> = ({
  children,
  mobileLineClamp = 4,
  className,
  readMoreLabel = 'Read More',
  readLessLabel = 'Read Less',
  toggleClassName,
  fillSpaceRef,
}) => {
  const [expanded, setExpanded] = useState(false)
  // fillSpaceRef only: 'all' = the whole text fits, a number = the lines that
  // fit, null = not measured (server render, tablets up): the fixed clamp.
  const [fit, setFit] = useState<number | 'all' | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  // Height the Read More toggle takes (its own + its top margin), kept from
  // when it was last shown so it is known while hidden.
  const toggleSpace = useRef(0)

  useEffect(() => {
    const stack = fillSpaceRef?.current
    const box = boxRef.current
    if (!stack || !box || expanded) return
    const phones = window.matchMedia('(max-width: 767px)')
    let frame = 0
    // Set on cleanup, so a late callback (fonts.ready, a queued observer) from
    // this run does nothing after Read More is tapped or the text unmounts.
    let cancelled = false
    const measure = () => {
      if (cancelled) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (cancelled) return
        if (!phones.matches) {
          setFit(null)
          return
        }
        const toggle = toggleRef.current
        const toggleShown = !!toggle && toggle.offsetParent !== null
        if (toggleShown) {
          toggleSpace.current = toggle.offsetHeight + parseFloat(getComputedStyle(toggle).marginTop)
        }
        // The stack's auto top margin is the panel's unused room. When the
        // content is taller than the panel's one-screen floor (min-height),
        // the room is negative by the overflow.
        const panel = stack.closest('section') ?? stack.parentElement ?? stack
        const floor = parseFloat(getComputedStyle(panel).minHeight) || 0
        const over = floor > 0 ? Math.max(0, panel.offsetHeight - floor) : 0
        const spare = Math.max(0, parseFloat(getComputedStyle(stack).marginTop) || 0) - over
        // Room for the text if there were no toggle.
        const room = box.clientHeight + spare + (toggleShown ? toggleSpace.current : 0)
        const next: number | 'all' =
          box.scrollHeight <= room + 1
            ? 'all'
            : Math.max(mobileLineClamp, linesWithin(box, room - toggleSpace.current))
        setFit((prev) => (prev === next ? prev : next))
      })
    }
    measure()
    const watch = new ResizeObserver(measure)
    watch.observe(box)
    watch.observe(stack)
    if (stack.parentElement) watch.observe(stack.parentElement)
    // The photo above sets the room left for the text; it can size late.
    const panel = stack.closest('section')
    if (panel) watch.observe(panel)
    phones.addEventListener('change', measure)
    document.fonts?.ready.then(measure)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      watch.disconnect()
      phones.removeEventListener('change', measure)
    }
  }, [fillSpaceRef, mobileLineClamp, expanded])

  // fillSpaceRef, while expanded: the fit was measured for this screen, so a
  // rotation or a real resize closes the text again, and the effect above
  // measures for the new screen (or drops to the fixed clamp from 768 up).
  // The iOS address bar showing or hiding only changes the height a little.
  useEffect(() => {
    if (!expanded || !fillSpaceRef) return
    const w = window.innerWidth
    const h = window.innerHeight
    const onResize = () => {
      if (window.innerWidth !== w || Math.abs(window.innerHeight - h) > 120) setExpanded(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [expanded, fillSpaceRef])

  const lines = typeof fit === 'number' ? fit : mobileLineClamp
  // fillSpaceRef: the height the clamped text had, kept for the expanded
  // scroll area so opening Read More moves nothing below it.
  const [cageHeight, setCageHeight] = useState<number | null>(null)

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
        ref={boxRef}
        className={fit === 'all' ? undefined : expanded ? 'expandable-text-scroll' : 'expandable-text-clamp'}
        // `--clamp-lines` is the per-instance line count used by BOTH
        // the clamp rule (number of visible lines) and the scroll rule
        // (max-height = lines × line-height). Cast to any because
        // React's CSSProperties type doesn't list custom props.
        style={
          {
            ['--clamp-lines' as string]: lines,
            ...(expanded && typeof fit === 'number' && cageHeight ? { maxHeight: cageHeight } : {}),
          } as React.CSSProperties
        }
      >
        {children}
      </div>
      {/* Toggle is mobile-only — desktop always renders full content
          so no toggle is needed. */}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => {
          if (!expanded && typeof fit === 'number' && boxRef.current) setCageHeight(boxRef.current.offsetHeight)
          setExpanded((v) => !v)
        }}
        className={cn(
          // The whole text fits (fillSpaceRef): nothing to expand.
          fit === 'all' && '!hidden',
          // `md:hidden` hides the toggle from tablet up (full text, no
          // clamp). `.expandable-text-toggle` lets globals.css RE-SHOW it on
          // SHORT viewports (landscape tablets / narrow-short windows) where
          // the clamp is re-applied — otherwise the clamped text couldn't be
          // expanded.
          'expandable-text-toggle md:hidden mt-3 font-script italic text-sm underline underline-offset-4',
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
