'use client'

import CookieBanner from './CookieBanner'
import CookieSettingsModal from './CookieSettingsModal'
import { CookieConsentProvider } from './cookie-consent-context'

/**
 * Cookie consent for every public page: the banner, the settings window, and
 * Google Analytics, which loads only after the visitor accepts it (see
 * consent.ts). Mounted once in the frontend layout.
 */
export function CookieConsent() {
  return (
    <CookieConsentProvider>
      <CookieBanner />
      <CookieSettingsModal />
    </CookieConsentProvider>
  )
}
