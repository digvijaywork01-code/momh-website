import type { Block } from 'payload'

/**
 * PressGridBlock — the press coverage grid from the Press PDF (/press).
 *
 * One block holds every press item: an uploaded photo, the date the
 * publication gives the piece, the publication's name, our own short summary
 * and the address of the article. The cards are shown newest first by date
 * (or in the order entered), so a new item can be added anywhere in the list.
 *
 * Photos: portrait, 0.72 wide to 1 tall (e.g. 1568 x 2178). The photo is
 * fitted inside its frame, never cropped; a photo of that shape fills it.
 */
export const PressGrid: Block = {
  slug: 'pressGrid',
  interfaceName: 'PressGridBlock',
  labels: {
    singular: 'Press Grid',
    plural: 'Press Grid blocks',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'order',
          type: 'select',
          required: true,
          defaultValue: 'newest',
          label: 'Order',
          options: [
            { label: 'Newest first (by date)', value: 'newest' },
            { label: 'As entered below', value: 'manual' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'linkLabel',
          type: 'text',
          required: true,
          defaultValue: 'Read the full story',
          label: 'Link text',
          admin: {
            width: '50%',
            description: 'Shown in capitals under every card. Type it in normal case.',
          },
        },
      ],
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Press item', plural: 'Press items' },
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/blocks/PressGrid/RowLabel#RowLabel',
        },
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: {
            description:
              'Portrait photo, 0.72 wide to 1 tall (e.g. 1568 x 2178). It is fitted, never cropped. Give it alt text in the media library.',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'date',
              type: 'date',
              required: true,
              admin: {
                width: '35%',
                description: 'The date the publication gives the piece.',
                date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' },
              },
            },
            {
              name: 'publication',
              type: 'text',
              required: true,
              admin: { width: '65%', description: 'e.g. Condé Nast Traveller India' },
            },
          ],
        },
        {
          name: 'summary',
          type: 'textarea',
          required: true,
          admin: { description: 'Our own short summary of the piece (about 15 to 25 words).' },
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          label: 'Article address',
          // A field with its own validate skips Payload's built-in `required`
          // check, so an empty value is refused here too.
          validate: (value: string | null | undefined) =>
            value && /^https:\/\/\S+$/.test(value.trim())
              ? true
              : 'Paste the full address of the article, starting with https://',
          admin: { description: "The publication's own page for the piece. Opens in a new tab." },
        },
      ],
    },
  ],
}
