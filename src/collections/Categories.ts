import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { slugField } from '@/fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: authenticated,
    delete: authenticated,
    // STOP-GAP until the Payload 3.93 upgrade (GHSA-xx6w-jxg9-2wh8,
    // GHSA-v49j-62m6-pgrr): was `anyone`. The public pages read through the
    // Local API, which skips access rules, so they are not affected.
    read: authenticated,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    ...slugField(),
  ],
}
