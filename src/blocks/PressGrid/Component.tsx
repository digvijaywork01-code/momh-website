import React from 'react'

import type { PressGridBlock as PressGridBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'

import { PressCarousel } from './PressCarousel'

type Item = NonNullable<PressGridBlockProps['items']>[number]

/** The day as the publication gives it, read in India time, so a date saved at midnight IST never shows as the day before. */
const DAY = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
})
/** The same day as YYYY-MM-DD, for <time dateTime>. */
const ISO_DAY = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
})

const toTime = (value: Item['date']): number => {
  const time = value ? new Date(value).getTime() : NaN
  return Number.isNaN(time) ? -Infinity : time
}

/** The calendar day in India time ("2026-01-14"), or '' with no date. Sorting
 *  by the day, not the stored instant, keeps two pieces from the same day in
 *  the order they were entered: the admin's date picker stores the day at a
 *  time of day that depends on the editor's timezone. */
const dayKey = (value: Item['date']): string => {
  const time = toTime(value)
  return Number.isFinite(time) ? ISO_DAY.format(time) : ''
}

/**
 * Press coverage grid (Press PDF, /press). Layout from the PDF, type from the
 * site (Gill Sans Light, regular weight for the publication).
 *
 * At 1920 (PDF): 4 columns with 99pt side margins (5.156vw) and 72pt gaps
 * (3.75vw); photo frame 377 x 524 (the supplied photos are cut to it, so
 * object-contain fills it without cropping); all text 24pt (1.25vw). Like the
 * rest of the site, sizes are 1vw-based up to 1920 and frozen above it
 * (--pp-vw is 1vw, capped at 19.2px).
 *  - Columns: 4 from 1440, 3 from 1024, 2 from 768. Below 1440 the text
 *    stays at 18px (the site's smallest body size), which leaves each
 *    justified column at least about 15em wide.
 *  - Phones (under 768): the same list is a swipeable carousel, one centred
 *    card at a time with nothing of the next one showing, sliding on by
 *    itself every 3 seconds, with red position dots on the photo
 *    (PressCarousel) and the card's text rising in as it arrives (RISE).
 *    Each slide is the full screen width with the section's 36px margin
 *    inside it; the card is at most 360px wide, centred.
 *  - Under the photo (baselines from the PDF, at line-height 1.5, where Gill
 *    Sans Light's baseline sits 1.0798em below the line top): photo -> date
 *    2.246em, then date -> publication -> summary 2.4em apart.
 *  - The link is pushed to the bottom of its card, so the links of a row
 *    line up whatever the length of each summary, as in the PDF.
 *  - Row gap: link baseline -> next photo top = 118.7pt of 1920 (6.182vw),
 *    less the part of the link line below its baseline (0.4202em).
 *  - Top padding: from a Text Section above, last baseline -> first photo
 *    = 208pt of 1920 (10.833vw), less that section's 48px bottom padding
 *    and the part of its last line below the baseline.
 *  - Bottom padding: 32px / 48px (md+), the same as a Text Section, so a
 *    Divider below gets the same gap as everywhere else.
 * Summaries are justified from 768 up and left-aligned on phones, where a
 * narrow justified column leaves wide gaps between words. The link stays ink
 * on hover and focus (its underline thickens): brand red on white is about
 * 4.4:1, under the 4.5:1 that 18px regular text needs.
 */
/**
 * Text entrance on the phone carousel: each slide carries data-current (set by
 * PressCarousel, phones only). The text of the other cards waits 12px low and
 * transparent; when a card becomes current its date, publication, summary and
 * link rise and fade in one after the other (0.7s each, starting 0.1, 0.2,
 * 0.3 and 0.5s after the card starts sliding in; Tailwind's own steps, since
 * arbitrary duration/delay values clash with the animation plugin here and
 * are not generated). With "reduce motion" the text simply stays. Nothing
 * here applies where no slide is marked (768px up, or before the script runs).
 */
const RISE = [
  'group-data-[current]:transition-[opacity,transform] group-data-[current]:duration-700 group-data-[current]:ease-out',
  'group-data-[current=false]:translate-y-3 group-data-[current=false]:opacity-0',
  'motion-reduce:group-data-[current]:transition-none motion-reduce:group-data-[current=false]:translate-y-0 motion-reduce:group-data-[current=false]:opacity-100',
].join(' ')

export const PressGridBlock: React.FC<PressGridBlockProps> = ({
  items,
  order = 'newest',
  linkLabel,
}) => {
  // Only items whose photo is there: one deleted from the media library leaves
  // its item with no image (the link is cleared), and a card with an empty
  // frame would break the grid, so it is left out until a photo is chosen
  // again (as the SS press page does).
  const withPhoto = Array.isArray(items)
    ? items.filter((item) => item.image && typeof item.image === 'object')
    : []
  if (withPhoto.length === 0) return null

  // Newest day first. Array.prototype.sort is stable, so items from the same
  // day keep the order they were entered in; items with no date go last.
  const cards =
    order === 'manual'
      ? withPhoto
      : [...withPhoto].sort((a, b) => {
          const [x, y] = [dayKey(a.date), dayKey(b.date)]
          return x === y ? 0 : x < y ? 1 : -1
        })
  const label = linkLabel?.trim() || 'Read the full story'

  return (
    <div
      className={[
        'press-grid w-full text-ink [--pp-vw:min(1vw,19.2px)]',
        '[--pg-fs:18px] [@media(min-width:1440px)]:[--pg-fs:calc(1.25*var(--pp-vw))]',
        'px-9 md:px-12 lg:px-[calc(5.156*var(--pp-vw))]',
        'pt-4 lg:pt-[max(1rem,calc(10.833*var(--pp-vw)_-_3rem_-_0.4202*var(--fs-body)))] pb-8 md:pb-12',
      ].join(' ')}
    >
      <PressCarousel
        count={cards.length}
        listClassName={[
          'm-0 flex list-none p-0',
          'md:mx-auto md:grid md:w-full md:max-w-[1722px]',
          'md:grid-cols-2 lg:grid-cols-3 [@media(min-width:1440px)]:grid-cols-4',
          'md:gap-x-8 lg:gap-x-[calc(3.75*var(--pp-vw))]',
          'md:gap-y-16 lg:gap-y-[calc(6.182*var(--pp-vw)_-_0.4202*var(--pg-fs))]',
        ].join(' ')}
      >
        {cards.map((item, index) => {
          const time = toTime(item.date)
          const hasDate = Number.isFinite(time)
          const href = item.url?.trim()

          return (
            <li
              key={item.id ?? index}
              className="group m-0 min-w-0 shrink-0 grow-0 basis-full px-9 py-0 md:basis-auto md:p-0"
            >
              <article className="mx-auto flex h-full w-full max-w-[360px] flex-col font-body text-[length:var(--pg-fs)] leading-[1.5] md:max-w-none">
                <div className="relative aspect-[377/524] w-full overflow-hidden">
                  {item.image && typeof item.image === 'object' && (
                    <Media
                      resource={item.image}
                      fill
                      htmlElement={null}
                      imgClassName="object-contain"
                      size="(min-width: 1440px) 20vw, (min-width: 1024px) 30vw, (min-width: 768px) 45vw, (min-width: 432px) 360px, 82vw"
                    />
                  )}
                </div>
                {hasDate && (
                  <p className={`mt-[1.166em] font-light ${RISE} group-data-[current=true]:delay-100`}>
                    <time dateTime={ISO_DAY.format(time)}>{DAY.format(time)}</time>
                  </p>
                )}
                <h3 className={`mt-[0.9em] font-normal ${RISE} group-data-[current=true]:delay-200`}>
                  {item.publication}
                </h3>
                <p
                  className={`mt-[0.9em] font-light break-words md:text-justify md:[text-align-last:left] ${RISE} group-data-[current=true]:delay-300`}
                >
                  {item.summary}
                </p>
                {href && (
                  <p className={`mt-auto pt-[0.9em] ${RISE} group-data-[current=true]:delay-500`}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-normal uppercase underline decoration-1 underline-offset-[0.2em] hover:decoration-2 focus-visible:decoration-2 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4"
                    >
                      {label}
                      <span className="sr-only">: {item.publication} (opens in a new tab)</span>
                    </a>
                  </p>
                )}
              </article>
            </li>
          )
        })}
      </PressCarousel>
    </div>
  )
}

export default PressGridBlock
