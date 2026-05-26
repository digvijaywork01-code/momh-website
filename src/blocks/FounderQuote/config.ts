import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * FounderQuoteBlock — 50/50 portrait + quote panel.
 *
 * Matches PDF page 3: portrait of the founder on the left, cream-background
 * content panel on the right with floral icon, eyebrow ("A NOTE BY"), display
 * title ("THE FOUNDER"), the quote with curly marks, signature, and
 * attribution.
 *
 * Reusable for any director's note, testimonial, or featured-voice section
 * that uses the same 50/50 portrait-plus-quote layout.
 */

export const FounderQuote: Block = {
  slug: 'founderQuote',
  interfaceName: 'FounderQuoteBlock',
  labels: {
    singular: 'Founder Quote',
    plural: 'Founder Quote blocks',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'portrait',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'portraitPosition',
          type: 'select',
          defaultValue: 'left',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      label: 'Floral icon (top of content panel)',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          defaultValue: 'A Note By',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'title',
          type: 'text',
          defaultValue: 'The Founder',
          required: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'quote',
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
        description: 'The body of the testimonial. Curly quote marks render automatically.',
      },
    },
    {
      name: 'signature',
      type: 'upload',
      relationTo: 'media',
      label: 'Signature image (optional)',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'attribution',
          type: 'text',
          required: true,
          defaultValue: 'Sunita Shekhawat',
          admin: { width: '50%' },
        },
        {
          name: 'attributionRole',
          type: 'text',
          required: true,
          defaultValue: 'Museum Director & Founder',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'backgroundColor',
      type: 'select',
      required: true,
      defaultValue: 'cream',
      options: [
        { label: 'Cream', value: 'cream' },
        { label: 'Ivory', value: 'ivory' },
      ],
    },
  ],
}
