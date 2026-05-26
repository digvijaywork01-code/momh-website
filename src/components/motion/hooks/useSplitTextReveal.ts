'use client'

/**
 * useSplitTextReveal — split the target element's text into words and animate
 * each word fading and sliding up from below as the element enters the
 * viewport. Honors the `--ease-out-expo` token via the GSAP "outExpo" custom
 * ease registered by SmoothScrollProvider.
 *
 * Pass a ref to the element whose text should be split. If
 * `prefers-reduced-motion: reduce` is set, the hook is a no-op — the text
 * renders as plain HTML and is fully visible.
 */

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import SplitType from 'split-type'
// ScrollTrigger is registered globally by SmoothScrollProvider; no import needed.

type Options = {
  /** Seconds between each word's reveal. Defaults to 0.08 (80 ms). */
  stagger?: number
  /** Animation duration per word. Defaults to 1.2 s. */
  duration?: number
  /** Distance (in px) each word travels up from. Defaults to 40. */
  travel?: number
  /** ScrollTrigger `start` value. Defaults to "top 80%". */
  start?: string
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const useSplitTextReveal = <T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  opts: Options = {},
) => {
  const { stagger = 0.08, duration = 1.2, travel = 40, start = 'top 80%' } =
    opts
  const splitRef = useRef<SplitType | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) return

    const split = new SplitType(el, { types: 'words' })
    splitRef.current = split
    if (!split.words?.length) return

    const tween = gsap.from(split.words, {
      y: travel,
      opacity: 0,
      duration,
      stagger,
      ease: 'outExpo',
      scrollTrigger: {
        trigger: el,
        start,
        toggleActions: 'play none none reverse',
      },
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
      split.revert()
      splitRef.current = null
    }
  }, [ref, stagger, duration, travel, start])
}

export default useSplitTextReveal
