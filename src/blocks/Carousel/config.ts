import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * CarouselBlock — text panel + horizontal Embla carousel of images.
 *
 * Used twice on the Plan Your Visit page:
 *   - "Craft Your Jewellery With Us" (image right, jewelry slides)
 *   - "Museum Guidelines" (image left, museum interior slides) with the
 *     ACCESSIBILITY notePanel filled
 *
 * The `notePanel` group is an optional small text panel that renders below
 * the main two-column row. Used for the ACCESSIBILITY note that sits
 * directly below the Museum Guidelines section in the PDF — kept inside
 * this block so the section reads as one unit and the smooth-scroll snap
 * doesn't split it.
 */

const richTextEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

export const Carousel: Block = {
  slug: 'carousel',
  interfaceName: 'CarouselBlock',
  labels: {
    singular: 'Carousel',
    plural: 'Carousel blocks',
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
            { label: 'Black', value: 'black' },
            { label: 'Emerald', value: 'emerald' },
            { label: 'Maroon', value: 'maroon' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'eyebrow',
      type: 'text',
      admin: { description: 'Italic eyebrow above the headline. Optional.' },
    },
    {
      name: 'headline',
      type: 'richText',
      required: true,
      editor: richTextEditor,
      admin: {
        description:
          'e.g. "Craft Your *Jewellery* With Us" or "Museum *Guidelines*" — italicize the key word.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
      editor: richTextEditor,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'ctaLabel',
          type: 'text',
          admin: { width: '60%' },
        },
      ],
    },
    {
      name: 'ctaLink',
      type: 'group',
      label: 'CTA link target',
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
              defaultValue: 'reference',
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
          admin: { condition: (_, sd) => sd?.type === 'reference' },
        },
        {
          name: 'url',
          type: 'text',
          admin: { condition: (_, sd) => sd?.type === 'custom' },
        },
      ],
    },
    {
      name: 'images',
      type: 'array',
      label: 'Carousel slides',
      minRows: 2,
      required: true,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'alt',
          type: 'text',
          label: 'Alt text (overrides the Media item alt)',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'slidesPerView',
          type: 'number',
          defaultValue: 1.15,
          min: 1,
          max: 4,
          admin: {
            width: '33%',
            description:
              '1 = full-width slides; 1.15 = active + ~10% peek of next (PDF spec, accounting for the inter-slide gap); 1.5 = active + half-peek.',
          },
        },
        {
          name: 'autoplay',
          type: 'checkbox',
          defaultValue: true,
          admin: { width: '33%' },
        },
        {
          name: 'autoplayInterval',
          type: 'number',
          defaultValue: 4000,
          admin: {
            width: '34%',
            description: 'ms between auto-advances. 4000 = 4s.',
            condition: (_, sd) => Boolean(sd?.autoplay),
          },
        },
      ],
    },
    {
      name: 'notePanel',
      type: 'group',
      label: 'Note panel (optional, renders below the carousel)',
      admin: {
        description:
          'Use for the ACCESSIBILITY note under "Museum Guidelines". Leave disabled on the "Craft Your Jewellery" carousel.',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
          label: 'Show note panel',
        },
        {
          name: 'eyebrow',
          type: 'text',
          admin: {
            description: 'e.g. "ACCESSIBILITY"',
            condition: (_, sd) => Boolean(sd?.enabled),
          },
        },
        {
          name: 'body',
          type: 'richText',
          editor: richTextEditor,
          admin: {
            condition: (_, sd) => Boolean(sd?.enabled),
          },
        },
      ],
    },
  ],
}
