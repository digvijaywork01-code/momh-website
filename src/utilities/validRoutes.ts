/**
 * Live front-end routes + a helper to decide whether a CTA target actually
 * resolves to a real page.
 *
 * Why this exists: several editorial blocks were seeded with CTA links to
 * pages that were never built (e.g. /about, /architecture, /collections,
 * /collections/craftsmanship). Those buttons 404 on click. Rather than
 * delete the CTA data from the CMS (so it can come back when the page is
 * built), blocks call `isCtaTargetLive()` and simply don't render a button
 * whose internal target doesn't exist yet.
 *
 * The front end is a fixed set of explicit App Router folders under
 * `src/app/(frontend)/` — there is no `[slug]` catch-all — so the valid
 * route set is small and known. KEEP THIS LIST IN SYNC with the route
 * folders: if you add e.g. `src/app/(frontend)/collections/page.tsx`, add
 * `/collections` here and its CTA will start rendering automatically.
 */

export const VALID_ROUTES: ReadonlySet<string> = new Set([
  '/',
  '/about',
  '/founders-vision',
  '/book-an-appointment',
  '/craft-your-jewellery',
  '/museum-guidelines',
  '/personal-consultation',
  '/plan-your-visit',
  '/thank-you',
])

/**
 * Returns true if a CTA href should be rendered (target is reachable),
 * false if it's a dead internal link that would 404.
 *
 * Rules:
 *  - External links (http/https/mailto/tel) → always show (we can't and
 *    shouldn't validate them here).
 *  - Anchors / same-page anchors (`#x`, `/#x`) → always show.
 *  - Relative links not starting with `/` → show (can't reason about them).
 *  - Absolute internal paths (`/x`) → show ONLY if the normalised path is
 *    in VALID_ROUTES; otherwise hide (it 404s).
 */
export function isCtaTargetLive(href: string | null | undefined): boolean {
  if (!href) return false
  const h = href.trim()
  if (!h) return false

  // External protocols — always render.
  if (/^(https?:|mailto:|tel:)/i.test(h)) return true

  // Same-page anchor (`#about`) or root-anchor (`/#about`) — always render.
  if (h.startsWith('#') || h.startsWith('/#')) return true

  // Strip hash + query, then a trailing slash, to get the bare pathname.
  let path = h.split('#')[0].split('?')[0]
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)

  // Non-absolute internal link — can't validate, render it.
  if (!path.startsWith('/')) return true

  return VALID_ROUTES.has(path)
}
