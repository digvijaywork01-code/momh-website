'use client'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LOGO_SRC = '/momh-logo.jpg'

/** `image` is the Media upload's 500x500 `square` size, so every panel
 *  tile is the same square photo. A long name can stack onto two `lines`
 *  in the panel when its tile is too narrow for it on one line;
 *  `stackWhen` holds the container-width conditions for that (see the
 *  tile-row note in the panel and NavName below). */
type NavChild = {
  label: string
  href: string
  image?: string
  lines?: [string, string]
  stackWhen?: string
}
/** Copy for the desktop panel's left intro column (eyebrow, heading,
 *  one-line description), shown beside the tiles from md up. */
type NavIntro = { eyebrow: string; title: string; description: string }
type NavItem = { label: string; href: string; intro?: NavIntro; children?: NavChild[] }

/** Faint line drawing of Shekhawat Haveli at the foot of the panel's intro
 *  column. A design asset shipped with the code (public/momh-assets), not
 *  CMS media: white border trimmed, 600x171 for 2x screens. */
const PANEL_SKETCH_SRC = '/momh-assets/header/haveli-sketch.webp'

/** One shared nav model for desktop AND mobile (they used to be two
 *  hand-maintained duplicate arrays). An item with `children` renders as
 *  a dropdown on both: a button that opens the panel on desktop, an
 *  accordion row in the mobile drawer. Its href (the hub page) is reached
 *  through the panel's "View all" link and its first child. */
const NAV_LINKS: NavItem[] = [
  { label: 'Book Your Appointment', href: '/book-an-appointment' },
  {
    label: 'The Museum',
    href: '/about',
    intro: {
      eyebrow: 'Explore',
      title: 'The Museum',
      description: 'A journey through heritage, art, and craftsmanship preserved for generations.',
    },
    children: [
      {
        label: 'Our Story',
        href: '/about',
        image: '/media/about-gallery-interior-500x500.jpg',
      },
      {
        label: "Founder's Vision",
        href: '/founders-vision',
        lines: ["Founder's", 'Vision'],
        stackWhen:
          '[@container(max-width:1139.98px)]:[@media(max-width:1048.98px)]:inline',
        image: '/media/fv-founder-library-500x500.jpg',
      },
      {
        label: 'The Art & Craftsmanship',
        href: '/art-and-craftsmanship',
        lines: ['The Art &', 'Craftsmanship'],
        stackWhen:
          '[@container(max-width:1193.98px)]:inline',
        image: '/media/ac-tech-painted-enamel-500x500.jpg',
      },
      {
        label: 'The Architecture',
        href: '/architecture',
        lines: ['The', 'Architecture'],
        stackWhen:
          '[@container(max-width:1139.98px)]:[@media(max-width:1228.98px)]:inline',
        image: '/media/thank-you-architecture-500x500.jpg',
      },
      // The footer's Visit pages, so the panel offers the visit too.
      {
        label: 'Museum Guidelines',
        href: '/museum-guidelines',
        lines: ['Museum', 'Guidelines'],
        stackWhen:
          '[@container(max-width:1181.98px)]:inline',
        image: '/media/mg-experience-500x500.jpg',
      },
      {
        label: 'Book Your Appointment',
        href: '/book-an-appointment',
        lines: ['Book Your', 'Appointment'],
        stackWhen:
          '[@container(max-width:1193.98px)]:inline',
        image: '/media/visit-museum-exhibit-500x500.jpg',
      },
    ],
  },
  { label: 'Museum Guidelines', href: '/museum-guidelines' },
  { label: 'Craft Your Jewellery', href: '/craft-your-jewellery' },
]

/** DOM id of a dropdown panel, linking it to its trigger's aria-controls. */
const panelId = (label: string) => `nav-panel-${label.toLowerCase().replace(/\W+/g, '-')}`

/** A panel tile's name. A stackable name breaks onto its two `lines` only
 *  where its `stackWhen` container conditions hold (a <br> that is
 *  display:none otherwise), so both the visible name and its invisible
 *  bold copy break at the same place and hovering never re-wraps it. */
const NavName = ({ child }: { child: NavChild }) =>
  child.lines ? (
    <>
      {child.lines[0]} <br className={`hidden ${child.stackWhen ?? ''}`} />
      {child.lines[1]}
    </>
  ) : (
    <>{child.label}</>
  )

/** Moves keyboard focus to a panel's first rendered link (the intro column's
 *  "View all" is display:none below lg, so skip links with no box).
 *  preventScroll stops the browser scrolling a still-collapsed
 *  overflow-hidden panel to reveal it. */
const focusFirstPanelLink = (label: string) =>
  [...(document.getElementById(panelId(label))?.querySelectorAll<HTMLElement>('a') ?? [])]
    .find((a) => a.getClientRects().length > 0)
    ?.focus({ preventScroll: true })

