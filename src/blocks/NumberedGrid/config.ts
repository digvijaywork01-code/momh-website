import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * NumberedGridBlock — a row/grid/carousel of images, each optionally carrying
 * a small number and caption, and optionally sitting beside a text column.
 *
 * Built for The Art & Craftsmanship page (designer PDF), which needs four
 * variations no existing block could express:
 *   - a 3-up square grid with "01 / FLUX" captions, sitting BESIDE a text column
 *   - a 2-up grid of the six making-of steps (those images carry their labels
 *     burned into the artwork, so their number/caption fields stay empty)
 *   - a 2-up plain image row with no captions at all
 *   - a 7-item techniques CAROUSEL showing 3 cards per slide
 *
 * Why not CardGrid: it caps at 6 items (techniques has 7), has no number
 * field, forces a required `summary`, is a full-viewport snap panel, and below
 * `lg` it stops being a grid entirely and becomes a one-card carousel — which
 * would destroy every grid on this page on mobile.
 *
 * Why not Carousel: its headline/body are required and its rows carry only
 * image + alt, with nowhere to put a number or caption.
 */

const richTextEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

export const NumberedGrid: Block = {
  slug: 'numberedGrid',
  interfaceName: 'NumberedGridBlock',
  labels: {
    singular: 'Numbered Grid',
    plural: 'Numbered Grid blocks',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'layout',
          type: 'select',
          required: true,
          defaultValue: 'grid',
          options: [
            { label: 'Grid — all items visible at once', value: 'grid' },
            { label: 'Carousel — swipe through, several per slide', value: 'carousel' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'columns',
          type: 'select',
          required: true,
          defaultValue: '3',
          options: [
            { label: '2', value: '2' },
            { label: '3', value: '3' },
            { label: '4', value: '4' },
          ],
          admin: {
            width: '50%',
            description: 'Grid columns, or cards per slide in carousel mode.',
          },
        },
      ],
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Item', plural: 'Items' },
      admin: {
        description:
          'Leave Number and Caption blank when the artwork already carries its own label (as the making-of step images do).',
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
              name: 'number',
              type: 'text',
              label: 'Number',
              admin: { width: '30%', description: 'e.g. "01". Renders small, italic, in brand red.' },
            },
            {
              name: 'caption',
              type: 'text',
              label: 'Caption',
              admin: { width: '70%', description: 'e.g. "FLUX", "Painted Enamel".' },
            },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'maxWidth',
          type: 'select',
          required: true,
          defaultValue: 'wide',
          label: 'Grid width',
          options: [
            { label: 'Edge-to-edge mosaic (no side padding, tight gutter)', value: 'bleed' },
            { label: 'Full width of the padded section', value: 'full' },
            { label: 'Wide (≈88%) — 3-up grids', value: 'wide' },
            { label: 'Medium (≈79%) — a pair of large images', value: 'medium' },
            { label: 'Narrow (≈67%) — a tall 2-column grid', value: 'narrow' },
          ],
          admin: {
            width: '50%',
            description: 'Ignored when a text column is set — the grid then fills its half.',
            condition: (_, sd) => !sd?.textPosition || sd.textPosition === 'none',
          },
        },
        {
          name: 'itemAspect',
          type: 'select',
          required: true,
          defaultValue: 'square',
          label: 'Tile shape',
          options: [
            { label: 'Square (1:1)', value: 'square' },
            { label: 'Portrait (3:5)', value: 'portrait' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'textPosition',
      type: 'select',
      required: true,
      defaultValue: 'none',
      options: [
        { label: 'None — grid spans the page', value: 'none' },
        { label: 'Text column on the LEFT, grid right', value: 'left' },
        { label: 'Text column on the RIGHT, grid left', value: 'right' },
      ],
      admin: {
        description:
          'When set, the grid takes one half of the section and a heading + body column takes the other.',
      },
    },
    {
      name: 'headline',
      type: 'richText',
      editor: richTextEditor,
      admin: {
        condition: (_, sd) => sd?.textPosition && sd.textPosition !== 'none',
        description:
          'Section heading. Type it in the case you want. Italicise for an italic heading; bold a word to make it brand red.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      editor: richTextEditor,
      admin: { condition: (_, sd) => sd?.textPosition && sd.textPosition !== 'none' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'autoplay',
          type: 'checkbox',
          defaultValue: false,
          label: 'Autoplay the carousel',
          admin: {
            width: '50%',
            condition: (_, sd) => sd?.layout === 'carousel',
          },
        },
        {
          name: 'autoplayInterval',
          type: 'number',
          defaultValue: 5000,
          label: 'Autoplay interval (ms)',
          admin: {
            width: '50%',
            condition: (_, sd) => sd?.layout === 'carousel' && Boolean(sd?.autoplay),
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
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
          admin: { width: '50%' },
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
          admin: { width: '50%' },
        },
      ],
    },
  ],
}
