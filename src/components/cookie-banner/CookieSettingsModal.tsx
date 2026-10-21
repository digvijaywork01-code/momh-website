'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { COOKIES_POLICY_URL } from './consent'
import { useCookieConsent } from './cookie-consent-context'

/**
 * Cookie settings: opened from the banner's "Cookie settings" or from the
 * footer at any time, so withdrawing consent is as easy as giving it. Laid out
 * like sunitashekhawat.com's settings window, with this site's only optional
 * category: analytics (Google Analytics); Reject all sits right under Accept
 * all, so refusing is never further down. Esc and the backdrop close it
 * without changing anything; focus stays inside while it is open and returns
 * to where it was afterwards (not when its policy link leaves the page).
 *
 * While it is open the page behind does not scroll: the same lock the header
 * uses for its menus (overflow hidden on <html>, and on #scroll-container
 * when that is the scroller, below 1024), announced with 'momh:nav-lock' so
 * the homepage's wheel snap manager stands down and the wheel scrolls the
 * window instead.
 */

type CategoryId = 'necessary' | 'analytics'

const BUTTON =
  'w-full border-2 border-ink bg-pure-white py-3 text-sm font-normal uppercase tracking-[0.06em] text-ink transition-colors hover:bg-ink hover:text-pure-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/50 focus-visible:ring-offset-2'

/**
 * Stop the page behind the dialog from scrolling; returns the undo. Mirrors
 * the header's menu lock (header.tsx), including the scrollbar-width padding
 * so the page does not shift sideways.
 */
function lockPageScroll(): () => void {
  const html = document.documentElement
  const scrollbar = window.innerWidth - html.clientWidth
  const prev = { overflow: html.style.overflow, paddingRight: html.style.paddingRight }
  html.style.overflow = 'hidden'
  if (scrollbar > 0) html.style.paddingRight = `${scrollbar}px`
  const scroller = document.getElementById('scroll-container')
  const lockScroller = scroller !== null && /^(auto|scroll)$/.test(getComputedStyle(scroller).overflowY)
  const prevScroller = { overflowY: scroller?.style.overflowY ?? '', paddingRight: scroller?.style.paddingRight ?? '' }
  if (scroller && lockScroller) {
    const bar = scroller.offsetWidth - scroller.clientWidth
    scroller.style.overflowY = 'hidden'
    if (bar > 0) scroller.style.paddingRight = `${bar}px`
  }
  const alreadyLocked = !!html.dataset.navLock
  html.dataset.navLock = '1'
  window.dispatchEvent(new CustomEvent('momh:nav-lock', { detail: true }))
  return () => {
    html.style.overflow = prev.overflow
    html.style.paddingRight = prev.paddingRight
    if (scroller && lockScroller) {
      scroller.style.overflowY = prevScroller.overflowY
      scroller.style.paddingRight = prevScroller.paddingRight
    }
    // Leave the lock to the header if it held one before the dialog opened.
    if (!alreadyLocked) {
      delete html.dataset.navLock
      window.dispatchEvent(new CustomEvent('momh:nav-lock', { detail: false }))
    }
  }
}

