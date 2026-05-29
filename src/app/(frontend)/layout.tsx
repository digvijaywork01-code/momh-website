'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
// import { AdminBar } from '@/components/AdminBar'
// import { Footer } from '@/Footer/Component'
// import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import Header from '@/components/header/header'
import Footer from '@/components/footer/footer'
import FlowerPaintings from '@/components/body/FlowerPaintings'
import { useNoScrollAnimations } from '@/utilities/useNoScrollAnimations'
import { cn } from '@/utilities/ui'
// import { draftMode } from 'next/headers'

import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const noScrollAnim = useNoScrollAnimations()
  const [isMobile, setIsMobile] = useState(false)
  // Reserved hook for any future page that wants to opt out of the
  // global Header / FlowerPaintings / Footer chrome.
  // /book-an-appointment and /appointment-booked used to live here
  // while they were hand-rolled standalone pages; both are now
  // Payload-managed (book-an-appointment) or deleted
  // (appointment-booked → replaced by the AppointmentForm block's
  // inline success message), so the exception list is empty.
  const hideGlobalElements = false

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Inner mobile pages USED to need extra top padding because the
  // mobile nav was a solid white bar that pushed content down. Now
  // the nav is fully transparent at every breakpoint (see
  // header.tsx → `mobileBg`), so the top image banner can sit flush
  // against the viewport top and the nav floats over it as chrome.
  // `needsMobilePadding` is permanently false now; keeping the
  // identifier so the wrapper-className branch below still compiles
  // unchanged.
  const isHomePage = pathname === '/'
  void isHomePage // suppress unused-var warning — retained for context
  const needsMobilePadding = false

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Self-hosted font stylesheets — loaded as <link> tags because
            CSS @import rules must precede all other CSS, which can't be
            guaranteed once globals.css is bundled with tokens.css and
            Tailwind base/components/utilities. Loading via <link> keeps
            the @font-face declarations in their own stylesheet, so the
            browser registers them with document.fonts. */}
        <link rel="stylesheet" href="/fonts/cormorant/stylesheet.css" />
        <link rel="stylesheet" href="/fonts/gill-sans/stylesheet.css" />
        <link rel="stylesheet" href="/fonts/helvetica-neue/stylesheet.css" />
        <link rel="stylesheet" href="/fonts/times-now/stylesheet.css" />
        {/* Cormorant Light 300 (regular style) — the local /fonts/cormorant
            bundle only ships Regular 400, RegularItalic 400 and
            LightItalic 300; without 300-normal the Founder block's
            "SUNITA SHEKHAWAT" line was being rendered at 400 by the
            browser, killing the PDF's Light vs Regular hierarchy. This
            link adds the missing weight (and only that weight) from the
            Google Fonts CDN so the @font-face stack now covers 300/400
            in both styles. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant:wght@300;500;600&display=swap"
        />
        {/* TODO(adobe-fonts-kit): swap KIT_ID with the project's Typekit kit id.
            Once enabled, the --font-display token resolves to Meno Banner.
            Until then, Cormorant (self-hosted) is the display fallback. */}
        {/* <link rel="stylesheet" href="https://use.typekit.net/KIT_ID.css" /> */}
      </head>
      <body className="overflow-x-hidden">
        {/* Mobile scroll container.
         *
         * Mobile browsers collapse the address bar when the page
         * itself scrolls, which resizes the viewport mid-scroll and
         * causes layout shift across the editorial blocks. Muse
         * Atelier and similar luxury sites avoid this by locking
         * the body and scrolling an inner container instead — the
         * browser sees "no page scroll" and the address bar stays
         * put.
         *
         * Implementation: `id="scroll-container"` is the actual
         * scroller. CSS in globals.css gates the lock + snap rules
         * to `< lg` (max-width 1023px), so desktop keeps native
         * page-level scroll + the GSAP wheel observer unchanged.
         *
         * scroll-snap-type + scroll-snap-align on every
         * [data-snap-section] turns each editorial block into a
         * mandatory snap point — one swipe = one section.
         */}
        {/* `data-snap-enabled` toggles the mobile mandatory scroll-snap.
         *
         * Home page (and any other path NOT in useNoScrollAnimations'
         * NO_ANIM_PATHS list) sets it to `true` — the CSS in globals.css
         * gates `scroll-snap-type: y mandatory` on this attribute, so
         * snap activates only when wanted.
         *
         * Internal pages (Plan Your Visit, Personal Consultation,
         * Museum Guidelines, Book An Appointment, Thank You, etc.) set
         * it to `false`. These pages are dense reads — visitor needs to
         * scroll naturally through long-form content, not be force-
         * snapped block-by-block. With snap-type off, every block's
         * `scroll-snap-align: start` becomes inert (no snap container,
         * no snap behaviour), and no block-level code changes are
         * needed to opt into the natural-scroll mode. */}
        <div id="scroll-container" data-snap-enabled={!noScrollAnim}>
          <Providers>
            {!hideGlobalElements && <Header />}

            <div className={needsMobilePadding ? 'pt-[16svh] mobile-padding-custom sm:pt-[20svh]' : ''}>
              {children}
            </div>

          {!hideGlobalElements && (
            // FlowerPaintings + Footer wrapped as a single snap section
            // so they participate in the section-snap rhythm like every
            // other block. `min-h-svh` gives the wrapper a full-viewport
            // presence; `justify-end` pushes the content to the wrapper's
            // bottom edge; `[scroll-snap-align:end]` overrides the
            // global `start` alignment so the wrapper's BOTTOM (== the
            // bottom of the footer) lands at the viewport bottom when
            // snapped.
            //
            // End-alignment matters: on small phones the flowers +
            // footer content together (~700px) is slightly TALLER than
            // a viewport (~667px). With the default start-alignment,
            // the bottom ~30px of the footer (copyright row) was
            // permanently below the fold under mandatory snap — there's
            // no further snap target to scroll into. End-alignment puts
            // the footer fully in view; the flowers row above shows a
            // small sliver at the top, which reads as the intended
            // "you've reached the end" visual punctuation.
            //
            // DESKTOP (lg+): `lg:min-h-0 lg:justify-start` drops the
            // full-viewport sizing so the wrapper HUGS its content
            // (flowers + footer ≈ 550px). On desktop there is no
            // scroll-snap (it's gated to <lg in globals.css), so the
            // full-viewport "end beat" served no purpose there — it
            // just left a tall black slab of empty space above the
            // footer on monitors taller than the content (very visible
            // on 1080p+ Windows displays; barely noticeable on shorter
            // Mac laptops, which is why it looked fine there). The
            // mobile snap sizing (min-h-svh + justify-end +
            // scroll-snap-align:end) stays as the base classes.
            //
            // `lg:pt-14` adds breathing room above the flowers row so
            // the black footer doesn't slam flush against the previous
            // (cream) block once it's hugging its content — matches the
            // pt-14 the no-anim inner pages already use.
            <div
              // On no-scroll-anim pages (e.g. /plan-your-visit) the snap
              // attribute is omitted AND the min-h-svh is dropped so
              // the footer wrapper hugs its content (flower row +
              // footer) instead of leaving an awkward black slab
              // above.
              {...(noScrollAnim ? {} : { 'data-snap-section': true })}
              className={cn(
                'flex flex-col bg-black',
                noScrollAnim
                  ? // On no-anim (inner) pages the wrapper hugs the
                    // flowers + footer. Add some top padding so the
                    // black footer area doesn't slam against the
                    // previous block — gives the page a moment to
                    // breathe before transitioning into the footer.
                    'pt-10 lg:pt-14'
                  : 'min-h-svh justify-end [scroll-snap-align:end] lg:min-h-0 lg:justify-start lg:pt-14',
              )}
            >
              <FlowerPaintings />
              <Footer />
            </div>
          )}
          </Providers>
        </div>
      </body>
    </html>
  )
}
