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
 */
const getPublishedPage = async (): Promise<PageType | undefined> => {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'press', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }
  return page?._status === 'published' ? page : undefined
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage()
  return generateMeta({ doc: page ?? null, pageTitle: 'The Museum in the Press' })
}

/**
 * Styles for this page only, on its wrapper (Press PDF; the blocks themselves
 * are unchanged). The page has the same shape as Accessibility (title, then
 * Divider + Text Section pairs, no hero), so it uses the same title, list,
 * link, menu-icon and print rules.
 *  - --pp-vw: 1vw, frozen at 19.2px above 1920 (where the type stops growing).
 *  - Page end: last text baseline to the end of the PDF artboard = 112pt of
 *    1920 (5.833vw) before the flower row and footer, minus the Text
 *    Section's own 48px bottom padding and the part of its last line below the
 *    baseline (0.4202em of the body size).
 *  - Title (Section Intro, the first section below the haveli banner, or the
 *    first section when there is none): it sizes to its content; on phones,
 *    when it opens the page, the title sits 45px below the header (115px top
 *    padding) with the Text Sections' 36px side margins, as on FAQ and Contact.
 *    From lg up the column widens so the intro wraps as in the PDF (~860px at
 *    1920) and the title -> intro gap is the PDF's 90.9pt baseline to baseline
 *    at 1920 (the same measured formula as the FAQ page's title).
 *  - Bullet lists ("The Museum at a Glance"): the PDF puts a dot before every
 *    point. Text Section's own lists carry no marker (a Privacy Policy
 *    decision), so here the top-level lists get a real disc marker hanging
 *    outside the column. A real marker keeps the list a list for Safari and
 *    VoiceOver, which drop the list role when list-style is none. On phones
 *    the points are left-aligned instead of justified, and the dots sit
 *    inside the column, in line with the paragraphs' left edge.
 *  - Links: no underline, as in the PDF (Text Section's own rule: underlined on
 *    hover and keyboard focus only). The phone link never wraps. The press
 *    cards' own "Read the full story" links stay underlined (Press Grid).
 *  - Phone menu icon: the header draws it white, for a dark photo at the top
 *    of the page. This page starts with its title instead, so while its first
 *    section is the title block (.editorial-display) the icon is ink; if a
 *    hero photo is ever added as the first block, the rule stops matching and
 *    the icon is white again. Only the phone header has this icon (it is
 *    hidden from md up).
 *  - Print: below lg the site scrolls inside #scroll-container with html and
 *    body locked to one screen, so printing would output only the first
 *    screen. Undone here, and the fixed header hidden, for this page only.
 */
const PAGE_CLASSES = [
  'press-page [--pp-vw:min(1vw,19.2px)]',
  'pb-8 lg:pb-[max(0px,calc(5.833*var(--pp-vw)_-_3rem_-_0.4202*var(--fs-body)))]',
  // Title block: the first section that is not an Image Banner (the haveli
  // photo above the title), and only while it IS the title block (it holds
  // .editorial-display). The 115px phone top padding clears the header, so
  // it applies only when the title opens the page (first-of-type, and never the banner, which carries a copy of
  // the title); under the
  // banner the block keeps its own padding.
  // No quoted attribute selector here: Tailwind silently drops a breakpoint
  // variant (lg:) whose selector has quotes.
  '[&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)]:min-h-0',
  '[@media(max-width:767px)]:[&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)]:px-9 [@media(max-width:767px)]:[&>section:first-of-type:not(.image-banner):has(.editorial-display)]:pt-[115px]',
  'lg:[&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)>div]:max-w-[min(max(720px,46.1vw),885px)]',
  'lg:[&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)_.editorial-display]:mb-[calc(min(4.735vw,90.91px)_-_17.6px_-_1.17*var(--fs-body))]',
  '[&_.text-section-body_.payload-richtext>ul]:list-disc [&_.text-section-body_.payload-richtext>ul]:list-outside',
  // Phones: list points left-aligned, as the FAQ answers are; justified text
  // on a narrow column leaves wide gaps between words. The dots move inside
  // the column: the list is indented by the dot and its gap (0.95em), so each
  // dot lines up with the paragraphs' left edge and the text follows it.
  '[@media(max-width:767px)]:[&_.text-section-body_li]:text-left',
  '[@media(max-width:767px)]:[&_.text-section-body_.payload-richtext>ul]:pl-[0.95em]',
  // The phone number never breaks across two lines.
  '[&_.text-section-body_a[href^=tel]]:whitespace-nowrap',
  '[html:has(&>section:first-of-type:not(.image-banner)_.editorial-display)_header_button>svg.text-white]:text-ink',
  'print:[html:has(&)]:!static print:[html:has(&)]:!inset-auto print:[html:has(&)]:!h-auto print:[html:has(&)]:!overflow-visible',
  'print:[html:has(&)_body]:!static print:[html:has(&)_body]:!inset-auto print:[html:has(&)_body]:!h-auto print:[html:has(&)_body]:!overflow-visible',
  'print:[html:has(&)_#scroll-container]:!h-auto print:[html:has(&)_#scroll-container]:!overflow-visible',
  'print:[html:has(&)_header]:!hidden',
].join(' ')

/**
 * /press — Payload-managed press page (Press PDF).
 *
 * Same pattern as /accessibility: server component, fetches the Pages doc by
 * slug with depth=2 (so each press card's photo arrives as a media object),
 * renders `layout` via the shared `<RenderBlocks />` (SectionIntro, Divider +
 * TextSection pairs, and the Press Grid of coverage cards).
 *
 * The visible title is a <p> in SectionIntro, so a screen-reader-only <h1>
 * heads the document outline. The wrapper carries this page's own styles
 * (PAGE_CLASSES above).
 */
export default async function PressPage() {
  const page = await getPublishedPage()

  const layout = page?.layout
  const hasContent = Array.isArray(layout) && layout.length > 0

  if (!hasContent) {
    notFound()
  }

  return (
    <div className={PAGE_CLASSES}>
      <h1 className="sr-only">The Museum in the Press</h1>
      {/* As on /about: on phones too the title and its first sentence sit on
          the haveli photo (centred at its bottom), and on laptops and
          desktops the photo fills exactly the first screen. */}
      <RenderBlocks blocks={layout} introOnBannerPhone bannerFillsScreen />
    </div>
  )
}

export const dynamic = 'force-static'
export const revalidate = 600
