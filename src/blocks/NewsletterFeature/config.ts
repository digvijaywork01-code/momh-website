import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * NewsletterFeatureBlock — 50/50 split with a full-bleed image on one
 * side and a coloured panel on the other containing a newsletter
 * signup form (eyebrow + headline + body + email input + SUBSCRIBE).
 *
 * Used for the bottom-of-page newsletter section on PDF p3 of the
 * Craft Your Jewellery page. Distinct from `TwoColumnFeature` because
 * this layout is opinionated: one image column (no padding, fully
 * bleeds) and one coloured form column. The form column's background
 * colour is configurable so the same block can render with maroon
 * (PDF default), emerald, black, or lighter cream/ivory panels.
 *
 * Reuses the existing `NewsletterWidget` component (extracted from
 * TwoColumnFeature) for the input + button UX.
 */

const richTextEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

export const NewsletterFeature: Block = {
  slug: 'newsletterFeature',
  interfaceName: 'NewsletterFeatureBlock',
  labels: {
    singular: 'Newsletter Feature',
    plural: 'Newsletter Feature blocks',
  },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'imagePosition',
          type: 'select',
          required: true,
          defaultValue: 'left',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'panelBackgroundColor',
          type: 'select',
          required: true,
          defaultValue: 'maroon',
          options: [
            { label: 'Maroon', value: 'maroon' },
            { label: 'Emerald', value: 'emerald' },
            { label: 'Black', value: 'black' },
            { label: 'Cream', value: 'cream' },
            { label: 'Ivory', value: 'ivory' },
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
          'e.g. "Our *Newsletter*" — italicize the second word for the Cormorant emphasis treatment.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      editor: richTextEditor,
      admin: { description: 'Short editorial paragraph above the form.' },
    },
    {
      name: 'inputLabel',
      type: 'text',
      defaultValue: 'Email Address:',
      admin: { description: 'Inline label shown next to the email input.' },
    },
    {
      name: 'buttonLabel',
      type: 'text',
      defaultValue: 'SUBSCRIBE',
    },
    {
      name: 'endpoint',
      type: 'text',
      label: 'Submit URL (POST)',
      admin: {
        description:
          'Where the email submission POSTs as JSON `{ email }`. Leave blank to show local success only.',
      },
    },
  ],
}
