import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const SITE_NAME = 'Museum of Meenakari Heritage'
const DEFAULT_DESCRIPTION =
  "India's first museum devoted entirely to the art of enamelling on gold. From The House of Sunita Shekhawat — meenakari's living archive in the heart of Jaipur."

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: DEFAULT_DESCRIPTION,
  images: [
    {
      url: `${getServerSideURL()}/og-momh.jpg`,
      width: 1200,
      height: 630,
      alt: SITE_NAME,
    },
  ],
  locale: 'en_IN',
  siteName: SITE_NAME,
  title: SITE_NAME,
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
