import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { authenticated } from '../access/authenticated'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: authenticated,
    delete: authenticated,
    // STOP-GAP until the Payload 3.93 upgrade (GHSA-xx6w-jxg9-2wh8,
    // GHSA-v49j-62m6-pgrr): was `anyone`. Pages read media through the Local
    // API and the image files come from the Blob host, so visitors are not
    // affected. A local copy has no Blob token and serves page images from
    // /api/media/file/<name>, so there (and only there) reading a FILE stays
    // open; lists and documents stay closed everywhere. To undo: put
    // `read: anyone` back with its import. See servesLocalMediaFiles in
    // src/access/stopgapGate.ts.
    read: ({ isReadingStaticFile, req }) =>
      Boolean(req.user) || (isReadingStaticFile === true && !process.env.BLOB_READ_WRITE_TOKEN),
    update: authenticated,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      //required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
      },
      {
        name: 'small',
        width: 600,
      },
      {
        name: 'medium',
        width: 900,
      },
      {
        name: 'large',
        width: 1400,
      },
      {
        name: 'xlarge',
        width: 1920,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
}
