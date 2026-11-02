/**
 * Mouse press-and-drag scrolling below 1024, the way a finger scrolls.
 *
 * Below 1024 the page scrolls inside #scroll-container (globals.css). A
 * finger drags it, but a mouse could only wheel it: pressing and dragging
 * selected text, as on any site, so a laptop window between phone and
 * desktop widths had no phone-like drag. Here a mostly vertical mouse drag
 * moves the page with the pointer, and letting go finishes the move as a
 * swipe does: a quick flick carries on, and on pages that snap (home) the
 * page glides to the rest nearest where the throw lands, one screen at most,
 * so a short slow drag springs back like a phone's.
 *
 * Mouse only (pointerType), so touch keeps the browser's own scrolling, and
 * nothing happens from 1024 up. A drag is not started on the header (which
 * sits inside the container), form fields, the scrollbar's edge, outside the
 * container (cookie banner), while a menu or dialog locks the page, or during
 * the wheel's slide. A press during the glide after a drag catches the page,
 * as a finger catches a flick. A drag that moves sideways first is left alone,
 * so it still drives the carousels and selects text. An opened "Read more" text
 * that scrolls inside its block is dragged itself, like the container.
 *
 * During a drag nothing else follows the mouse: the pointer is captured, so a
 * menu trigger it passes over doesn't open, and Embla, whose mouse path never
 * yields to a vertical move, doesn't drift the slide. The click that ends a
 * drag is swallowed, so links, buttons and the Hero's "next section" click
 * don't fire, and images and links are not picked up for drag-and-drop. An
 * up/down drag no longer selects text across lines there (a sideways drag and
 * a double-click still select).
 */

import { gsap } from 'gsap'

// Movement before a press becomes a drag; below it a press is a click.
const START_PX = 6
// A release carries the page on by its speed over this long, as a flick does.
const THROW_MS = 250
// Only the last moments of a drag count towards its speed.
const SPEED_WINDOW_MS = 100
// A press this close to a scroller's right edge is on its scrollbar, or where
// an overlay scrollbar appears.
const SCROLLBAR_EDGE_PX = 18

const NOT_DRAGGED =
  'header, input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="combobox"], [role="listbox"], [role="slider"]'

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

// Where a snapping container can rest nearest `y`: a section's top or, for one
// taller than the screen, anywhere it fills the screen, as the CSS snap allows.
const nearestRest = (sc: HTMLElement, y: number): number => {
  const screen = sc.clientHeight
  const max = sc.scrollHeight - screen
  const offset = sc.scrollTop - sc.getBoundingClientRect().top
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>('[data-snap-section], [data-mobile-snap-target]'),
  ).filter((el) => el.offsetParent !== null)
  let rest = y
  let gap = Infinity
  sections.forEach((el, i) => {
    const r = el.getBoundingClientRect()
    const from = Math.min(max, r.top + offset)
    // The last section reaches the very end: the cookie banner pads the page
    // below it so the footer's last row can scroll clear of the banner.
    const to =
      i === sections.length - 1
        ? max
        : Math.min(max, Math.max(from, r.top + offset + r.height - screen))
    const here = Math.min(to, Math.max(from, y))
    if (Math.abs(here - y) < gap) {
      gap = Math.abs(here - y)
      rest = here
    }
  })
  return Math.round(rest)
}

type Press = {
  x: number
  y: number
  el: HTMLElement
  top: number
  dragging: boolean
  snaps: boolean
  samples: { t: number; y: number }[]
}

