'use client'
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LOGO_SRC = '/momh-logo.jpg'

/** One shared nav model for desktop AND mobile (they used to be two
 *  hand-maintained duplicate arrays). An item with `children` renders as
 *  a dropdown panel on desktop and an accordion row in the mobile drawer.
 *  The parent itself stays a real crawlable link (the Chaumet/Graff
 *  pattern) — its href is the hub page. */
type NavChild = { label: string; href: string; image?: string }
type NavItem = { label: string; href: string; children?: NavChild[] }

const NAV_LINKS: NavItem[] = [
  { label: 'Visit', href: '/book-an-appointment' },
  {
    label: 'The Museum',
    href: '/about',
    children: [
      {
        label: 'Our Story',
        href: '/about',
        image: '/media/about-gallery-interior-900x886.jpg',
      },
      {
        label: "Founder's Vision",
        href: '/founders-vision',
        image: '/media/fv-founder-library-900x496.jpg',
      },
      {
        label: 'The Art & Craftsmanship',
        href: '/art-and-craftsmanship',
        image: '/media/ac-tech-painted-enamel-900x900.jpg',
      },
      {
        label: 'The Architecture',
        href: '/architecture',
        image: '/media/thank-you-architecture-900x836.jpg',
      },
    ],
  },
  { label: 'Plan Your Visit', href: '/plan-your-visit' },
  { label: 'Museum Guidelines', href: '/museum-guidelines' },
  { label: 'Craft Your Jewellery', href: '/craft-your-jewellery' },
]

