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
 * (SectionIntro, VisitInfo with its intro, then two SectionIntros: "For
 * specific Enquiries" and "Find Us" with its two buttons).
 *
 * The visible title is a <p> in SectionIntro, so a screen-reader-only <h1>
 * heads the document outline. The wrapper class scopes the page's link
 * styling and its spacing overrides (see globals.css).
 */
/**
 * Phone menu icon: the header draws it white, for a dark photo at the top of
 * the page. This page starts with its title instead (no hero yet), so while
 * its first section is the title block (.editorial-display) the icon is ink;
 * once a hero photo is added as the first block, the rule stops matching and
 * the icon is white again. Only the phone header has this icon.
 */
const MENU_ICON_ON_LIGHT_TOP =
  '[html:has(&>section:first-of-type_.editorial-display)_header_button>svg.text-white]:text-ink'

/**
 * The Getting Here email (Visit Info block) underlines itself; the PDF shows
 * no underline, so it is removed on this page only. Its red hover stays.
 * Book an Appointment uses the same block and keeps its underline.
 */
const NO_LINK_UNDERLINE = '[&_a.underline]:no-underline'

export default async function ContactPage() {
  const page = await getPublishedPage()

  const layout = page?.layout
  const hasContent = Array.isArray(layout) && layout.length > 0

  if (!hasContent) {
    notFound()
  }

  return (
    <div className={`contact-page ${MENU_ICON_ON_LIGHT_TOP} ${NO_LINK_UNDERLINE}`}>
      <h1 className="sr-only">Contact Us</h1>
      <RenderBlocks blocks={layout} />
    </div>
  )
}

export const dynamic = 'force-static'
export const revalidate = 600
