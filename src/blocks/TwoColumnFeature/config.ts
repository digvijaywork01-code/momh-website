import type { Block, Field } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * TwoColumnFeatureBlock — two independently-configurable, independently-
 * optional columns side-by-side.
 *
 * Each column's `type` selects between:
 *   - "promo" : image + body + italic CTA (the standard editorial promo card)
 *   - "form"  : image + body + embedded Payload form (newsletter signups, etc.)
 *
 * Used on PDF page 12 as Blog teaser (columnA, type=promo) + Newsletter
 * (columnB, type=form). When only one column is enabled it occupies the full
 * width. Reusable for any side-by-side feature.
 */

const richTextEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

const columnFields = (columnLabel: 'A' | 'B'): Field[] => [
  {
    name: 'enabled',
    type: 'checkbox',
    defaultValue: true,
    label: `Show column ${columnLabel}`,
  },
  {
    name: 'type',
    type: 'select',
    required: true,
    defaultValue: 'promo',
    options: [
      { label: 'Promo (image + text + CTA)', value: 'promo' },
      { label: 'Form (embedded Payload form)', value: 'form' },
      { label: 'Newsletter (inline email + subscribe)', value: 'newsletter' },
    ],
    admin: {
      condition: (_, siblingData) => Boolean(siblingData?.enabled),
    },
  },
  {
    name: 'eyebrow',
    type: 'text',
    admin: {
      condition: (_, siblingData) => Boolean(siblingData?.enabled),
    },
  },
  {
    name: 'headline',
    type: 'richText',
    editor: richTextEditor,
    admin: {
      condition: (_, siblingData) => Boolean(siblingData?.enabled),
    },
  },
  {
    name: 'image',
    type: 'upload',
    relationTo: 'media',
    admin: {
      condition: (_, siblingData) => Boolean(siblingData?.enabled),
    },
  },
  {
    name: 'body',
    type: 'richText',
    editor: richTextEditor,
    admin: {
      condition: (_, siblingData) => Boolean(siblingData?.enabled),
    },
  },
  // Promo-only fields
  {
    name: 'ctaLabel',
    type: 'text',
    admin: {
      condition: (_, siblingData) =>
        Boolean(siblingData?.enabled) && siblingData?.type === 'promo',
    },
  },
  {
    name: 'ctaLink',
    type: 'group',
    admin: {
      hideGutter: true,
      condition: (_, siblingData) =>
        Boolean(siblingData?.enabled) &&
        siblingData?.type === 'promo' &&
        Boolean(siblingData?.ctaLabel),
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
  // Form-only field
  {
    name: 'embedForm',
    type: 'relationship',
    relationTo: 'forms',
    label: 'Embedded form',
    admin: {
      condition: (_, siblingData) =>
        Boolean(siblingData?.enabled) && siblingData?.type === 'form',
      description: 'The form to embed in this column. Submissions flow through Payload.',
    },
  },
  // Newsletter-only fields. The inline newsletter widget renders an
  // email input + subscribe button matching PDF page 12 right column.
  {
    name: 'newsletterInputLabel',
    type: 'text',
    label: 'Email input label',
    defaultValue: 'Email Address:',
    admin: {
      condition: (_, siblingData) =>
        Boolean(siblingData?.enabled) && siblingData?.type === 'newsletter',
    },
  },
  {
    name: 'newsletterButtonLabel',
    type: 'text',
    label: 'Subscribe button label',
    defaultValue: 'SUBSCRIBE',
    admin: {
      condition: (_, siblingData) =>
        Boolean(siblingData?.enabled) && siblingData?.type === 'newsletter',
    },
  },
  {
    name: 'newsletterEndpoint',
    type: 'text',
    label: 'Submit URL (POST)',
    admin: {
      condition: (_, siblingData) =>
        Boolean(siblingData?.enabled) && siblingData?.type === 'newsletter',
      description:
        'Where the email submission gets POSTed (JSON body { email }). Leave blank to disable submission for now.',
    },
  },
]

export const TwoColumnFeature: Block = {
  slug: 'twoColumnFeature',
  interfaceName: 'TwoColumnFeatureBlock',
  labels: {
    singular: 'Two Column Feature',
    plural: 'Two Column Feature blocks',
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
        { label: 'Black', value: 'black' },
        { label: 'Emerald', value: 'emerald' },
        { label: 'Maroon', value: 'maroon' },
      ],
    },
    {
      name: 'columnA',
      type: 'group',
      label: 'Column A (left)',
      fields: columnFields('A'),
    },
    {
      name: 'columnB',
      type: 'group',
      label: 'Column B (right)',
      fields: columnFields('B'),
    },
  ],
}
