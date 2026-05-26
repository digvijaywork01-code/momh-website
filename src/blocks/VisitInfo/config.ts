import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * VisitInfoBlock — "Getting Here" map + visit details panel.
 *
 * 60/40 split: map screenshot on one side, content panel on the other with
 * address, contact email, two CTAs (Get Directions + Book An Appointment),
 * and a structured opening-hours table.
 *
 * The map is a static image upload (not an iframe) — keeps first paint cheap,
 * no third-party JS, and lets the editor swap in a higher-quality screenshot
 * any time. `mapImageLink` makes the image clickable so visitors who tap can
 * still open the actual map.
 */

const richTextEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

export const VisitInfo: Block = {
  slug: 'visitInfo',
  interfaceName: 'VisitInfoBlock',
  labels: {
    singular: 'Visit Info (map + hours)',
    plural: 'Visit Info blocks',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'mapPosition',
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
      name: 'mapImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Map screenshot',
      admin: {
        description:
          'Static map image. Upload a snapshot from Google Maps showing the museum location.',
      },
    },
    {
      name: 'mapImageLink',
      type: 'text',
      label: 'Map click-through URL (optional)',
      admin: {
        description:
          'When set, the map image becomes a clickable link. Typically a Google Maps URL pointing at the museum address.',
      },
    },
    {
      name: 'headline',
      type: 'richText',
      required: true,
      editor: richTextEditor,
      admin: {
        description: 'e.g. "Getting *Here*" — italicize the second word.',
      },
    },
    {
      name: 'address',
      type: 'richText',
      required: true,
      editor: richTextEditor,
      admin: {
        description: 'Multi-line address. Each address line on its own paragraph.',
      },
    },
    {
      name: 'helperText',
      type: 'text',
      admin: {
        description:
          'Short helper line above the email. e.g. "Looking for something specific? Our team is happy to help."',
      },
    },
    {
      name: 'contactEmail',
      type: 'text',
      admin: { description: 'e.g. info@momhindia.org' },
    },
    {
      name: 'ctas',
      type: 'array',
      label: 'Buttons (max 2)',
      maxRows: 2,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
              admin: { width: '40%' },
            },
            {
              name: 'href',
              type: 'text',
              required: true,
              label: 'URL or /path',
              admin: { width: '50%' },
            },
            {
              name: 'newTab',
              type: 'checkbox',
              defaultValue: false,
              admin: { width: '10%' },
            },
          ],
        },
      ],
    },
    {
      name: 'hours',
      type: 'array',
      label: 'Opening hours (one row per day)',
      minRows: 1,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'day',
              type: 'text',
              required: true,
              admin: { width: '40%', description: 'e.g. "Monday"' },
            },
            {
              name: 'hours',
              type: 'text',
              admin: { width: '40%', description: 'e.g. "11:00 AM to 6:00 PM"' },
            },
            {
              name: 'isClosed',
              type: 'checkbox',
              defaultValue: false,
              label: 'Closed',
              admin: { width: '20%' },
            },
          ],
        },
      ],
    },
    {
      name: 'hoursNote',
      type: 'textarea',
      label: 'Hours footnote',
      admin: {
        description:
          'e.g. "Closed on select Indian public holidays. Please confirm before your visit."',
      },
    },
  ],
}
