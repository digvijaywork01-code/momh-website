import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * SectionIntroBlock — centered eyebrow + headline + body.
 *
 * Used for the "Plan Your Visit" intro on PDF page 2. Centered max-width
 * column, italic eyebrow above a display headline (with italic emphasis on
 * key words via Lexical), short editorial body underneath. Optional hairline
 * divider above the eyebrow.
 *
 * Reusable for any centered section intro on inner pages.
 */

const richTextEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

export const SectionIntro: Block = {
  slug: 'sectionIntro',
  interfaceName: 'SectionIntroBlock',
  labels: {
    singular: 'Section Intro',
    plural: 'Section Intro blocks',
  },
  fields: [
    {
      type: 'row',
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
            { label: 'Black', value: 'black' },
            { label: 'Emerald', value: 'emerald' },
            { label: 'Maroon', value: 'maroon' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'showTopDivider',
          type: 'checkbox',
          defaultValue: false,
          label: 'Show hairline divider above eyebrow',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'tightBottom',
      type: 'checkbox',
      defaultValue: false,
      label: 'Tighten bottom padding',
      admin: {
        description:
          'When the next block has its own substantial top padding (e.g. a form or info panel), halve the SectionIntro bottom padding so the gap between the intro and the next block doesn’t feel too cavernous. Leave OFF when the next block is a full-bleed image / banner.',
      },
    },
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Eyebrow (italic, above headline)',
      admin: {
        description: 'e.g. "Events At MoMH", "About MoMH". Optional.',
      },
    },
    {
      name: 'headline',
      type: 'richText',
      required: true,
      editor: richTextEditor,
      admin: {
        description:
          'Display headline. Italicize key words (Cmd/Ctrl+I) for the Cormorant emphasis pattern, e.g. "Plan Your *Visit*".',
      },
    },
    {
      name: 'body',
      type: 'richText',
      editor: richTextEditor,
      admin: {
        description: 'Optional short editorial paragraph below the headline.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'ctaLabel',
          type: 'text',
          label: 'CTA label (optional)',
          admin: {
            description:
              'e.g. "Book Your Personal Consultation". Leaving this blank hides the CTA entirely.',
            width: '60%',
          },
        },
        {
          name: 'ctaStyle',
          type: 'select',
          defaultValue: 'filled-red',
          options: [
            { label: 'Filled red rectangular button', value: 'filled-red' },
            { label: 'Outlined rectangular button', value: 'outlined' },
            { label: 'Italic CTA with red arrow', value: 'arrow' },
          ],
          admin: {
            description: 'Visual treatment for the CTA below the body.',
            width: '40%',
            condition: (_, sd) => Boolean(sd?.ctaLabel),
          },
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
  ],
}
