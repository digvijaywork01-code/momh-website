import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * QuestionPanelBlock — 50/50 split with image on one side and a
 * coloured panel on the other carrying a small "have a question" /
 * inquiry vignette.
 *
 * Specific to PDF p5 (Museum Guidelines, bottom panel) where the
 * content layout differs from the editorial split / promo panel
 * pattern used elsewhere on the page:
 *
 *   - The icon sits ABOVE the headline (not in a corner)
 *   - All content is LEFT-aligned at the same x position
 *   - The whole content stack sits at the INNER edge of the panel
 *     (toward the image seam at 50%vw), with comfortable left
 *     padding — NOT at the outer viewport edge like Gallery / Visit
 *   - Content is vertically centred in the panel
 *   - No CTA button — just an "Email: address" link
 *
 * Reusable for any "small contact callout" pattern across the site
 * (research enquiry, group programmes, private viewings, etc.).
 */

const richTextEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

export const QuestionPanel: Block = {
  slug: 'questionPanel',
  interfaceName: 'QuestionPanelBlock',
  labels: {
    singular: 'Question Panel',
    plural: 'Question Panel blocks',
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
          defaultValue: 'cream',
          options: [
            { label: 'Cream', value: 'cream' },
            { label: 'Ivory', value: 'ivory' },
            { label: 'Maroon', value: 'maroon' },
            { label: 'Emerald', value: 'emerald' },
            { label: 'Black', value: 'black' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'topSpacing',
          type: 'select',
          required: true,
          defaultValue: 'none',
          options: [
            { label: 'None (edge-to-edge, default)', value: 'none' },
            { label: 'Small (24px white gap above)', value: 'sm' },
            { label: 'Medium (40px)', value: 'md' },
            { label: 'Large (64px)', value: 'lg' },
          ],
          admin: {
            width: '50%',
            description:
              'White gap to render ABOVE this panel. Mirrors the EditorialSplit `topSpacing` field — use to open up air between stacked panels.',
          },
        },
        {
          name: 'bottomSpacing',
          type: 'select',
          required: true,
          defaultValue: 'none',
          options: [
            { label: 'None (edge-to-edge, default)', value: 'none' },
            { label: 'Small (24px white gap below)', value: 'sm' },
            { label: 'Medium (40px)', value: 'md' },
            { label: 'Large (64px)', value: 'lg' },
          ],
          admin: {
            width: '50%',
            description:
              'White gap to render BELOW this panel. Use on the LAST panel before the footer so the page doesn\'t slam straight into the global chrome.',
          },
        },
      ],
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      label: 'Decorative icon (optional)',
      admin: {
        description:
          'Small line-art icon (phoenix, leaf, bird, etc.) shown above the headline at the same left edge.',
      },
    },
    {
      name: 'headline',
      type: 'richText',
      required: true,
      editor: richTextEditor,
      admin: {
        description:
          'e.g. "Have a *Question?*" — italicize the second word for the Cormorant + red emphasis.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      editor: richTextEditor,
    },
    {
      name: 'email',
      type: 'text',
      admin: {
        description:
          'Optional. Rendered below body as "Email: address" with the address as a mailto link.',
      },
    },
  ],
}
