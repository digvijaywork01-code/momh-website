import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

type Collection = keyof Config['collections']

async function getDocument(collection: Collection, slug: string, depth = 0) {
  const payload = await getPayload({ config: configPromise })

  const page = await payload.find({
    collection,
    depth,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return page.docs[0]
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug.
 * `depth` controls how deeply Payload populates relationship fields — pass
 * a higher value (e.g. 2) when downstream components expect populated
 * upload/media objects rather than bare IDs.
 */
export const getCachedDocument = (collection: Collection, slug: string, depth = 0) =>
  unstable_cache(async () => getDocument(collection, slug, depth), [collection, slug, String(depth)], {
    tags: [`${collection}_${slug}`],
  })
