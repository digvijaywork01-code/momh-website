'use client'

/**
 * ProcessCarouselBlock — centered single-card walkthrough carousel.
 *
 * Used by Craft Your Jewellery for the INSPIRATION → DESIGN →
 * DEVELOPMENT sequence. Single slide visible at a time, full image up
 * top, red step label + body below. Red prev/next circles and the
 * pagination dots both sit on the photo, still, while the slides
 * cross-fade in place underneath, one at a time.
 *
 * One static section bg (no per-slide colour change) — the calmer
 * editorial choice per design direction.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import useEmblaCarousel from 'embla-carousel-react'
import Fade from 'embla-carousel-fade'

import type { ProcessCarouselBlock as ProcessCarouselBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useNoScrollAnimations } from '@/utilities/useNoScrollAnimations'
import { cn } from '@/utilities/ui'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** After an arrow, a dot, a swipe or keyboard use, the next automatic
 *  move waits at least this long: the same 8 seconds as the Testimonials
 *  and Press carousels. */
const HOLD_AFTER = 8000

/** Phones (below 768) only: the photo box, and the arrows-and-dots box laid
 *  over it, are 16:9 instead of the flat 16:5 banner, so the photo is not a
 *  thin strip on a narrow screen. The wide source photos fill it the same way
 *  (object-cover), so only their left and right edges are trimmed. Tablet
 *  and desktop keep 16:5. Tailwind's `max-md:` is not generated here (the
 *  custom raw screens turn max-* off), hence the explicit media query. */
const PHONE_PHOTO_RATIO = '[@media(max-width:767px)]:aspect-video'

/** Which photo file the browser loads. Filling the taller phone box zooms the
 *  ~3.15:1 photo to about 1.78 times the screen width (3.15 / 1.78), so phones
 *  ask for a file that wide and the photo stays sharp. From 768 up it is the
 *  full width, which is what the browser already used there (Media's default
 *  list is all `w` values, which `sizes` ignores, leaving 100vw). */
const PHONE_PHOTO_SIZES = '(max-width: 767px) 178vw, 100vw'

