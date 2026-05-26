import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * FAQBlock — "Frequently Asked Questions" accordion.
 *
 * Centered editorial header (eyebrow + headline + intro body) followed by a
 * vertical stack of expandable Q&A rows. Each row uses native <details>/
 * <summary> for built-in accessibility and zero-JS toggle.
 *
 * Reusable on any inner page that benefits from an FAQ section.
 */

const richTextEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

export const FAQ: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  labels: {
    singular: 'FAQ',
    plural: 'FAQ blocks',
  },
  fields: [
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
        description: 'e.g. "Frequently Asked *Questions*" — italicize the second word.',
      },
    },
    {
      name: 'intro',
      type: 'richText',
      editor: richTextEditor,
      admin: {
        description: 'Short editorial paragraph below the headline. Optional.',
      },
    },
    {
      name: 'items',
      type: 'array',
      label: 'Questions',
      minRows: 1,
      required: true,
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'answer',
          type: 'richText',
          required: true,
          editor: richTextEditor,
        },
      ],
    },
  ],
}
