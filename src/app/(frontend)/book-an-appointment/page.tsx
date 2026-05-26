import { notFound } from 'next/navigation'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { getCachedDocument } from '@/utilities/getDocument'

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

  return <RenderBlocks blocks={layout} />
}

export const dynamic = 'force-static'
export const revalidate = 600
