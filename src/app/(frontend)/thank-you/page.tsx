import { notFound } from 'next/navigation'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { getCachedDocument } from '@/utilities/getDocument'

/**
 * /thank-you — shared form confirmation page (PDF p7). Both the
 * AppointmentForm on /book-an-appointment and the ConsultationForm
 * on /personal-consultation redirect here via the block's
 * `successRedirect` field on successful submission.
 *
 * Same pattern as /personal-consultation, /book-an-appointment,
 * /plan-your-visit, /craft-your-jewellery: server component, fetches
 * the Pages doc by slug with depth=2, renders the layout via shared
 * `<RenderBlocks />`.
 */
export default async function ThankYouPage() {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'thank-you', 2)()) as
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
