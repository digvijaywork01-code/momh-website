import { notFound } from 'next/navigation'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import type { Metadata } from 'next'

import { getCachedDocument } from '@/utilities/getDocument'
import { generateMeta } from '@/utilities/generateMeta'

export async function generateMetadata(): Promise<Metadata> {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'museum-guidelines', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }
  return generateMeta({ doc: page ?? null, pageTitle: 'Museum Guidelines' })
}

/**
 * /museum-guidelines — Payload-managed editorial page.
 *
 * Replaces the earlier static placeholder. Mirrors the home-page +
 * Plan-Your-Visit + Craft-Your-Jewellery pattern: server component
 * fetches the page from Payload by slug (depth 2 so upload
 * relationships come back populated) and renders `layout` through the
 * shared `<RenderBlocks />` dispatcher.
 */
export default async function MuseumGuidelinesPage() {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'museum-guidelines', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }

  const layout = page?.layout
  const hasContent = Array.isArray(layout) && layout.length > 0

  if (!hasContent) {
    notFound()
  }

  // As on /about: on phones too the title and its first sentence sit on the
  // haveli photo (centred at its bottom), and on laptops and desktops that
  // opening photo fills exactly the first screen (the flower wall further
  // down keeps its own size).
  return <RenderBlocks blocks={layout} introOnBannerPhone bannerFillsScreen />
}

export const dynamic = 'force-static'
export const revalidate = 600
