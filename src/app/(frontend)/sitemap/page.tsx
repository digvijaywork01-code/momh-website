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
 * The page's slug field stays unlocked (slugLock false in
 * scripts/page-content/sitemap.json), as on Terms: locked, the admin rewrites
 * the slug from the title as soon as the page is opened, and renaming the
 * title would then move the page off this route.
 *
 * This route is /sitemap, the page for people. /sitemap.xml, the list for
 * search engines, is src/app/sitemap.ts and is a different route.
 */
const getPublishedPage = async (): Promise<PageType | undefined> => {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'sitemap', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }
  return page?._status === 'published' ? page : undefined
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage()
  return generateMeta({ doc: page ?? null, pageTitle: 'Sitemap' })
}

/**
 * Styles for this page only, on its wrapper (Sitemap PDF; the reused blocks
 * themselves are unchanged). Built like the Terms of Use page, whose PDF
 * shares the title, the Divider and the closing Contact section.
 *  - --pp-vw: 1vw, frozen at 19.2px above 1920 (where the type stops growing).
 *  - Page end: last text baseline to the end of the PDF artboard = 96.5pt of
 *    1920 (5.026vw) before the flower row and footer, minus the Text
 *    Section's own 48px bottom padding and the part of its last line below the
 *    baseline (0.4202em of the body size).
 *  - Title (Section Intro, while it is the page's first section): no hero, so
 *    it sizes to its content; on phones the title sits 45px below the header
 *    (115px top padding) with the Text Sections' 36px side margins, as on
 *    Terms. From lg up the intro column is Terms' (~885px at 1920) and the
 *    title -> intro gap is the PDF's 77.70pt baseline to baseline at 1920
 *    (4.047vw), by the same formula as Terms'.
 *  - Touch screens from 768px (no mouse hover): the header never shrinks there;
 *    it stays expanded and white, at 14vh (header.tsx: isExpanded when the
 *    pointer cannot hover). So the title starts 51px below that header, and
 *    in-page jumps stop 2rem below it, as on Terms.
 *  - The thank-you note (the Text Section straight after the Site Map): the
 *    PDF sets it centred in two lines, 841.5pt wide on 24pt type (35.06em).
 *    The site's type is larger (26px at 1920), so the measure is set in em
 *    (35.6em), which breaks the lines where the PDF does at every width from
 *    md up. Phones wrap it to the screen.
 *  - Phones: justified paragraphs (Contact) are left-aligned, as on Terms.
 *  - The phone link never wraps.
 *  - Phone menu icon: the header draws it white, for a dark photo at the top
 *    of the page. This page starts with its title instead (no hero), so while
 *    its first section is the title block (.editorial-display) the icon is
 *    ink, as on Terms.
 *  - Print: below lg the site scrolls inside #scroll-container with html and
 *    body locked to one screen, so printing would output only the first
 *    screen. Undone here, and the fixed header hidden, for this page only.
 *  - Wide screens (above 1920, client request 21 Oct): the site's type and
 *    columns stop growing at 1920, which left wide empty sides on a 2560
 *    screen. On this page they keep growing with the screen up to 2560 (a
 *    4/3 scale-up of the 1920 layout) and stop there. Every rule below is
 *    inside (min-width: 1921px), so 1920 and narrower are untouched:
 *      - --pp-vw (here and on each block, which sets its own) runs to 25.6px;
 *      - the body and heading sizes (--fs-body, --fs-display) follow it from
 *        their 1920 values (26px, 48px), and the title from its 64px;
 *      - the px caps of the Text Section column (1140.3px), the Divider art
 *        (778.8px), the intro column (885px) and the title gap (77.70px)
 *        grow by the same 4/3.
 *    Every gap that ends at a block's fixed 48px bottom padding is already
 *    written as a total that subtracts it, so those gaps scale too. The header
 *    and footer are site-wide and keep their size.
 */
