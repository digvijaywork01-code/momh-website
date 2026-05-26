import { notFound } from 'next/navigation'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { getCachedDocument } from '@/utilities/getDocument'

/**
 * /personal-consultation — Payload-managed bespoke-jewellery enquiry
 * form page. Linked from the "Book Your Personal Consultation" CTA on
 * /craft-your-jewellery.
 *
 * Same pattern as /plan-your-visit and /craft-your-jewellery: server
 * component, fetches Pages doc by slug with depth=2, renders layout
 * via shared `<RenderBlocks />`.
 */
export default async function PersonalConsultationPage() {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'personal-consultation', 2)()) as
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
