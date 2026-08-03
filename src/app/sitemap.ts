import type { MetadataRoute } from 'next'

import { getServerSideURL } from '@/utilities/getURL'

/**
 * Dynamic sitemap.
 *
 * Replaces the broken `next-sitemap` static file (which listed localhost
 * URLs and pointed at non-existent pages-sitemap.xml / posts-sitemap.xml).
 * Lists the indexable public routes with the real production domain from
 * `getServerSideURL()`.
 *
 * `/thank-you` is intentionally omitted — it's a form-confirmation page set
 * to `noindex`, so it must not appear in the sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const url = getServerSideURL()

  const routes = [
    '', // home
    '/about',
    '/plan-your-visit',
    '/craft-your-jewellery',
    '/museum-guidelines',
    '/personal-consultation',
    '/book-an-appointment',
  ]

  return routes.map((route) => ({
    url: `${url}${route}`,
    changeFrequency: 'monthly',
    priority: route === '' ? 1 : 0.8,
  }))
}
