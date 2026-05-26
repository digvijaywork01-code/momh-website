import type { Block } from 'payload'

/**
 * ImageBannerBlock — full-bleed photographic banner.
 *
 * Used for the haveli exterior shots at the top + bottom of the Plan Your
 * Visit page. No text overlay. Sets header theme on entry so the nav bar
 * stays legible against dark/light imagery.
 */

export const ImageBanner: Block = {
  slug: 'imageBanner',
  interfaceName: 'ImageBannerBlock',
  labels: {
    singular: 'Image Banner',
    plural: 'Image Banner blocks',
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
          name: 'headerTheme',
          type: 'select',
          required: true,
          defaultValue: 'dark',
          options: [
            { label: 'Dark (nav becomes light to read on dark image)', value: 'dark' },
            { label: 'Light (nav becomes dark to read on light image)', value: 'light' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'height',
          type: 'select',
          required: true,
          defaultValue: 'screen',
          options: [
            { label: 'Full screen (100vh)', value: 'screen' },
            { label: 'Tall (80vh)', value: 'tall' },
            { label: 'Medium (60vh)', value: 'medium' },
            {
              label: "Natural — match image's own aspect (no crop)",
              value: 'natural',
            },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Optional caption (rendered below the image)',
    },
  ],
}
