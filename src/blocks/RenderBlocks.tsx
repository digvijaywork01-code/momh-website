import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'
import { richTextToPlain } from '@/utilities/richTextToPlain'
import { splitFirstSentence } from '@/utilities/splitFirstSentence'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { HeroBlock } from '@/blocks/Hero/Component'
import { EditorialSplitBlock } from '@/blocks/EditorialSplit/Component'
import { FounderQuoteBlock } from '@/blocks/FounderQuote/Component'
import { CardGridBlock } from '@/blocks/CardGrid/Component'
import { TwoColumnFeatureBlock } from '@/blocks/TwoColumnFeature/Component'
import { InfoHeroBlock } from '@/blocks/InfoHero/Component'
import { ImageBannerBlock } from '@/blocks/ImageBanner/Component'
import { MediaBandBlock } from '@/blocks/MediaBand/Component'
import { NumberedGridBlock } from '@/blocks/NumberedGrid/Component'
import { SectionIntroBlock } from '@/blocks/SectionIntro/Component'
import { VisitInfoBlock } from '@/blocks/VisitInfo/Component'
import { CarouselBlock } from '@/blocks/Carousel/Component'
import { FAQBlock } from '@/blocks/FAQ/Component'
import { ProcessCarouselBlock } from '@/blocks/ProcessCarousel/Component'
import { NewsletterFeatureBlock } from '@/blocks/NewsletterFeature/Component'
import { ConsultationFormBlock } from '@/blocks/ConsultationForm/Component'
import { ContactPanelBlock } from '@/blocks/ContactPanel/Component'
import { BulletListBlock } from '@/blocks/BulletList/Component'
import { QuestionPanelBlock } from '@/blocks/QuestionPanel/Component'
import { AppointmentFormBlock } from '@/blocks/AppointmentForm/Component'
import { TextSectionBlock } from '@/blocks/TextSection/Component'
import { DividerBlock } from '@/blocks/Divider/Component'
import { PressGridBlock } from '@/blocks/PressGrid/Component'
import { SiteMapBlock } from '@/blocks/SiteMap/Component'
import { ReviewCarouselBlock } from '@/blocks/ReviewCarousel/Component'

const blockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
  heroBlock: HeroBlock,
  editorialSplit: EditorialSplitBlock,
  founderQuote: FounderQuoteBlock,
  cardGrid: CardGridBlock,
  twoColumnFeature: TwoColumnFeatureBlock,
  infoHero: InfoHeroBlock,
  imageBanner: ImageBannerBlock,
  mediaBand: MediaBandBlock,
  numberedGrid: NumberedGridBlock,
  sectionIntro: SectionIntroBlock,
  visitInfo: VisitInfoBlock,
  carousel: CarouselBlock,
  faq: FAQBlock,
  processCarousel: ProcessCarouselBlock,
  newsletterFeature: NewsletterFeatureBlock,
  consultationForm: ConsultationFormBlock,
  contactPanel: ContactPanelBlock,
  bulletList: BulletListBlock,
  questionPanel: QuestionPanelBlock,
  appointmentForm: AppointmentFormBlock,
  textSection: TextSectionBlock,
  divider: DividerBlock,
  pressGrid: PressGridBlock,
  siteMap: SiteMapBlock,
  reviewCarousel: ReviewCarouselBlock,
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
  /** Page-level render variant forwarded to every editorialSplit block.
   *  'fifty-justified' = the About-page PDF spec (flush 50/50 columns,
   *  justified body, vertically centred stack).
   *  'editorial-band'  = the Founder's-Vision PDF spec (short 50/50 bands
   *  separated by white, Cormorant capitals over a maroon rule, 30px
   *  justified body). Not a CMS field — a page route opts in explicitly,
   *  so shared-block rendering on every other page is untouched. */
  editorialSplitVariant?: 'fifty-justified' | 'editorial-band'
  /** Page-level render variant forwarded to every infoHero block.
   *  'banner-title' = italic-serif title with a red accent word. */
  infoHeroVariant?: 'banner-title'
  /** Page-level render variant forwarded to every faq block.
   *  'faq-page' = the /faq page (FAQ PDF): one block per question group,
   *  all-red group heading, answers open (closed on phones). */
  faqVariant?: 'faq-page'
  /** Page-level render variant forwarded to every sectionIntro block.
   *  'appointment-page' = the Book An Appointment PDF intro: red Cormorant
   *  Light eyebrow, vw-scaled heading and body (lg+ only). */
  sectionIntroVariant?: 'appointment-page'
  /** Page-level render variant forwarded to every contactPanel block.
   *  'appointment-page' = the Book An Appointment PDF contact band:
   *  brand-red-dark panel, white icon discs, vw-scaled type (lg+ only). */
  contactPanelVariant?: 'appointment-page'
  /** Page-level layout option, on by default: when the page opens with an
   *  Image Banner followed by a Section Intro, the intro's eyebrow, title and
   *  first sentence are shown over the banner's bottom-left on screens at
   *  least 768px wide and 481px tall; there the intro block keeps only the
   *  rest of its text and its buttons (or is hidden when nothing is left),
   *  and elsewhere (phones, upright or sideways, and print) it renders
   *  whole. Skipped when the
   *  banner is a
   *  thin strip (a natural-height photo more than 3x wider than tall), which
   *  has no room for the text. Not a CMS field — a route can pass false. */
  introOnBanner?: boolean
  /** With introOnBanner: also put the title on the banner on phones (upright
   *  or sideways), centred at the photo's bottom. Off by default; a page
   *  route opts in (About). */
  introOnBannerPhone?: boolean
  /** On laptops and desktops, an opening natural banner fills exactly one
   *  screen (ImageBanner's fillScreen; 'keep-top' takes the trim from the
   *  photo's bottom only, 'keep-right' from its left only). Off by default;
   *  a page route opts in (About). */
  bannerFillsScreen?: boolean | 'keep-top' | 'keep-right'
  /** When the page opens with an Info Hero (no cards), its title and line
   *  sit at the bottom: bottom-left from 768px, bottom centre on phones
   *  (InfoHero's textAtBottom). Off by default; a route opts in
   *  (Architecture). */
  infoHeroTextAtBottom?: boolean
  /** When the page opens with a photo Info Hero (no cards): on phones the
   *  hero takes the photo's own shape, neither cropped nor zoomed
   *  (InfoHero's wholePhotoOnPhone). Off by default; a route opts in
   *  (Architecture). */
  infoHeroWholePhotoOnPhone?: boolean
  /** When the page opens with an Info Hero followed by a Section Intro: the
   *  intro's heading becomes the small line above the hero's title, its
   *  first sentence sits under the title, and the hero's text sits at its
   *  bottom (as infoHeroTextAtBottom). The intro block then keeps only the
   *  rest of its text on screens (print keeps it whole). Off by default; a
   *  route opts in (Art & Craftsmanship). */
  introOnHero?: boolean
}> = (props) => {
  const {
    blocks,
    editorialSplitVariant,
    infoHeroVariant,
    faqVariant,
    sectionIntroVariant,
    contactPanelVariant,
    introOnBanner = true,
    introOnBannerPhone = false,
    bannerFillsScreen = false,
    infoHeroTextAtBottom = false,
    infoHeroWholePhotoOnPhone = false,
    introOnHero = false,
  } = props

  const variantByBlockType: Partial<Record<string, string>> = {
    editorialSplit: editorialSplitVariant,
    infoHero: infoHeroVariant,
    faq: faqVariant,
    sectionIntro: sectionIntroVariant,
    contactPanel: contactPanelVariant,
  }

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0
  const first = hasBlocks ? blocks[0] : undefined
  const photo =
    first?.blockType === 'imageBanner' && typeof first.image === 'object' ? first.image : null
  const roomyBanner =
    first?.blockType === 'imageBanner' &&
    (first.height !== 'natural' ||
      (!!photo?.width && !!photo?.height && photo.width / photo.height <= 3))
  const second = hasBlocks ? blocks[1] : undefined
  const intro = introOnBanner && roomyBanner && second?.blockType === 'sectionIntro' ? second : null
  const introText = intro?.body ? splitFirstSentence(intro.body) : null
  const heroIntro =
    introOnHero && first?.blockType === 'infoHero' && second?.blockType === 'sectionIntro'
      ? second
      : null
  const heroIntroText = heroIntro?.body ? splitFirstSentence(heroIntro.body) : null

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              // Page-level render variants (see the props above).
              // Kept OUT of the JSX below so the single @ts-expect-error
              // there still covers the whole element (a multi-line element
              // would push the real mismatch past the directive's one-line
              // reach and break the build).
              const variant = variantByBlockType[blockType]
              const variantProps = {
                ...(variant ? { variant } : {}),
                ...(infoHeroTextAtBottom && index === 0 && blockType === 'infoHero'
                  ? { textAtBottom: true }
                  : {}),
                ...(infoHeroWholePhotoOnPhone && index === 0 && blockType === 'infoHero'
                  ? { wholePhotoOnPhone: true }
                  : {}),
                ...(heroIntro && index === 0
                  ? {
                      textAtBottom: true,
                      intro: {
                        eyebrow: richTextToPlain(heroIntro.headline),
                        body: heroIntroText?.lead ?? heroIntro.body,
                      },
                    }
                  : {}),
                ...(heroIntro && index === 1
                  ? {
                      phoneOnly: true,
                      onPhoneBanner: true,
                      bodyBelowBanner: heroIntroText?.rest ?? null,
                    }
                  : {}),
                ...(bannerFillsScreen && index === 0 && blockType === 'imageBanner'
                  ? { fillScreen: bannerFillsScreen }
                  : {}),
                ...(intro && index === 0
                  ? {
                      overlay: {
                        eyebrow: intro.eyebrow,
                        headline: intro.headline,
                        body: introText?.lead ?? intro.body,
                      },
                      overlayOnPhone: introOnBannerPhone,
                    }
                  : {}),
                ...(intro && index === 1
                  ? {
                      phoneOnly: true,
                      bodyBelowBanner: introText?.rest ?? null,
                      onPhoneBanner: introOnBannerPhone,
                    }
                  : {}),
              }

              // No wrapper margin — editorial blocks render edge-to-edge.
              // The default Payload template had `my-16` here, which produced
              // a 4rem white gap above the hero and between every section.
              return (
                // eslint-disable-next-line react/jsx-key
                <Fragment key={index}>
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...block} {...variantProps} disableInnerContainer />
                </Fragment>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
