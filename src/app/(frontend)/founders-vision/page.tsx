import { notFound } from 'next/navigation'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import type { Metadata } from 'next'

import { getCachedDocument } from '@/utilities/getDocument'
import { generateMeta } from '@/utilities/generateMeta'

export async function generateMetadata(): Promise<Metadata> {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'founders-vision', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }
  return generateMeta({ doc: page ?? null, pageTitle: "The Founder's Vision" })
}

/**
 * /founders-vision — Payload-managed editorial page (The Founder's Vision).
 *
 * Mirrors the inner-page pattern (`plan-your-visit/page.tsx`): server
 * component, fetches the `founders-vision` Page from Payload with depth 2 so upload
 * relationships (images on each block) come back populated as full Media
 * objects ready for `<Media />`. Renders the `layout` array through the
 * shared `<RenderBlocks />` dispatcher. Returns 404 if the page hasn't been
 * seeded / published yet.
 */
export default async function FoundersVisionPage() {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'founders-vision', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }

  const layout = page?.layout
  const hasContent = Array.isArray(layout) && layout.length > 0

  if (!hasContent) {
    notFound()
  }

  // `editorial-band` opts every editorialSplit on THIS page into the
  // Founder's-Vision-PDF layout (short 50/50 bands separated by white,
  // Cormorant capitals over a maroon rule, justified 30px body) without
  // touching how the shared block renders anywhere else.
  return <RenderBlocks blocks={layout} editorialSplitVariant="editorial-band" />
}

export const dynamic = 'force-static'
export const revalidate = 600
