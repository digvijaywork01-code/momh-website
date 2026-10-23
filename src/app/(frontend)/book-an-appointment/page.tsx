import { notFound } from 'next/navigation'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import type { Metadata } from 'next'

import { getCachedDocument } from '@/utilities/getDocument'
import { generateMeta } from '@/utilities/generateMeta'

export async function generateMetadata(): Promise<Metadata> {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'book-an-appointment', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }
  return generateMeta({ doc: page ?? null, pageTitle: 'Book an Appointment' })
}

/**
 * /book-an-appointment — Payload-managed visit-booking enquiry form
 * page. Linked from the "Visit" / "Book An Appointment" header items,
 * the footer "Book a Visit" link, and 6+ in-page CTAs across the home
 * Hero / Plan Your Visit / Museum Guidelines / craft-your-jewellery /
 * gallery pages.
 *
 * Same pattern as /personal-consultation, /plan-your-visit, and
 * /craft-your-jewellery: server component, fetches Pages doc by slug
 * with depth=2, renders layout via shared `<RenderBlocks />`.
 *
 * Replaces the previous 673-line standalone form file — the form
 * is now an `AppointmentForm` block inside the Pages doc, and the
 * page picks up the global Header / FlowerPaintings / Footer chrome.
 */

/**
 * Styles for this page only, on its wrapper. They apply only while the page
 * opens with its title block (.editorial-display) instead of a hero photo,
 * the same rules as /contact and /terms; with a banner first they match
 * nothing.
 *  - The phone menu icon is white for dark hero photos; on the white title
 *    section it turns ink.
 *  - Phones (under 768px): the title clears the 108px phone header with the
 *    115px top space /contact uses, and the 40vh minimum height is released.
 */
const PAGE_CLASSES = [
  '[html:has(&>section:first-of-type_.editorial-display)_header_button>svg.text-white]:text-ink',
  '[@media(max-width:767.98px)]:[&>section:first-of-type:has(.editorial-display)]:min-h-0',
  '[@media(max-width:767.98px)]:[&>section:first-of-type:has(.editorial-display)]:pt-[115px]',
].join(' ')

export default async function BookAnAppointmentPage() {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'book-an-appointment', 2)()) as
      | PageType
      | undefined
  } catch {
    page = undefined
  }

  const layout = page?.layout
  const hasContent = Array.isArray(layout) && layout.length > 0

  if (!hasContent) {
    notFound()
  }

  // Page-only variants for the Book An Appointment PDF (lg+ only; the
  // shared blocks render unchanged on every other page).
  return (
    <div className={PAGE_CLASSES}>
      <RenderBlocks
        blocks={layout}
        sectionIntroVariant="appointment-page"
        contactPanelVariant="appointment-page"
      />
    </div>
  )
}

export const dynamic = 'force-static'
export const revalidate = 600
