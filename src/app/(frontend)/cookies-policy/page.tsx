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
 * The title "Cookies Policy" gives the slug 'cookies-policy' anyway; the
 * slug field is still left unlocked (slugLock false in
 * scripts/page-content/cookies-policy.json) so that renaming the title in the
 * admin can never move the page off this route.
 */
const getPublishedPage = async (): Promise<PageType | undefined> => {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'cookies-policy', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }
  return page?._status === 'published' ? page : undefined
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage()
  return generateMeta({ doc: page ?? null, pageTitle: 'Cookies Policy' })
}

/**
 * Styles for this page only, on its wrapper (Cookies Policy PDF; the blocks
 * themselves are unchanged). Built like the Terms of Use page, which shares
 * the PDF template; only the measurements and the lists differ.
 *  - --pp-vw: 1vw, frozen at 19.2px above 1920 (where the type stops growing).
 *  - Page end: last text baseline to the end of the PDF artboard = 134.71pt of
 *    1920 (7.016vw) before the flower row and footer, minus the Text
 *    Section's own 48px bottom padding and the part of its last line below the
 *    baseline (0.4202em of the body size). Shorter than Terms (247.13pt): this
 *    artboard ends sooner, and each legal page follows its own PDF.
 *  - Title (Section Intro, the first section below the haveli banner, or the
 *    first section when there is none): it sizes to its content; on phones,
 *    when it opens the page, the title sits 45px below the header (115px top
 *    padding) with the Text Sections' 36px side margins, as on FAQ,
 *    Contact, Accessibility and Terms. From lg up the intro column is
 *    Accessibility's (~885px at 1920) and the title -> intro gap is the PDF's
 *    90.91pt baseline to baseline at 1920 (4.735vw), the same as Accessibility.
 *  - Intro: two paragraphs with one blank line between them, as in the PDF
 *    (1.5em: the intro's line height). Section Intro puts no space between
 *    paragraphs, so it is added here.
 *  - Phones: justified paragraphs and list items are left-aligned; on a narrow
 *    column justified text opens wide gaps. Desktop keeps the PDF's justified
 *    text.
 *  - Intro link (Privacy Policy): red as the page's other links. SectionIntro
 *    gives links no style of its own, so the hover and keyboard-focus
 *    underline is added here too, as Text Section and Contact do.
 *  - Red links in the Text Sections: the editor's Red colour sits on a span
 *    inside the link, so the link itself is turned red too; otherwise its
 *    hover underline would be drawn in ink under red text.
 *  - Cookie lists: the PDF hangs a round dot in the margin, outside the text
 *    column, and starts the text at the column edge; the items are justified
 *    like the paragraphs and spaced like them (Text Section already does both).
 *    Text Section's own lists carry no marker (a Privacy Policy decision), so
 *    here top-level lists get a real disc marker, drawn outside the column. A
 *    real marker keeps the list a list for Safari and VoiceOver, which drop the
 *    list role when list-style is none. On phones the dots move inside the
 *    column (as on Terms), since the 36px margin is too narrow to hang them.
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
  'cookies-policy-page [--pp-vw:min(1vw,19.2px)]',
  'pb-8 lg:pb-[calc(7.016*var(--pp-vw)_-_3rem_-_0.4202*var(--fs-body))]',
  // Title block: the first section that is not an Image Banner (the haveli
  // photo above the title), and only while it IS the title block (it holds
  // .editorial-display). The 115px phone top padding clears the header, so it
  // applies only when the title opens the
  // page (first-of-type, and never the banner, which carries a copy of
  // the title); under the banner the block keeps its own padding.
  // No quoted attribute selector here: Tailwind silently drops a breakpoint
  // variant (lg:) whose selector has quotes.
  '[&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)]:min-h-0',
  '[@media(max-width:767px)]:[&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)]:px-9 [@media(max-width:767px)]:[&>section:first-of-type:not(.image-banner):has(.editorial-display)]:pt-[115px]',
  'lg:[&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)>div]:max-w-[min(max(720px,46.1vw),885px)]',
  'lg:[&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)_.editorial-display]:mb-[calc(min(4.735vw,90.91px)_-_17.6px_-_1.17*var(--fs-body))]',
  // Intro: one blank line between its two paragraphs.
  '[&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)_p+p]:mt-[1.5em]',
  // Phones: justified paragraphs left-aligned (beats Lexical's inline style).
  '[@media(max-width:767px)]:[&_.text-section-body_p[style*=justify]]:!text-left',
  // Intro link: red, underlined on hover and keyboard focus only.
  '[&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)_a]:text-brand-red [&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)_a]:no-underline [&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)_a]:underline-offset-4',
  '[&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)_a:hover]:underline [&>section:nth-child(1_of_section:not(.image-banner)):has(.editorial-display)_a:focus-visible]:underline',
  // Red links in the Text Sections: the whole link red, so its underline is red.
  '[&_.text-section-body_a:has(.text-section-red)]:text-brand-red',
  // Cookie lists: a disc hanging outside the text column.
  '[&_.text-section-body_.payload-richtext>ul]:list-disc [&_.text-section-body_.payload-richtext>ul]:list-outside [&_.text-section-body_.payload-richtext>ul]:pl-0',
  // Phones: dots inside the column (indented by the dot and its gap, 0.95em),
  // items left-aligned.
  '[@media(max-width:767px)]:[&_.text-section-body_.payload-richtext>ul]:pl-[0.95em]',
  '[@media(max-width:767px)]:[&_.text-section-body_.payload-richtext>ul>li]:text-left',
  // The phone number never breaks across two lines.
  '[&_.text-section-body_a[href^=tel]]:whitespace-nowrap',
  '[html:has(&>section:first-of-type:not(.image-banner)_.editorial-display)_header_button>svg.text-white]:text-ink',
  'print:[html:has(&)]:!static print:[html:has(&)]:!inset-auto print:[html:has(&)]:!h-auto print:[html:has(&)]:!overflow-visible',
  'print:[html:has(&)_body]:!static print:[html:has(&)_body]:!inset-auto print:[html:has(&)_body]:!h-auto print:[html:has(&)_body]:!overflow-visible',
  'print:[html:has(&)_#scroll-container]:!h-auto print:[html:has(&)_#scroll-container]:!overflow-visible',
  'print:[html:has(&)_header]:!hidden',
].join(' ')

/**
 * /cookies-policy — Payload-managed Cookies Policy (Cookies Policy PDF).
 *
 * Same pattern as /privacy-policy, /accessibility and /terms: server
 * component, fetches the Pages doc by slug with depth=2, renders `layout` via
 * the shared `<RenderBlocks />` (SectionIntro, then Divider + TextSection
 * pairs).
 *
 * The visible title is a <p> in SectionIntro, so a screen-reader-only <h1>
 * heads the document outline. The wrapper carries this page's own styles
 * (PAGE_CLASSES above). The cookie banner and settings it describes live in
 * src/components/cookie-banner; keep the two in step.
 */
export default async function CookiesPolicyPage() {
  const page = await getPublishedPage()

  const layout = page?.layout
  const hasContent = Array.isArray(layout) && layout.length > 0

  if (!hasContent) {
    notFound()
  }

  return (
    <div className={PAGE_CLASSES}>
      <h1 className="sr-only">Cookies Policy</h1>
      {/* As on /about: on phones too the title and its first sentence sit on
          the haveli photo (centred at its bottom), and on laptops and
          desktops the photo fills exactly the first screen. */}
      <RenderBlocks blocks={layout} introOnBannerPhone bannerFillsScreen />
    </div>
  )
}

export const dynamic = 'force-static'
export const revalidate = 600
