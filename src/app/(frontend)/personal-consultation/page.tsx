import { notFound } from 'next/navigation'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import type { Metadata } from 'next'

import { getCachedDocument } from '@/utilities/getDocument'
import { generateMeta } from '@/utilities/generateMeta'

export async function generateMetadata(): Promise<Metadata> {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'personal-consultation', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }
  return generateMeta({ doc: page ?? null, pageTitle: 'Personal Consultation' })
}

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

  // As on /about: on phones too the title and its first sentence sit on the
  // haveli photo (centred at its bottom), and on laptops and desktops the
  // photo fills exactly the first screen.
  return <RenderBlocks blocks={layout} introOnBannerPhone bannerFillsScreen />
}

export const dynamic = 'force-static'
export const revalidate = 600
