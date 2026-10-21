'use client'

import { OPEN_SETTINGS_EVENT } from './consent'

/**
 * "Cookie Settings" for the footer: reopens the cookie settings at any time,
 * so a visitor can withdraw consent as easily as they gave it. The footer sits
 * outside CookieConsentProvider, so this sends a window event the provider
 * listens for. Pass the className of the sibling footer links so it matches
 * them.
 */
export default function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT))}
    >
      Cookie Settings
    </button>
  )
}
