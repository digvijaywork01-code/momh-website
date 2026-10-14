import type { Block } from 'payload'

/**
 * DividerBlock — the gold lotus ornament from the Privacy Policy PDF:
 * a tapered gold hairline, a lotus motif, a tapered gold hairline.
 *
 * Settings:
 *  - Show on: all devices, desktop only (1024px and wider) or mobile &
 *    tablet only (under 1024px).
 *  - Spacing per device, shown for the devices the divider appears on:
 *    Large = an even gap above and below the art (default: 48px on phones,
 *    56px on tablets, 56px rising to 64px at 1400px and frozen at 87.8px
 *    from 1920px on desktop; deliberately tighter than the PDF), Medium =
 *    3/4 of it, Small = 1/2, None = no space of its own.
 * The defaults are what the Privacy Policy page uses. The gap is measured
 * against a Text Section (or a SectionIntro with "tight bottom") above; under
 * other blocks the divider never overlaps, but the gap can be larger.
 */

const spacingOptions = [
  { label: 'Large (Privacy Policy design)', value: 'large' },
  { label: 'Medium', value: 'medium' },
  { label: 'Small', value: 'small' },
  { label: 'None', value: 'none' },
]

export const Divider: Block = {
  slug: 'divider',
  interfaceName: 'DividerBlock',
  labels: {
    singular: 'Divider',
    plural: 'Divider blocks',
  },
  fields: [
    {
      name: 'showOn',
      type: 'select',
      required: true,
      defaultValue: 'all',
      label: 'Show on',
      options: [
        { label: 'All devices', value: 'all' },
        { label: 'Desktop only (1024px and wider)', value: 'desktop' },
        { label: 'Mobile & tablet only (under 1024px)', value: 'mobile' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'desktopSpacing',
          type: 'select',
          required: true,
          defaultValue: 'large',
          label: 'Desktop spacing',
          options: spacingOptions,
          admin: {
            description: 'Measured from a Text Section above. Large is the Privacy Policy design.',
            width: '50%',
            condition: (_, siblingData) => siblingData?.showOn !== 'mobile',
          },
        },
        {
          name: 'mobileSpacing',
          type: 'select',
          required: true,
          defaultValue: 'large',
          label: 'Mobile & tablet spacing',
          options: spacingOptions,
          admin: {
            description: 'Measured from a Text Section above. Large is the Privacy Policy design.',
            width: '50%',
            condition: (_, siblingData) => siblingData?.showOn !== 'desktop',
          },
        },
      ],
    },
  ],
}
