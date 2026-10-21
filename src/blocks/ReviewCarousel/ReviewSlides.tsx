'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Fade from 'embla-carousel-fade'

export type Review = { id: string; quote: string; author: string; details?: string }

/** After an arrow, a dot or a swipe, the next automatic change waits at least this long. */
const HOLD_AFTER = 8000

/** How long a review stays before the next one comes in: 2.5s plus 0.18s a
 *  word, never under 5s or over 10s (a one-line review 5s, the longest 10s). */
const readingTime = (quote: string): number => {
  const words = quote.split(/\s+/).filter(Boolean).length
  return Math.min(10000, Math.max(5000, 2500 + words * 180))
}

/** The site's red round arrow button (as on the Press carousel): 44px from
 *  768px up, 32px on phones (the user, 21 Oct: smaller there). */
const ArrowButton: React.FC<{
  label: string
  onClick: () => void
  flip?: boolean
  className?: string
}> = ({ label, onClick, flip, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className={[
      'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full md:h-11 md:w-11',
      'bg-brand-red text-white',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite',
      className,
    ].join(' ')}
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`h-3.5 w-3.5 md:h-4 md:w-4${flip ? ' rotate-180' : ''}`}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  </button>
)

/** A red quote mark in the display face, 2.25 times the text (the user asked
 *  twice on 21 Oct for it larger), set so it never makes its line taller: its
 *  top sits level with the tops of the capitals, and a small space (0.09em of
 *  the mark, about 0.2em of the text) separates it from the words. */
const Mark: React.FC<{ children: string; side: 'open' | 'close' }> = ({ children, side }) => (
  <span
    aria-hidden="true"
    className={[
      'font-display font-normal text-brand-red text-[2.25em] leading-[0] align-[-0.37em]',
      side === 'open' ? 'mr-[0.09em]' : 'ml-[0.09em]',
    ].join(' ')}
  >
    {children}
  </span>
)

/**
 * Text entrance: each time a review arrives its words, then its name, rise
 * 12px and fade in (0.7s each, the name 0.2s later; Tailwind's own steps,
 * since arbitrary duration/delay values clash with the animation plugin here
 * and are not generated). The slide is marked data-current="true"/"false"
 * once the carousel is running; before that nothing is hidden. With "reduce
 * motion" nothing moves. Printing shows every review.
 */
const RISE = [
  'motion-safe:transition-[opacity,transform] motion-safe:duration-700 motion-safe:ease-out',
  'motion-safe:group-data-[current=false]/slide:translate-y-3 motion-safe:group-data-[current=false]/slide:opacity-0',
  'print:!translate-y-0 print:!opacity-100',
].join(' ')

/**
 * The reviews, one at a time, on a light band the full width of the window
 * (offwhite, #F5F5F5).
 *
 * Each review: the words, centred, in Gill Sans Light at the Founder Quote's
 * size (20px to 34px), with a red quote mark at its start and end; under it
 * the name, and in grey italic where and when it was posted (after a dot from
 * 768px up, on its own line on phones, where it would wrap). Text column:
 * the intro's (720px, 46.1vw, at most 885px), so its lines are 50 to 60
 * letters long.
 *
 * Movement: Embla with its fade plugin: the reviews cross-fade in place
 * (no sideways slide) and loop. The band is as tall as the longest review
 * (the slides sit in one row, so the row takes the tallest), and each review
 * is centred in it, so the page never jumps as they change. A swipe (phones)
 * or a drag (mouse) also moves it.
 *
 * Automatic change, only while the band is on screen (30% of it or more):
 * each review stays its reading time (readingTime: 5 to 10s). It keeps going
 * under the mouse (the user, 21 Oct: it should autoplay; a pause on hover made
 * it look stuck); it waits while keyboard focus is inside it, and after an
 * arrow, a dot or a swipe the next change comes no sooner than 8s later. With
 * "reduce motion" set it never changes by itself, and the arrows and dots
 * change it at once, without the fade.
 *
 * Controls: the site's red round arrows (as on the Press carousel), at the
 * band's sides from 768px up and either side of the dots on phones. The dots
 * are buttons (the current one a longer red bar, the others faint red): 8px
 * dots 16px apart, each a 24px target, from 768px up; on phones (the user,
 * 21 Oct) 6px dots 8px apart and 32px arrows. A phone dot's target is 14px,
 * under WCAG 2.5.8's 24px, which allows it because the arrows beside it (32px)
 * reach every review too.
 *
 * Screen readers: a region named after the heading, each review a group
 * "n of total", the hidden ones inert; "Review n of total" is read out only
 * when the visitor moves it (the live region's text changes only then, never
 * on an automatic change).
 */
