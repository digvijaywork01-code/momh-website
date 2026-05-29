'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LOGO_SRC = '/momh-logo.jpg'

const NAV_LINKS = [
  { label: 'Visit', href: '/book-an-appointment' },
  { label: 'Plan Your Visit', href: '/plan-your-visit' },
  { label: 'Museum Guidelines', href: '/museum-guidelines' },
  { label: 'Craft Your Jewellery', href: '/craft-your-jewellery' },
]

// Mobile Nav Specifics
const MOBILE_NAV_LINKS = [
  { label: 'Visit', href: '/book-an-appointment' },
  { label: 'Plan Your Visit', href: '/plan-your-visit' },
  { label: 'Museum Guidelines', href: '/museum-guidelines' },
  { label: 'Craft Your Jewellery', href: '/craft-your-jewellery' },
]

const openingHours = [
  { day: 'Monday', time: '10am – 4pm' },
  { day: 'Tuesday', time: '10am – 4pm' },
  { day: 'Wednesday', time: '10am – 4pm' },
  { day: 'Thursday', time: '10am – 4pm' },
  { day: 'Friday', time: '10am – 4pm' },
  { day: 'Saturday', time: '10am – 4pm' },
  { day: 'Sunday', time: 'Holiday' },
]

const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    stroke="currentColor"
    fill="none"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="2em"
    width="2em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

const RightArrowIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    width="8"
    height="14"
    viewBox="0 0 8 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 1L7 7L1 13"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    stroke="currentColor"
    fill="none"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="2em"
    width="2em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
)

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

