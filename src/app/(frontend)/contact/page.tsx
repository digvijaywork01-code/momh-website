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
    page = (await getCachedDocument('pages', 'contact', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }
  return page?._status === 'published' ? page : undefined
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage()
  return generateMeta({ doc: page ?? null, pageTitle: 'Contact Us' })
}

/**
 * Phone menu icon: the header draws it white, for a dark photo at the top of
 * the page. This page starts with its title instead (no hero yet), so while
 * its first section is the title block (.editorial-display) the icon is ink;
 * once a hero photo is added as the first block, the rule stops matching and
 * the icon is white again. Only the phone header has this icon.
 */
const MENU_ICON_ON_LIGHT_TOP =
  '[html:has(&>section:first-of-type:not(.image-banner)_.editorial-display)_header_button>svg.text-white]:text-ink'

/**
 * The Getting Here email (Visit Info block) underlines itself; the PDF shows
 * no underline, so it is removed on this page only. Its red hover stays.
 * Book an Appointment uses the same block and keeps its underline.
 */
const NO_LINK_UNDERLINE = '[&_a.underline]:no-underline'

/**
 * Styles for this page only, on its wrapper (Contact us PDF; the blocks
 * themselves are unchanged). Sections are addressed by position: 1 = the
 * "Contact Us" title (Section Intro), 2 = Getting Here (Visit Info, with its
 * "We are happy to help" intro), 3 = "For specific Enquiries", 4 = "Find Us"
 * with its two buttons. If the blocks are reordered in the admin, update the
 * indexes. Tablets (768-1023px) keep the blocks' own spacing.
 *  - Links typed into the text (the email, the Craft Your Jewellery and FAQ
 *    links) carry no class: no underline, as in the PDF and on the Privacy
 *    Policy page; underlined on hover and keyboard focus. Classed links
 *    (buttons, the Getting Here email) keep their own styles.
 *  - Laptop and desktop (lg+) gaps, chosen by the user on 9 Oct, measured
 *    from a text baseline so the visible space is exact (the text below a
 *    baseline is about 0.43 x the body size): Enquiries -> "Find Us" 184px,
 *    Find Us text -> buttons 72px, buttons -> footer 96px, "We are happy to
 *    help" -> map 96px; the Find Us buttons are 2.89vw apart, at most 55.5px.
 *  - Title (lg+): spacing from the PDF, frozen at 1920; the page has no hero,
 *    so the title keeps the block's own top padding.
 *  - Getting Here (lg+): PDF side space, the map level with the text column,
 *    hours on one row, and tighter text in short windows so map and text fit
 *    one window below the 61px header.
 *  - Desktop (1536px+): wider Enquiries and Find Us text.
 *  - Phones (under 768px): 32px side space, 120px gaps around the ivory band
 *    and above "Find Us"; under 390px the opening time drops below the day.
 *  - The 40vh minimum height of the title and Find Us sections is released
 *    wherever their padding is set, so tall windows add no space.
 */
