import { notFound } from 'next/navigation'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import type { Metadata } from 'next'

import { getCachedDocument } from '@/utilities/getDocument'
import { generateMeta } from '@/utilities/generateMeta'

/**
 * Published page only. `getDocument` reads through the Local API with access
 * control off and no draft filter, so a page that has only ever been saved as
 * a draft would come back too. (A published page with a newer pending draft
 * keeps its published content in the main row, so editing a live page does
 * not trip this.)
 *
 * The title "The Museum in Visitors' Words" would give a different slug, so
 * the slug field is left unlocked (slugLock false in
 * scripts/page-content/testimonials.json): renaming the title in the admin
 * can never move the page off this route.
 */
const getPublishedPage = async (): Promise<PageType | undefined> => {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'testimonials', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }
  return page?._status === 'published' ? page : undefined
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage()
  return generateMeta({ doc: page ?? null, pageTitle: "The Museum in Visitors' Words" })
}

/**
 * Styles for this page only, on its wrapper (Visitor's Review PDF; the blocks
 * themselves are unchanged). Built like the Cookies Policy page, which shares
 * the PDF template; only the measurements differ.
 *  - --pp-vw: 1vw, frozen at 19.2px above 1920 (where the type stops growing).
 *  - Page end: last text baseline to the end of the PDF artboard = 137.93pt of
 *    1920 (7.184vw) before the flower row and footer, minus the Text
 *    Section's own 48px bottom padding and the part of its last line below the
 *    baseline (0.4202em of the body size). The Cookies Policy rule, with this
 *    PDF's figure.
 *  - Title (Section Intro, the first section below the haveli banner, or the
 *    first section when there is none): it sizes to its content; on phones,
 *    when it opens the page, the title sits 45px below the header (115px top
 *    padding) with the Text Sections' 36px side margins, as on the
 *    other legal pages. From lg up the intro column is Accessibility's (~885px
 *    at 1920) and the title -> intro gap is the PDF's 78.57pt baseline to
 *    baseline at 1920 (4.092vw).
 *  - Touch screens from 768px (no mouse hover): the header never shrinks there;
 *    it stays expanded and white, at 14vh (header.tsx: isExpanded when the
 *    pointer cannot hover). So the title starts 51px below that header (the
 *    gap a mouse user gets below the shrunk 61px header: 112px padding), and
 *    in-page jumps stop 2rem below it instead of under it.
 *  - The three centred sections (About These Reviews, Share Your Review, Visit
 *    the Museum): the PDF sets them centred in a column narrower than the
 *    Contact block's, its longest line 866.9pt of 24pt type (36.1em). Their
 *    text is held to 36.7em, centred, from 768px up: measured, the widths
 *    from 36.6em to 36.8em break the three into 7, 6 and 2 + 3 lines as in
 *    the PDF at every width from 768 to 1920. Contact keeps Text Section's
 *    full column, as in the PDF.
 *  - Intro link and the red links in the Text Sections: red, underlined on
 *    hover and keyboard focus only (the Cookies Policy rules).
 *  - The phone number never wraps.
 *  - Phone menu icon: the header draws it white, for a dark photo at the top
 *    of the page. This page starts with its title instead (no hero), so while
 *    its first section is the title block (.editorial-display) the icon is
 *    ink; once a hero photo is added as the first block, the rule stops
 *    matching and the icon is white again.
 *  - Print: below lg the site scrolls inside #scroll-container with html and
 *    body locked to one screen, so printing would output only the first
 *    screen. Undone here, and the fixed header hidden, for this page only.
 */
