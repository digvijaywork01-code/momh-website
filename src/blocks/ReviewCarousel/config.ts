import type { Block } from 'payload'

/**
 * ReviewCarouselBlock — visitor reviews, one at a time (Testimonials page,
 * /testimonials).
 *
 * One block holds an optional heading and every review: the words, the name
 * as its author agreed it, and a short line saying where and when it was
 * posted. The reviews show in the order entered, one at a time on a light
 * band, with red quote marks at the start and end of each (added by the page,
 * so editors never type them).
 */
export const ReviewCarousel: Block = {
  slug: 'reviewCarousel',
  interfaceName: 'ReviewCarouselBlock',
  labels: {
    singular: 'Review Carousel',
    plural: 'Review Carousel blocks',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      admin: {
        description: 'Shown above the reviews in the red heading style, e.g. "Visitor Reviews". Leave empty for none.',
      },
    },
    {
      name: 'reviews',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Review', plural: 'Reviews' },
      admin: {
        initCollapsed: true,
        description: 'Shown one at a time, in this order. Show a review only with its author’s written agreement to the exact words and name.',
        components: {
          RowLabel: '@/blocks/ReviewCarousel/RowLabel#RowLabel',
        },
      },
      fields: [
        {
          name: 'quote',
          type: 'textarea',
          required: true,
          admin: {
            description:
              'The review in the words its author approved. Do not type quote marks: they are added. Type […] where words are left out.',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'author',
              type: 'text',
              required: true,
              admin: { width: '40%', description: 'As the author agreed, e.g. "Sandeep A."' },
            },
            {
              name: 'details',
              type: 'text',
              admin: { width: '60%', description: 'e.g. "review on Google, a year ago"' },
            },
          ],
        },
      ],
    },
  ],
}
