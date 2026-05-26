import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * HeroBlock — full-bleed image hero with display headline and body line.
 *
 * Matches PDF page 1 of the MOMH landing: dusk haveli image, large display
 * headline with italic emphasis on key words ("*Meenakari*", "*Heart of
 * Jaipur*"), small body line below, and a scroll-down indicator chevron.
 *
 * Slug is `heroBlock` (not `hero`) because the Pages collection already has
 * a top-level `hero` field; using a distinct slug keeps the admin UI clear.
 */

export const Hero: Block = {
  slug: 'heroBlock',
  interfaceName: 'HeroBlock',
  labels: {
    singular: 'Hero (Editorial)',
    plural: 'Hero (Editorial) blocks',
  },
  fields: [
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Background image or video',
      admin: {
        description:
          'Full-bleed media behind the headline. Accepts images OR videos — videos autoplay muted/loop. Dark sources work best.',
      },
    },
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Eyebrow (small text above headline)',
      admin: {
        description: 'Optional. Small uppercase line, e.g. "A House of Sunita Shekhawat Project".',
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
          'Display headline. Italicize specific words (Cmd/Ctrl+I) to apply Cormorant Italic emphasis.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
      label: 'Body line',
      admin: {
        description: 'One- or two-line description under the headline.',
      },
    },
    {
      name: 'showScrollIndicator',
      type: 'checkbox',
      label: 'Show scroll-down indicator',
      defaultValue: true,
    },
  ],
}
