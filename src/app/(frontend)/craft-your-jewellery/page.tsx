import { notFound } from 'next/navigation'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { getCachedDocument } from '@/utilities/getDocument'

/**
 * /craft-your-jewellery — Payload-managed editorial page.
 *
 * Mirrors `/plan-your-visit` exactly — server component, fetches the
 * `craft-your-jewellery` Page from Payload at depth 2, renders the layout
 * array via the shared dispatcher. Returns 404 if the page hasn't been
 * seeded or published.
 */
export default async function CraftYourJewelleryPage() {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'craft-your-jewellery', 2)()) as
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
