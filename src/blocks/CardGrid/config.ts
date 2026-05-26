import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * CardGridBlock — generic reusable row of N cards.
 *
 * Each card has an image, title, short summary, and an italic CTA with the
 * MOMH red-circle arrow. Used on PDF page 11 (Press News) as a 3-column row
 * on a black background. Reusable elsewhere for related articles, team
 * grids, exhibition listings, awards, etc.
 */

export const CardGrid: Block = {
  slug: 'cardGrid',
  interfaceName: 'CardGridBlock',
  labels: {
    singular: 'Card Grid',
    plural: 'Card Grid blocks',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          admin: { width: '50%', description: 'Optional italic eyebrow above the headline.' },
        },
        {
          name: 'columns',
          type: 'select',
          required: true,
          defaultValue: '3',
          options: [
            { label: '2 columns', value: '2' },
            { label: '3 columns', value: '3' },
            { label: '4 columns', value: '4' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'headline',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
      admin: {
        description:
          'Section headline. Italicize key words for emphasis. For the MOMH-in-News pattern, use a literal "●" (U+25CF) in the headline and wrap it in red text via the inline toolbar.',
      },
    },
    {
      name: 'backgroundColor',
      type: 'select',
      required: true,
      defaultValue: 'ivory',
      options: [
        { label: 'Ivory', value: 'ivory' },
        { label: 'Cream', value: 'cream' },
        { label: 'Black', value: 'black' },
        { label: 'Emerald', value: 'emerald' },
        { label: 'Maroon', value: 'maroon' },
      ],
    },
    {
      name: 'cards',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 6,
      labels: { singular: 'Card', plural: 'Cards' },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'summary',
          type: 'textarea',
          required: true,
        },
        {
          type: 'row',
          fields: [
            {
              name: 'ctaLabel',
              type: 'text',
              admin: { width: '60%' },
            },
            {
              name: 'ctaArrowPosition',
              type: 'select',
              defaultValue: 'right',
              options: [
                { label: 'Right', value: 'right' },
                { label: 'Left', value: 'left' },
              ],
              admin: { width: '40%' },
            },
          ],
        },
        {
          name: 'ctaLink',
          type: 'group',
          admin: {
            hideGutter: true,
            condition: (_, siblingData) => Boolean(siblingData?.ctaLabel),
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'type',
                  type: 'radio',
                  defaultValue: 'custom',
                  admin: { layout: 'horizontal', width: '50%' },
                  options: [
                    { label: 'Internal page', value: 'reference' },
                    { label: 'Custom URL', value: 'custom' },
                  ],
                },
                {
                  name: 'newTab',
                  type: 'checkbox',
                  label: 'Open in new tab',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'reference',
              type: 'relationship',
              relationTo: ['pages', 'posts'],
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'reference',
              },
            },
            {
              name: 'url',
              type: 'text',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'custom',
              },
            },
          ],
        },
      ],
    },
  ],
}
