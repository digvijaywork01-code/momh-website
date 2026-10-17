'use client'

/**
 * FAQBlock — "Frequently Asked Questions" accordion.
 *
 * Centered editorial header (eyebrow + headline + intro) followed by a
 * vertical stack of <FaqItem /> rows. The header cascades in on viewport
 * entry; the items themselves fade up individually as each crosses the
 * trigger line, giving a subtle scroll-driven cadence.
 */

import React, { useEffect, useId, useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'

import type { FAQBlock as FAQBlockProps } from '@/payload-types'

import RichText from '@/components/RichText'
import { FaqItem } from '@/components/FaqItem'
import { FAQ_PAGE_CLOSED_FLAG, FAQ_PAGE_PHONE_QUERY } from '@/blocks/FAQ/phoneQuery'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useNoScrollAnimations } from '@/utilities/useNoScrollAnimations'
import { cn } from '@/utilities/ui'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

type BgKey = NonNullable<FAQBlockProps['backgroundColor']>

const bgClass: Record<BgKey, string> = {
  ivory: 'bg-ivory text-ink',
  cream: 'bg-cream text-ink',
  black: 'bg-black text-offwhite',
  emerald: 'bg-emerald text-offwhite',
  maroon: 'bg-maroon text-offwhite',
}

const isDarkBg = (bg: BgKey): boolean =>
  bg === 'black' || bg === 'emerald' || bg === 'maroon'

/**
 * The 'faq-page' variant's own styles (FAQ PDF, approved 12 Oct). Only the
 * /faq route asks for this variant: one block per question group, an all-red
 * group heading, answers open (closed on phones), a thin line between
 * questions (FaqItem's page variant). The FAQ block on Book An Appointment
 * and every other page never renders these classes.
 *
 * Laptop and desktop sizes follow the PDF's 1920 artboard, scale with the
 * screen down to 1024 and freeze above 1920. The gaps around the group
 * headings are fixed values the user chose. The custom properties set on the
 * section are also read by the rows (FaqItem).
 *  - --faq-q, the question size: 20px on phones, 24px from 768, and from lg
 *    the PDF's 1920 size scaling with the screen (24px to 42px).
 *  - --faq-group-gap, the section's top padding: empty space from the intro
 *    or the last answer to the next red group heading. Tablets (768-1023)
 *    81px (120px baseline to baseline). Phones 64px and lg+ 80px, the user's
 *    choices on 12 Oct (lg+ chosen at 2560x1600, then "apply same values for
 *    laptop too"; phones are option A, the desktop's 80 / 64 proportions,
 *    was 81 / 32 / 72; the PDF's gaps were about 130px).
 *  - --faq-head-gap, the heading row's bottom margin: red group heading ->
 *    its first question. Tablets 32px, phones 48px, lg+ 64px (less than the
 *    gap above, so a heading sits with its questions).
 *  - --faq-qa-gap, the answer's top padding: question -> its answer. 12px
 *    below lg. From lg it keeps the PDF's 57.6px baseline to baseline at 1920,
 *    scaling with the screen: the gap subtracts the type around the two
 *    baselines, measured on the live fonts at 1024, 1440 and 1920 (body =
 *    --fs-body, question = --faq-q), so it matches at every width (+-1px).
 *  - No bottom padding: the next group's top padding, or the buttons row,
 *    sets the gap below. The 32px side space on phones comes from the page
 *    wrapper (faq/page.tsx).
 */
const PAGE_SECTION_CLASSES = [
  'faq-block--page',
  '[--faq-q:20px] md:[--faq-q:24px] lg:[--faq-q:clamp(24px,_2.1875vw,_42px)]',
  '[--faq-group-gap:81px] [@media(max-width:767.98px)]:[--faq-group-gap:64px] lg:[--faq-group-gap:80px]',
  '[--faq-head-gap:32px] [@media(max-width:767.98px)]:[--faq-head-gap:48px] lg:[--faq-head-gap:64px]',
  '[--faq-qa-gap:12px] lg:[--faq-qa-gap:calc(min(3vw,_57.6px)_-_0.41_*_var(--faq-q)_-_0.895_*_var(--fs-body))]',
  'pt-[var(--faq-group-gap)] pb-0',
].join(' ')

/**
 * Column: the standard block's 896px (56rem). From lg the PDF's column,
 * 1203px at 1920 (62.64vw), never narrower than 896px.
 */
const PAGE_INNER_CLASSES =
  'faq-block--page__inner w-full mx-auto max-w-[56rem] lg:max-w-[max(56rem,min(62.64vw,1203px))]'

/** Heading row: its gap to the first question is --faq-head-gap (above). */
const PAGE_HEAD_CLASSES = 'faq-block--page__head text-center mb-[var(--faq-head-gap)]'

/** Group heading: the large display size, line height 1.2. Font size before
 *  line height, so cn's class merge keeps both. */
const PAGE_HEADING_CLASSES =
  'faq-block--page__heading editorial-display text-[length:var(--fs-display-large)] leading-[1.2]'

export const FAQBlock: React.FC<
  FAQBlockProps & {
    /** Page-level render variant, passed by a page route through RenderBlocks
     *  (not a CMS field). 'faq-page' = the /faq page (FAQ PDF): one block per
     *  question group, the headline shown as a centred all-red group heading,
     *  answers open (closed on phones), no full-screen height, no #faq anchor
     *  (the page holds several FAQ blocks). Sizes and gaps live in the
     *  PAGE_*_CLASSES above and in FaqItem's page variant.
     *  Unset = today's block. */
    variant?: 'faq-page'
  }
> = ({ eyebrow, headline, intro, items, backgroundColor = 'ivory', variant }) => {
  const page = variant === 'faq-page'
  const headingId = useId()
  const { setHeaderTheme } = useHeaderTheme()
  const noScrollAnim = useNoScrollAnimations()
  const sectionRef = useRef<HTMLElement | null>(null)
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null)
  const headlineRef = useRef<HTMLDivElement | null>(null)
  const introRef = useRef<HTMLDivElement | null>(null)
  const itemsWrapRef = useRef<HTMLDivElement | null>(null)

  const bg = (backgroundColor || 'ivory') as BgKey
  const dark = isDarkBg(bg)

  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setHeaderTheme(dark ? 'dark' : 'light')
        })
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [dark, setHeaderTheme])

  // /faq on phones: the answers start closed (user's choice, 12 Oct; open on
  // tablets and up, as in the PDF). On a full page load the route's inline
  // script has already closed them before the first paint and flagged the
  // wrapper; closing again here at hydration would shut an answer the visitor
  // opened meanwhile, so this only runs after a client-side navigation to
  // /faq, before the browser paints the new page.
  useLayoutEffect(() => {
    if (!page || !window.matchMedia(FAQ_PAGE_PHONE_QUERY).matches) return
    const root = itemsWrapRef.current?.closest('.faq-page') as
      | (HTMLElement & Record<string, unknown>)
      | null
      | undefined
    if (root?.[FAQ_PAGE_CLOSED_FLAG]) return
    itemsWrapRef.current?.querySelectorAll('details').forEach((d) => {
      d.open = false
    })
  }, [page])

  useEffect(() => {
    if (prefersReducedMotion() || noScrollAnim) return
    const section = sectionRef.current
    if (!section) return

    const headerEls = (
      [eyebrowRef.current, headlineRef.current, introRef.current] as (HTMLElement | null)[]
    ).filter((el): el is NonNullable<typeof el> => el !== null)
    gsap.set(headerEls, { y: 30, opacity: 0 })

    const headerTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
        toggleActions: 'play reset play reset',
      },
    })
    headerTl.to(
      headerEls,
      { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out', stagger: 0.1 },
      0,
    )

    // Each FAQ row fades up individually as it crosses the trigger line.
    const rows = itemsWrapRef.current?.querySelectorAll<HTMLElement>('details') || []
    rows.forEach((row) => {
      gsap.set(row, { y: 25, opacity: 0 })
      gsap.to(row, {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: row, start: 'top 85%', toggleActions: 'play none play none' },
      })
    })

    return () => {
      headerTl.scrollTrigger?.kill()
      headerTl.kill()
    }
  }, [items])

  const rows = Array.isArray(items) ? items : []

  return (
    <section
      ref={sectionRef}
      // Anchor target for links such as /book-an-appointment#faq. The /faq
      // page holds several FAQ blocks, so its variant leaves the id off.
      id={page ? undefined : 'faq'}
      className={
        page
          ? cn(PAGE_SECTION_CLASSES, 'w-full flex flex-col items-center px-6 md:px-12', bgClass[bg])
          : cn(
              'w-full min-h-svh flex flex-col items-center justify-center py-20 lg:py-24 px-6 md:px-12',
              bgClass[bg],
            )
      }
      data-theme={dark ? 'dark' : 'light'}
      {...(noScrollAnim ? {} : { 'data-snap-section': true })}
      {...(page
        ? { 'aria-labelledby': headingId }
        : { 'aria-label': eyebrow || 'Frequently asked questions' })}
    >
      <div className={page ? PAGE_INNER_CLASSES : 'w-full max-w-4xl mx-auto'}>
        <div className={page ? PAGE_HEAD_CLASSES : 'text-center mb-12 lg:mb-16'}>
          {eyebrow && (
            <p
              ref={eyebrowRef}
              className="font-script italic text-eyebrow opacity-90 mb-3"
            >
              {eyebrow}
            </p>
          )}
          <div
            ref={headlineRef}
            // PDF p2 "Frequently Asked Questions" sits on a single line
            // at ~70px. Sized 4.5rem (72px) on lg — fits within max-w-4xl
            // without wrapping. Italic words (em/i) render in brand red
            // to match the PDF's red emphasis (e.g. "*Questions*").
            // /faq: the headline is a group heading ("Visiting"), all red,
            // exposed as a level-2 heading. A real <h2> cannot hold the rich
            // text's <div><p>, hence role + aria-level.
            {...(page ? { id: headingId, role: 'heading', 'aria-level': 2 } : {})}
            className={
              page
                ? cn(PAGE_HEADING_CLASSES, dark ? 'text-offwhite' : 'text-brand-red')
                : 'editorial-display text-[2.5rem] md:text-[3.5rem] lg:text-[4.5rem] leading-[1.05] mb-6 [&_em]:text-brand-red [&_i]:text-brand-red'
            }
          >
            <RichText data={headline} enableGutter={false} enableProse={false} />
          </div>
          {intro && (
            <div ref={introRef} className="font-body text-body opacity-95 max-w-xl mx-auto">
              <RichText data={intro} enableGutter={false} enableProse={false} />
            </div>
          )}
        </div>

        <div ref={itemsWrapRef} className="flex flex-col">
          {rows.map((row, i) =>
            page ? (
              <FaqItem key={i} question={row.question} answer={row.answer} variant="faq-page" defaultOpen />
            ) : (
              <FaqItem key={i} question={row.question} answer={row.answer} />
            ),
          )}
        </div>
      </div>
    </section>
  )
}

export default FAQBlock
