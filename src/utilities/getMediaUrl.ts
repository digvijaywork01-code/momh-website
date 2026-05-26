/**
 * Processes media resource URL to ensure proper formatting.
 *
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 *
 * Returns absolute URLs unchanged (cloud storage hosts). Returns
 * path-only URLs as path-only — the browser resolves them against
 * `window.location.origin`, so the same code path works for:
 *   - localhost (`/media/foo.jpg` → `http://localhost:3000/media/foo.jpg`)
 *   - tunnels  (`/media/foo.jpg` → `https://xxx.trycloudflare.com/media/foo.jpg`)
 *   - production (`/media/foo.jpg` → `https://yourdomain.com/media/foo.jpg`)
 *
 * Previous implementation prepended `getClientSideURL()` which fell
 * back to `NEXT_PUBLIC_SERVER_URL` (= `http://localhost:3000`) during
 * SSR. That baked the localhost host into the SSR HTML, so video
 * `<source src>` tags pointed at localhost when the page was served
 * over a tunnel — visitors saw the hero video fail to load.
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  // Already a fully-qualified URL (cloud storage etc.) — return as-is
  // with the optional cache tag appended.
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return cacheTag ? `${url}?${cacheTag}` : url
  }

  // Relative path — let the browser resolve against the current
  // origin. Works identically for localhost, tunnels, and production.
  return cacheTag ? `${url}?${cacheTag}` : url
}
