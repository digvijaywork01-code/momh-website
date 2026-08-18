import type { Block } from 'payload'

/**
 * MediaBandBlock — a single image or video panel, sized and aligned within
 * the page, optionally framed.
 *
 * Built for The Founder's Vision page (designer PDF), which needs three
 * things no existing block could express:
 *   - an image band at 60% width flush LEFT, with white beside it
 *   - the same flush RIGHT
 *   - a centred 70%-wide video panel on black with a 1px maroon hairline
 *
 * `imageBanner` is full-bleed only and `editorialSplit` always renders two
 * columns with required text, so neither fits. This block is deliberately
 * generic (width x align x aspect x frame) so future pages get the same
 * vocabulary rather than another one-off.
 *
 * NOTE ON `aspectRatio`: Payload's sharp pipeline records width/height for
 * IMAGES only — a video upload has both columns null (verified against the
 * live media collection). So 'natural' cannot be derived for video, and any
 * video panel must state its ratio explicitly. Images should stay on
 * 'natural', which is also what keeps them from ever being cropped.
 */

export const MediaBand: Block = {
  slug: 'mediaBand',
  interfaceName: 'MediaBandBlock',
  labels: {
    singular: 'Media Band',
    plural: 'Media Band blocks',
  },
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Image or video',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'width',
          type: 'select',
          required: true,
          defaultValue: 'three-fifths',
          options: [
            { label: 'Half (50%)', value: 'half' },
            { label: 'Three-fifths (60%)', value: 'three-fifths' },
            { label: 'Seven-tenths (70%)', value: 'seven-tenths' },
            { label: 'Full bleed (100%)', value: 'full' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'align',
          type: 'select',
          required: true,
          defaultValue: 'center',
          options: [
            { label: 'Left (flush to page edge)', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right (flush to page edge)', value: 'right' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'aspectRatio',
          type: 'select',
          required: true,
          defaultValue: 'natural',
          options: [
            { label: "Natural — the file's own ratio (images only)", value: 'natural' },
            { label: 'Square (1:1)', value: 'square' },
            { label: 'Widescreen (16:9)', value: 'wide' },
          ],
          admin: {
            width: '50%',
            description:
              'Videos MUST pick an explicit ratio — Payload does not record dimensions for video files, so "Natural" has nothing to read.',
          },
        },
        {
          name: 'frame',
          type: 'select',
          required: true,
          defaultValue: 'none',
          options: [
            { label: 'No frame', value: 'none' },
            { label: 'Hairline (1px maroon)', value: 'hairline' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'panelBackground',
          type: 'select',
          required: true,
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Black (letterbox behind the media)', value: 'black' },
          ],
          admin: { width: '33%' },
        },
        {
          name: 'topSpacing',
          type: 'select',
          required: true,
          defaultValue: 'md',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
          admin: { width: '33%' },
        },
        {
          name: 'bottomSpacing',
          type: 'select',
          required: true,
          defaultValue: 'md',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
          admin: { width: '33%' },
        },
      ],
    },
  ],
}
