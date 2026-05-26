import { notFound } from 'next/navigation'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { getCachedDocument } from '@/utilities/getDocument'

/**
 * /plan-your-visit — Payload-managed editorial page.
 *
 * Mirrors the home-page pattern (`src/app/(frontend)/page.tsx`): server
 * component, fetches the `plan-your-visit` Page from Payload with depth 2 so
 * upload relationships (images on each block) come back populated as full
 * Media objects ready for `<Media />`. Renders the `layout` array through the
 * shared `<RenderBlocks />` dispatcher. Returns 404 if the page hasn't been
 * seeded / published yet.
 */
export default async function PlanYourVisitPage() {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'plan-your-visit', 2)()) as PageType | undefined
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
