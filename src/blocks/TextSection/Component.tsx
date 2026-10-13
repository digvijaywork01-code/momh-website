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
 *    node as `$: { color: 'red' }`) is wrapped in a span, styled below. The
 *    shared text converter ignores text state.
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
 * Styles for the rich text inside a Text Section. The body's paragraphs,
 * lists and links are written by the rich-text renderer, not by this file,
 * so they are styled from the body wrapper with descendant classes
 * (`[&_p+p]:…`). Every value here belongs to this block only. --pp-vw (set
 * on the section) is 1vw, frozen at 19.2px above 1920 where the type stops
 * growing.
 */
const BODY_CLASSES = [
  // Base alignment is LEFT: Lexical writes no style for "left", so a centred
  // wrapper would silently override it. Centre and justify arrive per
  // paragraph from the editor as inline text-align.
  'text-left break-words',
  // One blank line between paragraphs, lists and list items.
  '[&_p+p]:mt-[1.5em] [&_p+ul]:mt-[1.5em] [&_p+ol]:mt-[1.5em] [&_ul+p]:mt-[1.5em] [&_ol+p]:mt-[1.5em] [&_li+li]:mt-[1.5em]',
  // An empty paragraph is how an editor asks for one extra blank line: it adds
  // its own line and no margin of its own. Phones leave it out (a double blank
  // line reads as a hole on a narrow screen).
  '[&_p.text-section-gap]:mt-0 [@media(max-width:767px)]:[&_p.text-section-gap]:hidden',
  // Red highlight (the PDF's red phrases), set per word in the editor.
  '[&_.text-section-red]:text-brand-red',
  // Links carry no underline, as in the PDF; it shows on hover and keyboard focus.
  '[&_a]:no-underline [&_a]:underline-offset-4 [&_a:hover]:underline [&_a:focus-visible]:underline',
  // Lists. Main points carry no bullet (their bold label leads the line); only
  // sub-points (a nested list) get the site's "•", drawn inline with no hanging
  // indent, so wrapped lines return under the dot as in the PDF. Every item is
  // justified with a left last line. Numbered lists keep their numbers.
  '[&_ul]:m-0 [&_ul]:p-0 [&_ul]:list-none [&_ol]:m-0 [&_ol]:p-0 [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:pl-[1.5em]',
  '[&_li]:text-justify [&_li]:[text-align-last:left]',
  "[&_li.nestedListItem>ul>li:not(.nestedListItem)::before]:content-['•'] [&_li.nestedListItem>ul>li:not(.nestedListItem)::before]:text-black/70 [&_li.nestedListItem>ul>li:not(.nestedListItem)::before]:mr-[0.5em]",
  // Lexical wraps a nested list in its own <li class="nestedListItem">, which
  // gets no marker and no spacing of its own; the nested list carries it.
  '[&_li.nestedListItem]:mt-0 [&_li.nestedListItem+li]:mt-0 [&_li.nestedListItem>ul]:my-[1.5em] [&_li.nestedListItem>ol]:my-[1.5em]',
  // Phones: sub-points are indented under their parent point.
  '[@media(max-width:767px)]:[&_li.nestedListItem>ul]:pl-[1.25em] [@media(max-width:767px)]:[&_li.nestedListItem>ol]:pl-[1.25em]',
  // Tablets up: sub-points sit in the narrow centred column (837.38pt of 1920
  // = 43.61vw, kept at the PDF's ratio to the text column, so 493.5px where the
  // column holds at 672px), with about 2.25 blank lines above and below.
  'md:[&_li.nestedListItem>ul]:max-w-[max(493.5px,calc(43.61*var(--pp-vw)))] md:[&_li.nestedListItem>ul]:mx-auto md:[&_li.nestedListItem>ul]:my-[3.375em]',
  'md:[&_li.nestedListItem>ol]:max-w-[max(493.5px,calc(43.61*var(--pp-vw)))] md:[&_li.nestedListItem>ol]:mx-auto md:[&_li.nestedListItem>ol]:my-[3.375em]',
].join(' ')

/** "Bullet list width: Narrow": top-level lists use the same narrow column. */
const NARROW_LIST_CLASSES =
  'md:[&_.payload-richtext>ul]:max-w-[max(493.5px,calc(43.61*var(--pp-vw)))] md:[&_.payload-richtext>ul]:mx-auto md:[&_.payload-richtext>ul]:my-[3.375em] ' +
  'md:[&_.payload-richtext>ol]:max-w-[max(493.5px,calc(43.61*var(--pp-vw)))] md:[&_.payload-richtext>ol]:mx-auto md:[&_.payload-richtext>ol]:my-[3.375em]'

/** "Last line of justified paragraphs": centred or left, per section. */
const LAST_LINE_CLASSES = {
  center: '[&_p[style*=justify]]:[text-align-last:center]',
  left: '[&_p[style*=justify]]:[text-align-last:left]',
} as const

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
 * Spacing: the section ends with 32px / 48px (md+) of bottom padding, the
 * same as SectionIntro's "tight bottom", so the Divider below gets the same
 * gap whichever block sits above it. The heading's bottom margin sets the
 * heading-baseline to first-text-baseline distance (97pt of 1920 = 5.052vw,
 * never less than 18px of clear space). In Gill Sans Light the baseline sits
 * 1.0798em below the top of a 1.5 line box, and 0.1952em above the bottom of
 * a 1.05 one (the heading). scroll-margin keeps an in-page jump clear of the
 * fixed header.
 *
 * The class names `text-section`, `text-section-heading`, `text-section-body`
 * and the body's data attributes carry no styles of their own; they name the
 * elements and the chosen settings (the Divider uses `.text-section` to know a
 * Text Section sits above it).
 */
export const TextSectionBlock: React.FC<TextSectionBlockProps> = ({
  heading,
  body,
  listWidth = 'full',
  justifyLastLine = 'center',
}) => {
  return (
    <section className="text-section w-full px-9 md:px-12 lg:px-0 pb-8 md:pb-12 text-ink [--pp-vw:min(1vw,19.2px)]">
      <div className="mx-auto w-full max-w-2xl lg:max-w-[min(max(672px,59.39vw),1140.3px)]">
        {heading && (
          <h2
            id={toAnchor(heading)}
            className="text-section-heading editorial-display text-display text-brand-red text-center mb-[max(18px,calc(5.052*var(--pp-vw)_-_0.1952*var(--fs-display)_-_1.0798*var(--fs-body)))] scroll-mt-[14svh] lg:scroll-mt-32"
          >
            {heading}
          </h2>
        )}
        {body && (
          <div
            className={[
              'text-section-body font-body text-body',
              BODY_CLASSES,
              listWidth === 'narrow' ? NARROW_LIST_CLASSES : '',
              LAST_LINE_CLASSES[justifyLastLine === 'left' ? 'left' : 'center'],
            ].join(' ')}
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