const openingHours = [
  { day: 'Monday', time: '10am – 7:30pm' },
  { day: 'Tuesday', time: '10am – 7:30pm' },
  { day: 'Wednesday', time: '10am – 7:30pm' },
  { day: 'Thursday', time: '10am – 7:30pm' },
  { day: 'Friday', time: '10am – 7:30pm' },
  { day: 'Saturday', time: '10am – 7:30pm' },
  { day: 'Sunday', time: '10am – 7:30pm' },
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
                    {/* Skip sub-pages that already have their own link row
                        in this drawer, so none is listed twice. Only plain
                        rows count; a parent's href is not a row. */}
                    {link.children
                      .filter((child) => !NAV_LINKS.some((l) => !l.children && l.href === child.href))
                      .map((child) => (
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
  // Baymard/NN/g: a 250ms delay stops the panel flickering open as the
  // cursor crosses the bar, and a 250ms close delay tolerates the move
  // from trigger down to panel. A click never closes it; it only opens
  // it, for touch screens (no hover) and the keyboard. It also closes on
  // Escape or a click outside.
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  // Keyboard focus inside the header holds the nav expanded, so a
  // keyboard user can see the minimized links they tab onto.
  // `:focus-visible` only, so a mouse click on the trigger never pins
  // the bar open after the cursor leaves.
  const [navFocusVisible, setNavFocusVisible] = useState(false)
  // Devices without a hovering pointer (touch tablets) can't reveal the
  // minimized desktop nav by moving a cursor to the top, so on those the
  // bar stays expanded and one tap on a trigger opens its panel.
  const [canHover, setCanHover] = useState(true)
  // True while the panel collapses (until its max-height transition ends).
  // The bar stays expanded meanwhile, so the panel never sits over the
  // page on a fading bar, and a quick re-hover finds the trigger where it
  // was (a collapsing bar would slide it out from under the cursor).
  const [menuClosing, setMenuClosing] = useState(false)
  const prevOpenMenu = useRef<string | null>(null)
  // True once an open panel has finished growing. It only scrolls
  // (overflow-y auto) from then on: a scrollbar shown while max-height is
  // still animating would narrow the tile row's query container and could
  // flip its band mid-open (classic, space-taking scrollbars).
  const [panelSettled, setPanelSettled] = useState(false)
  // The panel is collapsed, not unmounted, while closed: its links stay in
  // the server HTML for crawlers and it is inert meanwhile. So the photos
  // mount only after the first hover intent, or every page view would
  // fetch them. Mounting at hover start gives the images a head start
  // over the 250ms open delay.
  const [sheetMediaMounted, setSheetMediaMounted] = useState(false)
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const headerRef = useRef<HTMLElement | null>(null)
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  // Set when the panel is opened from the keyboard, so focus moves into
  // it (the panel sits after the whole bar in DOM order).
  const focusPanelOnOpen = useRef(false)
  // Whether the open panel was opened from the keyboard, so Escape can
  // hand focus back to the trigger even after a click on blank panel
  // space has moved focus to <body>.
  const openedByKeyboard = useRef(false)
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
  // Click (or Enter/Space) opens at once. With a mouse it never closes,
  // so a click on an already hover-opened panel leaves it open. On a
  // touch screen (no hover, see canHover) a tap on the open trigger
  // closes it: there the trigger is the only toggle besides tapping
  // elsewhere.
  const openMenuNow = (label: string, fromKeyboard: boolean) => {
    clearMenuTimers()
    setSheetMediaMounted(true)
    if (openMenu === label) {
      if (fromKeyboard) focusFirstPanelLink(label)
      else if (!canHover) setOpenMenu(null)
      return
    }
    focusPanelOnOpen.current = fromKeyboard
    openedByKeyboard.current = fromKeyboard
    setOpenMenu(label)
  }
  // Keyboard path through an open panel. It sits after the whole bar in
  // DOM order, so the order is routed: trigger -> panel links -> the bar
  // item after the trigger. Tab on the open trigger enters the panel; Tab
  // on its last link closes it and moves to that next bar item; Shift+Tab
  // on its first link returns to the trigger.
  const onTriggerKeyDown = (label: string) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'Tab' || e.shiftKey || openMenu !== label) return
    e.preventDefault()
    focusFirstPanelLink(label)
  }
  const onPanelKeyDown = (label: string) => (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return
    const links = [...e.currentTarget.querySelectorAll<HTMLElement>('a')].filter(
      (a) => a.getClientRects().length > 0,
    )
    if (!links.length) return
    const trigger = triggerRefs.current[label]
    if (e.shiftKey && document.activeElement === links[0]) {
      e.preventDefault()
      trigger?.focus()
    } else if (!e.shiftKey && document.activeElement === links[links.length - 1]) {
      const next = trigger?.parentElement?.nextElementSibling as HTMLElement | null
      if (!next) return
      e.preventDefault()
      setOpenMenu(null)
      next.focus()
    }
  }

  // Escape closes an open panel (WCAG dismissible-content contract) and
  // hands focus back to its trigger if focus was inside the panel, or was
  // dropped to <body> after a keyboard open.
  useEffect(() => {
    if (!openMenu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const panel = document.getElementById(panelId(openMenu))
      const active = document.activeElement
      const focusDropped = openedByKeyboard.current && (!active || active === document.body)
      if (panel?.contains(active) || focusDropped) triggerRefs.current[openMenu]?.focus()
      setOpenMenu(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openMenu])

  // A click or tap anywhere outside the header closes the panel. Mouse
  // users already get this from the hover close; this covers touch.
  useEffect(() => {
    if (!openMenu) return
    const onPointerDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpenMenu(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [openMenu])

  // Opened from the keyboard: move focus to the panel's first link.
  useEffect(() => {
    if (!openMenu || !focusPanelOnOpen.current) return
    focusPanelOnOpen.current = false
    focusFirstPanelLink(openMenu)
  }, [openMenu])

  // Scrolling while the panel is open must not move the page behind it.
  // Element-level wheel preventDefault is unreliable against Chrome's
  // compositor-driven scrolling, so lock the document's scroll instead,
  // padding-compensated so browsers with classic (space-taking)
  // scrollbars don't shift the page. The lock covers the whole time the
  // panel shows, its 300ms collapse included (menuClosing), so a classic
  // scrollbar is never on screen beside it: the panel always spans the
  // full window and its tile bands and even ends are measured against
  // that, with nothing to switch mid-open or mid-close. A layout effect,
  // so the lock lands before the first open frame is painted. The fixed
  // header widens when the scrollbar goes; the bar row adds that width
  // (published as --sb) to its right padding, so its links don't move.
  // The homepage's wheel snap manager scrolls with JS, which ignores
  // overflow:hidden, so the lock is announced ('momh:nav-lock' event)
  // and kept readable (data-nav-lock on <html>) for it to stand down.
  // Releasing waits a frame and is cancelled by a re-lock: a close first
  // renders openMenu = null with menuClosing still false, then sets
  // menuClosing in a layout effect, so navLocked dips false for one
  // commit. Releasing and re-locking there re-measured the scrollbar
  // just after overflow was restored, which Chrome reports as 0 before
  // its next layout, and the bar and page jumped 15px for the collapse.
  // Now the dip keeps the lock it already has.
  // Below 1024 the page doesn't scroll on <html> at all: globals.css
  // locks html and body and scrolls #scroll-container instead, so that
  // is locked too, whenever it is the scroller (on desktop it is a plain
  // div and is left alone), with its own scrollbar's width kept as
  // padding so the page doesn't shift.
  const navLocked = openMenu !== null || menuClosing
  const navLockRelease = useRef<(() => void) | null>(null)
  const navUnlockFrame = useRef(0)
  useLayoutEffect(() => {
    if (!navLocked) return
    if (navUnlockFrame.current) {
      cancelAnimationFrame(navUnlockFrame.current)
      navUnlockFrame.current = 0
    }
    if (!navLockRelease.current) {
      const html = document.documentElement
      const header = headerRef.current
      const scrollbar = window.innerWidth - html.clientWidth
      const prevOverflow = html.style.overflow
      const prevPad = html.style.paddingRight
      html.style.overflow = 'hidden'
      if (scrollbar > 0) {
        html.style.paddingRight = `${scrollbar}px`
        header?.style.setProperty('--sb', `${scrollbar}px`)
      }
      const scroller = document.getElementById('scroll-container')
      const lockScroller =
        scroller !== null && /^(auto|scroll)$/.test(getComputedStyle(scroller).overflowY)
      const scrollerBar = lockScroller ? scroller.offsetWidth - scroller.clientWidth : 0
      const prevScrollerOverflow = scroller?.style.overflowY ?? ''
      const prevScrollerPad = scroller?.style.paddingRight ?? ''
      if (lockScroller) {
        scroller.style.overflowY = 'hidden'
        if (scrollerBar > 0) scroller.style.paddingRight = `${scrollerBar}px`
      }
      html.dataset.navLock = '1'
      window.dispatchEvent(new CustomEvent('momh:nav-lock', { detail: true }))
      navLockRelease.current = () => {
        html.style.overflow = prevOverflow
        html.style.paddingRight = prevPad
        if (lockScroller) {
          scroller.style.overflowY = prevScrollerOverflow
          scroller.style.paddingRight = prevScrollerPad
        }
        header?.style.removeProperty('--sb')
        delete html.dataset.navLock
        window.dispatchEvent(new CustomEvent('momh:nav-lock', { detail: false }))
      }
    }
    return () => {
      navUnlockFrame.current = requestAnimationFrame(() => {
        navUnlockFrame.current = 0
        navLockRelease.current?.()
        navLockRelease.current = null
      })
    }
  }, [navLocked])

  // Hold the bar expanded through the panel's 300ms collapse (see
  // menuClosing). A layout effect, so the hold lands before the browser
  // paints the closed state: a passive effect let one frame of the
  // collapsing bar through. A re-open during the hold cancels it.
  useLayoutEffect(() => {
    const wasOpen = prevOpenMenu.current !== null
    prevOpenMenu.current = openMenu
    if (openMenu) {
      setMenuClosing(false)
      return
    }
    setPanelSettled(false)
    if (!wasOpen) return
    setMenuClosing(true)
    // Normally released by the panel's own max-height transitionend (it
    // starts a frame or two after the close); this is the fallback.
    const t = setTimeout(() => setMenuClosing(false), 450)
    return () => clearTimeout(t)
  }, [openMenu])

  // Navigating away (a tile, the browser's back button, a swipe) closes
  // the panel, so it never carries its lock onto the next page.
  useEffect(() => {
    if (openTimer.current) clearTimeout(openTimer.current)
    if (closeTimer.current) clearTimeout(closeTimer.current)
    openTimer.current = null
    closeTimer.current = null
    setOpenMenu(null)
  }, [pathname])

  // Narrowing the window to phone width hides the desktop bar and its
  // panel (the drawer takes over), so close the panel there rather than
  // leave its scroll lock on a page that can no longer show it.
  useEffect(() => {
    if (isMobile) setOpenMenu(null)
  }, [isMobile])

  // Each panel animates max-height to its content's exact height
  // (--panel-h), so opening and closing use the whole 300ms instead of
  // idling against a large fixed cap. Content height changes with the
  // width bands, so it is kept current with a ResizeObserver.
  useEffect(() => {
    const observers = NAV_LINKS.filter((l) => l.children).map((l) => {
      const panel = document.getElementById(panelId(l.label))
      const content = panel?.firstElementChild
      if (!panel || !content) return null
      const ro = new ResizeObserver(() =>
        panel.style.setProperty('--panel-h', `${panel.scrollHeight}px`),
      )
      ro.observe(content)
      return ro
    })
    return () => observers.forEach((o) => o?.disconnect())
  }, [])

  // Whether the primary pointer can hover (see canHover).
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setCanHover(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

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
  // down into the panel would collapse the whole bar. Keyboard focus in
  // the header holds it expanded too, as do touch devices (no hover to
  // reveal it) and the panel's 300ms collapse (menuClosing).
  const isExpanded = isMobile
    ? !isScrolled
    : !canHover || isNavZoneHovered || openMenu !== null || navFocusVisible || menuClosing

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
        // Transitions are named, not `all`: the scroll lock pads this
        // header inline while the panel is open, and an animated padding
        // would squeeze the panel for 0.5s as the scrollbar snaps back.
        className={`fixed top-0 left-0 w-full z-50 flex flex-col items-center transition-[background-color,opacity,transform] duration-500 ${bgClass} opacity-100 translate-y-0`}
        style={{ fontFamily: 'HelveticaNeueCyr, Helvetica, Arial, sans-serif' }}
        ref={headerRef}
        onFocusCapture={(e) => {
          if ((e.target as HTMLElement).matches(':focus-visible')) setNavFocusVisible(true)
        }}
        // Keyboard focus moving out of the header collapses it and closes
        // the panel. Focus going nowhere (a mouse click on blank panel
        // space blurs to <body>) only drops the keyboard hold; closing is
        // then left to the hover and outside-click rules, so clicking
        // blank panel space never closes it.
        onBlurCapture={(e) => {
          if (!navFocusVisible || e.currentTarget.contains(e.relatedTarget as Node | null)) return
          setNavFocusVisible(false)
          if (e.relatedTarget) setOpenMenu(null)
        }}
      >
        {/* Desktop Header. Tablet portrait (768-1023) gets a tighter bar
            (40px sides, 24px gaps, 14px links that never wrap, a logo that
            never shrinks): at the desktop sizes the four links wrapped to
            two lines and squeezed the logo. The [@media(max-width:...)]
            variants are arbitrary because this config's object screens
            (wide, sbs) switch off Tailwind's max-[...]. */}
        <div
          className={`max-w-[calc(1920px+var(--sb,0px))] w-full hidden md:flex flex-row items-center justify-between pl-[70px] pr-[calc(70px+var(--sb,0px))] [@media(max-width:1023.98px)]:pl-10 [@media(max-width:1023.98px)]:pr-[calc(40px+var(--sb,0px))] ${headerHeight} transition-[min-height] duration-300`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center min-w-0 flex-shrink [@media(max-width:1023.98px)]:shrink-0">
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
            className={`flex flex-row gap-[48px] [@media(max-width:1023.98px)]:gap-6 items-center min-w-0 flex-shrink relative transition-all duration-500 ease-out ${
              isExpanded
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 -translate-y-2 pointer-events-none'
            }`}
          >
            {NAV_LINKS.map((link) =>
              link.children ? (
                // Panel trigger — hover opens the white panel rendered
                // after the bar (250ms intent); leaving the trigger or the
                // panel closes it after 250ms. The button's click only
                // opens, for touch screens and the keyboard. The hub page
                // (/about) is the panel's "View all" link and "Our Story"
                // tile.
                <div
                  key={link.label}
                  className="flex items-center"
                  onMouseEnter={() => scheduleMenuOpen(link.label)}
                  onMouseLeave={scheduleMenuClose}
                >
                  <button
                    type="button"
                    ref={(el) => {
                      triggerRefs.current[link.label] = el
                    }}
                    onClick={(e) => openMenuNow(link.label, e.detail === 0)}
                    onKeyDown={onTriggerKeyDown(link.label)}
                    aria-expanded={openMenu === link.label}
                    aria-controls={panelId(link.label)}
                    className="relative whitespace-nowrap text-base [@media(max-width:1023.98px)]:text-sm text-black hover:text-red-600 transition-colors flex items-center gap-1.5"
                  >
                    {link.label}
                    <ChevronDownIcon
                      className={`transition-transform duration-300 ${
                        openMenu === link.label ? 'rotate-180' : ''
                      }`}
                    />
                    {/* Open-state rule — Cartier's 3px red bar, which sweeps
                        through rather than fading: it grows in from the left
                        (0.6s ease-out, slowed from Cartier's 0.3s) and, on
                        close, flips its anchor to the right and shrinks away
                        to the right (0.6s ease-in). right-4 keeps it under
                        the label, clear of the chevron (10px icon + 6px
                        gap). */}
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 right-4 -bottom-1 h-[3px] bg-red-600 transition-transform [transition-duration:600ms] ${
                        openMenu === link.label
                          ? 'origin-left scale-x-100 ease-out'
                          : 'origin-right scale-x-0 ease-in'
                      }`}
                    />
                  </button>
                </div>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  // Nav is only ever visible when expanded (white bg) — text
                  // is always black against the white panel, with a red
                  // hover. The open panel's own trigger carries the red
                  // underline, so siblings stay at full strength (Cartier).
                  className="whitespace-nowrap text-base [@media(max-width:1023.98px)]:text-sm text-black hover:text-red-600 transition-all duration-300"
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
            when expanded, and stays while a panel is open as the line along
            the panel's top edge. Drawn as Cartier's header shadow, not a
            flat border: a crisp 1px box-shadow of 15% black (rgb 217 on
            white), one step darker than the #E6E6E6 tab line below it, so
            it reads as the bar casting a hairline shadow. The border itself
            is transparent; the shadow lands on the row just under it. */}
        <div className="hidden md:flex justify-center w-full">
          <hr
            className={`border-t w-full transition-opacity duration-500 ${
              isExpanded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ borderColor: 'transparent', boxShadow: '0 1px 0 0 rgba(0, 0, 0, 0.15)' }}
          />
        </div>

        {/* The panel — Cartier's menu flyout: the white header surface
            extends downward into an intro column (lg up) and a row of
            square photo tiles, each named above its photo on Cartier's
            light grey tab line. Tiles up to 182px (wide enough for the
            longest bold name on one line); the rest measured from
            cartier.com at 1440: 16px gap, 12px/18px uppercase names 18px
            from the photo, 1px #E6E6E6 line (rgb 230,230,230), max-height
            0.3s ease-in. ALWAYS in the DOM so the links stay crawlable in
            the server HTML; `inert` while closed keeps them out of the tab
            order and the accessibility tree. */}
        {NAV_LINKS.filter((l) => l.children).map((link) => {
          const open = openMenu === link.label && isExpanded
          return (
            <div
              key={link.label}
              id={panelId(link.label)}
              inert={!open}
              onMouseEnter={cancelMenuClose}
              onMouseLeave={scheduleMenuClose}
              onTransitionEnd={(e) => {
                if (e.target !== e.currentTarget || e.propertyName !== 'max-height') return
                if (open) setPanelSettled(true)
                else setMenuClosing(false)
              }}
              onKeyDown={onPanelKeyDown(link.label)}
              // Open height: its content's exact height (--panel-h), capped
              // at the screen below the expanded bar (max(14vh, 80px) + its
              // 1px line) and scrolling past that once settled (see
              // panelSettled), so short screens and landscape phones can
              // still reach every tile.
              className={`hidden md:block w-full transition-[max-height] duration-300 ease-in ${
                open
                  ? 'max-h-[min(var(--panel-h,640px),calc(100svh_-_max(14vh,80px)_-_1px))]'
                  : 'max-h-0'
              } ${open && panelSettled ? 'overflow-y-auto' : 'overflow-hidden'}`}
            >
              {/* Query container for the tile row: the one-row tiles and
                  the bands size against this box (100cqw). The scroll lock
                  hides any classic scrollbar for as long as the panel shows,
                  so the box is the full window minus this padding, the same
                  open and closing. */}
              <div className="flex justify-center pt-10 pb-8 pl-[70px] pr-[70px] [@media(max-width:1023.98px)]:pl-10 [@media(max-width:1023.98px)]:pr-10 [container-type:inline-size]">
                {link.intro && (
                  <>
                    {/* Intro column (lg up), measured from the design mock:
                        13px/2px-tracked eyebrow #B8AA9D, 38px medium display
                        heading, 17.5px/23.5px light body copy #8A8682 in a
                        198px column, a 14px "View all" in the MOMH red with a
                        2px #AF8286 rule under the words only, then the
                        haveli sketch at 70% opacity running from the panel's
                        left edge to the divider and down to its bottom edge,
                        as in the mock. The column is pinned to the left (the
                        logo's 70px line) as in the mock; the tile row takes
                        the remaining width (see the ul). Weights matched to
                        the mock by ink density. */}
                    <div className="hidden w-[198px] shrink-0 flex-col items-start md:flex">
                      <p className="font-body text-[13px] font-normal leading-4 tracking-[2px] text-[#B8AA9D] uppercase">
                        {link.intro.eyebrow}
                      </p>
                      {/* nowrap: --font-display puts Meno Banner (Adobe kit,
                          not wired yet) ahead of Cormorant; a wider face must
                          not wrap the title onto two lines. */}
                      <p className="mt-[13px] whitespace-nowrap font-display text-[38px] font-medium leading-[44px] text-black">
                        {link.intro.title}
                      </p>
                      <p className="mt-[13px] font-body text-[17.5px] font-light leading-[23.5px] text-[#8A8682]">
                        {link.intro.description}
                      </p>
                      <Link
                        href={link.href}
                        onClick={() => setOpenMenu(null)}
                        // Visible text stays "View all"; the name adds what
                        // it is all of, for screen-reader link lists.
                        aria-label={`View all: ${link.intro.title}`}
                        className="group/viewall mt-[26px] inline-flex items-center gap-[11px] font-body text-[14px] font-normal leading-4 tracking-[1.5px] text-[#9D2326] uppercase"
                      >
                        <span className="border-b-2 border-[#AF8286] pb-[6px]">View all</span>
                        {/* Arrow nudges right on hover / keyboard focus. */}
                        <svg
                          aria-hidden="true"
                          width="15"
                          height="10"
                          viewBox="0 0 15 10"
                          fill="none"
                          className="-mt-[6px] transition-transform duration-300 ease-out group-hover/viewall:translate-x-1 group-focus-visible/viewall:translate-x-1"
                        >
                          <path d="M0 5h13.5M9.5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                      </Link>
                      {/* Pinned to the column's foot; pt keeps it clear of
                          "View all" when the column sets the panel height.
                          It touches the panel's left edge (-ml-[70px] undoes
                          the container's pl-[70px]; -ml-10 on tablets, whose
                          padding is 40px) and its bottom edge (-mb-8 undoes
                          pb-8). 330px wide (297 on tablets), 10% past the
                          divider (70 + 198 + 32 = 300), which stops above
                          it. That is the most it can grow: a wrapped second
                          row's first photo can sit 5.5px from it (a 1092px
                          window) or 8.5px on tablets (850px, 4 + 2). Change
                          these with the container padding, column/divider
                          widths and the tile bands. The
                          box keeps the art's 600:171 shape before the image
                          arrives, and the image mounts with the tile photos
                          (first hover), so it isn't fetched on every page
                          view or on phones. */}
                      <div className="mt-auto -mb-8 -ml-[70px] w-[330px] pt-[30px] [@media(max-width:1023.98px)]:-ml-10 [@media(max-width:1023.98px)]:w-[297px]">
                        <span className="block aspect-[600/171] w-full">
                          {sheetMediaMounted && (
                            <img
                              src={PANEL_SKETCH_SRC}
                              alt=""
                              width={600}
                              height={171}
                              draggable={false}
                              className="block h-full w-full opacity-70 mix-blend-multiply"
                            />
                          )}
                        </span>
                      </div>
                    </div>
                    {/* Divider: 1px #EFEDE9, 32px after the text column and
                        29px before the tiles. As in the mock it starts at the
                        eyebrow's letters (mt-1); it stops 12px above the
                        sketch, which reaches past it: 107px above the
                        panel's foot (mb-[74px] + the container's pb-8 + the
                        1px bottom hr; the sketch is 95px tall incl. that
                        hr), 98px on tablets (mb-[65px]; sketch 86px). */}
                    <span
                      aria-hidden="true"
                      className="mt-1 mb-[74px] mr-[29px] ml-[32px] hidden w-px shrink-0 self-stretch bg-[#EFEDE9] md:block [@media(max-width:1023.98px)]:mb-[65px]"
                    />
                  </>
                )}
                {/* --tile is the photo size. Beside the 260px intro (198 +
                    32 + 1 + 29) the row follows the design's breakpoints
                    (desktop / laptop one row, tablet 3 + 3), and the photos
                    only ever shrink as the window narrows. 100cqw is the
                    panel's own content width: the window minus 2 x 70, or
                    2 x 40 below 1024 (the scroll lock keeps a classic
                    scrollbar off screen while the panel shows). With a
                    classic scrollbar on a window too short for the panel,
                    the panel's own scrollbar takes 15px once it settles,
                    once: one-row tiles shrink 2.5px, or a 1280-1294px
                    window wraps to 5 + 1. The narrower layout is never the
                    shorter one, so it stays.
                    - 100cqw >= 1140 (a 1280px window): one row of six,
                      (100cqw - 260 - 5 x 16) / 6, capped at 182 (133px at
                      1280, 142 at 1334, 153 at 1400, 160 at 1440, 182 from
                      1572). From 1194 the names keep one line and a long
                      bold name can overhang its tile by (name - tile) / 2,
                      kept >= 16px from its normal-weight neighbour (only one
                      is ever bold): at 12px that needs a 153.2px tile
                      (100cqw 1260), so below 1266 the names drop to 11px
                      (needs 141.2px); the last tile's line reaches 12px past
                      its edge to stay under an overhang. Below 1194 a name
                      that would overhang stacks onto two lines instead (each
                      child's stackWhen).
                    - below 1140: the tiles shrink with the window from the
                      one-row size at 1280 (133px) to 112px at 768, so a
                      narrower window never gets bigger photos:
                      112 + (100vw - 768) / 24. 112 is the floor: the widest
                      stacked line, CRAFTSMANSHIP, is 110.7px bold. They
                      shrink more slowly than the room, so the grid's
                      auto-fit columns wrap one tile at a time: 5 + 1 from
                      a 1279px window, 4 + 2 from 1091, 3 + 3 from 849. Below
                      1024 the row is capped at four columns: the padding
                      drops from 70 to 40 there, which would otherwise
                      bring back 5 + 1 at 1016-1023. Every wrap is two
                      rows, so the panel's height doesn't change with it.
                      The tiles are sized from the window (100vw), not the
                      panel, so the panel's own scrollbar on a short screen
                      can't change them (sized from 100cqw, that scrollbar
                      shrank the tiles, the panel then fitted and dropped
                      it, and the two states alternated every frame). It
                      can only take a column away, which keeps two rows.
                    Names stack where a tile is narrower than the bold name
                    plus ~1px for fonts rasterising slightly wider elsewhere:
                    Founder's Vision (122.7px bold) below a 1049px window,
                    The Architecture (130.2) below 1229, the other three in
                    all of the wrapped layouts. Those two are window
                    queries, as the tile is; the @container wrapper keeps
                    them off in browsers without container queries, which
                    simply keep 3 + 3 at 182px with one-line names (the base
                    max-w; the @supports rules lift it). Name widths were measured in
                    the real fonts; re-measure if a label or the font
                    changes. 340 (260 + 80) and the breakpoints assume the
                    intro column: change them with its width. Arbitrary
                    variants because this config's object screens (wide,
                    sbs) switch off Tailwind's min-[...]. The grid fills the
                    width right of the divider (flex-1, which auto-fit needs
                    to count its columns) and centres its columns in it
                    (justify-center); a wrapped tile starts under the first
                    column. auto-fit, not auto-fill: once the tiles stop at
                    182px a wide screen has room for more columns than
                    tiles, and auto-fill keeps those empty columns, pushing
                    the six off centre (one spare at 1920, four at 2560).
                    One row fills the width exactly until the tiles reach
                    182px.
                    Even ends: the row sits 29px after the divider but the
                    panel's right padding is 70 (40 below 1024), so left
                    shifts it by half the difference, 20.5 (5.5), leaving
                    equal space from the divider and from the window's right
                    edge at every width, with the tile sizes
                    and every band above unchanged. Change it with that
                    padding or the divider's mr. */}
                <ul className="relative left-[20.5px] mx-auto grid min-w-0 flex-1 max-w-[calc(var(--tile)*3+32px)] grid-cols-[repeat(auto-fit,var(--tile))] [@media(max-width:1023.98px)]:left-[5.5px] content-start justify-center gap-x-4 gap-y-6 self-start [--tile:182px] [@container(max-width:1139.98px)]:[--tile:calc(112px_+_(100vw_-_768px)/24)] [@container(min-width:1140px)]:[--tile:min(182px,calc((100cqw_-_340px)/6))] [@supports(container-type:inline-size)]:[@media(min-width:1024px)]:max-w-none [@supports(container-type:inline-size)]:[@media(max-width:1023.98px)]:max-w-[calc(var(--tile)*4+48px)]">
                  {link.children!.map((child) => (
                    <li key={child.label}>
                      <Link
                        href={child.href}
                        onClick={() => setOpenMenu(null)}
                        className="group flex w-[var(--tile)] flex-col items-center text-center text-black"
                      >
                        {/* Name above the photo: one line, or two where
                            the tile is narrower than the bold name (see the
                            --tile note above). The box is 36px tall in the
                            bands where any name can stack, so a row's
                            one-line and two-line names share one bottom
                            edge. 12px, or 11px in the 1194-1265 one-row band.
                            The ::after is Cartier's tab line: 1px #E6E6E6
                            under the names, 8px past each side of the tile
                            so neighbours meet mid-gap as one continuous line
                            per row. It sits on the bottom pixel row of this
                            box, which is also the bottom row of the 2px red
                            rule (the rule ends at this box's bottom), so the
                            red rests on the grey and covers it under the
                            hovered name; isolate + -z-10 keeps the grey
                            behind the red. */}
                        <span className="relative isolate mb-[18px] flex h-[18px] [@container(max-width:1193.98px)]:h-[36px] items-end justify-center self-stretch whitespace-nowrap text-[12px] leading-[18px] [@container(min-width:1194px)_and_(max-width:1265.98px)]:text-[11px] tracking-[0.5px] uppercase after:absolute after:-inset-x-2 after:bottom-0 after:-z-10 after:h-px after:bg-[#E6E6E6] [@container(min-width:1194px)]:[li:last-child_&]:after:-right-3">
                          {/* Hover turns the name bold. An invisible bold
                              copy shares the grid cell and sets its size,
                              so going bold never shifts the name. */}
                          <span className="grid">
                            <span aria-hidden="true" className="invisible col-start-1 row-start-1 self-end font-bold">
                              <NavName child={child} />
                            </span>
                            {/* Hover sweeps a 2px red rule under the name,
                                the same motion as the bar under "The
                                Museum": in from the left (0.6s ease-out),
                                and on leave it anchors right and shrinks
                                away to the right (0.6s ease-in). Only the
                                size transitions, so the anchor flips at
                                once. The name stays black. #dc2626 is
                                red-600, the nav's hover red. The rule is
                                the bottom 2px of the name's last line box,
                                4px below the letters, on the grey line.
                                justify-self-center shrinks this block to
                                its own text, so the rule spans the name
                                (the widest line of a stacked one) at its
                                current weight, and a stacked name gets one
                                rule under both lines, not one per line. */}
                            <span className="col-start-1 row-start-1 self-end justify-self-center bg-[linear-gradient(#dc2626,#dc2626)] bg-[length:0_2px] bg-[position:100%_100%] bg-no-repeat transition-[background-size] [transition-duration:600ms] ease-in group-hover:bg-[length:100%_2px] group-hover:bg-[position:0_100%] group-hover:font-bold group-hover:ease-out group-focus-visible:bg-[length:100%_2px] group-focus-visible:bg-[position:0_100%] group-focus-visible:font-bold group-focus-visible:ease-out">
                              <NavName child={child} />
                            </span>
                          </span>
                        </span>
                        {/* Square photo in a square frame, so every tile is
                            the same size; cream shows only while it loads.
                            Hover zooms the photo inside the fixed frame;
                            its edges trim only while hovered. */}
                        <span className="relative block aspect-square w-full overflow-hidden bg-[#F7F4EF]">
                          {sheetMediaMounted && child.image && (
                            <img
                              src={child.image}
                              alt=""
                              draggable={false}
                              className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.06] group-focus-visible:scale-[1.06]"
                            />
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Bottom separator — the same hairline as the bar's own hr,
                  closing the panel where it meets the page. */}
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
