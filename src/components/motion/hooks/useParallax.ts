'use client'

/**
 * useParallax — scrub a y-axis parallax on the target element as its parent
 * section scrolls past. Used for full-bleed images that should drift gently
 * upward as the viewport advances.
 *
 * No-op under prefers-reduced-motion.
 */

import { useEffect } from 'react'
import { gsap } from 'gsap'
// ScrollTrigger is registered globally by SmoothScrollProvider; no import needed.

type Options = {
  /** Maximum yPercent offset at scroll-end (positive = drift down). Defaults to 15. */
  amount?: number
  /** Optional override for the ScrollTrigger trigger element. Defaults to the parent of `ref.current`. */
  trigger?: HTMLElement | null
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const useParallax = <T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  opts: Options = {},
) => {
  const { amount = 15, trigger } = opts

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) return

    const triggerEl = trigger ?? el.parentElement
    if (!triggerEl) return

    const tween = gsap.fromTo(
      el,
      { yPercent: -amount },
      {
        yPercent: amount,
        ease: 'none',
        scrollTrigger: {
          trigger: triggerEl,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      },
    )

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [ref, amount, trigger])
}

export default useParallax
