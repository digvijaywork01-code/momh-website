'use client'

/**
 * useFadeUp — animate the target element fading and sliding up as it enters
 * the viewport. Designed for the content column of EditorialSplitBlock and
 * similar editorial layouts.
 *
 * No-op under prefers-reduced-motion: the element renders in its final
 * position with full opacity, no animation.
 */

import { useEffect } from 'react'
import { gsap } from 'gsap'
// ScrollTrigger is registered globally by SmoothScrollProvider; no import needed.

type Options = {
  /** Distance (in px) the element travels up from. Defaults to 60. */
  travel?: number
  /** Animation duration. Defaults to 1.2 s. */
  duration?: number
  /** ScrollTrigger `start` value. Defaults to "top 80%". */
  start?: string
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const useFadeUp = <T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  opts: Options = {},
) => {
  const { travel = 60, duration = 1.2, start = 'top 80%' } = opts

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) return

    const tween = gsap.fromTo(
      el,
      { y: travel, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: 'play none none reverse',
        },
      },
    )

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [ref, travel, duration, start])
}

export default useFadeUp
