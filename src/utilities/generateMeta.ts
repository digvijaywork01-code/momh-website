import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

const SITE_NAME = 'Museum of Meenakari Heritage'
const HOME_TITLE = 'Museum of Meenakari Heritage — Jaipur, India'
const DEFAULT_DESCRIPTION =
  "India's first museum devoted entirely to the art of enamelling on gold. From The House of Sunita Shekhawat — meenakari's living archive in the heart of Jaipur."

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  // Brand default OG card (1200×630) lives in /public. Used whenever a
  // page has no CMS-set SEO image.
  let url = serverUrl + '/og-momh.jpg'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

/**
 * Builds Next.js Metadata for a CMS-backed page.
 *
 * Title rules:
 *  - CMS SEO title set        → "<that title> — Museum of Meenakari Heritage"
 *  - `pageTitle` passed       → "<pageTitle> — Museum of Meenakari Heritage"
 *    (inner routes pass their page name so the title is right even when the
 *     CMS SEO field is blank)
 *  - neither (home page)      → "Museum of Meenakari Heritage — Jaipur, India"
 *
 * Description / OG image fall back to brand defaults when the CMS fields are
 * empty, so every page ships real, accurate tags out of the box.
 */
export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
  pageTitle?: string
}): Promise<Metadata> => {
  const { doc, pageTitle } = args

  const ogImage = getImageURL(doc?.meta?.image)

  const name = doc?.meta?.title || pageTitle
  const title = name ? `${name} — ${SITE_NAME}` : HOME_TITLE
  const description = doc?.meta?.description || DEFAULT_DESCRIPTION

  // Canonical path. Home doc has slug "home" → "/"; everything else maps to
  // "/<slug>".
  const slug = Array.isArray(doc?.slug) ? doc?.slug.join('/') : doc?.slug
  const path = slug && slug !== 'home' ? `/${slug}` : '/'

  return {
    title,
    description,
    metadataBase: new URL(getServerSideURL()),
    alternates: {
      canonical: path,
    },
    openGraph: mergeOpenGraph({
      title: name ? `${name} — ${SITE_NAME}` : SITE_NAME,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: name || SITE_NAME }],
      url: path,
    }),
    twitter: {
      card: 'summary_large_image',
      title: name ? `${name} — ${SITE_NAME}` : SITE_NAME,
      description,
      images: [ogImage],
    },
  }
}
