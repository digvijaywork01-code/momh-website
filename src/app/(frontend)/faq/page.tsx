import { notFound } from 'next/navigation'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import type { Metadata } from 'next'

import { FAQ_PAGE_CLOSED_FLAG, FAQ_PAGE_PHONE_QUERY } from '@/blocks/FAQ/phoneQuery'
import { getCachedDocument } from '@/utilities/getDocument'
import { generateMeta } from '@/utilities/generateMeta'

// Phones: the answers start closed (user's choice, 12 Oct). Runs as soon as
// the page above it is parsed, before the first paint, so the open answers
// never flash on a phone, then flags the wrapper so the FAQ block does not
// close them again at hydration. The FAQ block closes them itself after a
// client-side navigation to /faq, where this script does not run.
const CLOSE_ON_PHONES = `if(window.matchMedia(${JSON.stringify(FAQ_PAGE_PHONE_QUERY)}).matches){document.querySelectorAll('.faq-page details[open]').forEach(function(d){d.open=false})}document.currentScript.parentElement[${JSON.stringify(FAQ_PAGE_CLOSED_FLAG)}]=1`

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
    page = (await getCachedDocument('pages', 'faq', 2)()) as PageType | undefined
  } catch {
    page = undefined
  }
  return page?._status === 'published' ? page : undefined
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage()
  return generateMeta({ doc: page ?? null, pageTitle: 'Frequently Asked Questions' })
}

/**
 * /faq — Payload-managed FAQ page (FAQ PDF).
 *
 * Same pattern as /contact: server component, fetches the Pages doc by slug
 * with depth=2, renders `layout` via the shared `<RenderBlocks />`
 * (SectionIntro title, one FAQ block per question group, then a buttons-only
 * SectionIntro). `faqVariant="faq-page"` gives the FAQ blocks this page's look
 * (all-red group headings, answers open on tablets and up, closed on phones);
 * every other page renders the FAQ block unchanged.
 *
 * The visible title is a <p> in SectionIntro, so a screen-reader-only <h1>
 * heads the document outline; the group headings are level 2. The wrapper
 * class scopes the page's link styling and its spacing overrides (see
 * globals.css).
 */
export default async function FaqPage() {
  const page = await getPublishedPage()

  const layout = page?.layout
  const hasContent = Array.isArray(layout) && layout.length > 0

  if (!hasContent) {
    notFound()
  }

  return (
    <div className="faq-page">
      <h1 className="sr-only">Frequently Asked Questions</h1>
      <RenderBlocks blocks={layout} faqVariant="faq-page" />
      <script dangerouslySetInnerHTML={{ __html: CLOSE_ON_PHONES }} />
    </div>
  )
}

export const dynamic = 'force-static'
export const revalidate = 600
