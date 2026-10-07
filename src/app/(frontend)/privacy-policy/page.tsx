import { notFound } from 'next/navigation'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import type { Metadata } from 'next'

import { getCachedDocument } from '@/utilities/getDocument'
import { generateMeta } from '@/utilities/generateMeta'

/**
 * Published page only. `getDocument` reads through the Local API with access
 * control off and no draft filter, so a page that has only ever been saved as
 * a draft would come back too. A legal page must never go public that way.
 * (A published page with a newer pending draft keeps its published content in
 * the main row, so editing a live page does not trip this.)
 */
const getPublishedPage = async (): Promise<PageType | undefined> => {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'privacy-policy', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }
  return page?._status === 'published' ? page : undefined
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage()
  return generateMeta({ doc: page ?? null, pageTitle: 'Privacy Policy' })
}

/**
 * /privacy-policy — Payload-managed legal page (Privacy Policy PDF).
 *
 * Same pattern as /museum-guidelines: server component, fetches the Pages
 * doc by slug with depth=2, renders `layout` via the shared `<RenderBlocks />`
 * (ImageBanner, SectionIntro, then Divider + TextSection pairs).
 *
 * The wrapper class carries the page-end spacing from the PDF and a print
 * fix scoped to this route (see globals.css). The visible title is a <p> in
 * SectionIntro, so a screen-reader-only <h1> heads the document outline.
 */
export default async function PrivacyPolicyPage() {
  const page = await getPublishedPage()

  const layout = page?.layout
  const hasContent = Array.isArray(layout) && layout.length > 0

  if (!hasContent) {
    notFound()
  }

  return (
    <div className="privacy-policy-page">
      <h1 className="sr-only">Privacy Policy</h1>
      <RenderBlocks blocks={layout} />
    </div>
  )
}

export const dynamic = 'force-static'
export const revalidate = 600
