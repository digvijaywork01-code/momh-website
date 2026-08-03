import { notFound } from 'next/navigation'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import type { Metadata } from 'next'

import { getCachedDocument } from '@/utilities/getDocument'
import { generateMeta } from '@/utilities/generateMeta'

export async function generateMetadata(): Promise<Metadata> {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'about', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }
  return generateMeta({ doc: page ?? null, pageTitle: 'About Us' })
}

/**
 * /about — Payload-managed editorial page (the About Us story).
 *
 * Mirrors the inner-page pattern (`plan-your-visit/page.tsx`): server
 * component, fetches the `about` Page from Payload with depth 2 so upload
 * relationships (images on each block) come back populated as full Media
 * objects ready for `<Media />`. Renders the `layout` array through the
 * shared `<RenderBlocks />` dispatcher. Returns 404 if the page hasn't been
 * seeded / published yet.
 */
export default async function AboutPage() {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'about', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }

  const layout = page?.layout
  const hasContent = Array.isArray(layout) && layout.length > 0

  if (!hasContent) {
    notFound()
  }

  // `fifty-justified` opts every editorialSplit on THIS page into the
  // About-PDF layout (flush 50/50 columns, justified body, centred stack)
  // without touching how the shared block renders anywhere else.
  return <RenderBlocks blocks={layout} editorialSplitVariant="fifty-justified" />
}

export const dynamic = 'force-static'
export const revalidate = 600