export const ReviewSlides: React.FC<{ reviews: Review[]; label: string }> = ({ reviews, label }) => {
  const count = reviews.length
  const [reduced, setReduced] = useState(false)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: count > 1, duration: 30, active: count > 1 }, [Fade()])

  const regionRef = useRef<HTMLDivElement | null>(null)
  const lastMove = useRef(-Infinity) // when the visitor last moved it (performance.now())
  const pressed = useRef(false) // a finger (or mouse button) is down on the reviews

  const [ready, setReady] = useState(false) // the carousel is running
  const [index, setIndex] = useState(0)
  const [inView, setInView] = useState(true) // until the observer says otherwise
  const [focused, setFocused] = useState(false) // keyboard focus inside
  const [said, setSaid] = useState('') // what the live region last read out

  const times = useMemo(() => reviews.map((review) => readingTime(review.quote)), [reviews])
  const playing = ready && count > 1 && inView && !reduced && !focused

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const el = regionRef.current
    if (!el || count < 2 || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.3,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [count])

  const moved = useCallback(() => {
    lastMove.current = performance.now()
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => {
      const i = emblaApi.selectedScrollSnap()
      setIndex(i)
      // Read the new position out only when the visitor moved it (an arrow, a
      // dot or a swipe just now), never on an automatic change.
      // An automatic change clears the text, so the region never names an old
      // position and the next move is read out even to the same review.
      if (performance.now() - lastMove.current < 1500) setSaid(`Review ${i + 1} of ${count}`)
      else setSaid('')
    }
    // A swipe = the reviews moved while a finger (or mouse button) was down.
    // A touch that scrolls the page up or down never moves them (Embla lets
    // go of a mostly vertical gesture at once), so it does not count.
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
        moved()
      }
    }
    const onUp = () => {
      if (swiped) moved()
      pressed.current = false
    }
    onSelect()
    setReady(true)
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
  }, [emblaApi, moved, count])

  // The automatic change: the next review once this one's reading time is up,
  // and never sooner than HOLD_AFTER after the visitor last moved it. Never
  // under a finger: while one is down, it waits another turn.
  useEffect(() => {
    if (!emblaApi || !playing) return
    let timer = 0
    const restart = () => {
      window.clearTimeout(timer)
      const wait = Math.max(times[emblaApi.selectedScrollSnap()] ?? 5000, lastMove.current + HOLD_AFTER - performance.now())
      timer = window.setTimeout(next, wait)
    }
    // When the turn comes, the hold is checked again: a move that changed
    // nothing (a drag that snapped back, the dot already showing) or the
    // release of a swipe counts too, though it brought no 'select'.
    const next = () => {
      const hold = lastMove.current + HOLD_AFTER - performance.now()
      if (pressed.current) restart()
      else if (hold > 0) timer = window.setTimeout(next, hold)
      else emblaApi.scrollNext()
    }
    restart()
    emblaApi.on('select', restart)
    return () => {
      window.clearTimeout(timer)
      emblaApi.off('select', restart)
    }
  }, [emblaApi, playing, times])

  const go = (to: 'prev' | 'next' | number) => {
    if (!emblaApi) return
    moved()
    if (to === 'prev') emblaApi.scrollPrev(reduced)
    else if (to === 'next') emblaApi.scrollNext(reduced)
    else emblaApi.scrollTo(to, reduced)
  }

  const controls = count > 1

  return (
    <div
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className="w-full bg-offwhite px-9 py-12 md:px-12 md:py-14 lg:px-0 lg:py-[max(56px,calc(4.5714*var(--pp-vw)))] print:bg-transparent print:py-0"
      // Keyboard focus only (:focus-visible): a tapped arrow also takes focus
      // on some phones, and that must not stop the automatic change for good.
      onFocus={(event) => {
        if ((event.target as HTMLElement).matches?.(':focus-visible')) setFocused(true)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          // Keyboard focus leaving counts as a move (the hold starts again);
          // a mouse or touch focus never paused it, so its blur does not.
          if (focused) moved()
          setFocused(false)
        }
      }}
    >
      <div className="mx-auto flex w-full items-center justify-center md:gap-6 lg:gap-[max(24px,calc(3.75*var(--pp-vw)))]">
        {controls && <ArrowButton flip label="Previous review" onClick={() => go('prev')} className="hidden md:inline-flex print:!hidden" />}
        <div
          ref={emblaRef}
          className="min-w-0 flex-1 overflow-hidden lg:max-w-[min(max(720px,46.1vw),885px)] lg:flex-none lg:basis-[min(max(720px,46.1vw),885px)] print:overflow-visible"
        >
          <div className="flex print:!transform-none print:flex-col print:gap-10">
            {reviews.map((review, i) => (
              <div
                key={review.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                inert={controls && i !== index ? true : undefined}
                data-current={ready && controls ? String(i === index) : undefined}
                className="group/slide flex min-w-0 shrink-0 grow-0 basis-full flex-col justify-center text-center print:!pointer-events-auto print:!transform-none print:!opacity-100"
              >
                <figure className="m-0">
                  <blockquote className={`m-0 whitespace-pre-line break-words font-body font-light text-founder-quote leading-[1.5] ${RISE}`}>
                    <Mark side="open">{'“'}</Mark>
                    {review.quote}
                    <Mark side="close">{'”'}</Mark>
                  </blockquote>
                  <figcaption className={`mt-[1.2em] font-body text-body leading-[1.5] motion-safe:group-data-[current=true]/slide:delay-200 ${RISE}`}>
                    <span className="font-normal">{review.author}</span>
                    {review.details && (
                      <span className="block font-light italic text-warm-gray md:inline">
                        <span className="hidden md:inline"> &middot; </span>
                        {review.details}
                      </span>
                    )}
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>
        {controls && <ArrowButton label="Next review" onClick={() => go('next')} className="hidden md:inline-flex print:!hidden" />}
      </div>

      {controls && (
        <div className="mt-6 flex items-center justify-center gap-3 md:mt-8 md:gap-4 print:hidden">
          <ArrowButton flip label="Previous review" onClick={() => go('prev')} className="md:hidden" />
          <div className="flex items-center">
            {reviews.map((review, i) => (
              <button
                key={review.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show review ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                className="rounded-full p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red md:p-2"
              >
                <span
                  aria-hidden="true"
                  className={[
                    'block h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none md:h-2',
                    i === index ? 'w-4 bg-brand-red md:w-6' : 'w-1.5 bg-brand-red/40 md:w-2',
                  ].join(' ')}
                />
              </button>
            ))}
          </div>
          <ArrowButton label="Next review" onClick={() => go('next')} className="md:hidden" />
        </div>
      )}
      {controls && (
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {said}
        </p>
      )}
    </div>
  )
}

export default ReviewSlides
