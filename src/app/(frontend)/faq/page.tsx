import { notFound } from 'next/navigation'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import type { Metadata } from 'next'

import { FAQ_PAGE_CLOSED_FLAG, FAQ_PAGE_PHONE_QUERY } from '@/blocks/FAQ/phoneQuery'
import { getCachedDocument } from '@/utilities/getDocument'
import { generateMeta } from '@/utilities/generateMeta'

// Phones: the answers start closed (user's choice, 12 Oct). Runs as soon as
// the page above it is parsed, before the first paint, so the open answers
// never flash on a phone, then flags the wrapper so the FAQ block does not
// close them again at hydration. The FAQ block closes them itself after a
// client-side navigation to /faq, where this script does not run.
const CLOSE_ON_PHONES = `if(window.matchMedia(${JSON.stringify(FAQ_PAGE_PHONE_QUERY)}).matches){document.querySelectorAll('.faq-page details[open]').forEach(function(d){d.open=false})}document.currentScript.parentElement[${JSON.stringify(FAQ_PAGE_CLOSED_FLAG)}]=1`

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
    page = (await getCachedDocument('pages', 'faq', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }
  return page?._status === 'published' ? page : undefined
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage()
  return generateMeta({ doc: page ?? null, pageTitle: 'Frequently Asked Questions' })
}

/**
 * Phone menu icon: the header draws it white, for a dark photo at the top of
 * the page. This page starts with its title instead (no hero yet), so while
 * its first section is the title block (.editorial-display) the icon is ink;
 * once a hero photo is added as the first block, the rule stops matching and
 * the icon is white again. Only the phone header has this icon.
 */
const MENU_ICON_ON_LIGHT_TOP =
  '[html:has(&>section:first-of-type_.editorial-display)_header_button>svg.text-white]:text-ink'

/**
 * Styles for this page only, on its wrapper (FAQ PDF). The FAQ blocks' own
 * look is their 'faq-page' variant (FAQ block and FaqItem). These rules style
 * the page's title row (first block) and buttons row (last block), picked by
 * position (first / last of the sections), never by a numbered index, so
 * adding or reordering a question group cannot break them.
 *  - Title and buttons rows: the 40vh minimum height is released so the gaps
 *    do not grow with the window. The title row has no bottom padding: the
 *    intro -> first group heading gap is that group's own top padding.
 *  - Phones: 32px side space on every section and the title 45px below the
 *    header (115px top padding), as on the Contact page (user's choices
 *    there, 9 Oct). Last question -> buttons 64px of empty space (user's
 *    choice, 12 Oct, option A): 32px top padding plus the button pair's own
 *    32px top margin. Tablets (768-1023): 40px top, 80px bottom.
 *  - lg+ title: it needs 676px at its 64px live size and the block's column
 *    is 672px, so the column widens and the title stays on one line, and the
 *    intro wraps like the PDF's (~880px at 1920). Title -> intro is the PDF's
 *    90.9px baseline to baseline at 1920.
 *  - lg+ buttons: last answer -> buttons 80px of empty space, like the gaps
 *    above each group heading (user's choice, 12 Oct; the pair carries its
 *    own 32px top margin). Buttons -> footer 96px, the Contact page's value
 *    (user's choice there, 9 Oct; the PDF has 160). The gap between the two
 *    buttons scales with the screen (55.5px at 1920).
 *  - Links inside the answers: no underline at rest, as in the PDF (user's
 *    choice, 12 Oct); underlined on hover and keyboard focus, as on the
 *    Contact page.
 *  - 'faq-page' itself stays: the phone script below and the FAQ block look
 *    the wrapper up by it.
 */
const PAGE_CLASSES = [
  'faq-page',
  '[&>section:first-of-type]:min-h-0 [&>section:first-of-type]:pb-0',
  '[&>section:last-of-type]:min-h-0 [&>section:last-of-type]:pt-[40px] [&>section:last-of-type]:pb-[80px]',
  '[@media(max-width:767.98px)]:[&>section]:px-[32px]',
  '[@media(max-width:767.98px)]:[&>section:first-of-type]:pt-[115px]',
  '[@media(max-width:767.98px)]:[&>section:last-of-type]:pt-[calc(64px_-_32px)]',
  'lg:[&>section:first-of-type>div]:max-w-[min(max(720px,46.1vw),885px)]',
  'lg:[&>section:first-of-type_.editorial-display]:mb-[calc(min(4.735vw,90.91px)_-_17.6px_-_1.17*var(--fs-body))]',
  'lg:[&>section:last-of-type]:pt-[calc(80px_-_32px)] lg:[&>section:last-of-type]:pb-[96px]',
  'lg:[&>section:last-of-type_div:has(>a.uppercase)]:gap-x-[min(2.89vw,55.5px)]',
  '[&_a:not([class]):hover]:underline [&_a:not([class]):hover]:underline-offset-[4px]',
  '[&_a:not([class]):focus-visible]:underline [&_a:not([class]):focus-visible]:underline-offset-[4px]',
  MENU_ICON_ON_LIGHT_TOP,
].join(' ')

/**
 * /faq — Payload-managed FAQ page (FAQ PDF).
 *
 * Same pattern as /contact: server component, fetches the Pages doc by slug
 * with depth=2, renders `layout` via the shared `<RenderBlocks />`
 * (SectionIntro title, one FAQ block per question group, then a buttons-only
 * SectionIntro). `faqVariant="faq-page"` gives the FAQ blocks this page's look
 * (all-red group headings, answers open on tablets and up, closed on phones);
 * every other page renders the FAQ block unchanged.
 *
 * The visible title is a <p> in SectionIntro, so a screen-reader-only <h1>
 * heads the document outline; the group headings are level 2. The wrapper
 * carries the page's link styling and its spacing overrides (PAGE_CLASSES
 * below).
 */
export default async function FaqPage() {
  const page = await getPublishedPage()

  const layout = page?.layout
  const hasContent = Array.isArray(layout) && layout.length > 0

  if (!hasContent) {
    notFound()
  }

  return (
    <div className={PAGE_CLASSES}>
      <h1 className="sr-only">Frequently Asked Questions</h1>
      <RenderBlocks blocks={layout} faqVariant="faq-page" />
      <script dangerouslySetInnerHTML={{ __html: CLOSE_ON_PHONES }} />
    </div>
  )
}

export const dynamic = 'force-static'
export const revalidate = 600
