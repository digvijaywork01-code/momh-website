'use client'

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'

import {
  REVEAL,
  REVEAL_LIVE,
  REVEAL_MARGIN,
  REVEAL_MAX_WAIT,
  REVEAL_OBSERVER,
  REVEAL_OFF,
  REVEAL_STAGGER,
} from './reveal'

/** Phones only: from 768px up the list is the plain grid and Embla is off. */
const CAROUSEL_OFF = '(min-width: 768px)'
/** Automatic sliding: one card every 3 seconds. */
const AUTO_DELAY = 3000
/** After a swipe, an arrow or keyboard focus, sliding pauses this long; with
 *  AUTO_DELAY on top, the next automatic move comes 8 seconds after the last one. */
const RESUME_AFTER = 5000
/** Position dots shown at once (34 would not fit across a phone). */
const DOT_WINDOW = 7

const ICON = {
  prev: (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),
}

const RoundButton: React.FC<{
  label: string
  onClick: () => void
  flip?: boolean
  children: React.ReactNode
}> = ({ label, onClick, flip, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className={[
      'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
      'bg-brand-red text-white',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2',
    ].join(' ')}
  >
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={flip ? 'rotate-180' : undefined}
    >
      {children}
    </svg>
  </button>
)

/**
 * Position dots on the bottom of the photo, in brand red on a light pill, the
 * whole at 70% opacity: a window of up to 7 dots that
 * follows the current card, the current one drawn longer, and the outermost
 * dots smaller when there are more cards beyond them. Decorative: the
 * "n / total" counter below says the same thing in words.
 */
const Dots: React.FC<{ index: number; count: number }> = ({ index, count }) => {
  const size = Math.min(DOT_WINDOW, count)
  const start = Math.min(Math.max(index - Math.floor(DOT_WINDOW / 2), 0), count - size)
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-[calc(min(360px,100cqw_-_72px)*524/377_-_30px)] flex h-[18px] -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/50 px-2.5 opacity-70 md:hidden"
    >
      {Array.from({ length: size }, (_, k) => {
        const i = start + k
        const edge = (k === 0 && start > 0) || (k === size - 1 && start + size < count)
        return (
          <span
            key={i}
            className={[
              'block rounded-full transition-all duration-300 motion-reduce:transition-none',
              i === index ? 'h-1.5 w-4 bg-brand-red' : edge ? 'h-1 w-1 bg-brand-red/40' : 'h-1.5 w-1.5 bg-brand-red/40',
            ].join(' ')}
          />
        )
      })}
    </div>
  )
}

/**
 * The Press Grid's list, as a swipeable carousel on phones (under 768px) and
 * the plain grid from 768px up. One list in the page either way: Embla runs
 * on it below 768px and switches itself off above (its `breakpoints` option),
 * so the cards are not rendered twice, and nothing below runs from 768px up.
 *
 * Phones: one card at a time, centred, with nothing of the next card showing
 * (each slide is the full width of the screen and centres its card). It loops
 * (after the last card comes the first) and slides on by itself every 3
 * seconds while it is on screen. A swipe, an arrow or keyboard focus pauses the
 * sliding, and the next automatic move comes 8 seconds after the last of these
 * (a 5-second pause, then the usual 3-second wait). Only a real
 * sideways swipe counts: on a phone the carousel fills most of the screen, so
 * a thumb scrolling the page up or down usually starts on it, and that must
 * not pause anything. With "reduce motion" set on the phone it does not slide
 * by itself at all.
 *
 * Text: the date, publication, summary and link of the current card rise and
 * fade in one after the other each time a card arrives (the cards read the
 * `data-current` this sets on each slide; see the Press Grid component).
 *
 * Under the card: an "n / total" counter (read out by screen readers only
 * while the sliding is paused, so they are not interrupted every 3 seconds),
 * and the site's red-circle arrows. On the photo: position dots (Dots).
 *
 * The cards themselves (the `<li>`s) are rendered by the server component and
 * passed in as children; `listClassName` carries the grid layout for 768px up.
 *
 * Reveal (768px up; see reveal.ts): each card is marked `data-shown` as it
 * comes into view, which lets it rise and fade in. Cards arriving together
 * (on load, or a fast scroll) go in reading order, one every 0.05s; a group
 * arriving while the previous one is still starting follows on from it, but
 * waits at most 0.1s for it, so even a fast scroll never leaves a card on
 * screen waiting long.
 */
