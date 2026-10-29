'use client'

/**
 * ImageBannerBlock — full-bleed photographic banner.
 *
 * Used at the top + bottom of the Plan Your Visit page (haveli exterior
 * shots) and to open most inner pages. When the page's title block comes
 * right after it, the title and its first sentence sit on the photo
 * (RenderBlocks' introOnBanner, on by default). Sets the header theme so
 * the nav bar reads
 * correctly against the image. Marked `data-snap-section` so the
 * smooth-scroll snap manager treats it as a discrete editorial moment.
 */

import React, { useEffect, useRef } from 'react'

import type { ImageBannerBlock as ImageBannerBlockProps, SectionIntroBlock } from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { accentLastWord } from '@/utilities/accentLastWord'
import { richTextHasText } from '@/utilities/richTextHasText'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useNoScrollAnimations } from '@/utilities/useNoScrollAnimations'
import { cn } from '@/utilities/ui'

type HeightKey = NonNullable<ImageBannerBlockProps['height']>

const heightClass: Record<HeightKey, string> = {
  screen: 'h-svh',
  tall: 'h-[80svh]',
  medium: 'h-[60svh]',
  // 'natural' is handled separately below — it sets aspect-ratio
  // from the image's intrinsic dimensions so the full image is
  // visible with no crop, regardless of viewport height.
  natural: '',
}

export const ImageBannerBlock: React.FC<
  ImageBannerBlockProps & {
    /** The page's title block (eyebrow, title, first sentence of its
     *  text), shown over the photo's bottom-left on windows at least 768px
     *  wide and 481px tall. Passed by RenderBlocks' introOnBanner (NOT a CMS
     *  field). */
    overlay?: Pick<SectionIntroBlock, 'eyebrow' | 'headline' | 'body'>
    /** Also show `overlay` on the other screens (phones, upright or
     *  sideways), centred at the photo's bottom in smaller type; on upright
     *  phones a natural banner then also grows from its own shape to 13:8,
     *  trimming a strip of sky and trees at each side (~10% at 2:1), so
     *  the photo and its title hold their own above the next section. Below
     *  360px (iPhone SE 1st gen) it grows to 3:2 (~13% a side), so a long
     *  first sentence (Press) still clears the header's logo.
     *  Passed by RenderBlocks' introOnBannerPhone (NOT a CMS field). */
    overlayOnPhone?: boolean
    /** On laptops and desktops (fine pointer, 1024px+), a natural banner
     *  fills exactly one screen: no next section peeking in below it, and
     *  no photo running past the window's bottom edge. The photo covers the
     *  window, trimming its edges: ~10% a side on a 16:10 laptop, a strip of
     *  sky and ground top and bottom on a window wider than the photo. Only
     *  between 3:2 and 13:5 windows, where that trim stays off the building;
     *  squarer or extra-wide windows keep the natural size. 'keep-top'
     *  takes that top-and-bottom trim from the bottom only, for a photo
     *  whose subject reaches its top edge (Founder's Vision: her head).
     *  'keep-right' takes the side trim from the left only, here and in the
     *  phone crop (overlayOnPhone), for a subject at the right edge
     *  (Privacy Policy: the enamelled gold piece). Passed by RenderBlocks'
     *  bannerFillsScreen (NOT a CMS field). */
    fillScreen?: boolean | 'keep-top' | 'keep-right'
  }
