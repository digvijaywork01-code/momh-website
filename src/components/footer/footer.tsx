'use client'

/**
 * Footer — PDF page 13.
 *
 * Black background with white text. Top strip is the floral painting row
 * (rendered by the separate FlowerPaintings component, also on black).
 * Below it: logo + social icons on the left, then a 4-column link grid
 * (Story / Support / Visit / Opening Hours). Bottom bar has copyright
 * + 3 legal links on the right.
 *
 * Note on the logo: per the user's instruction, the current red
 * `momh-logo.jpg` is used as a placeholder until the white footer logo
 * arrives. The white stacked MoMH glyph in the PDF will swap in cleanly
 * by replacing the <Image src> below.
 */

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

// Link columns from PDF page 13 (left → right).
type LinkItem = { label: string; href: string }
type LinkColumn = { title: string; items: LinkItem[] }

const ABOUT_LINKS: LinkColumn = {
  title: 'About',
  items: [
    { label: 'Our Story', href: '/#about' },
    { label: "Founder's Vision", href: '/#founder' },
    { label: 'As Seen On', href: '/#press' },
    { label: 'Blog', href: '/#blogs' },
    { label: 'Testimonials', href: '/#testimonials' },
  ],
}

const SUPPORT_LINKS: LinkColumn = {
  title: 'Support',
  items: [
    { label: 'Contact Us', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Cookies Policy', href: '/cookies-policy' },
    { label: 'Accessibility Statement', href: '/accessibility' },
    { label: 'Sitemap', href: '/sitemap' },
  ],
}

const VISIT_LINKS: LinkColumn = {
  title: 'Visit',
  items: [
    { label: 'Plan Your Visit', href: '/plan-your-visit' },
    { label: 'Museum Guidelines', href: '/museum-guidelines' },
    { label: 'Craft Your Jewellery', href: '/craft-your-jewellery' },
    { label: 'Book a Visit', href: '/book-an-appointment' },
    { label: 'Create Your Sevak', href: '/create-your-sevak' },
  ],
}

const OPENING_HOURS: { day: string; time: string }[] = [
  { day: 'Monday', time: '10am – 4pm' },
  { day: 'Tuesday', time: '10am – 4pm' },
  { day: 'Wednesday', time: '10am – 4pm' },
  { day: 'Thursday', time: '10am – 4pm' },
  { day: 'Friday', time: '10am – 4pm' },
  { day: 'Saturday', time: '10am – 4pm' },
  { day: 'Sunday', time: 'Holiday' },
]

const LEGAL_LINKS: LinkItem[] = [
  { label: 'Copyright', href: '/copyright' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Use', href: '/terms' },
]

const ADDRESS_LINES = [
  'Shekhawati Haveli E141,',
  'Sardar Patel Marg, Durgadas Colony,',
  'C Scheme, Ashok Nagar, Jaipur,',
  'Rajasthan 302001',
]

const SocialLinks: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex gap-3 ${className || ''}`}>
    <Link
      href="https://www.facebook.com/sunitashekhawatjaipur"
      aria-label="Facebook"
      className="w-7 h-7 rounded-full bg-offwhite text-founder-red flex items-center justify-center hover:bg-offwhite/90 transition-colors"
    >
      <svg width="6" height="12" viewBox="0 0 5 11" fill="none">
        <path
          d="M3.0889 6.39497V11H1.40169V6.39497H0V4.52774H1.40169V3.84837C1.40169 1.32618 2.24205 0 4.02012 0C4.56522 0 4.70149 0.109837 5 0.199334V2.04623C4.6658 1.973 4.57171 1.93232 4.22453 1.93232C3.81246 1.93232 3.59182 2.07877 3.39066 2.3676C3.18949 2.65644 3.0889 3.1568 3.0889 3.87278V4.53181H5L4.48735 6.39904H3.0889V6.39497Z"
          fill="currentColor"
        />
      </svg>
    </Link>
    <Link
      href="https://www.instagram.com/momh_india/"
      aria-label="Instagram"
      className="w-7 h-7 rounded-full bg-offwhite text-founder-red flex items-center justify-center hover:bg-offwhite/90 transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
        <path
          d="M7.54 9.06H1.67C0.86 9.06 0.19 8.4 0.19 7.59V1.71C0.19 0.9 0.86 0.24 1.67 0.24H7.54C8.35 0.24 9.01 0.9 9.01 1.71V7.59C9.01 8.4 8.35 9.06 7.54 9.06Z"
          fill="currentColor"
        />
        <path
          d="M4.6 6.92C4 6.92 3.43 6.68 3 6.25C2.58 5.82 2.34 5.26 2.34 4.65C2.34 4.05 2.58 3.48 3 3.05C3.43 2.62 4 2.39 4.6 2.39C5.21 2.39 5.78 2.62 6.21 3.05C6.63 3.48 6.87 4.05 6.87 4.65C6.87 5.26 6.63 5.82 6.21 6.25C5.78 6.68 5.21 6.92 4.6 6.92ZM4.6 2.87C3.62 2.87 2.82 3.67 2.82 4.65C2.82 5.63 3.62 6.43 4.6 6.43C5.59 6.43 6.39 5.64 6.39 4.65C6.38 3.67 5.59 2.87 4.6 2.87Z"
          fill="white"
        />
        <path d="M7.31 2.31C7.55 2.31 7.75 2.12 7.75 1.88C7.75 1.64 7.55 1.44 7.31 1.44C7.07 1.44 6.88 1.64 6.88 1.88C6.88 2.12 7.07 2.31 7.31 2.31Z" fill="white" />
      </svg>
    </Link>
    <Link
      href="https://twitter.com"
      aria-label="X (Twitter)"
      className="w-7 h-7 rounded-full bg-offwhite text-founder-red flex items-center justify-center hover:bg-offwhite/90 transition-colors"
    >
      <svg width="12" height="11" viewBox="0 0 11 10" fill="none">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3.47 0H0L4.11 5.44L0.26 10H2.04L4.95 6.55L7.53 9.97H11L6.77 4.37L6.78 4.38L10.42 0.06H8.64L5.94 3.27L3.47 0ZM1.91 0.95H2.99L9.09 9.02H8.01L1.91 0.95Z"
          fill="currentColor"
        />
      </svg>
    </Link>
    <Link
      href="https://www.linkedin.com/company/museum-of-meenakari-heritage-momh/about/"
      aria-label="LinkedIn"
      className="w-7 h-7 rounded-full bg-offwhite text-founder-red flex items-center justify-center hover:bg-offwhite/90 transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 11 11" fill="none">
        <path d="M2.56 3.89H0.41V10.75H2.56V3.89Z" fill="currentColor" />
        <path d="M8.38 3.74C8.3 3.73 8.21 3.73 8.13 3.72C6.93 3.67 6.25 4.38 6.01 4.69C5.94 4.78 5.91 4.83 5.91 4.83V3.91H3.86V10.77H5.91H6.01C6.01 10.07 6.01 9.37 6.01 8.68C6.01 8.3 6.01 7.92 6.01 7.55C6.01 7.08 5.97 6.58 6.21 6.16C6.41 5.8 6.76 5.62 7.16 5.62C8.35 5.62 8.38 6.7 8.38 6.8C8.38 6.8 8.38 6.81 8.38 6.81V10.8H10.53V6.32C10.53 4.79 9.75 3.89 8.38 3.74Z" fill="currentColor" />
        <path d="M1.48 3C2.17 3 2.73 2.44 2.73 1.75C2.73 1.06 2.17 0.5 1.48 0.5C0.79 0.5 0.24 1.06 0.24 1.75C0.24 2.44 0.79 3 1.48 3Z" fill="currentColor" />
      </svg>
    </Link>
    <Link
      href="https://www.youtube.com/channel/UCVDcqrqm62CcaPe1O5iJiVg"
      aria-label="YouTube"
      className="w-7 h-7 rounded-full bg-offwhite text-founder-red flex items-center justify-center hover:bg-offwhite/90 transition-colors"
    >
      <svg width="14" height="10" viewBox="0 0 14 9" fill="none">
        <path
          d="M10.98 8.91H2.15C0.97 8.91 0.02 7.87 0.02 6.59V2.42C0.02 1.13 0.98 0.09 2.15 0.09H10.98C12.16 0.09 13.11 1.14 13.11 2.42V6.59C13.11 7.87 12.16 8.91 10.98 8.91Z"
          fill="currentColor"
        />
        <path d="M8.88 4.44L5.17 2.3V6.58L8.88 4.44Z" fill="white" />
      </svg>
    </Link>
    <Link
      href="https://in.pinterest.com/shekhawatsunita/"
      aria-label="Pinterest"
      className="w-7 h-7 rounded-full bg-offwhite text-founder-red flex items-center justify-center hover:bg-offwhite/90 transition-colors"
    >
      <svg width="10" height="12" viewBox="0 0 9 11" fill="none">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3.76 7.52C4.12 7.53 4.45 7.99 5.42 7.99C7.23 8 8.48 6.68 8.86 4.93C10.22 -1.1 1 -1.58 0.06 3.38C-0.16 4.55 0.2 5.9 1.16 6.34C1.89 6.68 1.93 5.71 1.71 5.29C0.72 3.45 1.91 1.79 3.46 1.32C4.92 0.87 5.96 1.24 6.75 2.01C7.76 3.01 7.3 5.73 6.1 6.6C5.68 6.9 4.9 6.97 4.5 6.61C3.68 5.88 4.95 4.33 4.76 3.19C4.57 2.07 2.71 2.24 2.62 3.89C2.57 4.73 2.83 4.98 2.63 5.82C2.31 7.17 1.35 9.92 2.03 11C3.03 10.55 3.52 7.85 3.76 7.52Z"
          fill="currentColor"
        />
      </svg>
    </Link>
  </div>
)

const Footer = () => {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)
  const toggleAccordion = (title: string) =>
    setOpenAccordion((prev) => (prev === title ? null : title))

  return (
    // `font-body` (Gill Sans) on the root so the bottom-bar copyright +
    // legal links inherit it instead of falling back to the user-agent
    // serif (Times). Per-element overrides for the column headers etc.
    // still apply on top of this.
    <footer className="bg-black text-offwhite font-body">
      {/* ─── Desktop ─── */}
      <div className="hidden md:block">
        {/* Tight vertical padding so the flowers row + 4-column link
            grid + bottom copyright bar all fit in laptop-class
            viewports (~700-800px content area). Inside the snap-
            section wrapper, `justify-end` pushes this content to the
            bottom of the viewport while the flowers stack just above. */}
        <div className="max-w-[1920px] mx-auto px-16 lg:px-20 pt-8 lg:pt-10 pb-6">
          {/* Top row: logo + socials on the left, link columns on the right */}
          <div className="grid grid-cols-12 gap-8 lg:gap-12">
            <div className="col-span-3 flex flex-col gap-6">
              <Link href="/" className="inline-flex">
                {/* Official white stacked MOMH wordmark — same logo
                    used in the ContactPanel above on the personal-
                    consultation page. White-on-transparent, designed
                    for the black footer background. */}
                <Image
                  src="/momh-assets/momh-logo-white.png"
                  alt="Museum of Meenakari Heritage"
                  width={120}
                  height={120}
                  className="object-contain"
                />
              </Link>
              <SocialLinks />
            </div>

            <FooterLinkColumn className="col-span-2" column={ABOUT_LINKS} />
            <FooterLinkColumn className="col-span-2" column={SUPPORT_LINKS} />

            {/* Visit column with sub-section "Contact" + address */}
            <div className="col-span-2 flex flex-col gap-6">
              <FooterLinkColumn column={VISIT_LINKS} />
              <div className="flex flex-col gap-2">
                <h3 className="font-body font-normal text-offwhite text-sm tracking-wide mb-1">Contact</h3>
                <address className="not-italic font-body text-sm leading-relaxed text-offwhite/80">
                  {ADDRESS_LINES.map((line) => (
                    <React.Fragment key={line}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </address>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="col-span-3 flex flex-col gap-2">
              <h3 className="font-body font-normal text-offwhite text-sm tracking-wide mb-1">Opening Hours</h3>
              <ul className="font-body text-sm leading-relaxed text-offwhite/80 space-y-1.5">
                {OPENING_HOURS.map(({ day, time }) => (
                  <li key={day} className="flex justify-between">
                    <span>{day}</span>
                    <span>{time}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-offwhite/60">*Except Public Holidays</p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-6 pt-4 border-t border-offwhite/15 flex flex-row justify-between items-center text-xs text-offwhite/70">
            <p className="m-0">
              © Museum of Meenakari Heritage 2026. ALL RIGHTS RESERVED.
            </p>
            <div className="flex gap-6">
              {LEGAL_LINKS.map((link) => (
                <Link key={link.label} href={link.href} className="hover:text-offwhite transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile ─── */}
      <div className="md:hidden px-6 pt-12 pb-6">
        <div className="flex flex-col items-start gap-6 mb-10">
          <Link href="/" className="inline-flex">
            <Image
              src="/momh-assets/momh-logo-white.png"
              alt="Museum of Meenakari Heritage"
              width={80}
              height={80}
              className="object-contain"
            />
          </Link>
          <SocialLinks />
        </div>

        <div className="border-t border-offwhite/15">
          {[ABOUT_LINKS, SUPPORT_LINKS, VISIT_LINKS].map((col) => (
            <div key={col.title} className="border-b border-offwhite/15">
              <button
                onClick={() => toggleAccordion(col.title)}
                className="w-full flex justify-between items-center py-4 font-body text-sm"
              >
                {col.title}
                <ChevronDownIcon
                  className={`transition-transform ${openAccordion === col.title ? 'rotate-180' : ''}`}
                />
              </button>
              {openAccordion === col.title && (
                <ul className="pb-4 space-y-2 font-body text-sm text-offwhite/80">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="hover:underline">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Contact accordion */}
          <div className="border-b border-offwhite/15">
            <button
              onClick={() => toggleAccordion('Contact')}
              className="w-full flex justify-between items-center py-4 font-body text-sm"
            >
              Contact
              <ChevronDownIcon
                className={`transition-transform ${openAccordion === 'Contact' ? 'rotate-180' : ''}`}
              />
            </button>
            {openAccordion === 'Contact' && (
              <address className="pb-4 not-italic font-body text-sm leading-relaxed text-offwhite/80">
                {ADDRESS_LINES.map((line) => (
                  <React.Fragment key={line}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </address>
            )}
          </div>

          {/* Opening Hours accordion */}
          <div className="border-b border-offwhite/15">
            <button
              onClick={() => toggleAccordion('Opening Hours')}
              className="w-full flex justify-between items-center py-4 font-body text-sm"
            >
              Opening Hours
              <ChevronDownIcon
                className={`transition-transform ${openAccordion === 'Opening Hours' ? 'rotate-180' : ''}`}
              />
            </button>
            {openAccordion === 'Opening Hours' && (
              <div className="pb-4 font-body text-sm text-offwhite/80 space-y-1.5">
                {OPENING_HOURS.map(({ day, time }) => (
                  <div key={day} className="flex justify-between">
                    <span>{day}</span>
                    <span>{time}</span>
                  </div>
                ))}
                <p className="mt-2 text-xs text-offwhite/60">*Except Public Holidays</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 text-xs text-offwhite/70">
          <p className="m-0">© Museum of Meenakari Heritage 2026. ALL RIGHTS RESERVED.</p>
          <div className="flex flex-wrap gap-4">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="hover:text-offwhite transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

const FooterLinkColumn: React.FC<{ column: LinkColumn; className?: string }> = ({
  column,
  className,
}) => (
  <div className={`flex flex-col gap-3 ${className || ''}`}>
    <h3 className="font-body font-normal text-offwhite text-sm tracking-wide mb-1">{column.title}</h3>
    <ul className="space-y-2 font-body text-sm text-offwhite/80">
      {column.items.map((item) => (
        <li key={item.label}>
          <Link href={item.href} className="hover:text-offwhite transition-colors">
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
)

export default Footer