export const installMouseDragScroll = (): (() => void) => {
  const innerScroller = window.matchMedia('(max-width: 1023px)')
  const html = document.documentElement
  let press: Press | null = null
  let glide: gsap.core.Tween | null = null
  let swallowClick = false

  const setSelectable = (selectable: boolean) => {
    html.style.userSelect = selectable ? '' : 'none'
    html.style.webkitUserSelect = selectable ? '' : 'none'
  }

  const onDown = (e: PointerEvent) => {
    swallowClick = false
    if (e.pointerType !== 'mouse' || e.button !== 0 || !innerScroller.matches) return
    const sc = document.getElementById('scroll-container')
    const target = e.target instanceof Element ? e.target : null
    if (!sc || !target || !sc.contains(target) || target.closest(NOT_DRAGGED)) return
    if (html.dataset.navLock || getComputedStyle(sc).overflowY === 'hidden') return
    if (gsap.isTweening(sc) && !glide?.isActive()) return
    const el = scrollerFor(target, sc)
    if (e.clientX > el.getBoundingClientRect().right - SCROLLBAR_EDGE_PX) return
    press = {
      x: e.clientX,
      y: e.clientY,
      el,
      top: el.scrollTop,
      dragging: false,
      snaps: false,
      samples: [{ t: e.timeStamp, y: e.clientY }],
    }
  }

  const onMove = (e: PointerEvent) => {
    if (!press || e.pointerType !== 'mouse') return
    // The button came up where this page couldn't hear it.
    if (!(e.buttons & 1)) {
      if (press.el.hasPointerCapture(e.pointerId)) press.el.releasePointerCapture(e.pointerId)
      return finish(e)
    }
    const dx = e.clientX - press.x
    const dy = e.clientY - press.y
    if (!press.dragging) {
      if (Math.abs(dx) < START_PX && Math.abs(dy) < START_PX) return
      if (Math.abs(dx) >= Math.abs(dy)) {
        press = null
        return
      }
      const caught = glide?.isActive() && glide.targets()[0] === press.el
      // The wheel's slide began after the press: it keeps the page.
      if (!caught && gsap.isTweening(press.el)) {
        press = null
        return
      }
      press.dragging = true
      if (caught) {
        // The snap is already off; the drag goes on from where the glide got to.
        glide?.kill()
        press.snaps = true
        press.top = press.el.scrollTop + dy
      } else {
        press.snaps = getComputedStyle(press.el).scrollSnapType.startsWith('y')
        // The container's CSS snap would pull every step back to a section.
        press.el.style.scrollSnapType = 'none'
      }
      press.el.setPointerCapture(e.pointerId)
      setSelectable(false)
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
    setSelectable(true)
    const { el } = p
    // Speed in page pixels per ms; nothing if the pointer stood still at the end.
    const first = p.samples[0]
    const last = p.samples[p.samples.length - 1]
    const recent = e.timeStamp - last.t < SPEED_WINDOW_MS && last.t > first.t
    const speed = recent ? (first.y - last.y) / (last.t - first.t) : 0
    const thrown = el.scrollTop + speed * THROW_MS
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (p.snaps) {
      // The CSS snap stays off until the page has glided to its rest: turned
      // back on now, it would jump there, or to the nearest section first.
      const screen = el.clientHeight
      const rest = nearestRest(el, Math.min(p.top + screen, Math.max(p.top - screen, thrown)))
      const share = Math.abs(rest - el.scrollTop) / screen
      glide = gsap.to(el, {
        scrollTo: { y: rest, autoKill: false },
        duration: reduce ? 0 : Math.min(0.7, Math.max(0.25, 0.7 * share)),
        ease: 'power2.out',
        overwrite: true,
        onComplete: () => {
          el.style.scrollSnapType = ''
        },
      })
      return
    }
    el.style.scrollSnapType = ''
    if (!reduce && Math.abs(thrown - el.scrollTop) >= 2) {
      el.scrollTo({ top: thrown, behavior: 'smooth' })
    }
  }

  const onUp = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') finish(e)
  }

  // Embla follows the mouse itself and never lets go of a vertical move.
  const onMouseMove = (e: MouseEvent) => {
    if (press?.dragging) e.stopPropagation()
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
  window.addEventListener('mousemove', onMouseMove, true)
  window.addEventListener('dragstart', onDragStart, true)
  window.addEventListener('click', onClick, true)

  return () => {
    window.removeEventListener('pointerdown', onDown, true)
    window.removeEventListener('pointermove', onMove, true)
    window.removeEventListener('pointerup', onUp, true)
    window.removeEventListener('pointercancel', onUp, true)
    window.removeEventListener('mousemove', onMouseMove, true)
    window.removeEventListener('dragstart', onDragStart, true)
    window.removeEventListener('click', onClick, true)
    if (press?.dragging) {
      press.el.style.scrollSnapType = ''
      setSelectable(true)
    }
    press = null
  }
}
