/**
 * Cookie consent: the visitor's stored choice, and switching Google Analytics
 * on and off to match it.
 *
 * Google Analytics is the only thing on this site that needs consent. It
 * loads only after the visitor accepts it ("basic" consent mode: before that,
 * gtag.js is never requested, so Google receives nothing and no _ga cookie is
 * written). Everything else runs without asking: the stored choice itself,
 * reCAPTCHA on the booking form (spam protection), and Vercel's cookieless
 * Web Analytics / Speed Insights. The Cookies Policy page lists all of them,
 * so keep it in step with any change here.
 *
 * The choice lives in localStorage (not a cookie) under CONSENT_STORAGE_KEY as
 * {"v":1,"analytics":true|false,"at":<ms>}. It expires after
 * CONSENT_MAX_AGE_DAYS, and the banner then asks again.
 */

export const GA_MEASUREMENT_ID = 'G-GK6YKXRPJ8'
export const COOKIES_POLICY_URL = '/cookies-policy'
export const CONSENT_STORAGE_KEY = 'momh-cookie-consent'
export const CONSENT_MAX_AGE_DAYS = 182
/** Window event that opens the cookie settings from outside the provider (the footer). */
export const OPEN_SETTINGS_EVENT = 'momh:open-cookie-settings'

export type ConsentChoice = { analytics: boolean; at: number }

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const GA_DISABLE_KEY = `ga-disable-${GA_MEASUREMENT_ID}`
const MAX_AGE_MS = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000

// Whether Google Analytics is switched on in this page's lifetime. Makes
// start/stop idempotent (React runs mount effects twice in development).
let gaRunning = false

export function readConsent(): ConsentChoice | null {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    const o = JSON.parse(raw) as { v?: unknown; analytics?: unknown; at?: unknown }
    // Expired, stamped in the future by a wrong clock, or not ours: forget it
    // and ask again.
    const age = typeof o.at === 'number' ? Date.now() - o.at : -1
    if (o.v === 1 && typeof o.analytics === 'boolean' && age >= 0 && age <= MAX_AGE_MS) {
      return { analytics: o.analytics, at: o.at as number }
    }
  } catch {
    // Unreadable: forgotten below.
  }
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY)
  } catch {
    // Blocked storage: nothing to remove.
  }
  return null
}

/** Store the choice. Returns it even when storage is blocked, so the page still honours it. */
export function writeConsent(analytics: boolean): ConsentChoice {
  const choice = { analytics, at: Date.now() }
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ v: 1, ...choice }))
  } catch {
    // Private mode or blocked storage: the choice lasts for this page only.
  }
  return choice
}

/**
 * Load Google Analytics, or switch it back on if it was stopped earlier in
 * this visit. gtag.js replays the dataLayer when it arrives, so the commands
 * queued here run in order: consent first, then config (which sends the
 * page_view). Ad signals stay denied: the property has no advertising links.
 */
export function startGoogleAnalytics(): void {
  if (gaRunning) return
  gaRunning = true
  ;(window as unknown as Record<string, unknown>)[GA_DISABLE_KEY] = false
  const firstLoad = typeof window.gtag !== 'function'
  if (firstLoad) {
    const dataLayer = (window.dataLayer = window.dataLayer || [])
    window.gtag = function gtag() {
      // gtag.js reads queued entries as `arguments` objects, never arrays.
      // eslint-disable-next-line prefer-rest-params
      dataLayer.push(arguments)
    }
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })
    window.gtag('js', new Date())
  } else {
    window.gtag?.('consent', 'update', { analytics_storage: 'granted' })
  }
  window.gtag?.('config', GA_MEASUREMENT_ID)
  if (firstLoad && !document.getElementById('ga4-src')) {
    const s = document.createElement('script')
    s.id = 'ga4-src'
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    document.head.appendChild(s)
  }
}

/**
 * Withdrawal: stop Google Analytics for the rest of this visit and delete the
 * cookies it already wrote. gtag.js stays in memory until the next page load,
 * but the ga-disable flag makes it send nothing, and with analytics_storage
 * denied it writes no new cookies.
 */
export function stopGoogleAnalytics(): void {
  gaRunning = false
  ;(window as unknown as Record<string, unknown>)[GA_DISABLE_KEY] = true
  window.gtag?.('consent', 'update', { analytics_storage: 'denied' })
  deleteAnalyticsCookies()
}

/**
 * Delete _ga and _ga_<container>. gtag writes them on the widest domain it can
 * (".momhindia.org"), so try every form the name can have been set with.
 */
function deleteAnalyticsCookies(): void {
  const names = document.cookie
    .split(';')
    .map((c) => c.trim().split('=')[0])
    .filter((n): n is string => !!n && (n === '_ga' || n.startsWith('_ga_')))
  if (!names.length) return
  const host = window.location.hostname
  const parts = host.split('.')
  const domains = new Set<string>(['', host, `.${host}`])
  for (let i = 1; i < parts.length - 1; i++) domains.add(`.${parts.slice(i).join('.')}`)
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`
    }
  }
}
