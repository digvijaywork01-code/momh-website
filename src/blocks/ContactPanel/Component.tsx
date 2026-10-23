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
import { accentLastWord } from '@/utilities/accentLastWord'
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
const MomhLogo: React.FC<{ className?: string }> = ({ className }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="/momh-assets/momh-logo-white.png"
    alt="Museum of Meenakari Heritage"
    className={cn('h-16 lg:h-20 w-auto object-contain', className)}
  />
)

/**
 * Red-filled circular icon — the brand's signature contact mark from
 * PDF p4. Brand-red circle, white inner symbol, ~20px diameter.
 * Sized so the icon visually pairs tightly with the body text — a
 * larger circle leaves dead space between the visible pin and the
 * text's first character.
 *
 * `inverted` (Book An Appointment PDF, lg+ only): a white 28.6px disc
 * (of 1920) with a SOLID red glyph. The outline glyph stays for phones.
 */
const IconCircle: React.FC<{
  inverted?: boolean
  outline: React.ReactNode
  solidPath: string
}> = ({ inverted, outline, solidPath }) => (
  <span
    className={cn(
      'inline-flex items-center justify-center w-[20px] h-[20px] rounded-full bg-brand-red text-white shrink-0',
      inverted &&
        'lg:w-[max(20px,1.49vw)] lg:h-[max(20px,1.49vw)] lg:bg-white lg:text-brand-red',
    )}
  >
    {inverted ? <span className="lg:hidden inline-flex">{outline}</span> : outline}
    {inverted && (
      <svg
        className="hidden lg:block w-[max(11px,0.83vw)] h-[max(11px,0.83vw)]"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path fillRule="evenodd" d={solidPath} />
      </svg>
    )}
  </span>
)

const PinIcon: React.FC<{ inverted?: boolean }> = ({ inverted }) => (
  <IconCircle
    inverted={inverted}
    solidPath="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
    outline={
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    }
  />
)
const PhoneIcon: React.FC<{ inverted?: boolean }> = ({ inverted }) => (
  <IconCircle
    inverted={inverted}
    solidPath="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
    outline={
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    }
  />
)
const EmailIcon: React.FC<{ inverted?: boolean }> = ({ inverted }) => (
  <IconCircle
    inverted={inverted}
    solidPath="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
    outline={
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    }
  />
)

export const ContactPanelBlock: React.FC<
  ContactPanelBlockProps & {
    /** Render variant forwarded by RenderBlocks (NOT a CMS field).
     *  'appointment-page' = the Book An Appointment PDF contact band, lg+
     *  only: brand-red-dark panel, pure white type scaled from the 1920
     *  artboard, white icon discs hanging left of centred text. Default
     *  (undefined) keeps /personal-consultation untouched. */
    variant?: 'appointment-page'
  }
> = ({
  variant,
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
  // Book An Appointment PDF (1920 artboard): values are px / 1920 as vw,
  // floored at the phone sizes so 1024-1300 never shrinks below them.
  const appointmentPage = variant === 'appointment-page'
  // Icons hang outside the text so each line centres on the title axis.
  const hangingIcon = appointmentPage && 'lg:absolute lg:right-full lg:mr-[0.86vw]'
  const contactText =
    appointmentPage && 'lg:text-[length:max(1.125rem,1.495vw)] lg:leading-[1.2] lg:opacity-100'
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
          appointmentPage && 'lg:bg-brand-red-dark lg:text-white',
        )}
      >
        <div
          className={cn(
            'max-w-xl w-full flex flex-col items-center',
            appointmentPage && 'lg:max-w-[max(22rem,32vw)]',
          )}
        >
          {/* MOMH logo at TOP CENTRE of the panel (PDF p4). */}
          {showLogo && (
            <div className={cn('mb-8', appointmentPage && 'lg:mb-[2.6vw]')}>
              <MomhLogo className={appointmentPage ? 'lg:h-[max(4rem,6.49vw)]' : undefined} />
            </div>
          )}

          <div
            className={cn(
              'editorial-display text-[1.75rem] md:text-[2.25rem] lg:text-[2.75rem] leading-tight mb-4',
              // Only the last word is italic (accentLastWord), in brand red.
              '[&_em]:text-brand-red [&_i]:text-brand-red',
              // PDF: Gill Sans Light 48.66px, "Meenakari" Cormorant 50.69px,
              // flush left with the left-aligned blurb below it.
              appointmentPage &&
                'lg:self-stretch lg:text-left lg:text-[length:max(1.75rem,2.534vw)] lg:leading-[1.2] lg:mb-[1.84vw] lg:[&_em]:text-[1.042em] lg:[&_i]:text-[1.042em]',
            )}
          >
            <RichText data={accentLastWord(headline)} enableGutter={false} enableProse={false} />
          </div>

          {body && (
            <div
              className={cn(
                'font-body text-body opacity-90 leading-relaxed mb-10',
                // PDF: Gill Sans Light 28.7/34.4, left-aligned.
                contactText,
                appointmentPage && 'lg:text-left lg:mb-[1.797vw]',
              )}
            >
              <RichText data={body} enableGutter={false} enableProse={false} />
            </div>
          )}

          {/* Contact list — each row sizes to its content (`w-fit`)
              so the icon sits flush against the text edge. The OUTER
              flex centres each whole row within the panel. */}
          <div
            className={cn(
              'flex flex-col gap-5 items-center',
              // PDF: 68.9px baseline to baseline between the blocks.
              appointmentPage && 'lg:gap-[1.797vw]',
            )}
          >
            {address && (
              <div className={cn('flex items-start gap-2 w-fit', appointmentPage && 'lg:relative')}>
                {/* `mt-[7px]` aligns the icon's vertical centre with
                    the first line of the address text. */}
                <span className={cn('mt-[7px] shrink-0', hangingIcon, appointmentPage && 'lg:flex lg:mt-0 lg:top-[0.18vw]')}>
                  <PinIcon inverted={appointmentPage} />
                </span>
                {/* Address wrapper is `w-fit` so it shrinks to the
                    natural width of its longest line. Inside, text is
                    center-aligned so shorter lines (line 2, line 3)
                    sit visually centred under line 1 — matches PDF
                    p4 where each address line is individually centred
                    within the address block. */}
                <div
                  className={cn(
                    'font-body text-body opacity-95 leading-relaxed text-center w-fit',
                    contactText,
                  )}
                >
                  <RichText data={address} enableGutter={false} enableProse={false} />
                </div>
              </div>
            )}
            {phone && (
              <div className={cn('flex items-center gap-2 w-fit', appointmentPage && 'lg:relative')}>
                {appointmentPage ? (
                  <span className={cn('inline-flex', hangingIcon)}>
                    <PhoneIcon inverted />
                  </span>
                ) : (
                  <PhoneIcon />
                )}
                <a
                  href={`tel:${phone.replace(/\s+/g, '')}`}
                  className={cn(
                    'font-body text-body opacity-95 hover:opacity-100 hover:underline underline-offset-4',
                    contactText,
                  )}
                >
                  Phone: {phone}
                </a>
              </div>
            )}
            {email && (
              <div className={cn('flex items-center gap-2 w-fit', appointmentPage && 'lg:relative')}>
                {appointmentPage ? (
                  <span className={cn('inline-flex', hangingIcon)}>
                    <EmailIcon inverted />
                  </span>
                ) : (
                  <EmailIcon />
                )}
                <a
                  href={`mailto:${email}`}
                  className={cn(
                    'font-body text-body opacity-95 hover:opacity-100 hover:underline underline-offset-4',
                    contactText,
                  )}
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
