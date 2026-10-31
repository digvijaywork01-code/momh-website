/**
 * Mouse press-and-drag scrolling below 1024, the way a finger scrolls.
 *
 * Below 1024 the page scrolls inside #scroll-container (globals.css). A
 * finger drags it, but a mouse could only wheel it: pressing and dragging
 * selected text, as on any site, so a laptop window between phone and
 * desktop widths had no phone-like drag. Here a vertical mouse drag moves
 * the page with the pointer, and letting go finishes the move as a swipe
 * does: a quick flick carries on, and on pages that snap (home) the page
 * settles on the section nearest where the throw lands, one section at
 * most, so a short slow drag springs back like a phone's.
 *
 * Mouse only (pointerType), so touch keeps the browser's own scrolling,
 * and nothing happens from 1024 up. A drag is not started on form fields,
 * outside the container (header, cookie banner), while a menu or dialog
 * locks the page, or during the homepage's wheel slide. A drag that moves
 * sideways first is left to the carousels (Embla drags those with the
 * mouse). An opened "Read more" text that scrolls inside its block is
 * dragged itself, like the container.
 *
 * Side effects of a drag: the click that ends it is swallowed, so links,
 * buttons and the Hero's "next section" click don't fire; images and links
 * are not picked up for drag-and-drop; text can't be selected by dragging
 * below 1024 (a double-click still selects a word).
 */

import { gsap } from 'gsap'

// Movement before a press becomes a drag; below it a press is a click.
const START_PX = 6
// A release carries the page on by its speed over this long, as a flick does.
const THROW_MS = 250
// Only the last moments of a drag count towards its speed.
const SPEED_WINDOW_MS = 100

const FIELDS = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

// What a drag moves: the nearest box between the pressed element and the
// container that scrolls vertically, else the container.
const scrollerFor = (target: Element, sc: HTMLElement): HTMLElement => {
  for (let el: Element | null = target; el && el !== sc; el = el.parentElement) {
    if (
      el instanceof HTMLElement &&
      el.scrollHeight > el.clientHeight + 1 &&
      /^(auto|scroll)$/.test(getComputedStyle(el).overflowY)
    ) {
      return el
    }
  }
  return sc
}

type Press = {
  x: number
  y: number
  el: HTMLElement
  top: number
  dragging: boolean
  samples: { t: number; y: number }[]
}

export const installMouseDragScroll = (): (() => void) => {
  const innerScroller = window.matchMedia('(max-width: 1023px)')
  const html = document.documentElement
  let press: Press | null = null
  let swallowClick = false

  const onDown = (e: PointerEvent) => {
    swallowClick = false
    if (e.pointerType !== 'mouse' || e.button !== 0 || !innerScroller.matches) return
    const sc = document.getElementById('scroll-container')
    const target = e.target instanceof Element ? e.target : null
    if (!sc || !target || !sc.contains(target) || target.closest(FIELDS)) return
    if (html.dataset.navLock || getComputedStyle(sc).overflowY === 'hidden') return
    if (gsap.isTweening(sc)) return
    const el = scrollerFor(target, sc)
    press = {
      x: e.clientX,
      y: e.clientY,
      el,
      top: el.scrollTop,
      dragging: false,
      samples: [{ t: e.timeStamp, y: e.clientY }],
    }
  }

  const onMove = (e: PointerEvent) => {
    if (!press || e.pointerType !== 'mouse') return
    // The button came up where this page couldn't hear it.
    if (!(e.buttons & 1)) return finish(e)
    const dx = e.clientX - press.x
    const dy = e.clientY - press.y
    if (!press.dragging) {
      if (Math.abs(dx) < START_PX && Math.abs(dy) < START_PX) return
      if (Math.abs(dx) >= Math.abs(dy)) {
        press = null
        return
      }
      press.dragging = true
      // The container's CSS snap would pull every step back to a section.
      press.el.style.scrollSnapType = 'none'
      html.style.userSelect = 'none'
      window.getSelection()?.removeAllRanges()
    }
    press.el.scrollTop = press.top - dy
    press.samples.push({ t: e.timeStamp, y: e.clientY })
    while (press.samples.length > 2 && e.timeStamp - press.samples[0].t > SPEED_WINDOW_MS) {
      press.samples.shift()
    }
  }

  const finish = (e: PointerEvent) => {
    const p = press
    press = null
    if (!p?.dragging) return
    // The click that follows this release is swallowed; one that never comes
    // must not linger and eat a later keyboard click.
    swallowClick = true
    window.setTimeout(() => {
      swallowClick = false
    }, 0)
    html.style.userSelect = ''
    const { el } = p
    // Speed in page pixels per ms; nothing if the pointer stood still at the end.
    const first = p.samples[0]
    const last = p.samples[p.samples.length - 1]
    const recent = e.timeStamp - last.t < SPEED_WINDOW_MS && last.t > first.t
    const speed = recent ? (first.y - last.y) / (last.t - first.t) : 0
    let target = el.scrollTop + speed * THROW_MS
    el.style.scrollSnapType = ''
    // A snapping container settles on the section nearest the throw, at
    // most one screen from where the drag began.
    const snaps = getComputedStyle(el).scrollSnapType.startsWith('y')
    if (snaps) target = Math.min(p.top + el.clientHeight, Math.max(p.top - el.clientHeight, target))
    else if (Math.abs(target - el.scrollTop) < 2) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' })
  }

  const onUp = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') finish(e)
  }

  // A drag over an image or link would otherwise start the browser's own
  // drag-and-drop, which ends the pointer events mid-scroll.
  const onDragStart = (e: DragEvent) => {
    if (press) e.preventDefault()
  }

  const onClick = (e: MouseEvent) => {
    if (!swallowClick) return
    swallowClick = false
    e.preventDefault()
    e.stopPropagation()
  }

  window.addEventListener('pointerdown', onDown, true)
  window.addEventListener('pointermove', onMove, true)
  window.addEventListener('pointerup', onUp, true)
  window.addEventListener('pointercancel', onUp, true)
  window.addEventListener('dragstart', onDragStart, true)
  window.addEventListener('click', onClick, true)

  return () => {
    window.removeEventListener('pointerdown', onDown, true)
    window.removeEventListener('pointermove', onMove, true)
    window.removeEventListener('pointerup', onUp, true)
    window.removeEventListener('pointercancel', onUp, true)
    window.removeEventListener('dragstart', onDragStart, true)
    window.removeEventListener('click', onClick, true)
    if (press?.dragging) {
      press.el.style.scrollSnapType = ''
      html.style.userSelect = ''
    }
    press = null
  }
}
