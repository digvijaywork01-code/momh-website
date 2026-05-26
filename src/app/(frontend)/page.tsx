import { notFound } from 'next/navigation'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { getCachedDocument } from '@/utilities/getDocument'

/**
 * Home page — purely CMS-driven.
 *
 * Fetches the `pages` doc with slug `home` (depth: 2 populates upload
 * relationships into full Media objects) and renders its `layout`
 * blocks. If the doc is missing or has an empty layout, returns 404
 * so the build clearly surfaces the data problem rather than falling
 * back to a hard-coded layout that drifts from the live design.
 *
 * Earlier revisions kept a hard-coded legacy fallback (static Hero +
 * FounderQuote + ImageCardBlock + Carousel + MultiCard sections, plus
 * a `/gallery` standalone route) for use before the home page was
 * seeded. With every editorial section now defined as a CMS block
 * and the seed endpoints populating the page on first boot, the
 * fallback was unreachable dead code — removed in the cleanup pass.
 */
export default async function Page() {
  let homePage: PageType | undefined
  try {
    homePage = (await getCachedDocument('pages', 'home', 2)()) as PageType | undefined
  } catch {
    homePage = undefined
  }

  const layout = homePage?.layout
  if (!Array.isArray(layout) || layout.length === 0) {
    notFound()
  }

  return <RenderBlocks blocks={layout} />
}
