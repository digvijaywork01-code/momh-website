import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * EditorialSplitBlock — the workhorse of the MOMH home page.
 *
 * Renders a 60/40 split: a single image on one side, a content column on the
 * other with eyebrow, optional decorative icon at top (left/center/right),
 * headline (with inline italic emphasis), body, optional featured line, and
 * an italic CTA with red-circle arrow.
 *
 * Used for 7 PDF sections: About MoMH (p4), The Art of Craftsmanship (p5),
 * The Architecture (p6), An Era of Enamel (p7), Explore Our Collection (p8),
 * Explore Gallery (p9), Craft Your Jewellery With Us (p10).
 *
 * The Events section (p7) uses the same block with a composite image of the
 * 4×4 enamel-tile grid and the `featuredLine` field for "Upcoming:"
 * preamble. The Collection section (p8) uses `featuredLine` for "Featured
 * story:" and `ctaArrowPosition` set to "left".
 */

export const EditorialSplit: Block = {
  slug: 'editorialSplit',
  interfaceName: 'EditorialSplitBlock',
  labels: {
    singular: 'Editorial Split',
    plural: 'Editorial Split blocks',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: { width: '60%' },
        },
        {
          name: 'imagePosition',
          type: 'select',
          required: true,
          defaultValue: 'right',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
          admin: { width: '40%' },
        },
      ],
    },
    {
      type: 'row',
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
            { label: 'Navy', value: 'navy' },
          ],
          admin: { width: '50%' },
        },
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
              'White gap to render ABOVE this panel. Default `none` keeps the home-page edge-to-edge layout. Use `sm` between stacked panels (e.g. /thank-you) to give them air.',
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
              'White gap to render BELOW this panel. Use on the LAST panel before the footer to give the page room to breathe before the global chrome.',
          },
        },
        {
          name: 'iconPosition',
          type: 'select',
          required: true,
          defaultValue: 'left',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
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
      label: 'Decorative icon (top of content column)',
      admin: {
        description:
          'Optional small line-art icon (fish, bird, phoenix, floral, etc.). SVG preferred.',
      },
    },
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Eyebrow (italic, above headline)',
      admin: {
        description: 'e.g. "Form & Foundation", "About MoMH", "Collection".',
      },
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
          'Display headline. Italicize key words (Cmd/Ctrl+I) for the Cormorant italic emphasis pattern.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
    {
      name: 'featuredLine',
      type: 'richText',
      label: 'Featured line (optional preamble above CTA)',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
      admin: {
        description:
          'Optional. Used for "Upcoming: An Era of Enamel…" or "Featured story: The Royal Roots…". Italicize the preamble label.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'ctaLabel',
          type: 'text',
          label: 'CTA label',
          admin: {
            description: 'e.g. "Explore Our Story", "Book Your Consultation".',
            width: '60%',
          },
        },
        {
          name: 'ctaArrowPosition',
          type: 'select',
          defaultValue: 'right',
          options: [
            { label: 'Right', value: 'right' },
            { label: 'Left', value: 'left' },
          ],
          admin: {
            width: '40%',
            condition: (_, sd) => !sd?.ctaStyle || sd.ctaStyle === 'arrow',
          },
        },
      ],
    },
    {
      name: 'ctaStyle',
      type: 'select',
      defaultValue: 'arrow',
      options: [
        { label: 'Italic CTA with red arrow (default — editorial)', value: 'arrow' },
        { label: 'Filled red rectangular button', value: 'filled-red' },
        { label: 'Outlined rectangular button', value: 'outlined' },
      ],
      admin: {
        description:
          'Visual treatment for the CTA. Default keeps the home-page editorial arrow style; filled/outlined match the Plan Your Visit + Museum Guidelines panel buttons.',
        condition: (_, sd) => Boolean(sd?.ctaLabel),
      },
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
    {
      name: 'contactEmail',
      type: 'text',
      admin: {
        description:
          'Optional — renders below the CTA as "Email: address". Used for "Have a Question?" style panels (Museum Guidelines p5).',
      },
    },
  ],
}
