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
 * Styles for this page only, on its wrapper.
 *  - --pp-vw: 1vw, frozen at 19.2px above 1920 (where the type stops growing).
 *  - Page end: last text baseline to the end of the PDF artboard = 228.33pt of
 *    1920 (11.892vw) before the flower row and footer, minus the Text
 *    Section's own 48px bottom padding and the part of its last line below the
 *    baseline (0.4202em of the body size).
 *  - Section Intro (the shared title block, matched by its 40vh minimum
 *    height class, which it only has while "Tight top" is unticked, as this
 *    page requires): on this page it sizes to its content, so on tall screens
 *    the first divider is not pushed down; on phones its side margins are 36px
 *    to line up with the Text Sections. The block itself is unchanged.
 *  - Print: below lg the site scrolls inside #scroll-container with html and
 *    body locked to one screen, so printing would output only the first
 *    screen. Undone here, and the fixed header hidden, for this page only.
 */
const PAGE_CLASSES = [
  'privacy-policy-page [--pp-vw:min(1vw,19.2px)]',
  'pb-8 lg:pb-[calc(11.892*var(--pp-vw)_-_3rem_-_0.4202*var(--fs-body))]',
  "[&_section[class*='40vh']]:min-h-0 [@media(max-width:767px)]:[&_section[class*='40vh']]:px-9",
  'print:[html:has(&)]:!static print:[html:has(&)]:!inset-auto print:[html:has(&)]:!h-auto print:[html:has(&)]:!overflow-visible',
  'print:[html:has(&)_body]:!static print:[html:has(&)_body]:!inset-auto print:[html:has(&)_body]:!h-auto print:[html:has(&)_body]:!overflow-visible',
  'print:[html:has(&)_#scroll-container]:!h-auto print:[html:has(&)_#scroll-container]:!overflow-visible',
  'print:[html:has(&)_header]:!hidden',
].join(' ')

/**
 * /privacy-policy — Payload-managed legal page (Privacy Policy PDF).
 *
 * Same pattern as /museum-guidelines: server component, fetches the Pages
 * doc by slug with depth=2, renders `layout` via the shared `<RenderBlocks />`
 * (ImageBanner, SectionIntro, then Divider + TextSection pairs).
 *
 * The visible title is a <p> in SectionIntro, so a screen-reader-only <h1>
 * heads the document outline. The wrapper carries this page's own styles
 * (PAGE_CLASSES above).
 */
export default async function PrivacyPolicyPage() {
  const page = await getPublishedPage()

  const layout = page?.layout
  const hasContent = Array.isArray(layout) && layout.length > 0

  if (!hasContent) {
    notFound()
  }

  return (
    <div className={PAGE_CLASSES}>
      <h1 className="sr-only">Privacy Policy</h1>
      {/* As on /about: on phones too the title and its first sentence sit on
          the photo (centred at its bottom), and on laptops and desktops the
          photo fills exactly the first screen. The trim to fill a screen
          comes off the photo's left only, so the gold piece at its right
          edge stays whole. */}
      <RenderBlocks blocks={layout} introOnBannerPhone bannerFillsScreen="keep-right" />
    </div>
  )
}

export const dynamic = 'force-static'
export const revalidate = 600
