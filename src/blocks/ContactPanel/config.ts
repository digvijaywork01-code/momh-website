import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * ContactPanelBlock — 50/50 split: full-bleed image on one side, a
 * coloured panel on the other containing the MOMH contact details
 * (logo + headline + body + address + phone + email with icons).
 *
 * Shares the half-image/half-panel pattern with `NewsletterFeature`
 * but the right column carries CONTACT INFO (not a signup form). Used
 * at the bottom of `/personal-consultation` per the PDF.
 *
 * Reusable for any "find us / contact us" section across the site.
 */

const richTextEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

export const ContactPanel: Block = {
  slug: 'contactPanel',
  interfaceName: 'ContactPanelBlock',
  labels: {
    singular: 'Contact Panel',
    plural: 'Contact Panel blocks',
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
          defaultValue: 'maroon',
          options: [
            { label: 'Maroon', value: 'maroon' },
            { label: 'Emerald', value: 'emerald' },
            { label: 'Black', value: 'black' },
            { label: 'Cream', value: 'cream' },
            { label: 'Ivory', value: 'ivory' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'showLogo',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show MOMH monogram in top-right of panel',
    },
    {
      name: 'headline',
      type: 'richText',
      required: true,
      editor: richTextEditor,
      admin: {
        description:
          'e.g. "Museum of *Meenakari* Heritage" — italicize the second word.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      editor: richTextEditor,
      admin: { description: 'Short helper paragraph above the contact list.' },
    },
    {
      name: 'address',
      type: 'richText',
      editor: richTextEditor,
      admin: { description: 'Multi-line address; renders next to a pin icon.' },
    },
    {
      name: 'phone',
      type: 'text',
      admin: { description: 'e.g. "+91 6377 490 417". Renders next to a phone icon.' },
    },
    {
      name: 'email',
      type: 'text',
      admin: { description: 'e.g. "info@momhindia.org". Renders next to an envelope icon.' },
    },
  ],
}
