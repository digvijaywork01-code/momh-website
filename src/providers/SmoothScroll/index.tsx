'use client'

/**
 * SmoothScrollProvider — Lenis smooth scroll wired into GSAP's ticker.
 *
 * Mounted once in `Providers`, lives for the lifetime of the app. Re-runs
 * `ScrollTrigger.refresh()` on every route change (App Router's `window.load`
 * only fires once on first hard load, so trigger positions go stale after a
 * client-side navigation otherwise).
 *
 * On pages that contain `[data-snap-section]` markers, also installs a
 * wheel-driven section snap manager — one wheel/trackpad gesture past the
 * Hero pin range smoothly animates the scroll to the next section
 * (Musée Atelier-style "one scroll, one block"). Within the Hero pin
 * range we let wheel events pass through so the scrub reveal can scrub
 * naturally.
 *
 * Bails out entirely when the user prefers reduced motion — the page falls
 * back to native browser scroll with no animations.
 */

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { Observer } from 'gsap/Observer'
import { CustomEase } from 'gsap/CustomEase'

import { useNoScrollAnimations } from '@/utilities/useNoScrollAnimations'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Observer, CustomEase)
}

type Props = { children: React.ReactNode }

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const registerEaseFromToken = (name: string, tokenVar: string, fallback: string) => {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(tokenVar)
    .trim()
  const bezier = raw.match(/[\d.]+/g)
  const args = bezier && bezier.length === 4 ? bezier.join(',') : fallback
  CustomEase.create(name, args)
}

const registerEases = () => {
  // Mirror CSS motion tokens into GSAP eases so the design tokens stay
  // the single source of truth.
  registerEaseFromToken('outExpo', '--ease-out-expo', '0.16,1,0.3,1')
  // easeInOutQuart — the curve used for deliberate, editorial section
  // transitions. Slow start, brisk middle, slow landing. Pairs with
  // a longer (~1.4s) duration to feel intentional rather than abrupt.
  registerEaseFromToken('inOutQuart', '--ease-in-out-quart', '0.76,0,0.24,1')
}

/**
 * Section snap manager — GSAP Observer-driven.
 *
 * The raw `wheel` listener we used before fired on every event in a
 * trackpad gesture (dozens per swipe), which made each transition feel
 * stuttered as the listener and the browser's momentum scroll fought
 * each other. Observer collapses a single user gesture into one
 * `onDown` / `onUp` callback no matter how many low-level events make
 * it up. With `preventDefault: true` we own the wheel/touch input
 * entirely and animate the scroll position ourselves, so the result is
 * smooth and predictable.
 *
 * Behavior:
 *  - **Inside the Hero pin range** (scrollY < pinEnd): one gesture
 *    animates the scroll to `pinEnd`, which scrubs the Hero text reveal
 *    timeline from 0 → 1 in a single, deliberate sweep. Wheel-up from
 *    inside the pin sends the user back to scrollY = 0.
 *  - **Past the Hero pin** (scrollY >= pinEnd): each gesture snaps to
 *    the next or previous `[data-snap-section]`.
 *
 * Returns a cleanup function.
 */
