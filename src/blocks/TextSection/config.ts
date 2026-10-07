import type { Block } from 'payload'

import {
  AlignFeature,
  FixedToolbarFeature,
  IndentFeature,
  InlineToolbarFeature,
  OrderedListFeature,
  TextStateFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * TextSectionBlock — a centred long-form text section: an optional red
 * heading over rich text with paragraphs, bold run-in labels, bullet
 * lists (nested lists render as a narrower centred column), links and
 * per-paragraph alignment.
 *
 * Built for the Privacy Policy PDF; usable for any legal or long-read
 * page (Terms, Cookies, Accessibility). Pair with the Divider block.
 *
 * Editing notes:
 *  - Alignment is per paragraph (toolbar): Centre or Justify. Left is the
 *    default, so a paragraph with no alignment set renders left-aligned.
 *  - An empty paragraph between two paragraphs adds one extra blank line.
 *  - Red highlight: select the words and pick Red in the text colour menu.
 *  - Indent a bullet (Tab, anywhere in the line) to nest it; nested lists
 *    sit in the narrow centred column. Numbered lists are supported too.
 */

const bodyEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    UnorderedListFeature(),
    // Lexical's list node imports <ol> on paste regardless, so numbered
    // lists are enabled (and styled) rather than silently turned into bullets.
    OrderedListFeature(),
    AlignFeature(),
    // Indent only list items (nesting). Indented paragraphs would push
    // text off the centred column, so paragraphs cannot be indented.
    // disableTabNode: Tab always nests / un-nests a bullet instead of typing a
    // tab character, which the site would collapse to a single space.
    IndentFeature({ disabledNodes: ['paragraph'], disableTabNode: true }),
    // Red highlight, as in the Privacy Policy PDF: select text, then pick
    // "Red" from the toolbar's text colour menu. Saved on the text (no schema
    // change); the site renders it in brand red via TextSection's converter.
    TextStateFeature({
      state: {
        color: {
          red: { label: 'Red', css: { color: '#F1001C' } },
        },
      },
    }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

export const TextSection: Block = {
  slug: 'textSection',
  interfaceName: 'TextSectionBlock',
  labels: {
    singular: 'Text Section',
    plural: 'Text Section blocks',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      admin: {
        description: 'Rendered centred in brand red. Leave empty for a section without a heading.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
      editor: bodyEditor,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'listWidth',
          type: 'select',
          required: true,
          defaultValue: 'full',
          label: 'Bullet list width',
          options: [
            { label: 'Full column width', value: 'full' },
            { label: 'Narrow centred column', value: 'narrow' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'justifyLastLine',
          type: 'select',
          required: true,
          defaultValue: 'center',
          label: 'Last line of justified paragraphs',
          options: [
            { label: 'Centred', value: 'center' },
            { label: 'Left', value: 'left' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
  ],
}