const PAGE_CLASSES = [
  'testimonials-page [--pp-vw:min(1vw,19.2px)]',
  'pb-8 lg:pb-[calc(7.184*var(--pp-vw)_-_3rem_-_0.4202*var(--fs-body))]',
  // Title block: the first section that is not an Image Banner (the haveli
  // photo above the title), and only while it IS the title block (it holds
  // .editorial-display). The 115px phone top padding (and the touch-screen
  // one below) clear the header, so they apply only when the title opens the
  // page (first-of-type, and never the banner, which carries a copy of
  // the title); under the banner the block keeps its own padding.
  // No quoted attribute selector here: Tailwind silently drops a breakpoint
  // variant (lg:) whose selector has quotes.
  '[&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)]:min-h-0',
  '[@media(max-width:767px)]:[&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)]:px-9 [@media(max-width:767px)]:[&>section:first-of-type:not(.image-banner):has(.editorial-display)]:pt-[115px]',
  'lg:[&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)>div]:max-w-[min(max(720px,46.1vw),885px)]',
  'lg:[&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)_.editorial-display]:mb-[calc(min(4.092vw,78.57px)_-_17.6px_-_1.17*var(--fs-body))]',
  // Touch screens from 768px: clear the always-expanded 14vh header.
  '[@media(min-width:768px)_and_(not_((hover:hover)_and_(pointer:fine)))]:[&>section:first-of-type:not(.image-banner):has(.editorial-display)]:pt-[calc(14vh_+_52px)]',
  '[@media(min-width:768px)_and_(not_((hover:hover)_and_(pointer:fine)))]:[&_.text-section-heading]:scroll-mt-[calc(14vh_+_2rem)]',
  // The three centred sections: the PDF's narrower column (every Text Section
  // but Contact).
  'md:[&_.text-section:not(:has(#contact))_.text-section-body]:max-w-[36.7em] md:[&_.text-section:not(:has(#contact))_.text-section-body]:mx-auto',
  // Intro link: red, underlined on hover and keyboard focus only.
  '[&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)_a]:text-brand-red [&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)_a]:no-underline [&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)_a]:underline-offset-4',
  '[&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)_a:hover]:underline [&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)_a:focus-visible]:underline',
  // Red links in the Text Sections: the whole link red, so its underline is red.
  '[&_.text-section-body_a:has(.text-section-red)]:text-brand-red',
  // The phone number never breaks across two lines.
  '[&_.text-section-body_a[href^=tel]]:whitespace-nowrap',
  '[html:has(&>section:first-of-type:not(.image-banner)_.editorial-display)_header_button>svg.text-white]:text-ink',
  'print:[html:has(&)]:!static print:[html:has(&)]:!inset-auto print:[html:has(&)]:!h-auto print:[html:has(&)]:!overflow-visible',
  'print:[html:has(&)_body]:!static print:[html:has(&)_body]:!inset-auto print:[html:has(&)_body]:!h-auto print:[html:has(&)_body]:!overflow-visible',
  'print:[html:has(&)_#scroll-container]:!h-auto print:[html:has(&)_#scroll-container]:!overflow-visible',
  'print:[html:has(&)_header]:!hidden',
].join(' ')

/**
 * /testimonials — Payload-managed Testimonials page (Visitor's Review PDF).
 *
 * Same pattern as /press and /cookies-policy: server component, fetches the
 * Pages doc by slug with depth=2, renders `layout` via the shared
 * `<RenderBlocks />` (SectionIntro, the Review Carousel, then Divider +
 * TextSection pairs).
 *
 * The visible title is a <p> in SectionIntro, so a screen-reader-only <h1>
 * heads the document outline. The wrapper carries this page's own styles
 * (PAGE_CLASSES above).
 */
export default async function TestimonialsPage() {
  const page = await getPublishedPage()

  const layout = page?.layout
  const hasContent = Array.isArray(layout) && layout.length > 0

  if (!hasContent) {
    notFound()
  }

  return (
    <div className={PAGE_CLASSES}>
      <h1 className="sr-only">The Museum in Visitors&apos; Words</h1>
      {/* As on /about: on phones too the title and its first sentence sit on
          the haveli photo (centred at its bottom), and on laptops and
          desktops the photo fills exactly the first screen. */}
      <RenderBlocks blocks={layout} introOnBannerPhone bannerFillsScreen />
    </div>
  )
}

export const dynamic = 'force-static'
export const revalidate = 600
