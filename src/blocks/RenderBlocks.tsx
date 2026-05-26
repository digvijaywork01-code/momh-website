import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

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
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              // No wrapper margin — editorial blocks render edge-to-edge.
              // The default Payload template had `my-16` here, which produced
              // a 4rem white gap above the hero and between every section.
              return (
                // eslint-disable-next-line react/jsx-key
                <Fragment key={index}>
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...block} disableInnerContainer />
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