export default function CookieSettingsModal() {
  const { choice, choose, isSettingsOpen, closeSettings } = useCookieConsent()
  const [analytics, setAnalytics] = useState(false)
  const [expanded, setExpanded] = useState<CategoryId | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const leavingPage = useRef(false)

  // Each time it opens: start from the stored choice, lock the page behind,
  // focus the dialog, and remember what had focus so it can be given back on
  // close.
  useEffect(() => {
    if (!isSettingsOpen) return
    setAnalytics(choice?.analytics ?? false)
    setExpanded(null)
    leavingPage.current = false
    const unlock = lockPageScroll()
    const previous = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => {
      unlock()
      if (!leavingPage.current) previous?.focus?.()
    }
    // Only on open/close: a choice made inside the dialog closes it anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettingsOpen])

  if (!isSettingsOpen) return null

  const save = (value: boolean) => {
    choose(value)
    closeSettings()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      closeSettings()
      return
    }
    if (e.key !== 'Tab' || !dialogRef.current) return
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const toggle = (id: CategoryId) => setExpanded((prev) => (prev === id ? null : id))

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 [font-family:var(--font-body)] print:hidden">
      <div className="absolute inset-0 bg-ink/50" aria-hidden="true" onClick={closeSettings} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-settings-title"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="relative z-10 max-h-[90svh] w-full max-w-2xl overflow-y-auto border border-ink/10 bg-pure-white p-6 text-ink shadow-xl focus:outline-none md:p-8"
      >
        <button
          type="button"
          onClick={closeSettings}
          aria-label="Close cookie settings"
          className="absolute top-2 right-2 flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-ink/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/50"
        >
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>

        <h2 id="cookie-settings-title" className="m-0 pr-8 text-xl font-normal leading-tight md:text-2xl">
          Your privacy preferences
        </h2>
        <p className="mt-3 mb-0 text-base leading-relaxed text-ink">
          Choose which cookies this website may use. The cookies it needs in order to work are always
          on. Analytics cookies are set only if you switch them on. You can change your choice at any
          time with Cookie Settings at the foot of every page of this website.
        </p>
        <p className="mt-2 mb-0 text-base">
          <Link
            href={COOKIES_POLICY_URL}
            onClick={() => {
              leavingPage.current = true
              closeSettings()
            }}
            className="underline underline-offset-2 hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/50 focus-visible:ring-offset-2"
          >
            Read our Cookies Policy
          </Link>
        </p>

        <button type="button" onClick={() => save(true)} className={`${BUTTON} mt-6`}>
          Accept all
        </button>
        <button type="button" onClick={() => save(false)} className={`${BUTTON} mt-3`}>
          Reject all
        </button>

        <h3 className="mt-8 mb-0 text-sm font-normal uppercase tracking-[0.06em]">Manage your choices</h3>

        <div className="mt-4 border border-ink/15">
          {/* Strictly necessary: always on */}
          <div className="border-b border-ink/15 bg-offwhite">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <button
                type="button"
                onClick={() => toggle('necessary')}
                aria-expanded={expanded === 'necessary'}
                aria-controls="cookie-cat-necessary"
                className="flex flex-1 items-center gap-2 text-left text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/50"
              >
                <span aria-hidden="true" className="w-3 text-ink/60">
                  {expanded === 'necessary' ? '−' : '+'}
                </span>
                Strictly necessary
              </button>
              <span className="text-base text-ink">Always on</span>
            </div>
            {expanded === 'necessary' && (
              <p id="cookie-cat-necessary" className="m-0 border-t border-ink/10 px-4 py-3 pl-9 text-base leading-relaxed text-ink/80">
                They keep the website working and secure: your cookie choice is remembered in your
                browser, and Google reCAPTCHA protects the booking form from spam (on the Book Your
                Appointment page only). They cannot be switched off here.
              </p>
            )}
          </div>

          {/* Analytics: the only optional category */}
          <div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <button
                type="button"
                onClick={() => toggle('analytics')}
                aria-expanded={expanded === 'analytics'}
                aria-controls="cookie-cat-analytics"
                className="flex flex-1 items-center gap-2 text-left text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/50"
              >
                <span aria-hidden="true" className="w-3 text-ink/60">
                  {expanded === 'analytics' ? '−' : '+'}
                </span>
                <span id="cookie-cat-analytics-label">Analytics cookies</span>
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={analytics}
                aria-labelledby="cookie-cat-analytics-label"
                onClick={() => setAnalytics((v) => !v)}
                className={`relative h-6 w-11 shrink-0 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/50 focus-visible:ring-offset-2 ${
                  analytics ? 'border-ink bg-ink' : 'border-ink/60 bg-pure-white'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full transition-transform ${
                    analytics ? 'translate-x-5 bg-pure-white' : 'translate-x-0 bg-ink/60'
                  }`}
                />
              </button>
            </div>
            {expanded === 'analytics' && (
              <p id="cookie-cat-analytics" className="m-0 border-t border-ink/10 px-4 py-3 pl-9 text-base leading-relaxed text-ink/80">
                Google Analytics counts visits and shows which pages are read, so that we can improve
                this website. It sets the _ga cookies and sends information about your visit to
                Google, which may also use it to improve its own services, but not for ad
                personalisation.
              </p>
            )}
          </div>
        </div>

        <button type="button" onClick={() => save(analytics)} className={`${BUTTON} mt-6`}>
          Confirm my choices
        </button>
      </div>
    </div>
  )
}
