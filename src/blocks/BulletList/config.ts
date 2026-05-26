import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * BulletListBlock — two-column section: image on one side, eyebrow +
 * bulleted list on the other.
 *
 * Used twice on `/museum-guidelines`:
 *   - ESSENTIALS — bullets left, image right (gold necklace in vitrine)
 *   - EXPERIENCE — image left (painted ceiling + lounge), bullets right
 *
 * Eyebrow renders in red caps Gill Sans with wide letter-spacing
 * (same treatment as the carousel step labels and the ACCESSIBILITY
 * eyebrow on PYV).
 */

const richTextEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

export const BulletList: Block = {
  slug: 'bulletList',
  interfaceName: 'BulletListBlock',
  labels: {
    singular: 'Bullet List',
    plural: 'Bullet List blocks',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'imagePosition',
          type: 'select',
          required: true,
          defaultValue: 'right',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'backgroundColor',
          type: 'select',
          required: true,
          defaultValue: 'ivory',
          options: [
            { label: 'Ivory', value: 'ivory' },
            { label: 'Cream', value: 'cream' },
            { label: 'White', value: 'white' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'eyebrow',
      type: 'text',
      required: true,
      admin: {
        description:
          'Red caps section title, e.g. "ESSENTIALS" or "EXPERIENCE". Renders Gill Sans, wide letter-spacing.',
      },
    },
    {
      name: 'items',
      type: 'array',
      label: 'Bullet items',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'text',
          type: 'richText',
          required: true,
          editor: richTextEditor,
        },
      ],
    },
  ],
}
