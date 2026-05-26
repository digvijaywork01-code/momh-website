import type { Block } from 'payload'

/**
 * InfoHeroBlock — full-bleed video/image hero with overlaid title, subline,
 * and a row of info cards (each with label, description, and CTA button).
 *
 * Matches PDF page 2 of the MOMH landing: video of the haveli, "Museum
 * Hours" + "Museum Location" cards with red "Book an Appointment" and
 * "Museum Guidelines" buttons stacked on top. Replaces the existing
 * src/components/body/hero.tsx static implementation.
 */

export const InfoHero: Block = {
  slug: 'infoHero',
  interfaceName: 'InfoHeroBlock',
  labels: {
    singular: 'Info Hero',
    plural: 'Info Hero blocks',
  },
  fields: [
    {
      name: 'backgroundMedia',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Background image or video',
      admin: {
        description:
          'Upload a video or image. Videos autoplay muted and loop. The Media component picks the renderer from mimeType.',
      },
    },
    {
      name: 'overlayDarkness',
      type: 'number',
      defaultValue: 40,
      min: 0,
      max: 100,
      label: 'Overlay darkness (%)',
      admin: {
        description: 'Black overlay opacity. Increase for text legibility over bright backgrounds.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'headline',
          type: 'text',
          // Optional: PDF page 2 has no headline overlay; cards alone.
          // Other pages may want one, so the field stays available.
          admin: { width: '50%' },
        },
        {
          name: 'subline',
          type: 'text',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'infoCards',
      type: 'array',
      maxRows: 4,
      labels: { singular: 'Info card', plural: 'Info cards' },
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
              name: 'value',
              type: 'text',
              required: true,
              admin: { width: '60%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'ctaLabel',
              type: 'text',
              admin: { width: '50%' },
            },
            {
              name: 'ctaUrl',
              type: 'text',
              label: 'CTA URL (relative path or absolute)',
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
  ],
}
