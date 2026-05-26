import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * ProcessCarouselBlock — centered single-card carousel that walks the
 * visitor through a multi-step process.
 *
 * Used for the "Craft Your Jewellery" page's INSPIRATION → DESIGN →
 * DEVELOPMENT sequence. Each slide is a self-contained card with an
 * image up top, a red step label below, then a short body paragraph.
 * Pagination dots sit at the bottom and double as click targets.
 *
 * Distinct from `CarouselBlock` (which is text-on-one-side + sliding-
 * images-on-the-other). This one is centered, narrative, and the
 * editor doesn't choose layout direction — the slides ARE the content.
 */

const richTextEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

export const ProcessCarousel: Block = {
  slug: 'processCarousel',
  interfaceName: 'ProcessCarouselBlock',
  labels: {
    singular: 'Process Carousel',
    plural: 'Process Carousel blocks',
  },
  fields: [
    {
      name: 'backgroundColor',
      type: 'select',
      required: true,
      defaultValue: 'cream',
      options: [
        { label: 'Cream', value: 'cream' },
        { label: 'Ivory', value: 'ivory' },
        { label: 'White', value: 'white' },
        { label: 'Maroon', value: 'maroon' },
        { label: 'Emerald', value: 'emerald' },
        { label: 'Black', value: 'black' },
      ],
    },
    {
      name: 'slides',
      type: 'array',
      label: 'Steps',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'stepLabel',
          type: 'text',
          required: true,
          admin: {
            description:
              'Short step label rendered in red, all caps, with wide letter-spacing. e.g. "INSPIRATION", "DESIGN", "DEVELOPMENT".',
          },
        },
        {
          name: 'body',
          type: 'richText',
          required: true,
          editor: richTextEditor,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'autoplay',
          type: 'checkbox',
          defaultValue: true,
          admin: { width: '50%' },
        },
        {
          name: 'autoplayInterval',
          type: 'number',
          defaultValue: 5000,
          admin: {
            width: '50%',
            description: 'ms between auto-advances. 5000 = 5s.',
            condition: (_, sd) => Boolean(sd?.autoplay),
          },
        },
      ],
    },
  ],
}
