import { notFound } from 'next/navigation'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import type { Metadata } from 'next'

import { getCachedDocument } from '@/utilities/getDocument'
import { generateMeta } from '@/utilities/generateMeta'

export async function generateMetadata(): Promise<Metadata> {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'art-and-craftsmanship', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }
  return generateMeta({ doc: page ?? null, pageTitle: "The Art & Craftsmanship" })
}

/**
 * /art-and-craftsmanship — Payload-managed editorial page.
 *
 * Mirrors the inner-page pattern (`plan-your-visit/page.tsx`): server
 * component, fetches the `founders-vision` Page from Payload with depth 2 so upload
 * relationships (images on each block) come back populated as full Media
 * objects ready for `<Media />`. Renders the `layout` array through the
 * shared `<RenderBlocks />` dispatcher. Returns 404 if the page hasn't been
 * seeded / published yet.
 */
export default async function ArtAndCraftsmanshipPage() {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'art-and-craftsmanship', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }

  const layout = page?.layout
  const hasContent = Array.isArray(layout) && layout.length > 0

  if (!hasContent) {
    notFound()
  }

  // Same short-band editorial layout as the Founder's Vision page, plus the
  // italic-serif banner title this PDF uses. Both are route-level opt-ins, so
  // the shared blocks render unchanged on every other page.
  // `introOnHero`: the title block's heading ("The Art of Meenakari") becomes
  // the small line above the hero's title, its first sentence sits under it,
  // at the hero's bottom-left (bottom centre on phones), as on the banner
  // pages; the rest of its text stays below.
  // `infoHeroWholePhotoOnPhone`: on phones the hero shows the whole photo at
  // its own shape, neither cropped nor zoomed.
  return (
    <RenderBlocks
      blocks={layout}
      editorialSplitVariant="editorial-band"
      infoHeroVariant="banner-title"
      introOnHero
      infoHeroWholePhotoOnPhone
    />
  )
}

export const dynamic = 'force-static'
export const revalidate = 600
