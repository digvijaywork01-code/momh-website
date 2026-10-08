import { notFound } from 'next/navigation'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import type { Metadata } from 'next'

import { getCachedDocument } from '@/utilities/getDocument'
import { generateMeta } from '@/utilities/generateMeta'

/**
 * Published page only. `getDocument` reads through the Local API with access
 * control off and no draft filter, so a page that has only ever been saved as
 * a draft would come back too. (A published page with a newer pending draft
 * keeps its published content in the main row, so editing a live page does
 * not trip this.)
 */
const getPublishedPage = async (): Promise<PageType | undefined> => {
  let page: PageType | undefined
  try {
    page = (await getCachedDocument('pages', 'contact', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }
  return page?._status === 'published' ? page : undefined
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage()
  return generateMeta({ doc: page ?? null, pageTitle: 'Contact Us' })
}

/**
 * /contact — Payload-managed Contact Us page (Contact us PDF).
 *
 * Same pattern as /museum-guidelines: server component, fetches the Pages
 * doc by slug with depth=2, renders `layout` via the shared `<RenderBlocks />`
 * (ImageBanner, SectionIntro, VisitInfo with its intro, then two SectionIntros:
 * "For specific Enquiries" and "Find Us" with its two buttons).
 *
 * The visible title is a <p> in SectionIntro, so a screen-reader-only <h1>
 * heads the document outline. The wrapper class scopes the page's link
 * styling (see globals.css).
 */
export default async function ContactPage() {
  const page = await getPublishedPage()

  const layout = page?.layout
  const hasContent = Array.isArray(layout) && layout.length > 0

  if (!hasContent) {
    notFound()
  }

  return (
    <div className="contact-page">
      <h1 className="sr-only">Contact Us</h1>
      <RenderBlocks blocks={layout} />
    </div>
  )
}

export const dynamic = 'force-static'
export const revalidate = 600
