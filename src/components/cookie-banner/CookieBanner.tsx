'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { COOKIES_POLICY_URL } from './consent'
import { useCookieConsent } from './cookie-consent-context'

/**
 * Cookie banner, shown on every page until the visitor chooses: a bar across
 * the full width of the bottom of the window. From 768px it is laid out like
 * sunitashekhawat.com's banner (text left, three equal buttons right). On
 * phones it stacks: title, text, the three buttons full width (Accept,
 * Reject, Settings), then the Cookies and Privacy Policy links (the layout of
 * a consent banner the user shared, 21 Oct). Both use this site's colours and
 * body font (set here: the site sets Gill Sans per block, not on <body>).
 * Accept and Reject look the same on purpose: refusing must be as easy as
 * accepting. The close button counts as Reject.
 *
 * Shown to every visitor, wherever they are. z-[90] keeps it under the phone
 * menu (z-[100]) and over the header (z-50); it stays mounted under the
 * settings window, so closing that returns focus to the button that opened
 * it. It renders nothing until the stored choice has been read, so static
 * pages never flash it at visitors who already chose.
 *
 * While it shows, the page is padded at the bottom by the space it covers,
 * from its top edge to the bottom of the window (scroll padding for keyboard
 * focus, real padding so the last footer links can scroll clear of it): it
 * must never hide what has focus (WCAG 2.4.11).
 * Below 1024 the page scrolls inside #scroll-container, from 1024 up on
 * <html>, so both get the scroll padding.
 */

const BUTTON =
  'border border-ink/30 bg-pure-white font-normal text-ink uppercase tracking-[0.06em] transition-colors hover:bg-ink hover:text-pure-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/50 focus-visible:ring-offset-2 whitespace-nowrap'

const TITLE = 'Cookies on this website'
const TEXT =
  'We would like to use Google Analytics cookies to count visits and see which pages are read, so that we can improve this website. They are set only if you accept them. The cookies this website needs in order to work are always on.'
const LINK =
  'underline underline-offset-2 hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/50 focus-visible:ring-offset-2'

export default function CookieBanner() {
  const { ready, choice, choose, openSettings } = useCookieConsent()
  const visible = ready && !choice
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = barRef.current
    if (!visible || !bar) return
    const html = document.documentElement
    const scroller = document.getElementById('scroll-container')
    const pad = (px: string) => {
      html.style.scrollPaddingBottom = px
      if (scroller) {
        scroller.style.scrollPaddingBottom = px
        scroller.style.paddingBottom = px
      }
    }
    const update = () => pad(`${Math.max(0, Math.ceil(window.innerHeight - bar.getBoundingClientRect().top))}px`)
    const observer = new ResizeObserver(update)
    observer.observe(bar)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
      pad('')
    }
  }, [visible])

  if (!visible) return null

  const accept = () => choose(true)
  const reject = () => choose(false)

  return (
    <div
      ref={barRef}
      role="region"
      aria-label="Cookie choices"
      className="fixed inset-x-0 bottom-0 z-[90] max-h-svh overflow-y-auto border-t border-ink/10 bg-offwhite text-ink [font-family:var(--font-body)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] print:hidden md:max-h-none md:overflow-visible"
    >
      {/* Phones: the buttons stacked, full width */}
      <div className="flex flex-col gap-4 px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:hidden">
        <h2 className="m-0 pr-10 text-[22px] font-normal leading-tight text-ink">{TITLE}</h2>
        <p className="m-0 text-base leading-relaxed text-ink">{TEXT}</p>
        <div className="flex flex-col gap-2.5">
          <button type="button" onClick={accept} className={`${BUTTON} w-full py-3 text-sm`}>
            Accept all
          </button>
          <button type="button" onClick={reject} className={`${BUTTON} w-full py-3 text-sm`}>
            Reject all
          </button>
          <button type="button" onClick={openSettings} className={`${BUTTON} w-full py-3 text-sm`}>
            Cookie settings
          </button>
        </div>
        <p className="m-0 flex justify-center gap-6 text-base">
          <Link href={COOKIES_POLICY_URL} className={LINK}>
            Cookies Policy
          </Link>
          <Link href="/privacy-policy" className={LINK}>
            Privacy Policy
          </Link>
        </p>
      </div>

      {/* Tablet and desktop */}
      <div className="mx-auto hidden max-w-[1440px] items-center justify-between gap-8 py-6 pr-16 pl-8 md:flex lg:pl-12">
        <div className="max-w-[860px] flex-1 pr-10">
          <h2 className="m-0 text-2xl font-normal leading-tight text-ink">{TITLE}</h2>
          <p className="mt-2 mb-0 text-lg leading-relaxed text-ink">{TEXT}</p>
          <p className="mt-2 mb-0 text-base">
            <Link href={COOKIES_POLICY_URL} className={LINK}>
              Read our Cookies Policy
            </Link>
          </p>
        </div>

        <div className="flex w-[240px] flex-shrink-0 flex-col gap-2">
          <button type="button" onClick={openSettings} className={`${BUTTON} px-4 py-3 text-sm`}>
            Cookie settings
          </button>
          <button type="button" onClick={reject} className={`${BUTTON} px-4 py-3 text-sm`}>
            Reject all
          </button>
          <button type="button" onClick={accept} className={`${BUTTON} px-4 py-3 text-sm`}>
            Accept all
          </button>
        </div>
      </div>

      {/* Close (= Reject): the bar's own top-right corner, not the centred
          content's; the content keeps 64px clear on its right (the phone
          title 40px), so they never overlap. */}
      <button
        type="button"
        onClick={reject}
        aria-label="Close and reject analytics cookies"
        className="absolute top-2 right-2 flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-ink/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/50 md:right-3"
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round">
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      </button>
    </div>
  )
}