const installSectionSnapManager = (): (() => void) => {
  let isAnimating = false

  const getSections = () =>
    Array.from(
      document.querySelectorAll<HTMLElement>('[data-snap-section]'),
    ).filter((el) => el.offsetParent !== null)

  const getPinEnd = (): number => {
    const triggers = ScrollTrigger.getAll()
    let maxEnd = 0
    for (const t of triggers) {
      if (t.pin && typeof t.end === 'number' && t.end > maxEnd) {
        maxEnd = t.end
      }
    }
    return maxEnd
  }

  // Section tops outside the Hero pin range, sorted ascending.
  const getSectionTops = (pinEnd: number): number[] =>
    getSections()
      .map((el) => Math.round(el.getBoundingClientRect().top + window.scrollY))
      .filter((y) => y >= pinEnd - 2)
      .sort((a, b) => a - b)

  // Animate scroll to a target with uniform motion.
  //
  // Why `power1.out` and not `power3.out` / `power2.inOut`:
  //   - Higher-order easings (power3+) have a very steep front edge AND
  //     a very long slow tail. The slow tail is what reads as "stuck
  //     in the middle / sluggish to finish" because the last 30% of
  //     the animation covers only ~5% of the distance.
  //   - `inOut` has a slow START which feels like the gesture didn't
  //     register for 200ms.
  //   - `power1.out` is the gentlest deceleration available — motion
  //     is near-uniform with a soft landing, no harsh start, no long
  //     tail. Feels continuous, like one fluid slide rather than a
  //     "jump-then-settle".
  //
  // Duration is a flat 0.75s so every transition has the same rhythm —
  // users build a mental model of "one wheel = ~0.75s slide" and stop
  // perceiving the motion as variable / unpredictable.
  // Editorial section transition: `inOutQuart` ease + a deliberate
  // 1.4s duration. The slow-start / fast-middle / slow-landing curve
  // reads as an intentional slide rather than a snap. A shorter
  // duration with this curve would feel sluggish at the edges; a
  // shorter curve (e.g. power1.out at 0.75s) reads as abrupt-then-
  // creeping. The combination here is what gives the motion its
  // "confident editorial" quality.
  const animateTo = (target: number, duration = 1.4) => {
    isAnimating = true
    gsap.to(window, {
      scrollTo: { y: target, autoKill: false },
      duration,
      ease: 'inOutQuart',
      // `overwrite: true` kills any pre-existing tween on the same
      // target (window scroll) before starting this one. Without it,
      // a race where Observer fires a second gesture inside the
      // isAnimating debounce window would leave two competing tweens
      // both writing to `scrollTop` — perceived as a hitch or
      // doubled-up motion.
      overwrite: true,
      // `force3D: true` hints the browser to promote the scroll-host
      // to a compositor layer for the duration of the tween. Even
      // though scrollTop is a paint property (not transform), the
      // hint lets the compositor cache adjacent content in textures
      // and avoid full repaints per frame.
      force3D: true,
      onComplete: () => {
        gsap.delayedCall(0.05, () => {
          isAnimating = false
        })
      },
    })
  }

  // Hero pin scrub gets a bit more time than a plain section change —
  // the text reveal cascade + scroll movement happen simultaneously
  // so it benefits from extra breathing room. Both values pair with
  // the inOutQuart ease for a deliberate, editorial pace.
  const HERO_PIN_DURATION = 1.6
  const SECTION_DURATION = 1.4

  const goForward = () => {
    if (isAnimating) return
    const scrollY = window.scrollY
    const pinEnd = getPinEnd()

    if (scrollY < pinEnd - 4) {
      animateTo(pinEnd, HERO_PIN_DURATION)
      return
    }

    const tops = getSectionTops(pinEnd)
    const target = tops.find((y) => y > scrollY + 8)
    if (target == null) return
    animateTo(target, SECTION_DURATION)
  }

  const goBackward = () => {
    if (isAnimating) return
    const scrollY = window.scrollY
    const pinEnd = getPinEnd()

    if (scrollY < pinEnd - 4) {
      animateTo(0, HERO_PIN_DURATION)
      return
    }

    const tops = getSectionTops(pinEnd)
    const above = [...tops].reverse().find((y) => y < scrollY - 8)
    const target = above != null && above >= pinEnd ? above : 0
    // If we're returning from the first post-pin section back into
    // the Hero, that's a scrub-reverse — same duration as forward
    // pin scrub for symmetry.
    const duration = target < pinEnd ? HERO_PIN_DURATION : SECTION_DURATION
    animateTo(target, duration)
  }

  // TWO observers, one per input modality, because GSAP Observer's
  // `onUp` / `onDown` semantics are INVERTED between wheel and touch:
  //
  //   - Wheel (desktop): rolling the wheel DOWN moves content up =
  //     scrolling forward through the page. Observer fires `onDown` →
  //     we call `goForward()`. ✅ matches user intent.
  //
  //   - Touch (mobile): pushing your finger DOWN the screen pulls the
  //     previous content into view = scrolling BACKWARD. Observer
  //     fires `onDown` for that gesture. If we called `goForward()`
  //     here (the wheel mapping), swiping down would send the visitor
  //     forward — the inverted scroll people complained about on the
  //     first mobile launch. So for touch we swap the bindings.
  //
  // Using a single observer with `type: 'wheel,touch,pointer'` forces
  // one shared mapping that's right for wheel and wrong for touch (or
  // vice versa). Two observers with the same `tolerance` and snap
  // animation give us the same editorial behaviour on every device
  // with the correct direction for each modality.
  //
  // See: https://gsap.com/community/forums/topic/35925-how-do-i-make-an-observer-move-in-opposite-directions-when-touch/

  const wheelObserver = Observer.create({
    target: window,
    type: 'wheel,pointer',
    // Lower tolerance = Observer fires sooner during a gesture. 6 is
    // tight enough to feel instant on a trackpad but high enough that
    // accidental wiggles don't trigger a snap.
    tolerance: 6,
    // We take full control of the scroll position — native scroll is
    // suppressed so it can't fight gsap.to(). Keyboard, scrollbar drag,
    // and programmatic scrollTo from elsewhere still work.
    preventDefault: true,
    onDown: () => goForward(),
    onUp: () => goBackward(),
  })

  const touchObserver = Observer.create({
    target: window,
    type: 'touch',
    // Touch tolerance is a bit higher than wheel — phone users do
    // accidental small drags that aren't real swipes (e.g. tap-and-hold
    // before scrolling). 24px lifts that noise floor without making
    // intentional swipes feel sluggish.
    tolerance: 24,
    preventDefault: true,
    // SWAPPED relative to wheel — see comment block above.
    onDown: () => goBackward(),
    onUp: () => goForward(),
  })

  return () => {
    wheelObserver.kill()
    touchObserver.kill()
  }
}