const PAGE_CLASSES = [
  'sitemap-page [--pp-vw:min(1vw,19.2px)]',
  'pb-8 lg:pb-[max(0px,calc(5.026*var(--pp-vw)_-_3rem_-_0.4202*var(--fs-body)))]',
  // Title block: the first section, and only while it IS the title block
  // (it holds .editorial-display; no hero block does). No quoted attribute
  // selector here: Tailwind silently drops a breakpoint variant (lg:) whose
  // selector has quotes.
  '[&>section:first-of-type:has(.editorial-display)]:min-h-0',
  '[@media(max-width:767px)]:[&>section:first-of-type:has(.editorial-display)]:px-9 [@media(max-width:767px)]:[&>section:first-of-type:has(.editorial-display)]:pt-[115px]',
  'lg:[&>section:first-of-type:has(.editorial-display)>div]:max-w-[min(max(720px,46.1vw),885px)]',
  'lg:[&>section:first-of-type:has(.editorial-display)_.editorial-display]:mb-[calc(min(4.047vw,77.70px)_-_17.6px_-_1.17*var(--fs-body))]',
  // Touch screens from 768px: clear the always-expanded 14vh header.
  '[@media(min-width:768px)_and_(not_((hover:hover)_and_(pointer:fine)))]:[&>section:first-of-type:has(.editorial-display)]:pt-[calc(14vh_+_52px)]',
  '[@media(min-width:768px)_and_(not_((hover:hover)_and_(pointer:fine)))]:[&_.text-section-heading]:scroll-mt-[calc(14vh_+_2rem)]',
  // The thank-you note: the PDF's two centred lines.
  'md:[&_.site-map+.text-section_.text-section-body]:max-w-[35.6em] md:[&_.site-map+.text-section_.text-section-body]:mx-auto',
  // Phones: justified paragraphs left-aligned (beats Lexical's inline style).
  '[@media(max-width:767px)]:[&_.text-section-body_p[style*=justify]]:!text-left',
  // The phone number never breaks across two lines.
  '[&_.text-section-body_a[href^=tel]]:whitespace-nowrap',
  '[html:has(&>section:first-of-type_.editorial-display)_header_button>svg.text-white]:text-ink',
  'print:[html:has(&)]:!static print:[html:has(&)]:!inset-auto print:[html:has(&)]:!h-auto print:[html:has(&)]:!overflow-visible',
  'print:[html:has(&)_body]:!static print:[html:has(&)_body]:!inset-auto print:[html:has(&)_body]:!h-auto print:[html:has(&)_body]:!overflow-visible',
  'print:[html:has(&)_#scroll-container]:!h-auto print:[html:has(&)_#scroll-container]:!overflow-visible',
  'print:[html:has(&)_header]:!hidden',
  // Wide screens: everything grows with the screen from 1920 up to 2560.
  '[@media(min-width:1921px)]:[--pp-vw:min(1vw,25.6px)] [@media(min-width:1921px)]:[--fs-body:min(1.35417vw,34.667px)] [@media(min-width:1921px)]:[--fs-display:min(2.5vw,64px)]',
  '[@media(min-width:1921px)]:[&_.text-section]:[--pp-vw:min(1vw,25.6px)] [@media(min-width:1921px)]:[&_.lotus-divider]:[--pp-vw:min(1vw,25.6px)] [@media(min-width:1921px)]:[&_.site-map]:[--pp-vw:min(1vw,25.6px)]',
  '[@media(min-width:1921px)]:[&_.text-section>div]:max-w-[min(59.39vw,1520.4px)]',
  '[@media(min-width:1921px)]:[&_.lotus-divider>img:first-child]:w-[min(40.5644vw,1038.4px)]',
  '[@media(min-width:1921px)]:[&>section:first-of-type:has(.editorial-display)>div]:max-w-[min(46.1vw,1180px)]',
  // The title: 64px at 1920; the gap under it keeps its formula, the 17.6px
  // in it being 0.275em of the title.
  '[@media(min-width:1921px)]:[&>section:first-of-type:has(.editorial-display)_.editorial-display]:text-[min(3.3333vw,85.333px)]',
  '[@media(min-width:1921px)]:[&>section:first-of-type:has(.editorial-display)_.editorial-display]:mb-[calc(min(4.047vw,103.6px)_-_0.275em_-_1.17*var(--fs-body))]',
].join(' ')

/**
 * /sitemap — Payload-managed Sitemap (Sitemap PDF).
 *
 * Same pattern as /terms: server component, fetches the Pages doc by slug with
 * depth=2, renders `layout` via the shared `<RenderBlocks />` (Section Intro,
 * Site Map, the thank-you Text Section, then Divider + the Contact Text
 * Section).
 *
 * The visible title is a <p> in SectionIntro, so a screen-reader-only <h1>
 * heads the document outline. The wrapper carries this page's own styles
 * (PAGE_CLASSES above).
 */
export default async function SitemapPage() {
  const page = await getPublishedPage()

  const layout = page?.layout
  const hasContent = Array.isArray(layout) && layout.length > 0

  if (!hasContent) {
    notFound()
  }

  return (
    <div className={PAGE_CLASSES}>
      <h1 className="sr-only">Sitemap</h1>
      <RenderBlocks blocks={layout} />
    </div>
  )
}

export const dynamic = 'force-static'
export const revalidate = 600
