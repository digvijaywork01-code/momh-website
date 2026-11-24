/**
 * Browser side of Google reCAPTCHA v3 for the three public forms (the
 * server check is src/utilities/recaptcha.ts).
 *
 * v3 shows no box: when a form is sent, Google's script scores the visit
 * and returns a token, which the form sends with its answers. Google's
 * floating badge is hidden; each form shows the short notice Google asks
 * for instead (src/components/RecaptchaNotice.tsx).
 *
 * NEXT_PUBLIC_RECAPTCHA_SITE_KEY is the v3 site key (public by design).
 * Without it nothing loads and the forms send no token; the server skips
 * its check while its secret is unset too.
 *
 * Local testing only: NEXT_PUBLIC_RECAPTCHA_SCRIPT_URL loads a fake script
 * instead of Google's; it is ignored in production builds.
 */

type Grecaptcha = {
  ready: (cb: () => void) => void
  execute: (siteKey: string, options: { action: string }) => Promise<string>
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha
  }
}

export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''

/** Shown inside the forms' "Sorry — {message}. Please try again or email us…" line. */
export const RECAPTCHA_FAILED =
  'we could not run the reCAPTCHA spam check (an ad blocker or privacy setting may be stopping it)'

const LOAD_TIMEOUT_MS = 10_000
const TOKEN_TIMEOUT_MS = 10_000

const scriptUrl = (): string =>
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_RECAPTCHA_SCRIPT_URL
    ? process.env.NEXT_PUBLIC_RECAPTCHA_SCRIPT_URL
    : // Google's own address for its script that also works where
      // www.google.com is blocked (mainland China).
      `https://www.recaptcha.net/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}`

let loading: Promise<boolean> | null = null

/**
 * Loads Google's script once per page (later calls share it). Resolves
 * true when it is ready, false if it could not load in 10 seconds.
 */
export const loadRecaptcha = (): Promise<boolean> => {
  if (!RECAPTCHA_SITE_KEY || typeof window === 'undefined') return Promise.resolve(false)
  if (window.grecaptcha) return Promise.resolve(true)
  if (loading) return loading
  const attempt = new Promise<boolean>((resolve) => {
    // Google's badge floats over the page; the forms carry the notice.
    const style = document.createElement('style')
    style.textContent = '.grecaptcha-badge{visibility:hidden}'
    document.head.appendChild(style)

    const script = document.createElement('script')
    script.src = scriptUrl()
    script.async = true
    const timer = setTimeout(() => resolve(false), LOAD_TIMEOUT_MS)
    script.onload = () => {
      clearTimeout(timer)
      resolve(Boolean(window.grecaptcha))
    }
    script.onerror = () => {
      clearTimeout(timer)
      resolve(false)
    }
    document.head.appendChild(script)
  })
  loading = attempt
  // A failed load may be retried on the next send.
  attempt.then((ok) => {
    if (!ok && loading === attempt) loading = null
  })
  return attempt
}

/**
 * A fresh token for this send (each is single-use and lasts 2 minutes).
 *   ''      reCAPTCHA is not set up on this site: send without one.
 *   string  the token.
 *   null    it is set up but the check could not run (script blocked or
 *           too slow): do not send; show RECAPTCHA_FAILED.
 */
export const getRecaptchaToken = async (action: string): Promise<string | null> => {
  if (!RECAPTCHA_SITE_KEY) return ''
  if (!(await loadRecaptcha())) return null
  const grecaptcha = window.grecaptcha
  if (!grecaptcha) return null
  try {
    return await new Promise<string | null>((resolve) => {
      const timer = setTimeout(() => resolve(null), TOKEN_TIMEOUT_MS)
      grecaptcha.ready(() => {
        grecaptcha
          .execute(RECAPTCHA_SITE_KEY, { action })
          .then((token) => {
            clearTimeout(timer)
            resolve(typeof token === 'string' && token ? token : null)
          })
          .catch(() => {
            clearTimeout(timer)
            resolve(null)
          })
      })
    })
  } catch {
    return null
  }
}