export const SmoothScrollProvider: React.FC<Props> = ({ children }) => {
  const pathname = usePathname()
  const noScrollAnim = useNoScrollAnimations()
  const lenisRef = useRef<Lenis | null>(null)
  const tickerCbRef = useRef<((time: number) => void) | null>(null)

  // Boot once.
  useEffect(() => {
    if (prefersReducedMotion()) return
    // Pages in the no-scroll-anim list (e.g. /plan-your-visit) bypass
    // both Lenis and the section-snap manager — they scroll natively.
    if (noScrollAnim) return

    registerEases()

    // `lagSmoothing(0)` disables GSAP's automatic time-adjustment
    // when a frame takes longer than the threshold (default 500ms).
    // With smoothing ON, a 100ms layout pause would cause GSAP to
    // "catch up" by advancing animation time, producing a visible
    // skip. With smoothing OFF, dropped frames simply mean the next
    // frame uses real elapsed time — motion stays continuous.
    gsap.ticker.lagSmoothing(0)

    // NOTE: `ScrollTrigger.normalizeScroll(true)` was previously
    // enabled here, but it competes with the Observer-driven scroll
    // flow below — Observer already intercepts every wheel/touch
    // event, runs them through a unified gesture pipeline, and calls
    // `gsap.scrollTo` directly. `normalizeScroll` adds a second
    // event interception layer that re-processes those same events,
    // which on some hardware introduces a perceptible micro-lag
    // mid-tween. Removed.

    // Suppress ScrollTrigger.refresh() on mobile address-bar
    // collapse-expand events (iOS Safari fires resize during
    // momentum scroll). A refresh recomputes every trigger's
    // start/end positions — expensive during a scroll animation.
    ScrollTrigger.config({ ignoreMobileResize: true })

    // Lenis takes over wheel events with its own RAF-driven smooth scroll,
    // which bypasses native CSS scroll-snap. When the current page uses
    // [data-snap-section] (Muse-style section snap), skip Lenis entirely
    // — section snapping is handled by the wheel-driven manager installed
    // below + the browser's native CSS snap as a passive fallback. Lenis
    // would intercept the wheel events we need for the snap manager.
    if (document.querySelector('[data-snap-section]')) {
      // Wait one tick so the page's ScrollTriggers (Hero pin etc.) are
      // registered before we install the snap manager — getPinEnd reads
      // ScrollTrigger.getAll() to compute the Hero pin's end position.
      let cleanupSnapManager: (() => void) | null = null
      const id = window.setTimeout(() => {
        cleanupSnapManager = installSectionSnapManager()
      }, 50)
      return () => {
        window.clearTimeout(id)
        cleanupSnapManager?.()
      }
    }

    const lenis = new Lenis({
      lerp: 0.1,
      duration: 1.2,
      smoothWheel: true,
      syncTouch: true,
    })
    lenisRef.current = lenis

    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => {
      lenis.raf(time * 1000)
    }
    tickerCbRef.current = tick
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    // Trigger positions can shift once fonts and images settle.
    const onLoad = () => ScrollTrigger.refresh()
    if (document.readyState === 'complete') {
      onLoad()
    } else {
      window.addEventListener('load', onLoad, { once: true })
    }

    return () => {
      if (tickerCbRef.current) gsap.ticker.remove(tickerCbRef.current)
      tickerCbRef.current = null
      lenis.destroy()
      lenisRef.current = null
      ScrollTrigger.getAll().forEach((t) => t.kill())
      window.removeEventListener('load', onLoad)
    }
    // `noScrollAnim` is a dep so the effect re-runs when the user
    // navigates INTO or OUT OF a no-animation route — that tears down
    // any active Lenis instance / snap manager and re-installs the
    // correct one for the new page.
  }, [noScrollAnim])

  // Refresh ScrollTrigger when the route changes — the new page has different
  // layout heights so trigger positions need to recompute.
  useEffect(() => {
    if (!lenisRef.current) return
    // Reset to top on navigation, then refresh trigger geometry.
    lenisRef.current.scrollTo(0, { immediate: true })
    // requestAnimationFrame so React has flushed the new DOM before measuring.
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [pathname])

  return <>{children}</>
}

export default SmoothScrollProvider