const PAGE_CLASSES = [
  'contact-page',
  // Sections are counted with nth-child(N of section:not(.image-banner)), so
  // the haveli banner above the title does not shift them: section 1 is the
  // title, 2 Getting Here, 3 the Enquiries intro, 4 Find Us. (`of S` needs
  // Chrome/Edge 111, Firefox 113 or Safari 9; an older browser skips these
  // rules and shows the blocks' own spacing.)
  // Unclassed links in the text: underline on hover and keyboard focus only.
  '[&_a:not([class]):hover]:[text-decoration:underline] [&_a:not([class]):hover]:underline-offset-4',
  '[&_a:not([class]):focus-visible]:[text-decoration:underline] [&_a:not([class]):focus-visible]:underline-offset-4',
  // lg+, Find Us (section 4). Top padding: last Enquiries line -> "Find Us"
  // baseline = 184px; 109px + 0.415 x body size is the Enquiries block's 48px
  // bottom padding plus the type around the two baselines (measured at
  // 1024-1920). Bottom: buttons -> black footer 96px.
  'lg:[&>section:nth-child(4_of_section:not(.image-banner))]:min-h-0 lg:[&>section:nth-child(4_of_section:not(.image-banner))]:pt-[calc(184px_-_109px_-_0.415*var(--fs-body))] lg:[&>section:nth-child(4_of_section:not(.image-banner))]:pb-[96px]',
  // lg+, Find Us buttons: paragraph's last line -> buttons top 72px; gap
  // between the two buttons 2.89vw, max 55.5px (PDF).
  'lg:[&>section:nth-child(4_of_section:not(.image-banner))_div:has(>a.uppercase)]:mt-[calc(72px_-_0.43*var(--fs-body))] lg:[&>section:nth-child(4_of_section:not(.image-banner))_div:has(>a.uppercase)]:gap-x-[min(2.89vw,55.5px)]',
  // lg+, Getting Here: "We are happy to help" last line -> top of the map
  // 96px. The intro wrapper exists only when the block has an intro;
  // :not(.grid) keeps this off the map column if the intro is removed.
  'lg:[&>section:nth-child(2_of_section:not(.image-banner))>div:not(.grid)>div:first-child]:mb-[calc(96px_-_0.43*var(--fs-body))]',
  // lg+, title (section 1), baseline to baseline from the PDF, frozen at
  // 1920: last text line -> "We are happy to help" 10.906vw (209.4pt). The
  // 143px is the measured type at zero padding, including Getting Here's own
  // 80px top padding; padding cannot go negative, so below ~1310px wide the
  // gap stays at about 141px (the PDF would give 112px at 1024).
  'lg:[&>section:nth-child(1_of_section:not(.image-banner))]:min-h-0 lg:[&>section:nth-child(1_of_section:not(.image-banner))]:pb-[max(0px,calc(min(10.906vw,209.4px)_-_143px))]',
  // lg+, title -> first text line 2.115vw (40.6pt); 23px + 0.95 x body size
  // is the measured type between them at zero margin.
  'lg:[&>section:nth-child(1_of_section:not(.image-banner))_.editorial-display]:mb-[calc(min(2.115vw,40.6px)_-_23px_-_0.95*var(--fs-body))]',
  // lg+, Getting Here side space: 194.4pt on the 1920 artboard = 10.125vw,
  // frozen at 1920 (146px at 1440). Below ~1130px it tapers, never under the
  // block's own 64px, so the 12-column grid (its gaps alone need 880px) fits.
  'lg:[&>section:nth-child(2_of_section:not(.image-banner))]:px-[max(64px,min(10.125vw,194.4px,calc((100vw_-_900px)/2)))]',
  // The narrower text column fits the two Getting Here buttons side by side
  // only from ~1600px, so from 1400 to 1599px (where the block would pair
  // them) they stay stacked.
  '[@media(min-width:1400px)_and_(max-width:1599.98px)]:[&>section:nth-child(2_of_section:not(.image-banner))_div:has(>a.uppercase)]:grid-cols-1',
  // lg+, the map and the Getting Here text column start and end level: the
  // map takes the text column's height and the image fills it (object-cover,
  // as in the block), trimming a little of its edges; the pin stays centred.
  // div.grid = the block's 12-column grid; its first child is the map
  // column, its last child the text column.
  'lg:[&>section:nth-child(2_of_section:not(.image-banner))_div.grid]:items-stretch',
  'lg:[&>section:nth-child(2_of_section:not(.image-banner))_div.grid>div:first-child>div]:aspect-auto lg:[&>section:nth-child(2_of_section:not(.image-banner))_div.grid>div:first-child>div]:h-full',
  // Short windows: keep the map + Getting Here text inside one window below
  // the 61px fixed header. With the hours on one row the block fits every
  // window over 700px tall, except from 1400 to 1599px wide (buttons
  // stacked, column up to ~654px), which fits from 715px tall. Shorter
  // windows (e.g. 1366x657, 1024x640, 1599x710) tighten the text column; the
  // map follows it, so both stay level. Two media branches, same
  // declarations. (The holiday note's 1.3 line height applies at all sizes,
  // below.)
  '[@media(min-width:1024px)_and_(max-height:700px)]:[&>section:nth-child(2_of_section:not(.image-banner))_div.grid>div:last-child]:gap-y-[8px]',
  '[@media(min-width:1024px)_and_(max-height:700px)]:[&>section:nth-child(2_of_section:not(.image-banner))_div.grid>div:last-child>.leading-relaxed]:leading-[1.3]',
  '[@media(min-width:1024px)_and_(max-height:700px)]:[&>section:nth-child(2_of_section:not(.image-banner))_div.grid>div:last-child_dl>*]:leading-[1.25]',
  '[@media(min-width:1400px)_and_(max-width:1599.98px)_and_(max-height:714.98px)]:[&>section:nth-child(2_of_section:not(.image-banner))_div.grid>div:last-child]:gap-y-[8px]',
  '[@media(min-width:1400px)_and_(max-width:1599.98px)_and_(max-height:714.98px)]:[&>section:nth-child(2_of_section:not(.image-banner))_div.grid>div:last-child>.leading-relaxed]:leading-[1.3]',
  '[@media(min-width:1400px)_and_(max-width:1599.98px)_and_(max-height:714.98px)]:[&>section:nth-child(2_of_section:not(.image-banner))_div.grid>div:last-child_dl>*]:leading-[1.25]',
  // lg+, opening hours as one "Monday – Sunday" row with the time on the
  // right, level with the buttons' right edge (Getting Here design, 9 Oct).
  'lg:[&>section:nth-child(2_of_section:not(.image-banner))_dl_dd]:text-right',
  // All sizes: the holiday note under the hours ("Closed on select Indian
  // public holidays...") is tighter than the block's 1.625, so its two lines
  // read as one note.
  '[&>section:nth-child(2_of_section:not(.image-banner))_dl+p]:leading-[1.3]',
  // 1536px+: wider text for "For specific Enquiries" and "Find Us" (user's
  // choice, 9 Oct): 860px and 1159px (the PDF's Find Us measure) at 1920,
  // scaling below and frozen above. Laptops keep the block's 672px.
  // .max-w-2xl is Section Intro's centred text column.
  '[@media(min-width:1536px)]:[&>section:nth-child(3_of_section:not(.image-banner))>.max-w-2xl]:max-w-[min(44.79vw,860px)]',
  '[@media(min-width:1536px)]:[&>section:nth-child(4_of_section:not(.image-banner))>.max-w-2xl]:max-w-[min(60.36vw,1159px)]',
  // Phones: 32px side space for every section instead of the blocks' 24px
  // (user's request, 9 Oct).
  '[@media(max-width:767.98px)]:[&>section]:px-[32px]',
  // Phones, title: the 115px top padding keeps the title where it sat on a
  // 390x844 phone, now on every phone (centring it in 40% of the screen put
  // it against the logo on short phones and grew the gap below on tall ones).
  // It clears the header, so only when the title opens the page; under the
  // haveli banner the block keeps its own top padding.
  '[@media(max-width:767.98px)]:[&>section:nth-child(1_of_section:not(.image-banner))]:min-h-0 [@media(max-width:767.98px)]:[&>section:first-of-type:not(.image-banner):has(.editorial-display)]:pt-[115px] [@media(max-width:767.98px)]:[&>section:nth-child(1_of_section:not(.image-banner))]:pb-0',
  // Phones, the two gaps around the ivory "We are happy to help" band = 120px
  // each (user's choice, 9 Oct; were 173px and 141px at 390x844). Top: 78px
  // padding + 42px of type (body 18px, heading 36px). Bottom: 43px padding +
  // the Enquiries block's 32px top padding + 45px of type.
  '[@media(max-width:767.98px)]:[&>section:nth-child(2_of_section:not(.image-banner))]:pt-[calc(120px_-_42px)] [@media(max-width:767.98px)]:[&>section:nth-child(2_of_section:not(.image-banner))]:pb-[calc(120px_-_32px_-_45px)]',
  // Phones, last Enquiries line -> "Find Us" baseline = 120px (user's
  // choice, 9 Oct; was 158px). 78px = the Enquiries block's 32px bottom
  // padding plus the type around the two baselines (body 18px, heading 40px).
  '[@media(max-width:767.98px)]:[&>section:nth-child(4_of_section:not(.image-banner))]:min-h-0 [@media(max-width:767.98px)]:[&>section:nth-child(4_of_section:not(.image-banner))]:pt-[calc(120px_-_78px)]',
  // Small phones (under 390px): "Monday – Sunday" and the time need ~388px
  // side by side, so the time sits on its own line under the day instead of
  // both wrapping.
  '[@media(max-width:389.98px)]:[&>section:nth-child(2_of_section:not(.image-banner))_dl]:grid-cols-[minmax(0,1fr)] [@media(max-width:389.98px)]:[&>section:nth-child(2_of_section:not(.image-banner))_dl]:gap-y-[2px]',
  MENU_ICON_ON_LIGHT_TOP,
  NO_LINK_UNDERLINE,
].join(' ')

/**
 * /contact — Payload-managed Contact Us page (Contact us PDF).
 *
 * Same pattern as /museum-guidelines: server component, fetches the Pages
 * doc by slug with depth=2, renders `layout` via the shared `<RenderBlocks />`
 * (SectionIntro, VisitInfo with its intro, then two SectionIntros: "For
 * specific Enquiries" and "Find Us" with its two buttons).
 *
 * The visible title is a <p> in SectionIntro, so a screen-reader-only <h1>
 * heads the document outline. The wrapper carries this page's own styles
 * (PAGE_CLASSES above).
 */
export default async function ContactPage() {
  const page = await getPublishedPage()

  const layout = page?.layout
  const hasContent = Array.isArray(layout) && layout.length > 0

  if (!hasContent) {
    notFound()
  }

  return (
    <div className={PAGE_CLASSES}>
      <h1 className="sr-only">Contact Us</h1>
      {/* As on /about: on phones too the title and its first sentence sit on
          the haveli photo (centred at its bottom), and on laptops and
          desktops the photo fills exactly the first screen. */}
      <RenderBlocks blocks={layout} introOnBannerPhone bannerFillsScreen />
    </div>
  )
}

export const dynamic = 'force-static'
export const revalidate = 600
