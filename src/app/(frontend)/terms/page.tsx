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
 * The slug is 'terms' (the footer's link), not the title's 'terms-of-use', so
 * the page's slug field must stay unlocked (slugLock false in
 * scripts/page-content/terms.json). Locked, the admin rewrites it from the
 * title as soon as the page is opened, and the next publish moves the page off
 * this route.
 */
const getPublishedPage = async (): Promise<PageType | undefined> => {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'terms', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }
  return page?._status === 'published' ? page : undefined
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage()
  return generateMeta({ doc: page ?? null, pageTitle: 'Terms of Use' })
}

/**
 * Styles for this page only, on its wrapper (Terms of Use PDF; the blocks
 * themselves are unchanged). Built like the Accessibility Statement page,
 * which shares the PDF template.
 *  - --pp-vw: 1vw, frozen at 19.2px above 1920 (where the type stops growing).
 *  - Page end: last text baseline to the end of the PDF artboard = 247.13pt of
 *    1920 (12.871vw) before the flower row and footer, minus the Text
 *    Section's own 48px bottom padding and the part of its last line below the
 *    baseline (0.4202em of the body size).
 *  - Title (Section Intro, while it is the page's first section): no hero, so
 *    it sizes to its content; on phones the title sits 45px below the header
 *    (115px top padding) with the Text Sections' 36px side margins, as on FAQ,
 *    Contact and Accessibility. From lg up the intro column is Accessibility's
 *    (~885px at 1920) and the title -> intro gap is the PDF's 89.36pt baseline
 *    to baseline at 1920 (4.654vw), by the same formula as Accessibility's.
 *  - Touch screens from 768px (no mouse hover): the header never shrinks there;
 *    it stays expanded and white, at 14vh (header.tsx: isExpanded when the
 *    pointer cannot hover). So the title starts 51px below that header (the
 *    gap a mouse user gets below the shrunk 61px header: 112px padding), and
 *    in-page jumps (Contact below) stop 2rem below it instead of under it.
 *  - Phones: justified paragraphs are left-aligned (as the list items are, and
 *    as on Accessibility); on a narrow column justified text opens wide gaps,
 *    worst before an unbreakable email address. Desktop keeps the PDF's
 *    justified text.
 *  - Intro links (Privacy Policy, cookies): red as in the PDF. SectionIntro
 *    gives links no style of its own, so the hover and keyboard-focus
 *    underline is added here too, as Text Section and Contact do. (The rule
 *    covers every link in the title block, which has no button today.)
 *  - Red links in the Text Sections: the editor's Red colour sits on a span
 *    inside the link, so the link itself is turned red too; otherwise its
 *    hover underline would be drawn in ink under red text.
 *  - Acceptable Use list (the page's only list; the rules cover any top-level
 *    list in its Text Sections): the PDF sets a dot 2.52em in from the text
 *    column and the item text at 3.2em, and starts the note under the list
 *    under the dot. Text Section's own lists carry no marker (a Privacy Policy
 *    decision), so here top-level lists get a real disc marker, hanging in the
 *    3.2em indent; the browser draws it about 2.3em in, so the paragraph right
 *    after the list starts at 2.3em, under the dots. A real marker keeps the list a list for Safari and
 *    VoiceOver, which drop the list role when list-style is none. Items are
 *    left-aligned (ragged, as in the PDF) instead of justified, so an item that
 *    wraps on the site's larger type does not stretch. On phones the dots move
 *    to the column's left edge and the note under the list loses its indent,
 *    as on Accessibility.
 *  - Links: no underline at rest, as in the PDF (Text Section's own rule). The
 *    phone link never wraps.
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
  'terms-page [--pp-vw:min(1vw,19.2px)]',
  'pb-8 lg:pb-[calc(12.871*var(--pp-vw)_-_3rem_-_0.4202*var(--fs-body))]',
  // Title block: the first section, and only while it IS the title block
  // (it holds .editorial-display; no hero block does). No quoted attribute
  // selector here: Tailwind silently drops a breakpoint variant (lg:) whose
  // selector has quotes.
  '[&>section:first-of-type:has(.editorial-display)]:min-h-0',
  '[@media(max-width:767px)]:[&>section:first-of-type:has(.editorial-display)]:px-9 [@media(max-width:767px)]:[&>section:first-of-type:has(.editorial-display)]:pt-[115px]',
  'lg:[&>section:first-of-type:has(.editorial-display)>div]:max-w-[min(max(720px,46.1vw),885px)]',
  'lg:[&>section:first-of-type:has(.editorial-display)_.editorial-display]:mb-[calc(min(4.654vw,89.36px)_-_17.6px_-_1.17*var(--fs-body))]',
  // Touch screens from 768px: clear the always-expanded 14vh header.
  '[@media(min-width:768px)_and_(not_((hover:hover)_and_(pointer:fine)))]:[&>section:first-of-type:has(.editorial-display)]:pt-[calc(14vh_+_52px)]',
  '[@media(min-width:768px)_and_(not_((hover:hover)_and_(pointer:fine)))]:[&_.text-section-heading]:scroll-mt-[calc(14vh_+_2rem)]',
  // Phones: justified paragraphs left-aligned (beats Lexical's inline style).
  '[@media(max-width:767px)]:[&_.text-section-body_p[style*=justify]]:!text-left',
  // Intro links: red, underlined on hover and keyboard focus only.
  '[&>section:first-of-type:has(.editorial-display)_a]:text-brand-red [&>section:first-of-type:has(.editorial-display)_a]:no-underline [&>section:first-of-type:has(.editorial-display)_a]:underline-offset-4',
  '[&>section:first-of-type:has(.editorial-display)_a:hover]:underline [&>section:first-of-type:has(.editorial-display)_a:focus-visible]:underline',
  // Red links in the Text Sections: the whole link red, so its underline is red.
  '[&_.text-section-body_a:has(.text-section-red)]:text-brand-red',
  // Acceptable Use: disc markers in a 3.2em indent, items left-aligned, the
  // note under the list under the dots (2.3em: where the disc is drawn).
  '[&_.text-section-body_.payload-richtext>ul]:list-disc [&_.text-section-body_.payload-richtext>ul]:list-outside [&_.text-section-body_.payload-richtext>ul]:pl-[3.2em]',
  '[&_.text-section-body_.payload-richtext>ul>li]:text-left',
  '[&_.text-section-body_.payload-richtext>ul+p]:pl-[2.3em]',
  // Phones: dots at the paragraphs' left edge (the list is indented by the dot
  // and its gap, 0.95em), the note under the list unindented.
  '[@media(max-width:767px)]:[&_.text-section-body_.payload-richtext>ul]:pl-[0.95em]',
  '[@media(max-width:767px)]:[&_.text-section-body_.payload-richtext>ul+p]:pl-0',
  // The phone number never breaks across two lines.
  '[&_.text-section-body_a[href^=tel]]:whitespace-nowrap',
  '[html:has(&>section:first-of-type_.editorial-display)_header_button>svg.text-white]:text-ink',
  'print:[html:has(&)]:!static print:[html:has(&)]:!inset-auto print:[html:has(&)]:!h-auto print:[html:has(&)]:!overflow-visible',
  'print:[html:has(&)_body]:!static print:[html:has(&)_body]:!inset-auto print:[html:has(&)_body]:!h-auto print:[html:has(&)_body]:!overflow-visible',
  'print:[html:has(&)_#scroll-container]:!h-auto print:[html:has(&)_#scroll-container]:!overflow-visible',
  'print:[html:has(&)_header]:!hidden',
].join(' ')

/**
 * /terms — Payload-managed Terms of Use (Terms of Use PDF).
 *
 * Same pattern as /privacy-policy and /accessibility: server component,
 * fetches the Pages doc by slug with depth=2, renders `layout` via the shared
 * `<RenderBlocks />` (SectionIntro, then Divider + TextSection pairs).
 *
 * The visible title is a <p> in SectionIntro, so a screen-reader-only <h1>
 * heads the document outline. The wrapper carries this page's own styles
 * (PAGE_CLASSES above).
 */
export default async function TermsPage() {
  const page = await getPublishedPage()

  const layout = page?.layout
  const hasContent = Array.isArray(layout) && layout.length > 0

  if (!hasContent) {
    notFound()
  }

  return (
    <div className={PAGE_CLASSES}>
      <h1 className="sr-only">Terms of Use</h1>
      <RenderBlocks blocks={layout} />
    </div>
  )
}

export const dynamic = 'force-static'
export const revalidate = 600
