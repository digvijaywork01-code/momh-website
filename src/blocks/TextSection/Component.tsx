import React from 'react'
import {
  RichText as ConvertRichText,
  type JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react'

import type { TextSectionBlock as TextSectionBlockProps } from '@/payload-types'

import { jsxConverters } from '@/components/RichText'

/** Stable in-page anchor from the heading text: "Children's Data" -> "childrens-data". */
const toAnchor = (text: string): string =>
  text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * The site's rich-text converters, with three additions:
 *  - the space before a colon ("Label : text") is made non-breaking;
 *  - text the editor coloured "Red" (TextState color: red, stored on the text
 *    node as `$: { color: 'red' }`) is wrapped in a span, styled in
 *    globals.css. The shared text converter ignores text state.
 *  - an EMPTY paragraph is rendered with a class. An empty paragraph is how
 *    an editor asks for one extra blank line, and CSS alone cannot tell
 *    `<p><br></p>` from a paragraph that merely contains a line break (text
 *    nodes are invisible to selectors).
 */
const converters: JSXConvertersFunction = (args) => {
  const base = jsxConverters(args)
  const { paragraph, text } = base
  return {
    ...base,
    text: (props) => {
      // "Label : text" — make the space before a colon non-breaking, so a
      // line can never start with the colon.
      const glued = props.node.text.includes(' :')
        ? { ...props, node: { ...props.node, text: props.node.text.replace(/ (?=:)/g, '\u00a0') } }
        : props
      const rendered = typeof text === 'function' ? text(glued) : text
      const state = (props.node as { $?: { color?: string } }).$
      return state?.color === 'red' ? <span className="text-section-red">{rendered}</span> : rendered
    },
    paragraph: (props) =>
      props.node.children?.length ? (
        typeof paragraph === 'function' ? paragraph(props) : paragraph
      ) : (
        <p className="text-section-gap" aria-hidden="true">
          <br />
        </p>
      ),
  }
}

/**
 * Long-form text section (Privacy Policy PDF layout, site typography).
 *
 * Type is the live site's: heading = `editorial-display text-display` in
 * brand red, body = `font-body text-body`. Layout comes from the PDF:
 * the text column is 1140pt of a 1920pt artboard (59.39vw) from lg up,
 * narrow bullet lists 837pt (43.61vw), both frozen at their 1920 size on
 * wider screens, where the type stops growing. The column never drops
 * below 672px (max-w-2xl, SectionIntro's own body width), so on tablets and
 * small laptops it lines up with the intro above it. Phones get 36px side
 * margins.
 *
 * Paragraph spacing, bullets, list widths, justification and link styles
 * are in globals.css under `.text-section`, keyed on the data attributes
 * below, because they style Lexical's rendered markup.
 */
export const TextSectionBlock: React.FC<TextSectionBlockProps> = ({
  heading,
  body,
  listWidth = 'full',
  justifyLastLine = 'center',
}) => {
  return (
    <section className="text-section w-full px-9 md:px-12 lg:px-0 text-ink">
      <div className="mx-auto w-full max-w-2xl lg:max-w-[min(max(672px,59.39vw),1140.3px)]">
        {heading && (
          <h2
            id={toAnchor(heading)}
            className="text-section-heading editorial-display text-display text-brand-red text-center"
          >
            {heading}
          </h2>
        )}
        {body && (
          <div
            className="text-section-body font-body text-body"
            data-list-width={listWidth || 'full'}
            data-last-line={justifyLastLine || 'center'}
          >
            <ConvertRichText
              data={body}
              converters={converters}
              className="payload-richtext max-w-none"
            />
          </div>
        )}
      </div>
    </section>
  )
}

export default TextSectionBlock