// `backgroundColor` is kept on the schema for forward-compatibility,
// but the component no longer paints the section bg — per design
// direction the carousel images bleed full viewport width on a
// background-less section. Text colour follows the inherited page
// theme (light = dark ink, dark = light offwhite).
export const ProcessCarouselBlock: React.FC<ProcessCarouselBlockProps> = ({
  slides,
  autoplay,
  autoplayInterval,
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const noScrollAnim = useNoScrollAnimations()
  const sectionRef = useRef<HTMLElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  // Section has no explicit bg — assume the surrounding ivory/cream
  // pages so the header theme stays "light" (dark text on light bg).
  const dark = false

  // Cross-fade in place with Embla's official Fade plugin, the same
  // fade as before (`duration: 30` sets how long it takes): the slides
  // stack and dissolve into each other, one slide per move. Movement is
  // independent of `noScrollAnim`: that flag governs SCROLL-driven
  // motion (entrance cascades, smooth scroll, snap), not self-driven UI
  // like a carousel. One plugin instance for the life of the carousel.
  const [plugins] = useState(() => [Fade()])
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', dragFree: false, duration: 30 },
    plugins,
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const slideList = Array.isArray(slides) ? slides : []
  const count = slideList.length
  const interval = autoplayInterval || 5000

  // Automatic sliding, written as on the Testimonials and Press
  // carousels: on only while the carousel is on screen, never with
  // "reduce motion", never while keyboard focus is inside, never under
  // a finger, and after the visitor moves it (arrow, dot or swipe) the
  // next automatic move waits until HOLD_AFTER has passed. A mouse
  // merely resting on it does not pause it (it used to), as on those
  // carousels.
  const [reduced, setReduced] = useState(false)
  const [inView, setInView] = useState(true) // until the observer says otherwise
  const [focused, setFocused] = useState(false) // keyboard focus inside
  // Tab in the background: timers still fire there but the slide cannot
  // move (no animation frames), so moves would pile up and all play at
  // once on return. Stop while hidden, as the Embla Autoplay plugin did.
  const [pageHidden, setPageHidden] = useState(false)
  const pressed = useRef(false) // a finger (or mouse button) is down on the slides
  const lastMove = useRef(-Infinity) // when the visitor last moved it (performance.now())
  const playing =
    autoplay !== false && count > 1 && inView && !reduced && !focused && !pageHidden

  useEffect(() => {
    const sync = () => setPageHidden(document.hidden)
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  // Refs to every slide's text elements so we can drive GSAP entrance
  // animations per-slide on each carousel change. Each array index
  // corresponds to the slide index.
  const labelRefs = useRef<(HTMLParagraphElement | null)[]>([])
  const bodyRefs = useRef<(HTMLDivElement | null)[]>([])

  // Track which slide is active. The select handler ALSO drives the
  // per-slide text entrance, as before: every slide's text is reset
  // (24/16px low, transparent), then the current label rises + fades
  // in and the body follows ~0.15s later, while the photos cross-fade.
  // With "reduce motion" the current slide's text simply shows and the
  // others' is hidden, at once: the slides lie on top of each other, so
  // showing every slide's text printed two texts over each other while
  // a finger swiped the photo.
  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap()
      setSelectedIndex(idx)

      if (reduced) {
        ;[labelRefs.current, bodyRefs.current].forEach((els) => {
          els.forEach((el, i) => {
            if (el) gsap.set(el, { y: 0, opacity: i === idx ? 1 : 0, overwrite: true })
          })
        })
        return
      }

      labelRefs.current.forEach((el) => {
        if (el) gsap.set(el, { y: 24, opacity: 0, overwrite: true })
      })
      bodyRefs.current.forEach((el) => {
        if (el) gsap.set(el, { y: 16, opacity: 0, overwrite: true })
      })

      // Animate the active slide's text in.
      const label = labelRefs.current[idx]
      const body = bodyRefs.current[idx]
      if (label) gsap.to(label, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', overwrite: true })
      if (body)
        gsap.to(body, { y: 0, opacity: 1, duration: 0.8, delay: 0.15, ease: 'power3.out', overwrite: true })
    }
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, reduced])

  const moved = useCallback(() => {
    lastMove.current = performance.now()
  }, [])

  // A swipe = the slides moved while a finger (or mouse button) was
  // down. A touch that scrolls the page up or down never moves them
  // (Embla lets go of a mostly vertical gesture at once), so it does
  // not count.
  useEffect(() => {
    if (!emblaApi) return
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
    // A width change (a tablet turned, a window resized) rebuilds Embla.
    // A press open at that moment is dropped and its release never
    // reported, so treat it as released here, or the automatic move
    // would keep waiting for that finger for good.
    const onReInit = () => {
      if (pressed.current) onUp()
    }
    emblaApi.on('pointerDown', onDown)
    emblaApi.on('scroll', onScroll)
    emblaApi.on('pointerUp', onUp)
    emblaApi.on('reInit', onReInit)
    return () => {
      emblaApi.off('pointerDown', onDown)
      emblaApi.off('scroll', onScroll)
      emblaApi.off('pointerUp', onUp)
      emblaApi.off('reInit', onReInit)
    }
  }, [emblaApi, moved])

  // The automatic move: the next slide `interval` after the last change
  // (the editor's "autoplay interval", 3.5s on the live page), and never
  // sooner than HOLD_AFTER after the visitor last moved it. When the
  // turn comes the hold is checked again, so a move that changed
  // nothing (a drag that snapped back, the dot already showing) counts
  // too. Never under a finger: while one is down it waits another turn.
  useEffect(() => {
    if (!emblaApi || !playing) return
    let timer = 0
    const restart = () => {
      window.clearTimeout(timer)
      const wait = Math.max(interval, lastMove.current + HOLD_AFTER - performance.now())
      timer = window.setTimeout(next, wait)
    }
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
  }, [emblaApi, playing, interval])

  // Slide on by itself only while the carousel is on screen (30% of
  // it or more).
  useEffect(() => {
    const el = sectionRef.current
    if (!el || count < 2 || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.3,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [count])

  // Arrows and dots: a visitor move (starts the hold). With "reduce
  // motion" they jump straight to the slide instead of gliding.
  const go = useCallback(
    (to: 'prev' | 'next' | number) => {
      if (!emblaApi) return
      moved()
      if (to === 'prev') emblaApi.scrollPrev(reduced)
      else if (to === 'next') emblaApi.scrollNext(reduced)
      else emblaApi.scrollTo(to, reduced)
    },
    [emblaApi, moved, reduced],
  )

  // Keyboard (Enter / Space) and screen-reader presses on the arrows and
  // dots. These clicks come with no pointer-down (event.detail is 0).
  // Embla cancels the click that ends a drag, but a finger swipe, or a
  // mouse drag let go outside the carousel, ends with no click, so that
  // cancel stays armed and would swallow the next such press (the
  // controls sit inside Embla's root). So this listener, on an ancestor
  // in the capture phase, runs before Embla's and handles those presses
  // itself, and stops the event so React's onClick does not run them a
  // second time. Pointer clicks and taps (detail 1+) take the normal
  // onClick path; their pointer-down resets Embla's cancel.
  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const onClickCapture = (event: MouseEvent) => {
      if (event.detail !== 0) return
      const button = (event.target as Element | null)?.closest?.('[data-go]')
      if (!button || !card.contains(button)) return
      event.stopPropagation()
      event.preventDefault()
      const to = button.getAttribute('data-go')
      if (to === 'prev' || to === 'next') go(to)
      else if (to !== null && to !== '') go(Number(to))
    }
    card.addEventListener('click', onClickCapture, true)
    return () => card.removeEventListener('click', onClickCapture, true)
  }, [go])

  // Header theme on viewport entry — matches the section bg's contrast.
  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHeaderTheme(dark ? 'dark' : 'light')
          }
        })
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [dark, setHeaderTheme])

  // Entrance cascade — card fades up on viewport entry. Skipped on
  // no-scroll-anim pages and under prefers-reduced-motion.
  useEffect(() => {
    if (prefersReducedMotion() || noScrollAnim) return
    const card = cardRef.current
    if (!card) return
    gsap.set(card, { y: 30, opacity: 0 })
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: 'top 75%',
        toggleActions: 'play reset play reset',
      },
    })
    tl.to(card, { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out' })
    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [noScrollAnim])

  return (
    <section
      ref={sectionRef}
      // No background colour, no horizontal padding — the image inside
      // each slide bleeds the entire viewport width. Vertical padding
      // keeps the step label + body from bumping into adjacent blocks.
      // The same 24px under the text at every width (was 64px, and 80px
      // on lg+), so the slider sits close to the next section.
      className="w-full pt-16 pb-6 lg:pt-20"
      data-theme={dark ? 'dark' : 'light'}
      {...(noScrollAnim ? {} : { 'data-snap-section': true })}
      aria-label="Process"
    >
      <div
        ref={cardRef}
        className="w-full"
        // Keyboard focus only (:focus-visible): a tapped arrow also takes
        // focus on some phones, and that must not stop the sliding for good.
        onFocus={(event) => {
          if ((event.target as HTMLElement).matches?.(':focus-visible')) setFocused(true)
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            // Keyboard focus leaving counts as a move (the hold starts
            // again); a mouse or touch focus never paused it.
            if (focused) moved()
            setFocused(false)
          }
        }}
      >
        {/* Viewport — clips the slide track. Full width, no max-w.
            `relative` anchors the controls overlay to its top, i.e. to
            the top of the image. The track must stay its first child
            (Embla takes root.children[0] as the container).
            `overflow-clip` clips without making a scroll box, so a
            link to a hidden slide's words (Google's "jump to this
            sentence") can no longer scroll the slider sideways and leave
            it blank. `overflow-hidden` stays as the fallback for browsers
            without `clip` (Safari before 16): Tailwind writes the clip
            rule after the hidden one, so clip wins wherever it works. */}
        <div ref={emblaRef} className="relative overflow-hidden overflow-clip">
          {/* Track — flex row, each slide takes 100% of the viewport. */}
          <div className="flex">
            {slideList.map((slide, idx) => {
              const resource =
                typeof slide.image === 'object' ? slide.image : null
              return (
                <div
                  key={idx}
                  className="shrink-0 grow-0 w-full"
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Image — full viewport width, ~16:5 aspect (16:9 on phones, see PHONE_PHOTO_RATIO)
                        (3.2:1 — flat editorial banner). Matches the
                        natural crop of the supplied source files
                        (7990 × 2537 ≈ 3.15:1). Was 16:10 (1.6:1)
                        which left no vertical room for the step
                        label + body text to fit alongside the image
                        in one viewport view; the flatter crop frees
                        ~450px of column height on a 1440 viewport. */}
                    {resource && (
                      <div className={cn('relative w-full aspect-[16/5] overflow-hidden', PHONE_PHOTO_RATIO)}>
                        <Media
                          fill
                          loading="eager"
                          size={PHONE_PHOTO_SIZES}
                          imgClassName="absolute inset-0 w-full h-full object-cover"
                          resource={resource}
                          alt={
                            (typeof resource === 'object' ? resource?.alt : '') ||
                            slide.stepLabel
                          }
                        />
                      </div>
                    )}

                    {/* Text content — constrained to a readable column
                        below the full-bleed image. Bumped outer width
                        from max-w-3xl → max-w-5xl so the description
                        (max-w-3xl inside) can actually use its full
                        intended line length. Horizontal padding lives
                        here so the text never touches the viewport
                        edges even though the image does. */}
                    <div className="w-full max-w-5xl mx-auto px-6 md:px-12">
                      {/* Step label — Gill Sans (sans-serif), regular
                          weight, red, all caps, with wide letter-
                          spacing. PDF uses Gill Sans for the step
                          labels (NOT Cormorant — that's reserved for
                          the editorial display headlines). Same font
                          treatment as the ACCESSIBILITY label on
                          Plan Your Visit. */}
                      <p
                        ref={(el) => {
                          labelRefs.current[idx] = el
                        }}
                        className={cn(
                          // Tighter top margin on lg+ so the whole
                          // slide (image + label + body + dots) fits
                          // in one viewport view.
                          'mt-6 lg:mt-8 font-body font-normal text-[1.5rem] md:text-[1.75rem] lg:text-[2rem]',
                          'tracking-[0.2em] uppercase text-brand-red',
                        )}
                      >
                        {slide.stepLabel}
                      </p>

                      {/* Body — wider container (max-w-3xl / 768px),
                          set in the site's body size and line height
                          (--fs-body / --lh-body, what `text-body` uses)
                          so it matches every other paragraph on the
                          page at every screen width. Written as
                          arbitrary values because cn() would read
                          `text-body` as a colour and drop it in favour
                          of the text colour below. */}
                      <div
                        ref={(el) => {
                          bodyRefs.current[idx] = el
                        }}
                        className={cn(
                          'mt-3 max-w-3xl mx-auto font-body opacity-95',
                          'text-[length:var(--fs-body)] leading-[var(--lh-body)]',
                          dark ? 'text-offwhite/95' : 'text-ink/95',
                        )}
                      >
                        <RichText
                          data={slide.body}
                          enableGutter={false}
                          enableProse={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Controls overlay — exactly the image box: full card width,
              same ratio (16:5; 16:9 on phones), top 0 (the image is every slide's first
              child and `image` is a required field). One shared set of
              arrows and dots (not one per slide), so they stay put while
              the slides fade underneath. The box itself ignores the
              pointer so the photo stays draggable; only the arrows and
              the dot row take clicks. Being inside Embla's root, a swipe
              that starts on an arrow or the dots still moves the slides
              (Embla cancels the click after a real drag, over 10px). */}
          {slideList.length > 1 && (
            <div className={cn('pointer-events-none absolute inset-x-0 top-0 z-10 aspect-[16/5]', PHONE_PHOTO_RATIO)}>
              {/* Prev / Next — on the image at mid-height, left + right
                  edges. Solid brand-red circles, darkening to
                  brand-red-dark on hover (as the InfoHero red buttons
                  do). */}
              <button
                type="button"
                onClick={() => go('prev')}
                data-go="prev"
                aria-label="Previous step"
                className={cn(
                  'pointer-events-auto absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10',
                  'h-11 w-11 md:h-12 md:w-12 flex items-center justify-center rounded-full',
                  'bg-brand-red hover:bg-brand-red-dark text-offwhite transition-colors duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offwhite',
                )}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => go('next')}
                data-go="next"
                aria-label="Next step"
                className={cn(
                  'pointer-events-auto absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10',
                  'h-11 w-11 md:h-12 md:w-12 flex items-center justify-center rounded-full',
                  'bg-brand-red hover:bg-brand-red-dark text-offwhite transition-colors duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offwhite',
                )}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {/* Pagination dots — clickable, with the active dot
                  enlarged, centred near the photo's bottom edge.
                  Inactive dots are light, as on the NumberedGrid photo
                  dots, so they read on the photo instead of the page. */}
              <div className="pointer-events-auto absolute bottom-4 md:bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-3">
                {slideList.map((_, idx) => {
                  const active = idx === selectedIndex
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => go(idx)}
                      data-go={idx}
                      aria-label={`Go to step ${idx + 1}`}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'h-2 rounded-full transition-all duration-300',
                        active
                          ? 'w-6 bg-brand-red'
                          : 'w-2 bg-offwhite/50 hover:bg-offwhite/80',
                      )}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default ProcessCarouselBlock