const MobileNav = ({ isOpen, onClose }: MobileNavProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  return (
    <div
      className={`fixed top-0 left-0 h-screen w-full bg-white z-[100] transform transition-transform duration-300 ease-in-out md:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{ fontFamily: 'HelveticaNeueCyr, Helvetica, Arial, sans-serif' }}
    >
      <div className="flex flex-col p-6 pt-12 h-full overflow-y-auto">
        <div className="flex justify-between items-start mb-10">
          <div className="flex items-center">
            <img src={LOGO_SRC} alt="Logo" className="h-[80px] w-[80px] object-contain mr-4" />
            <div>
              <p className="text-lg font-thin">
                Museum of <span className="text-[#9D2326] font-times-now italic">Meenakari</span>
              </p>
              <p className="text-base font-thin">Heritage</p>
            </div>
          </div>
          <button onClick={onClose} className="py-6 px-4 -mr-2">
            <CloseIcon className="h-8 w-8 text-black" />
          </button>
        </div>

        <nav className="flex flex-col border-t border-gray-200">
          {MOBILE_NAV_LINKS.map((link) => (
            <div key={link.label} className="border-b border-gray-200">
              <Link
                href={link.href}
                className="flex justify-between text-xl items-center py-8"
                onClick={onClose}
              >
                <span>{link.label}</span>
                {link.hasArrow && <RightArrowIcon />}
              </Link>
            </div>
          ))}
        </nav>

        <div className="mt-8 pr-8">
          <h3 className="font-bold text-lg mb-4">Opening Hours</h3>
          <div className="space-y-2 text-sm pr-8">
            {openingHours.map((item) => (
              <div key={item.day} className="flex justify-between">
                <span>{item.day}</span>
                <span>{item.time}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs">*Except Public Holidays</p>
        </div>
      </div>
    </div>
  )
}

export const Header = () => {
  const [isSolid, setIsSolid] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  // Hover-to-expand: the full nav (logo + links) shows when the cursor
  // is near the top of the viewport; otherwise a minimized version
  // (just the small logo) is rendered. Removes nav chrome from the
  // editorial reading experience while keeping it a single mouse
  // move away.
  const [isNavZoneHovered, setIsNavZoneHovered] = useState(false)
  const pathname = usePathname()

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    function onScroll() {
      const currentScrollY = window.scrollY
      const vh = window.innerHeight

      // First scroll: decrease size — kicks in soon so the nav doesn't pop
      // back to its full-tall state every time it re-appears.
      setIsScrolled(currentScrollY > 50)

      // Transparent for just a short scroll past the Hero, then solid white.
      // ~200px buffer after the hero ends gives the user a brief glimpse of
      // the nav in transparent mode over the InfoHero photo, then it firms
      // up to solid white as soon as they continue scrolling.
      setIsSolid(currentScrollY > vh + 200)
    }

    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Mouse-near-top detection. The "hover zone" is generous enough
  // (top 120px of viewport) that the user doesn't have to flick to
  // the very top edge to reveal the nav — any deliberate upward
  // motion lands in it. On mobile we skip the listener entirely
  // (touch devices don't have a hover state — the existing hamburger
  // menu handles nav access on small screens).
  useEffect(() => {
    if (isMobile) return
    const HOVER_ZONE_HEIGHT = 120
    let frame = 0
    const onMove = (e: MouseEvent) => {
      // rAF-throttle so we don't thrash state on every mousemove tick.
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        setIsNavZoneHovered(e.clientY <= HOVER_ZONE_HEIGHT)
      })
    }
    // If the cursor leaves the window, collapse to minimized.
    const onLeave = () => setIsNavZoneHovered(false)
    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [isMobile])

  // (Removed: the hero-in-view IntersectionObserver that used to hide
  // the nav while `data-hide-nav-when-visible` blocks were on screen.
  // The nav is now always visible — see the <header> className below.)

  // Suppress unused warnings — kept for backward-compat with the
  // existing scroll-driven mobile behavior below.
  void isSolid

  // On desktop the nav stays minimized (small logo only) until the
  // user hovers near the top of the viewport. On mobile we keep the
  // existing scroll-shrink behavior since there's no hover state to
  // drive the expand. `isExpanded` is the source of truth for "show
  // the full nav" on desktop.
  const isExpanded = isMobile ? !isScrolled : isNavZoneHovered

  // Desktop logo sizes — small in minimized state, larger when
  // expanded. The square brand mark stays visually unambiguous at
  // both sizes.
  const logoSize = isExpanded ? 'h-[80px] w-[80px]' : 'h-[44px] w-[44px]'
  // Mobile nav stays at a single fixed size regardless of scroll
  // position. Previously the logo grew 60 → 80px and the bar grew
  // 10vh → 15vh at the top of the page, which looked editorial on
  // standalone-hero pages but, with the nav now visible over the
  // 50vh Hero, the bigger top-state logo crowded the headline. Locking
  // to the compact 60px / 10vh values keeps the nav unobtrusive at
  // every scroll position.
  const mobileLogoSize = 'h-[60px] w-[60px]'
  const headerHeight = isExpanded ? 'min-h-[14vh]' : 'min-h-[60px]'
  const mobileHeaderHeight = 'min-h-[10vh]'

  // Background is now purely HOVER-driven on desktop:
  //   - Minimized (cursor away from top) → transparent. Only the small
  //     floating logo shows; underlying sections (haveli photos,
  //     cream/maroon panels, etc.) are completely uninterrupted.
  //   - Expanded (cursor in the top hover zone) → solid white. The
  //     full nav (bigger logo + links) reads cleanly as a chrome
  //     element. White restores its "normal/original" state from
  //     before this change.
  //
  // On mobile, the nav stays transparent on EVERY route — including
  // inner pages — so the top image banner sits flush against the
  // viewport top and the nav reads as a floating chrome layer over
  // the artwork rather than a white bar that pushes the banner down.
  // (Previously inner mobile pages used `bg-white` which both gave a
  // chunky white bar AND required `pt-[16vh]` padding on every inner
  // route to clear it.)
  const isHomePage = pathname === '/'
  const desktopBg = isExpanded ? 'bg-white' : 'bg-transparent'
  const mobileBg = 'bg-transparent'
  const bgClass = isMobile ? mobileBg : desktopBg

  return (
    <>
      <header
        // Nav is ALWAYS visible across the whole page now. The minimized
        // floating nav (small logo + burger) used to hide on desktop
        // while the editorial Hero was in view (`data-hide-nav-when-visible`
        // + an IntersectionObserver driving an `isHeroInView` flag). That
        // gave a full-bleed entrance when the Hero was the FIRST block,
        // but the homepage order is editable in the Payload admin and the
        // Hero now sits second behind the InfoHero — both full-svh blocks,
        // so the nav was hidden across the entire top of the page. The
        // hide behaviour (state + observer) has been removed; the nav
        // stays pinned and visible at every scroll position on every route.
        className={`fixed top-0 left-0 w-full z-50 flex flex-col items-center transition-all duration-500 ${bgClass} opacity-100 translate-y-0`}
        style={{ fontFamily: 'HelveticaNeueCyr, Helvetica, Arial, sans-serif' }}
      >
        {/* Desktop Header */}
        <div
          className={`max-w-[1920px] w-full hidden md:flex flex-row items-center justify-between ${headerHeight} transition-all duration-300`}
          style={{ padding: '0 70px' }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center min-w-0 flex-shrink">
            <img
              src={LOGO_SRC}
              alt="Logo"
              className={`${logoSize} object-contain transition-all duration-300`}
              style={{ mixBlendMode: 'multiply' }}
            />
          </Link>
          {/* Nav — fades + slides into place when the cursor enters the
              top hover zone, fades out when the cursor leaves. Always
              `pointer-events-none` while minimized so the hidden links
              don't intercept clicks on the underlying section. */}
          <nav
            className={`flex flex-row gap-[48px] items-center min-w-0 flex-shrink relative transition-all duration-500 ease-out ${
              isExpanded
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 -translate-y-2 pointer-events-none'
            }`}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                // Nav is only ever visible when expanded (white bg) — text
                // is always black against the white panel, with a red
                // hover. While minimized this nav has pointer-events-none
                // and opacity-0, so the color doesn't matter visually.
                className="text-base text-black hover:text-red-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Header */}
        <div
          className={`w-full flex md:hidden flex-row items-center justify-between p-6 ${mobileHeaderHeight} transition-all duration-300`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src={LOGO_SRC}
              alt="Logo"
              className={`${mobileLogoSize} object-contain transition-all duration-300`}
              style={{ mixBlendMode: 'multiply' }}
            />
          </Link>
          {/* Burger Menu — always white on mobile because the nav bar
              is fully transparent on every route and floats over the
              top image banner (haveli at twilight on inner pages, the
              hero photo/video on home). White reads cleanly against
              the dark imagery; mix-blend on the icon would muddy the
              line weight. */}
          <button onClick={() => setIsMobileNavOpen(true)}>
            <MenuIcon className="text-white" />
          </button>
        </div>

        {/* HR — anchors the bottom of the expanded white nav. Shows only
            when expanded (i.e. when the white bar is on screen). */}
        <div className="hidden md:flex justify-center w-full">
          <hr
            className={`border-t w-full transition-opacity duration-500 ${
              isExpanded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ borderColor: '#E6E6E6' }}
          />
        </div>
      </header>
      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
    </>
  )
}

export default Header