> = ({
  image,
  headerTheme = 'dark',
  height = 'screen',
  caption,
  overlay,
  overlayOnPhone = false,
  fillScreen = false,
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const noScrollAnim = useNoScrollAnimations()
  const sectionRef = useRef<HTMLElement | null>(null)

  // Push the header theme when this section enters viewport so the nav bar
  // stays legible against the image. Same pattern as EditorialSplit etc.
  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHeaderTheme(headerTheme === 'light' ? 'light' : 'dark')
          }
        })
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [headerTheme, setHeaderTheme])

  const imgObj = typeof image === 'object' && image ? image : null
  const h = (height || 'screen') as HeightKey

  // `height: 'natural'` → set the section's aspect-ratio from the
  // image's own width/height so the full image renders with no crop.
  // Falls back gracefully if the image dims aren't populated.
  const naturalAspect =
    h === 'natural' && imgObj && imgObj.width && imgObj.height
      ? `${imgObj.width} / ${imgObj.height}`
      : undefined
  const naturalStyle = naturalAspect ? { aspectRatio: naturalAspect } : undefined

  return (
    <section
      ref={sectionRef}
      // `image-banner` is a hook, not a style: a page's own rules find its
      // title block as the first section that is not a banner.
      // Touch screens from 768px keep the header expanded and white over the
      // page, so a banner that opens the page starts below that bar and the
      // whole photo shows. The bar is 14vh tall but never under its 80px
      // logo, plus its 1px rule (header.tsx). The space is a see-through top
      // border INSIDE the banner, not a margin: a margin would collapse
      // through the page's wrapper, and on a client-side navigation Next
      // scrolls that wrapper into view and would land one bar-height down.
      // content-box keeps the photo's shape on the box below the border.
      // A "natural" banner always spans the full width and shows the whole
      // photo. On a window wider than the photo's shape its last strip runs
      // just below the window edge and shows on scroll: no side bands, no crop.
      className={cn(
        'image-banner relative w-full bg-ink',
        // Inline aspect-ratio (naturalStyle) needs the !important.
        overlayOnPhone &&
          h === 'natural' &&
          '[@media_screen_and_(min-width:360px)_and_(max-width:767.98px)]:!aspect-[13/8] [@media_screen_and_(max-width:359.98px)]:!aspect-[3/2]',
        // On upright phones (not sideways: a short window would push the title
        // below its edge) the title box below sits in the banner's flow,
        // bottom-aligned: the banner keeps its shape while the title fits,
        // and grows just enough (the photo covering it) when a long title
        // and sentence would reach the header's logo.
        overlayOnPhone &&
          '[@media_screen_and_(max-width:767.98px)_and_(min-height:481px)]:flex [@media_screen_and_(max-width:767.98px)_and_(min-height:481px)]:flex-col [@media_screen_and_(max-width:767.98px)_and_(min-height:481px)]:justify-end',
        fillScreen &&
          h === 'natural' &&
          '[@media_screen_and_(min-width:1024px)_and_(hover:hover)_and_(pointer:fine)_and_(min-aspect-ratio:3/2)_and_(max-aspect-ratio:13/5)]:!aspect-auto [@media_screen_and_(min-width:1024px)_and_(hover:hover)_and_(pointer:fine)_and_(min-aspect-ratio:3/2)_and_(max-aspect-ratio:13/5)]:!h-svh',
        '[@media(min-width:768px)_and_(not_((hover:hover)_and_(pointer:fine)))]:[&:first-of-type]:box-content [@media(min-width:768px)_and_(not_((hover:hover)_and_(pointer:fine)))]:[&:first-of-type]:border-t-[length:calc(max(14vh,80px)_+_1px)] [@media(min-width:768px)_and_(not_((hover:hover)_and_(pointer:fine)))]:[&:first-of-type]:border-transparent [@media(min-width:768px)_and_(not_((hover:hover)_and_(pointer:fine)))]:[&:first-of-type]:bg-clip-padding',
        heightClass[h],
      )}
      style={naturalStyle}
      data-theme={headerTheme === 'light' ? 'light' : 'dark'}
      // Skip snap on no-anim pages so the snap manager (if ever installed
      // by a future code path) wouldn't observe this section.
      {...(noScrollAnim ? {} : { 'data-snap-section': true })}
      aria-label={imgObj?.alt || 'Image banner'}
    >
      {imgObj && (
        <Media
          fill
          loading="eager"
          // 'natural' container already matches the image aspect, so
          // any fit mode gives the same result; sticking with cover
          // keeps behaviour identical to the other modes.
          imgClassName={cn(
            'absolute inset-0 w-full h-full object-cover',
            fillScreen === 'keep-top' &&
              h === 'natural' &&
              '[@media_screen_and_(min-width:1024px)_and_(hover:hover)_and_(pointer:fine)_and_(min-aspect-ratio:3/2)_and_(max-aspect-ratio:13/5)]:object-top',
            fillScreen === 'keep-right' &&
              h === 'natural' &&
              '[@media_screen_and_(min-width:1024px)_and_(hover:hover)_and_(pointer:fine)_and_(min-aspect-ratio:3/2)_and_(max-aspect-ratio:13/5)]:object-right',
            fillScreen === 'keep-right' &&
              overlayOnPhone &&
              h === 'natural' &&
              '[@media_screen_and_(max-width:767.98px)]:object-right',
          )}
          resource={imgObj}
        />
      )}
      {overlay && (
        // Phones keep the title block below the photo (it is too short to
        // hold it there), and so do phones held sideways: the overlay needs a
        // window at least 768px wide AND 481px tall. Print never gets it: the
        // shade is a background, which browsers drop when printing (it would
        // print as a white sheet over the photo). A shade rising from the
        // bottom-left, plus a soft
        // dark glow behind the letters, keeps the type readable on any part
        // of the photo. The red last word gets a tighter, darker glow of its
        // own: brand red tops out at 4.8:1 even on black, and on the haveli's
        // stone the shared glow alone left it just under 3:1.
        // The shade covers the whole photo, but the text box stops at the
        // window's bottom edge (below the touch bar on touch tablets), so on
        // a wide window, where the photo runs past that edge, the title still
        // sits on the first screen.
        // The left edge lines up with the header logo (header.tsx: 40px,
        // 70px from 1024px, inside a centred 1920px row). The text here is
        // the intro's first sentence only (RenderBlocks splits it; the rest
        // stays in the text block below the photo). A link in it stays white
        // and underlined: the red used below the photo is too faint on it at
        // body size.
        <>
          <div
            aria-hidden
            className="hidden [@media_screen_and_(min-width:768px)_and_(min-height:481px)]:block absolute inset-0 bg-gradient-to-tr from-black/75 via-black/30 to-transparent"
          />
          <div className="hidden [@media_screen_and_(min-width:768px)_and_(min-height:481px)]:flex absolute inset-x-0 top-0 h-[min(100%,100svh)] [@media(min-width:768px)_and_(not_((hover:hover)_and_(pointer:fine)))]:h-[min(100%,calc(100svh_-_max(14vh,80px)_-_1px))] flex-col justify-end items-start text-left text-offwhite px-10 pb-10 lg:pl-[max(70px,calc(50%_-_890px))] lg:pr-[70px] lg:pb-16 [text-shadow:0_0_18px_rgba(0,0,0,0.65),0_1px_3px_rgba(0,0,0,0.6)]">
            {overlay.eyebrow && (
              <p className="font-script italic text-eyebrow opacity-90 mb-2">{overlay.eyebrow}</p>
            )}
            {overlay.headline && richTextHasText(overlay.headline) && (
              <div className="editorial-display text-[2.5rem] lg:text-[4rem] leading-tight mb-3 [&_em]:text-brand-red [&_i]:text-brand-red [&_em]:[text-shadow:0_0_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.85),0_0_14px_rgba(0,0,0,0.75),0_0_22px_rgba(0,0,0,0.6)] [&_i]:[text-shadow:0_0_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.85),0_0_14px_rgba(0,0,0,0.75),0_0_22px_rgba(0,0,0,0.6)]">
                <RichText
                  data={accentLastWord(overlay.headline)}
                  enableGutter={false}
                  enableProse={false}
                />
              </div>
            )}
            {overlay.body && richTextHasText(overlay.body) && (
              <div className="font-body text-body max-w-xl opacity-95 [&_a]:underline [&_a]:underline-offset-4">
                <RichText data={overlay.body} enableGutter={false} enableProse={false} />
              </div>
            )}
          </div>
        </>
      )}
      {overlay && overlayOnPhone && (
        // The same title on the screens the overlay above skips (phones,
        // upright or sideways), when the page asks for it: centred at the
        // photo's bottom, where the header's logo and menu button (top
        // corners) stay clear of it, in type small enough for a photo about
        // 190px tall on a 390px phone. Its shade rises from the bottom edge
        // under the centred text. Print still keeps the title below the photo.
        // On upright phones it is in the banner's flow with 91px on top (the
        // header's logo ends at 84px), so it can never reach the logo: a title
        // that needs more room than the photo's shape gives makes the banner
        // taller instead.
        <>
          <div
            aria-hidden
            className="hidden [@media_screen_and_(max-width:767.98px)]:block [@media_screen_and_(max-height:480px)]:block absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
          />
          <div className="hidden [@media_screen_and_(max-width:767.98px)]:flex [@media_screen_and_(max-height:480px)]:flex absolute inset-x-0 top-0 h-[min(100%,100svh)] [@media_screen_and_(max-width:767.98px)_and_(min-height:481px)]:relative [@media_screen_and_(max-width:767.98px)_and_(min-height:481px)]:h-auto [@media_screen_and_(max-width:767.98px)_and_(min-height:481px)]:pt-[91px] [@media(min-width:768px)_and_(not_((hover:hover)_and_(pointer:fine)))]:h-[min(100%,calc(100svh_-_max(14vh,80px)_-_1px))] flex-col justify-end items-center text-center text-offwhite px-4 pb-3 [text-shadow:0_0_14px_rgba(0,0,0,0.65),0_1px_3px_rgba(0,0,0,0.6)]">
            {overlay.eyebrow && (
              <p className="font-script italic text-[0.875rem] leading-none opacity-90">
                {overlay.eyebrow}
              </p>
            )}
            {overlay.headline && richTextHasText(overlay.headline) && (
              <div className="editorial-display text-[1.75rem] leading-[1.1] mb-0.5 [&_em]:text-brand-red [&_i]:text-brand-red [&_em]:[text-shadow:0_0_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.85),0_0_14px_rgba(0,0,0,0.75),0_0_22px_rgba(0,0,0,0.6)] [&_i]:[text-shadow:0_0_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.85),0_0_14px_rgba(0,0,0,0.75),0_0_22px_rgba(0,0,0,0.6)]">
                <RichText
                  data={accentLastWord(overlay.headline)}
                  enableGutter={false}
                  enableProse={false}
                />
              </div>
            )}
            {overlay.body && richTextHasText(overlay.body) && (
              <div className="font-body text-[0.875rem] leading-snug max-w-[22rem] opacity-95 [&_a]:underline [&_a]:underline-offset-4">
                <RichText data={overlay.body} enableGutter={false} enableProse={false} />
              </div>
            )}
          </div>
        </>
      )}
      {caption && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-body italic text-eyebrow text-offwhite/80">
          {caption}
        </p>
      )}
    </section>
  )
}

export default ImageBannerBlock
