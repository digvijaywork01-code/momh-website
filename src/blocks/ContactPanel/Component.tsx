'use client'

/**
 * ContactPanelBlock — half-image + half-coloured-panel layout with the
 * MOMH contact details (logo + headline + body + address + phone +
 * email).
 *
 * Shares the half-and-half structure with `NewsletterFeature` but the
 * right column carries CONTACT INFO. The image column sizes to the
 * image's natural aspect (same pattern as ImageBanner 'natural'); the
 * panel column matches via flex stretch and centres its content.
 */

import React, { useEffect, useRef } from 'react'

import type { ContactPanelBlock as ContactPanelBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { cn } from '@/utilities/ui'

type BgKey = NonNullable<ContactPanelBlockProps['panelBackgroundColor']>

const panelBgClass: Record<BgKey, string> = {
  maroon: 'bg-maroon text-offwhite',
  emerald: 'bg-emerald text-offwhite',
  black: 'bg-black text-offwhite',
  cream: 'bg-cream text-ink',
  ivory: 'bg-ivory text-ink',
}

const isDarkPanel = (bg: BgKey): boolean =>
  bg === 'maroon' || bg === 'emerald' || bg === 'black'

/**
 * MOMH logo — the official stacked wordmark ("MO" / "MH" with a
 * silhouetted parrot inside the "O") in WHITE on transparent. Sized
 * to ~80px tall to match the PDF p4 monogram in the top-centre of
 * the contact panel.
 *
 * The white logo only reads on dark panels (maroon / emerald /
 * black). If a light-coloured panel is ever chosen, the alpha layer
 * will render near-invisible — the caller should suppress the logo
 * via `showLogo: false` in that case.
 */
const MomhLogo: React.FC = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="/momh-assets/momh-logo-white.png"
    alt="Museum of Meenakari Heritage"
    className="h-16 lg:h-20 w-auto object-contain"
  />
)

/**
 * Red-filled circular icon — the brand's signature contact mark from
 * PDF p4. Brand-red circle, white inner symbol, ~20px diameter.
 * Sized so the icon visually pairs tightly with the body text — a
 * larger circle leaves dead space between the visible pin and the
 * text's first character.
 */
const IconCircle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center justify-center w-[20px] h-[20px] rounded-full bg-brand-red text-white shrink-0">
    {children}
  </span>
)

const PinIcon: React.FC = () => (
  <IconCircle>
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  </IconCircle>
)
const PhoneIcon: React.FC = () => (
  <IconCircle>
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  </IconCircle>
)
const EmailIcon: React.FC = () => (
  <IconCircle>
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  </IconCircle>
)

export const ContactPanelBlock: React.FC<ContactPanelBlockProps> = ({
  image,
  imagePosition = 'left',
  panelBackgroundColor = 'maroon',
  showLogo = true,
  headline,
  body,
  address,
  phone,
  email,
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const sectionRef = useRef<HTMLElement | null>(null)

  const panelBg = (panelBackgroundColor || 'maroon') as BgKey
  const dark = isDarkPanel(panelBg)
  const imageFirst = imagePosition === 'left'
  const imgObj = typeof image === 'object' && image ? image : null

  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setHeaderTheme(dark ? 'dark' : 'light')
        })
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [dark, setHeaderTheme])

  return (
    <section
      ref={sectionRef}
      className={cn(
        'w-full flex flex-col',
        imageFirst ? 'lg:flex-row' : 'lg:flex-row-reverse',
      )}
      data-theme={dark ? 'dark' : 'light'}
      aria-label="Contact us"
    >
      {/* Image column — sized to natural aspect (no crop). */}
      <div
        className="lg:w-1/2 relative aspect-[4/3] lg:aspect-auto overflow-hidden bg-warm-gray/10"
        style={
          imgObj && imgObj.width && imgObj.height
            ? { aspectRatio: `${imgObj.width} / ${imgObj.height}` }
            : undefined
        }
      >
        {imgObj && (
          <Media
            fill
            loading="eager"
            imgClassName="absolute inset-0 w-full h-full object-cover"
            resource={imgObj}
          />
        )}
      </div>

      {/* Panel column — coloured bg, everything centered both axes.
          Layout (per PDF p4, top to bottom):
            1. MOMH monogram (top, small)
            2. Headline "Museum of *Meenakari* Heritage"
            3. Body paragraph
            4. Address  (pin icon + 3-line centred address text)
            5. Phone    (phone icon + single line)
            6. Email    (envelope icon + single line)
          Each row centres as a unit; the icon sits flush against the
          text, no awkward gap. */}
      <div
        className={cn(
          'lg:w-1/2 flex flex-col justify-center items-center text-center',
          'py-16 lg:py-20 px-6 md:px-12 lg:px-20',
          panelBgClass[panelBg],
        )}
      >
        <div className="max-w-xl w-full flex flex-col items-center">
          {/* MOMH logo at TOP CENTRE of the panel (PDF p4). */}
          {showLogo && (
            <div className="mb-8">
              <MomhLogo />
            </div>
          )}

          <div className="editorial-display text-[1.75rem] md:text-[2.25rem] lg:text-[2.75rem] leading-tight mb-4">
            <RichText data={headline} enableGutter={false} enableProse={false} />
          </div>

          {body && (
            <div className="font-body text-body opacity-90 leading-relaxed mb-10">
              <RichText data={body} enableGutter={false} enableProse={false} />
            </div>
          )}

          {/* Contact list — each row sizes to its content (`w-fit`)
              so the icon sits flush against the text edge. The OUTER
              flex centres each whole row within the panel. */}
          <div className="flex flex-col gap-5 items-center">
            {address && (
              <div className="flex items-start gap-2 w-fit">
                {/* `mt-[7px]` aligns the icon's vertical centre with
                    the first line of the address text. */}
                <span className="mt-[7px] shrink-0">
                  <PinIcon />
                </span>
                {/* Address wrapper is `w-fit` so it shrinks to the
                    natural width of its longest line. Inside, text is
                    center-aligned so shorter lines (line 2, line 3)
                    sit visually centred under line 1 — matches PDF
                    p4 where each address line is individually centred
                    within the address block. */}
                <div className="font-body text-body opacity-95 leading-relaxed text-center w-fit">
                  <RichText data={address} enableGutter={false} enableProse={false} />
                </div>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-2 w-fit">
                <PhoneIcon />
                <a
                  href={`tel:${phone.replace(/\s+/g, '')}`}
                  className="font-body text-body opacity-95 hover:opacity-100 hover:underline underline-offset-4"
                >
                  Phone: {phone}
                </a>
              </div>
            )}
            {email && (
              <div className="flex items-center gap-2 w-fit">
                <EmailIcon />
                <a
                  href={`mailto:${email}`}
                  className="font-body text-body opacity-95 hover:opacity-100 hover:underline underline-offset-4"
                >
                  Email: {email}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactPanelBlock
