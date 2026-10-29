import React from 'react'
import Link from 'next/link'

import type { SiteMapBlock as SiteMapBlockProps } from '@/payload-types'

import { COLUMN_ICONS, HomeIcon, SupportCircleIcon } from './icons'

/**
 * Site Map (Sitemap PDF, 1920 artboard; values in pt of 1920).
 *
 * The tree: a red house, a 1px line running from the first column's icon
 * centre to the last one's, and from that line a 1px drop ending in an arrow
 * over each column's icon. Under each icon, the column's links as a list
 * whose text starts 60.83pt left of the icon centre (the "pin"), as the
 * PDF's first two columns do (D7: its third column sat 20pt further out).
 * From md up the list has no bullets (client request, 29 Oct); phones keep
 * their red dots (below).
 *
 * How it is laid out (md and up): the columns are grid tracks with no gap,
 * and each column's pin sits the same distance (--sm-off) from its track's
 * left edge, so the pins are exactly one track apart. Every column except the
 * last draws one track-wide piece of the line, starting at its own pin, so the
 * pieces join from the first pin to the last for any number of columns. The
 * last track is only as wide as its list, capped so it ends 24px inside the
 * screen. The middle of the line sits on the page's centre line, under the
 * house, the title and the divider above (client request, 29 Oct: the house
 * centred like the divider). The lists hang to the right of their icons, so
 * the room beside the tree is smaller on the right than on the left.
 *  - lg (1024 and up), the PDF: the line (--sm-span) is 1290.4pt long
 *    (67.21vw) whatever the number of columns, so with 3 columns the icons
 *    are 645.2pt apart.
 *  - md (768-1023): no design. The PDF's spacing would push the last list
 *    off screen, so the icons are a share of the width minus 16px apart
 *    (208px at 768 with 3 columns), which keeps a gap between the lists.
 *  - Phones (under 768): a vertical tree, from the client's mobile design
 *    (21 Oct). The house is the root at the top left of a centred block; a
 *    light grey trunk runs down from its middle, with a plain branch out to
 *    each icon, all three in red circles (32px, smaller than the 42px house so
 *    the root reads as the largest; client request, 21 Oct); from each icon a
 *    line runs down with a tick, a red dot and the link (no bullets, no
 *    underline until tapped; role="list" keeps the list a list for
 *    VoiceOver). Rows are 2em
 *    apart, as in that design, and a thin grey rule closes the tree.
 *    Each piece of line is drawn by the element it belongs to, so the tree
 *    fits any number of columns and links: a column draws the trunk beside it
 *    (the last one only down to its own branch), a link the line beside it
 *    (the last one only down to its own tick).
 *
 * Units: --pp-vw is 1vw, frozen at 19.2px above 1920 (the site's type stops
 * growing there). --sm-u is 1pt of the PDF on screen (1px at 1920) for the
 * drawing itself (house, lines, arrows, icons), never smaller than 0.617px,
 * so the icons stay 36px across on small screens. Type is the site's
 * (text-body: 26px at 1920 against the PDF's 24pt), rows 1.6667em apart (the
 * PDF's 40pt rows on 24pt type), captions 0.5833em (14pt on 24pt), never
 * under 14px.
 */

/** Vertical rhythm, pt at 1920 (design/sitemap-bbox.html, icons/*.svg). */
// Intro's last baseline to the top of the house: 119.28pt (6.2125vw); the
// Section Intro above ends 48px (md+) and 0.4202em of its last line below
// its baseline.
// Last caption's baseline to the next block's first baseline: 112pt (5.8333vw).
const SECTION =
  'site-map w-full px-9 md:px-12 lg:px-0 text-ink ' +
  // Phones: the tree is centred even when it is a little wider than the space
  // between the 36px margins (it then reaches into both margins equally).
  'flex flex-col items-center md:block ' +
  // Phones: a thin grey rule under the tree, 48px below it and 24px above the
  // next text, as in the mobile design.
  "after:content-[''] after:self-stretch after:h-px after:bg-black/20 after:mt-12 md:after:hidden " +
  // The line's length, set here so --sm-cols (inline) can use it.
  'md:[--sm-span:var(--sm-span-md)] lg:[--sm-span:var(--sm-span-lg)] ' +
  // The widest the last column's track (its list) may be: the tree is placed
  // by its line, so the list must end 24px inside the screen.
  'md:[--sm-last:calc(50vw_-_var(--sm-span)_/_2_+_var(--sm-off)_-_24px)] ' +
  '[--pp-vw:min(1vw,19.2px)] [--sm-u:max(0.617px,calc(var(--pp-vw)/19.2))] ' +
  // Phones' tree (the mobile design, measured at 390): the trunk's x (the
  // house's middle), the branch from it to an icon's circle, the space above
  // each circle, the circle's radius, the line from a circle to its first
  // link's tick, a link's tick, and where its text starts (its red dot sits
  // between the two).
  '[--m-t:calc(33.715*var(--sm-u))] [--m-b:20px] [--m-pt:24px] [--m-ic:16px] [--m-ul:23px] [--m-tick:22px] [--m-text:44px] ' +
  // md+: the column icons' circle size (see ICON_SIZE).
  '[--sm-ic:max(32px,calc(44*var(--sm-u)))] ' +
  '[--sm-off:calc(60.83*var(--sm-u))] [--sm-row:calc(2*var(--fs-body))] md:[--sm-row:calc(1.6667*var(--fs-body))] [--sm-cap:max(14px,calc(0.5833*var(--fs-body)))] ' +
  'pt-8 pb-6 md:pt-[max(16px,calc(6.2125*var(--pp-vw)_-_3rem_-_0.4202*var(--fs-body)))] ' +
  // From the bottom of the last row: the caption's baseline sits 0.301em of
  // its own size below the row's middle (Gill Sans Light Italic, measured),
  // and the Text Section below starts with its baseline 1.0798em of the body
  // size down.
  'md:pb-[max(24px,calc(5.8333*var(--pp-vw)_-_0.5*var(--sm-row)_+_0.301*var(--sm-cap)_-_1.0798*var(--fs-body)))]'

/** A drop from the line: 1px stroke, 40.67pt to the arrow tip; the arrow's arms are 10.08pt each way at 45 degrees. */
const Drop: React.FC = () => (
  <svg
    viewBox="0 0 20.16 40.67"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
    className="hidden md:block overflow-visible w-[calc(20.16*var(--sm-u))] h-[calc(40.67*var(--sm-u))] ml-[calc(var(--sm-off)_-_10.08*var(--sm-u))]"
  >
    <g fill="none" stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke">
      <line x1="10.08" y1="0" x2="10.08" y2="40.67" vectorEffect="non-scaling-stroke" />
      <polyline points="0 30.59 10.08 40.67 20.16 30.59" vectorEffect="non-scaling-stroke" />
    </g>
  </svg>
)

/**
 * Icon sizes. The house is the root and the largest; the column icons are
 * smaller than the PDF draws them (client request, 21 Oct).
 *  - md+: the circles are --sm-ic across: 44pt of 1920 (the PDF's 58.36pt
 *    x 0.754), never under 32px. The others keep their PDF proportions to it:
 *    Visit 43.77/44, the telephone 46.86 x 42.64 per 44. Each sits centred in
 *    a slot --sm-ic high, so every icon centre is level.
 *  - Phones: every icon is a 32px circle (the house stays 42px).
 */
const PHONE_ICON = 'w-[calc(2*var(--m-ic))] h-[calc(2*var(--m-ic))]'
const ICON_SIZE: Record<keyof typeof COLUMN_ICONS, string> = {
  info: `${PHONE_ICON} md:w-[var(--sm-ic)] md:h-[var(--sm-ic)]`,
  support: 'md:w-[calc(1.065*var(--sm-ic))] md:h-[calc(0.969*var(--sm-ic))]',
  visit: `${PHONE_ICON} md:w-[calc(0.9948*var(--sm-ic))] md:h-[calc(0.9948*var(--sm-ic))]`,
}

/** The links: no bullets (md+, client request, 29 Oct), rows 1.6667em apart, underlined as in the PDF. */
const LIST =
  'font-body text-body leading-[var(--sm-row)] pl-0 ' +
  // Phones: the list sits under its icon's middle, where its line runs down;
  // the line starts at the circle (this padding, which ends half a row above
  // the first tick) and continues beside each link.
  'relative list-none w-max max-w-full pt-[calc(var(--m-ul)_-_var(--sm-row)_/_2)] ml-[calc(var(--m-t)_+_var(--m-b)_+_var(--m-ic))] ' +
  'before:absolute before:left-0 before:top-0 before:h-[calc(var(--m-ul)_-_var(--sm-row)_/_2)] before:w-px before:bg-black/20 ' +
  'md:pt-0 md:mx-0 md:w-auto md:before:hidden ' +
  // Icon slot bottom to the first baseline: 56.14pt. The baseline sits 1.1631em
  // down a 1.6667em row.
  'md:mt-[max(4px,calc(56.14*var(--sm-u)_-_1.1631*var(--fs-body)))] ' +
  // Underlined as in the PDF from md up; on phones only when tapped or focused.
  'md:[&_a]:underline [&_a:hover]:underline [&_a:focus-visible]:underline [&_a]:decoration-[0.05em] [&_a]:underline-offset-[0.12em] [&_a]:transition-colors ' +
  '[&_a:hover]:text-brand-red [&_a:focus-visible]:text-brand-red'

/** Phones: the line beside each link (the last stops at its own tick), the tick out to it, and a 5px red dot before the text. */
const ITEM =
  'relative pl-[var(--m-text)] ' +
  'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-black/20 ' +
  'last:before:bottom-auto last:before:h-[calc(var(--sm-row)_/_2)] ' +
  'after:absolute after:left-0 after:top-[calc(var(--sm-row)_/_2)] after:w-[var(--m-tick)] after:h-px after:bg-black/20 ' +
  '[&>a]:before:absolute [&>a]:before:left-[calc((var(--m-tick)_+_var(--m-text))_/_2_-_2.5px)] [&>a]:before:top-[calc(var(--sm-row)_/_2_-_2.5px)] ' +
  '[&>a]:before:w-[5px] [&>a]:before:h-[5px] [&>a]:before:rounded-full [&>a]:before:bg-brand-red ' +
  'md:before:hidden md:after:hidden md:[&>a]:before:hidden ' +
  // md+, no bullets: a label that wraps hangs its next lines 0.75em in, so
  // they never read as another link. First lines (and captions, which inherit
  // the indent) start where the text did before.
  'md:pl-[0.75em] md:-indent-[0.75em]'

/** Phones: the plain branch from the trunk to an icon's circle, level with its centre. */
const Branch: React.FC = () => (
  <span
    aria-hidden="true"
    className="md:hidden absolute left-[var(--m-t)] top-[calc(var(--m-pt)_+_var(--m-ic))] w-[var(--m-b)] h-px bg-black/20"
  />
)

export const SiteMapBlock: React.FC<SiteMapBlockProps> = ({ columns }) => {
  // A draft can hold a half-filled row (drafts skip `required`); show only
  // links with both a label and an address, and only columns that keep one.
  const cols = (columns || [])
    .map((c) => ({ ...c, links: (c?.links || []).filter((l) => l?.label && l?.url) }))
    .filter((c) => c.links.length > 0)
  if (!cols.length) return null
  const n = cols.length

  // The last track: as wide as its list, at most --sm-last (set above for md and up: the list ends 24px inside the screen).
  const last = 'fit-content(var(--sm-last))'
  const style = {
    '--sm-cols': n === 1 ? last : `repeat(${n - 1}, calc(var(--sm-span) / ${n - 1})) ${last}`,
    // md: n-1 gaps of (screen minus the 48px margins) / n, less 16px each.
    '--sm-span-md': `calc(${n - 1} * ((100vw - 96px) / ${n} - 16px))`,
    '--sm-span-lg': n === 1 ? '0px' : 'calc(67.208 * var(--pp-vw))',
  } as React.CSSProperties

  return (
    <nav aria-label="Sitemap" className={SECTION} style={style}>
      {/* Phones: as wide as the tree, centred. md+: the full width. */}
      <div className="w-max md:w-auto">
        {/* House: 67.43 x 54.42pt; its foot is 32.55pt above the line, over its middle (the page's centre from md up). */}
        <HomeIcon
          className={
            'block overflow-visible text-brand-red w-[calc(67.43*var(--sm-u))] h-[calc(54.42*var(--sm-u))] ' +
            'md:mx-auto md:mb-[calc(32.55*var(--sm-u))]'
          }
        />
        <div
          className={
            'block ' +
            'md:grid md:items-start md:gap-0 md:w-max md:[grid-template-columns:var(--sm-cols)] ' +
            'md:ml-[calc(50%_-_var(--sm-span)_/_2_-_var(--sm-off))]'
          }
        >
          {cols.map((col, i) => {
            const Icon = COLUMN_ICONS[col.icon] ?? COLUMN_ICONS.info
            return (
              <div
                key={col.id ?? i}
                // A 1em gap after every list but the last, so it never touches the next column's text.
                className={`relative block min-w-0 pt-[var(--m-pt)] md:pt-0 ${i < n - 1 ? 'md:pr-[1em]' : ''}`}
              >
                {/* Phones: the trunk beside this column; the last column's stops at its branch. */}
                <span
                  aria-hidden="true"
                  className={`md:hidden absolute left-[var(--m-t)] top-0 w-px bg-black/20 ${i < n - 1 ? 'bottom-0' : 'h-[calc(var(--m-pt)_+_var(--m-ic)_+_1px)]'}`}
                />
                <Branch />
                {i < n - 1 && (
                  <span
                    aria-hidden="true"
                    className="hidden md:block absolute top-0 left-[var(--sm-off)] w-full border-t border-ink"
                  />
                )}
                <h2 className="sr-only">{col.title}</h2>
                <Drop />
                {/* Arrow tip to the icon slot: 30pt. */}
                <span
                  aria-hidden="true"
                  className={
                    'flex items-center justify-center h-[calc(2*var(--m-ic))] w-[calc(2*var(--m-ic))] ml-[calc(var(--m-t)_+_var(--m-b))] ' +
                    'md:mt-[calc(30*var(--sm-u))] md:h-[var(--sm-ic)] md:w-[calc(1.065*var(--sm-ic))] md:ml-[calc(var(--sm-off)_-_0.5325*var(--sm-ic))]'
                  }
                >
                  {/* overflow-visible: the circles' strokes reach the edge of their box, and a clipped edge shows at some widths. */}
                  <Icon
                    className={`${col.icon === 'support' ? 'hidden md:block' : 'block'} shrink-0 overflow-visible text-brand-red ${ICON_SIZE[col.icon] ?? ICON_SIZE.info}`}
                  />
                  {col.icon === 'support' && (
                    <SupportCircleIcon
                      className={`block md:hidden shrink-0 overflow-visible text-brand-red ${PHONE_ICON}`}
                    />
                  )}
                </span>
                <ul className={LIST} role="list">
                  {col.links.map((link, j) => (
                    <li key={link.id ?? j} className={ITEM}>
                      {link.url.startsWith('/') ? (
                        <Link href={link.url}>{link.label}</Link>
                      ) : (
                        <a href={link.url}>{link.label}</a>
                      )}
                      {link.caption && (
                        <span className="block italic text-black/70 text-[length:var(--sm-cap)] leading-[24px] md:leading-[var(--sm-row)]">
                          {link.caption}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default SiteMapBlock