const openingHours = [
  { day: 'Monday', time: '11am – 6pm' },
  { day: 'Tuesday', time: '11am – 6pm' },
  { day: 'Wednesday', time: '11am – 6pm' },
  { day: 'Thursday', time: '11am – 6pm' },
  { day: 'Friday', time: '11am – 6pm' },
  { day: 'Saturday', time: '11am – 6pm' },
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

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    width="10"
    height="6"
    viewBox="0 0 10 6"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 1L5 5L9 1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/** The sheet's photo carousel — "Aperture Exchange", centred-hero cut.
 *  No sliding track: a row of vitrine panels exchanges WIDTHS, HEIGHTS
 *  and TINT on each tick. Three photographs show — a clean full-height
 *  hero in the centre, flanked by two smaller panels resting under a
 *  light white scrim — plus one pooled panel at zero width on the right
 *  edge. On a step every panel slides one role left: the left side
 *  curtains shut, the hero recedes into the left seat (its scrim
 *  settling on), the right side blooms into the clean hero, and the
 *  pool grows in as the new right side. Images never translate, scale
 *  or blur — only frame geometry moves, re-cropping the stationary
 *  photograph live (object-cover). All tweens share one clock and
 *  curve, so total width is conserved at every instant and no seams
 *  open. Panels are keyed by image, so when the step commits (start+1)
 *  every surviving DOM node's resting values equal what it just
 *  animated to — the handoff is pixel-invisible by construction. Fixed
 *  white mullions overlay the resting seams; the panels exchange
 *  widths behind them like display cases behind a grille. */
const GLIDE_MS = 1200
const GLIDE_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
// Slot geometry: [left side, centre hero, right side, pooled next].
// Sides are narrower, shorter and rest under a light tint; the hero is
// clean and full height. On a step every panel slides one role left:
// the left side curtains shut, the hero recedes into the left seat,
// the right side blooms into the hero, the pool grows in as the new
// right side. Width math: 27 + 46 + 27 = 100 and the four basis tweens
// share one clock, so -27 -19 +19 +27 = 0 at every instant.
type Slot = { basis: number; height: string; veil: number }
const REST_SLOTS: Slot[] = [
  { basis: 27, height: '78%', veil: 1 },
  { basis: 46, height: '100%', veil: 0 },
  { basis: 27, height: '78%', veil: 1 },
  { basis: 0, height: '78%', veil: 1 },
]
const STEP_SLOTS: Slot[] = [
  { basis: 0, height: '78%', veil: 1 },
  { basis: 27, height: '78%', veil: 1 },
  { basis: 46, height: '100%', veil: 0 },
  { basis: 27, height: '78%', veil: 1 },
]

const SheetCarousel = ({
  images,
  hrefs,
  active,
  onHeroChange,
  onNavigate,
}: {
  images: string[]
  /** Destination per image — each panel click-navigates to its page. */
  hrefs: string[]
  active: boolean
  /** Reports which image holds (or is taking) the hero seat, so the
   *  link list can highlight its matching entry. */
  onHeroChange: (i: number) => void
  /** Called when a panel is clicked (the sheet closes itself). */
  onNavigate: () => void
}) => {
  const [start, setStart] = useState(0)
  const [stepping, setStepping] = useState(false)
  // Rotation holds while the cursor is over the carousel, so the
  // panels are never moving targets for a click.
  const [paused, setPaused] = useState(false)
  const committed = useRef(false)
  const n = images.length

  // Tick only while the sheet is open and unhovered; closing resets to
  // the first frame. The first step fires early (1.2s — right after the
  // sheet finishes opening) so the motion introduces itself, then the
  // regular 3s cadence takes over.
  useEffect(() => {
    if (!active) {
      setStepping(false)
      setStart(0)
      setPaused(false)
      return
    }
    if (paused) return
    let iv: ReturnType<typeof setInterval> | null = null
    const first = setTimeout(() => {
      setStepping(true)
      iv = setInterval(() => setStepping(true), 3000)
    }, 1200)
    return () => {
      clearTimeout(first)
      if (iv) clearInterval(iv)
    }
  }, [active, paused])

  // The hero highlight follows the INCOMING hero the moment a step
  // begins, so the link list answers the motion instead of trailing it.
  useEffect(() => {
    onHeroChange((start + (stepping ? 2 : 1)) % n)
  }, [start, stepping, n, onHeroChange])

  const commit = () => {
    if (committed.current) return
    committed.current = true
    setStart((s) => (s + 1) % images.length)
    setStepping(false)
  }

  // transitionend on the blooming hero commits the step; the timeout is
  // the hidden-tab fallback (throttled tabs can swallow the event).
  useEffect(() => {
    if (!stepping) {
      committed.current = false
      return
    }
    const t = setTimeout(commit, GLIDE_MS + 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepping])

  const slots = stepping ? STEP_SLOTS : REST_SLOTS
  return (
    <div
      className="relative flex w-full items-center overflow-hidden"
      style={{ aspectRatio: '13 / 4', contain: 'layout paint' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {[0, 1, 2, 3].map((k) => {
        const idx = (start + k) % images.length
        const slot = slots[k]
        return (
          <div
            key={idx}
            className="relative overflow-hidden bg-[#F5F3F0]"
            style={{
              flex: `0 0 ${slot.basis}%`,
              height: slot.height,
              transition: `flex-basis ${GLIDE_MS}ms ${GLIDE_EASE}, height ${GLIDE_MS}ms ${GLIDE_EASE}`,
            }}
            onTransitionEnd={
              k === 2
                ? (e) => {
                    if (
                      e.propertyName === 'flex-basis' &&
                      e.target === e.currentTarget &&
                      stepping
                    )
                      commit()
                  }
                : undefined
            }
          >
            {/* Click-through to the panel's page. tabIndex -1 keeps it
                out of the tab order — keyboard users have the text
                links; this is a pointer affordance only. */}
            <Link
              href={hrefs[idx]}
              tabIndex={-1}
              onClick={onNavigate}
              className="absolute inset-0 block cursor-pointer"
            >
              <img
                src={images[idx]}
                alt=""
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Side-panel tint — a light scrim that lifts as a panel
                  takes the hero seat, on the same clock as the widths. */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  opacity: slot.veil,
                  transition: `opacity ${GLIDE_MS}ms ${GLIDE_EASE}`,
                }}
              />
            </Link>
          </div>
        )
      })}
      {/* Fixed mullions over the resting seams (27% / 73%) — the panels
          exchange widths BEHIND them, like cases behind a grille. */}
      {[27, 73].map((p) => (
        <div
          key={p}
          className="pointer-events-none absolute inset-y-0 z-10 w-3 -translate-x-1/2 bg-white"
          style={{ left: `${p}%` }}
        />
      ))}
    </div>
  )
}

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
  // One accordion open at a time — same convention as the footer's
  // mobile columns.
  const [openSub, setOpenSub] = useState<string | null>(null)

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
          {NAV_LINKS.map((link) =>
            link.children ? (
              // Accordion row — the chevron rotates to point down when
              // open; sub-rows keep 44px+ tap targets (py-4 + text-lg).
              <div key={link.label} className="border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setOpenSub(openSub === link.label ? null : link.label)}
                  aria-expanded={openSub === link.label}
                  className="flex justify-between text-xl items-center py-8 w-full text-left"
                >
                  <span>{link.label}</span>
                  <RightArrowIcon
                    className={`transition-transform duration-300 ${
                      openSub === link.label ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                {openSub === link.label && (
                  <div className="flex flex-col pb-4">
                    {link.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className="py-4 pl-4 text-lg text-black/80"
                        onClick={onClose}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div key={link.label} className="border-b border-gray-200">
                <Link
                  href={link.href}
                  className="flex justify-between text-xl items-center py-8"
                  onClick={onClose}
                >
                  <span>{link.label}</span>
                </Link>
              </div>
            ),
          )}
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
  // Which dropdown panel is open (by nav label). Hover-intent timed —
  // Baymard/NN/g: a 250-300ms delay stops the panel flickering open as
  // the cursor crosses the bar, and a close delay tolerates the diagonal
  // move from trigger to panel.
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  // Link ← carousel sync (one-way): which image holds the hero seat
  // drives the red link highlight. Hovering links never touches the
  // carousel.
  const [sheetHeroIdx, setSheetHeroIdx] = useState(1)
  // The sheet photos mount only after the first hover intent. The sheet
  // is max-h-0/overflow-hidden (NOT display:none — its links must stay
  // in the server HTML for crawlers), so always-rendered <img> tags
  // would be fetched on every page view. Flipping this during the 250ms
  // intent delay gives the images a head start over the 500ms slide.
  const [sheetMediaMounted, setSheetMediaMounted] = useState(false)
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()

  const clearMenuTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current)
    if (closeTimer.current) clearTimeout(closeTimer.current)
    openTimer.current = null
    closeTimer.current = null
  }
  const scheduleMenuOpen = (label: string) => {
    clearMenuTimers()
    setSheetMediaMounted(true)
    openTimer.current = setTimeout(() => setOpenMenu(label), 250)
  }
  const scheduleMenuClose = () => {
    clearMenuTimers()
    closeTimer.current = setTimeout(() => setOpenMenu(null), 250)
  }
  const cancelMenuClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }

  // Escape closes an open panel (WCAG dismissible-content contract).
  useEffect(() => {
    if (!openMenu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openMenu])

  // Keyboard-focus opens skip scheduleMenuOpen, so mount the photos
  // here too.
  useEffect(() => {
    if (openMenu) setSheetMediaMounted(true)
  }, [openMenu])

  // Scrolling while the sheet is open must not move the page behind it.
  // Element-level wheel preventDefault is unreliable against Chrome's
  // compositor-driven scrolling, so lock the document's scroll for the
  // sheet's lifetime instead — padding-compensated so browsers with
  // fixed scrollbars don't shift the layout. The sheet closes the
  // moment the cursor leaves it, so normal scrolling resumes instantly.
  useEffect(() => {
    if (!openMenu) return
    const html = document.documentElement
    const scrollbar = window.innerWidth - html.clientWidth
    const prevOverflow = html.style.overflow
    const prevPad = html.style.paddingRight
    html.style.overflow = 'hidden'
    if (scrollbar > 0) html.style.paddingRight = `${scrollbar}px`
    return () => {
      html.style.overflow = prevOverflow
      html.style.paddingRight = prevPad
    }
  }, [openMenu])

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
    // If the cursor leaves the window, collapse to minimized (and drop
    // any open dropdown panel with it).
    const onLeave = () => {
      setIsNavZoneHovered(false)
      setOpenMenu(null)
    }
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
  // An open dropdown panel extends well below the 120px hover zone, so
  // it must also hold the header expanded — otherwise moving the cursor
  // down into the panel would collapse the whole bar.
  const isExpanded = isMobile ? !isScrolled : isNavZoneHovered || openMenu !== null

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
            {NAV_LINKS.map((link) =>
              link.children ? (
                // Sheet trigger — the label itself is a real crawlable
                // link to the hub page (/about); hover or keyboard focus
                // extends the white header downward into the seamless
                // sheet rendered after the bar (the Musée YSL pattern —
                // no card, no border, the header surface simply grows).
                <div
                  key={link.label}
                  className="flex items-center"
                  onMouseEnter={() => scheduleMenuOpen(link.label)}
                  onMouseLeave={scheduleMenuClose}
                  onFocusCapture={() => {
                    clearMenuTimers()
                    setOpenMenu(link.label)
                  }}
                  // Timed close on blur: if focus lands in the sheet, its
                  // own focus handler cancels this before it fires.
                  onBlurCapture={scheduleMenuClose}
                >
                  <Link
                    href={link.href}
                    aria-expanded={openMenu === link.label}
                    aria-haspopup="true"
                    className="text-base text-black hover:text-red-600 transition-colors flex items-center gap-1.5"
                  >
                    {link.label}
                    <ChevronDownIcon
                      className={`transition-transform duration-300 ${
                        openMenu === link.label ? 'rotate-180' : ''
                      }`}
                    />
                  </Link>
                </div>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  // Nav is only ever visible when expanded (white bg) — text
                  // is always black against the white panel, with a red
                  // hover. While the sheet is open, sibling items recede
                  // (the YSL dimming) so the open group reads as active.
                  className={`text-base text-black hover:text-red-600 transition-all duration-300 ${
                    openMenu ? 'opacity-40' : ''
                  }`}
                >
                  {link.label}
                </Link>
              ),
            )}
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
            when expanded, and hides again while the sheet is open so the
            bar and sheet read as ONE continuous white surface. */}
        <div className="hidden md:flex justify-center w-full">
          <hr
            className={`border-t w-full transition-opacity duration-500 ${
              isExpanded && !openMenu ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ borderColor: '#E6E6E6' }}
          />
        </div>

        {/* The sheet — the Musée YSL treatment: the white header surface
            extends downward and the group's pages render as large serif
            lines directly on it. No border, no shadow, no card. ALWAYS
            in the DOM (max-height/opacity toggled) so the links stay
            crawlable in the server HTML. */}
        {NAV_LINKS.filter((l) => l.children).map((link) => {
          const open = openMenu === link.label && isExpanded
          return (
            <div
              key={link.label}
              onMouseEnter={cancelMenuClose}
              onMouseLeave={scheduleMenuClose}
              onFocusCapture={() => {
                clearMenuTimers()
                setOpenMenu(link.label)
              }}
              onBlurCapture={scheduleMenuClose}
              className={`hidden md:block w-full overflow-hidden transition-all duration-500 ease-out ${
                open ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
              }`}
              {...(open ? {} : { 'aria-hidden': true })}
            >
              <div className="max-w-[1920px] mx-auto flex items-center">
                <ul
                  className="flex flex-col gap-1 shrink-0"
                  style={{ padding: '16px 70px 48px' }}
                >
                  {link.children!.map((child, ci) => (
                    <li key={child.label}>
                      {/* Catalogue entry: red index numeral + label. The
                          entry whose photo holds the hero seat reads red;
                          hover grows the label without touching the
                          carousel. */}
                      <Link
                        href={child.href}
                        onClick={() => setOpenMenu(null)}
                        className={`inline-block origin-left text-[20px] lg:text-[22px] leading-[1.7] transition-all duration-300 hover:scale-[1.06] hover:text-red-600 ${
                          sheetHeroIdx === ci ? 'text-red-600' : 'text-ink'
                        }`}
                      >
                        {/* Serif italic numeral — the site's editorial
                            number treatment, contrasting the sans label. */}
                        <span className="font-script mr-3 inline-block w-6 text-[16px] lg:text-[17px] italic text-red-600">
                          {String(ci + 1).padStart(2, '0')}
                        </span>
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                {/* Photo carousel on the right — two images in view,
                    drifting one image leftward on a loop. Decorative:
                    hidden from AT, and mounted only after the first
                    hover intent so the photos never load on page views
                    that don't touch the nav. */}
                {sheetMediaMounted && (
                  <div
                    aria-hidden="true"
                    className="hidden lg:block flex-1 min-w-0"
                    style={{ padding: '20px 70px 36px 0' }}
                  >
                    {/* Centred in the space left of the link column. */}
                    <div className="max-w-[780px] mx-auto">
                      <SheetCarousel
                        images={link.children!.map((c) => c.image).filter((i): i is string => Boolean(i))}
                        hrefs={link.children!.filter((c) => c.image).map((c) => c.href)}
                        active={open}
                        onHeroChange={setSheetHeroIdx}
                        onNavigate={() => setOpenMenu(null)}
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* Bottom separator — the same hairline as the bar's own hr,
                  closing the sheet where it meets the page. */}
              <hr className="w-full border-t" style={{ borderColor: '#E6E6E6' }} />
            </div>
          )
        })}
      </header>
      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
    </>
  )
}

export default Header
