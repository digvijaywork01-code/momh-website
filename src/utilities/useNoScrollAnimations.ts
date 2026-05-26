'use client'

/**
 * useNoScrollAnimations — returns `true` on pages where scroll-driven motion
 * should be fully disabled.
 *
 * "Scroll-driven motion" here means three things:
 *  1. Lenis smooth scroll (the inertial wheel/touch easing)
 *  2. The section-snap manager (one-gesture-one-section advance)
 *  3. Per-block GSAP entrance cascades (fade-up + image scale on viewport entry)
 *
 * Pages in `NO_ANIM_PATHS` opt out of all three and behave like standard
 * browser-scrolled HTML. Used by `SmoothScrollProvider` and every block
 * component that fires a ScrollTrigger timeline.
 *
 * Keep the list narrow — most editorial pages want the full motion stack.
 */

import { usePathname } from 'next/navigation'

const NO_ANIM_PATHS = [
  '/plan-your-visit',
  '/craft-your-jewellery',
  '/personal-consultation',
  '/museum-guidelines',
  '/book-an-appointment',
  '/thank-you',
]

export const useNoScrollAnimations = (): boolean => {
  const pathname = usePathname()
  if (!pathname) return false
  return NO_ANIM_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export default useNoScrollAnimations