export const PressCarousel: React.FC<{
  count: number
  listClassName: string
  children: React.ReactNode
}> = ({ count, listClassName, children }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    breakpoints: { [CAROUSEL_OFF]: { active: false } },
  })
  const regionRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const resumeTimer = useRef<number | undefined>(undefined)
  const pressed = useRef(false) // a finger (or mouse button) is down on the slides

  const [active, setActive] = useState(false) // carousel on (phones)
  const [index, setIndex] = useState(0)
  const [inView, setInView] = useState(true) // until the observer says otherwise
  const [reduced, setReduced] = useState(false) // "reduce motion" is set: no automatic sliding
  const [holding, setHolding] = useState(false) // a recent swipe / arrow
  const [focused, setFocused] = useState(false) // keyboard focus inside

  const playing = active && inView && !reduced && !holding && !focused && count > 1

  // Carousel on below 768px; no automatic sliding with "reduce motion".
  useEffect(() => {
    const query = window.matchMedia(CAROUSEL_OFF)
    const sync = () => setActive(!query.matches)
    sync()
    query.addEventListener('change', sync)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setReduced(true)
    return () => query.removeEventListener('change', sync)
  }, [])

  // Slide on by itself only while the carousel is on screen (30% of it or more).
  useEffect(() => {
    const el = regionRef.current
    if (!el || !active || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.3,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [active])

  // A swipe or an arrow: pause now, carry on RESUME_AFTER after the last one.
  const hold = useCallback(() => {
    setHolding(true)
    window.clearTimeout(resumeTimer.current)
    resumeTimer.current = window.setTimeout(() => setHolding(false), RESUME_AFTER)
  }, [])
  useEffect(() => () => window.clearTimeout(resumeTimer.current), [])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setIndex(emblaApi.selectedScrollSnap())
    // A swipe = the slides moved while a finger (or mouse) was down (the
    // automatic sliding never moves them then, see below). A touch that
    // scrolls the page up or down never moves them (Embla lets go of a mostly
    // vertical gesture at once), so it does not count.
    let swiped = false
    let from = 0
    const onDown = () => {
      pressed.current = true
      swiped = false
      from = emblaApi.scrollProgress()
    }
    const onScroll = () => {
      if (pressed.current && !swiped && Math.abs(emblaApi.scrollProgress() - from) > 0.0005) {
        swiped = true
        hold()
      }
    }
    const onUp = () => {
      if (swiped) hold()
      pressed.current = false
    }
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    emblaApi.on('pointerDown', onDown)
    emblaApi.on('scroll', onScroll)
    emblaApi.on('pointerUp', onUp)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
      emblaApi.off('pointerDown', onDown)
      emblaApi.off('scroll', onScroll)
      emblaApi.off('pointerUp', onUp)
    }
  }, [emblaApi, hold])

  // Mark the current slide (data-current="true", the others "false") for the
  // text entrance; on wider screens, or before this runs, no slide is marked
  // and every card's text simply shows. Embla moves the list, never reorders
  // it, so child n is card n.
  useEffect(() => {
    const items = Array.from(listRef.current?.children ?? []) as HTMLElement[]
    items.forEach((li, i) => {
      if (active) li.dataset.current = String(i === index)
      else delete li.dataset.current
    })
  }, [active, index])

  // The card reveal. On a full page load START_REVEAL (an inline script) has
  // already started it: take its observer over, so it stops when the page is
  // left. After a client-side navigation (no inline scripts) start it here, in
  // a layout effect, so the cards are hidden before the browser draws them.
  useLayoutEffect(() => {
    const html = document.documentElement
    const list = listRef.current as
      | (HTMLUListElement & { [REVEAL_OBSERVER]?: IntersectionObserver })
      | null
    const items = Array.from(list?.children ?? []) as HTMLElement[]
    const clear = () =>
      [REVEAL, REVEAL_LIVE, REVEAL_OFF].forEach((name) => html.removeAttribute(name))
    const started = list?.[REVEAL_OBSERVER]
    if (list && started) {
      delete list[REVEAL_OBSERVER]
      return () => {
        started.disconnect()
        clear()
      }
    }
    // The safety net already showed every card, or the browser cannot tell
    // what is on screen: leave every card as it is, shown.
    if (html.hasAttribute(REVEAL_OFF) || typeof IntersectionObserver === 'undefined') return clear
    html.setAttribute(REVEAL, '')
    html.setAttribute(REVEAL_LIVE, '')
    let next = 0 // when the next card may start (performance.now() time)
    const observer = new IntersectionObserver(
      (entries) => {
        const now = performance.now()
        let start = now + Math.min(Math.max(next - now, 0), REVEAL_MAX_WAIT)
        entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target as HTMLElement)
          .sort((a, b) => items.indexOf(a) - items.indexOf(b))
          .forEach((li) => {
            observer.unobserve(li)
            li.style.transitionDelay = `${Math.round(start - now)}ms`
            li.dataset.shown = ''
            next = start + REVEAL_STAGGER
            start = next
          })
      },
      { rootMargin: REVEAL_MARGIN },
    )
    items.filter((li) => !li.hasAttribute('data-shown')).forEach((li) => observer.observe(li))
    return () => {
      observer.disconnect()
      clear()
    }
  }, [])

  // The automatic sliding: the next card AUTO_DELAY after the last change.
  // Never under a finger: while one is down, the turn waits for another delay.
  useEffect(() => {
    if (!emblaApi || !playing) return
    let timer = 0
    const next = () => {
      if (pressed.current) restart()
      else emblaApi.scrollNext()
    }
    const restart = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(next, AUTO_DELAY)
    }
    restart()
    emblaApi.on('select', restart)
    return () => {
      window.clearTimeout(timer)
      emblaApi.off('select', restart)
    }
  }, [emblaApi, playing])

  return (
    <div
      ref={regionRef}
      // Keyboard focus only (:focus-visible): a tapped arrow also takes focus
      // on some phones, and that must not stop the sliding for good.
      onFocus={(event) => {
        if ((event.target as HTMLElement).matches?.(':focus-visible')) setFocused(true)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocused(false)
          hold()
        }
      }}
      {...(active
        ? { role: 'region', 'aria-roledescription': 'carousel', 'aria-label': 'Press coverage' }
        : {})}
    >
      {/* On phones this spans the whole screen (it cancels the section's
          36px side padding), so each full-width slide holds one centred
          card; it is also the size container the dots are placed by (the
          photo is min(360px, screen - 72px) wide, 524/377 of that tall).
          From 768px up it is a plain wrapper. */}
      <div className="relative -mx-9 [container-type:inline-size] md:mx-0 md:[container-type:normal]">
        <div ref={emblaRef} className="overflow-hidden md:overflow-visible">
          <ul ref={listRef} role="list" className={listClassName}>
            {children}
          </ul>
        </div>
        {active && count > 1 && <Dots index={index} count={count} />}
      </div>
      {count > 1 && (
        <div className="mx-auto mt-8 flex max-w-[360px] items-center justify-between font-body text-[18px] font-light md:hidden">
          <p aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
            <span className="sr-only">Press item </span>
            {index + 1}
            <span aria-hidden="true"> / </span>
            <span className="sr-only"> of </span>
            {count}
          </p>
          <div className="flex gap-3">
            <RoundButton
              flip
              label="Previous press item"
              onClick={() => {
                hold()
                emblaApi?.scrollPrev()
              }}
            >
              {ICON.prev}
            </RoundButton>
            <RoundButton
              label="Next press item"
              onClick={() => {
                hold()
                emblaApi?.scrollNext()
              }}
            >
              {ICON.prev}
            </RoundButton>
          </div>
        </div>
      )}
    </div>
  )
}

export default PressCarousel
