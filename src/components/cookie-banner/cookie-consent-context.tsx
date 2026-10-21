'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

import {
  CONSENT_STORAGE_KEY,
  OPEN_SETTINGS_EVENT,
  readConsent,
  startGoogleAnalytics,
  stopGoogleAnalytics,
  writeConsent,
  type ConsentChoice,
} from './consent'

type CookieConsentValue = {
  /** False until the stored choice has been read (pages are static, so only after mount). */
  ready: boolean
  /** The visitor's choice, or null while they have not made one (or it expired). */
  choice: ConsentChoice | null
  choose: (analytics: boolean) => void
  isSettingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
}

const CookieConsentContext = createContext<CookieConsentValue | null>(null)

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [choice, setChoice] = useState<ConsentChoice | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    // Follow the stored choice. Without consent this also deletes _ga cookies
    // left by the time when Google Analytics ran on every page without asking.
    const sync = () => {
      const stored = readConsent()
      setChoice(stored)
      setReady(true)
      if (stored?.analytics) startGoogleAnalytics()
      else stopGoogleAnalytics()
    }
    sync()
    // Another open tab, or this page restored by Back from the browser's
    // back/forward cache, may have been left with an older choice: follow the
    // stored one, so a withdrawal anywhere stops Google Analytics everywhere.
    const onStorage = (e: StorageEvent) => {
      if (e.key === CONSENT_STORAGE_KEY || e.key === null) sync()
    }
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) sync()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  // The footer's "Cookie Settings" sits outside this provider, so it opens the
  // settings with a window event instead of calling openSettings.
  useEffect(() => {
    const open = () => setIsSettingsOpen(true)
    window.addEventListener(OPEN_SETTINGS_EVENT, open)
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, open)
  }, [])

  const choose = useCallback((analytics: boolean) => {
    // start/stop are idempotent, so this needs no "did it change" check.
    if (analytics) startGoogleAnalytics()
    else stopGoogleAnalytics()
    setChoice(writeConsent(analytics))
  }, [])

  const openSettings = useCallback(() => setIsSettingsOpen(true), [])
  const closeSettings = useCallback(() => setIsSettingsOpen(false), [])

  return (
    <CookieConsentContext.Provider
      value={{ ready, choice, choose, isSettingsOpen, openSettings, closeSettings }}
    >
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent(): CookieConsentValue {
  const ctx = useContext(CookieConsentContext)
  if (!ctx) throw new Error('useCookieConsent must be used inside CookieConsentProvider')
  return ctx
}
