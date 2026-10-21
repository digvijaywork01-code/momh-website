import type { Block } from 'payload'

/**
 * SiteMapBlock — the page tree from the Sitemap PDF (/sitemap).
 *
 * A red house at the top, one thin line with an arrow down to each column,
 * and in every column a red icon over a list of links. Editors manage only
 * the columns and their links; the house, the lines, the arrows and every
 * size are drawn by the block, so the design cannot be broken from the admin.
 *
 * Links are plain addresses, not page references: the site's routes are fixed
 * folders, and a link may point at a page that is not built yet. Such a link
 * shows the site's "page not found" until that page goes live, then opens it.
 */
export const SiteMap: Block = {
  slug: 'siteMap',
  interfaceName: 'SiteMapBlock',
  labels: {
    singular: 'Site Map',
    plural: 'Site Map blocks',
  },
  fields: [
    {
      name: 'columns',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 4,
      labels: { singular: 'Column', plural: 'Columns' },
      admin: {
        description: 'One column per group of pages, left to right (up to 4).',
        components: {
          RowLabel: '@/blocks/SiteMap/RowLabel#ColumnRowLabel',
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              admin: {
                width: '50%',
                description:
                  'Not shown on the page; screen readers announce it before the links. e.g. "About".',
              },
            },
            {
              name: 'icon',
              type: 'select',
              required: true,
              options: [
                { label: 'Info ("i" in a circle)', value: 'info' },
                { label: 'Support (telephone and speech bubble)', value: 'support' },
                { label: 'Visit (arrow in a circle)', value: 'visit' },
              ],
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'links',
          type: 'array',
          required: true,
          minRows: 1,
          labels: { singular: 'Link', plural: 'Links' },
          admin: {
            initCollapsed: true,
            components: {
              RowLabel: '@/blocks/SiteMap/RowLabel#LinkRowLabel',
            },
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                  admin: { width: '50%', description: 'e.g. Our Story' },
                },
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                  label: 'Address',
                  // A field with its own validate skips Payload's built-in
                  // `required` check, so an empty value is refused here too.
                  validate: (value: string | null | undefined) =>
                    value && /^(\/(?!\/)\S*|https:\/\/\S+)$/.test(value.trim())
                      ? true
                      : 'Start with / for a page on this website (e.g. /about), or https:// for another website',
                  admin: {
                    width: '50%',
                    description:
                      'e.g. /about. A page that is not built yet shows "page not found" until it goes live.',
                  },
                },
              ],
            },
            {
              name: 'caption',
              type: 'text',
              admin: {
                description:
                  'Optional small grey line under the link, e.g. "The Museum in the Press". Leave empty for most links.',
              },
            },
          ],
        },
      ],
    },
  ],
}
