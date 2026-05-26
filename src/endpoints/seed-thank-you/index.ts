/**
 * MOMH "Thank You" page seed (PDF p7).
 *
 * Programmatic Payload Local API population for the shared form
 * confirmation page. Both /book-an-appointment (AppointmentForm) and
 * /personal-consultation (ConsultationForm) redirect here on
 * successful submission.
 *
 * Page layout (5 blocks, all reusing existing block types):
 *   1. ImageBanner    — top haveli (natural aspect, dark header)
 *   2. SectionIntro   — "We Have Recieved Your *Request.*" (no eyebrow)
 *   3. EditorialSplit — Architecture (cream panel, image RIGHT)
 *   4. EditorialSplit — Era of Enamel (image LEFT, maroon panel)
 *   5. EditorialSplit — Our Blogs (NAVY panel, image RIGHT) — NEW colour
 *
 * Uploads 7 media: haveli top + 3 panel images + 3 icons (peacock,
 * phoenix, bouquet — all already on disk from the home-page seed).
 *
 * Idempotent: re-running deletes the previous [momh-thanks-seed]
 * media + the page doc and recreates fresh.
 */

import type { Payload, PayloadRequest, File } from 'payload'
import fs from 'fs/promises'
import path from 'path'

import { p, richText } from '../seed-momh/lexical'
import { PROTECTED_STEMS } from '../seed-momh/sharedFiles'

const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const MEDIA_DIR = path.join(PUBLIC_DIR, 'media')

const SEED_ALT_MARKER = '[momh-thanks-seed]'

async function readPublicFile(relPath: string): Promise<File> {
  const fullPath = path.join(PUBLIC_DIR, relPath)
  const data = await fs.readFile(fullPath)
  const name = path.basename(relPath)
  const extLower = path.extname(name).slice(1).toLowerCase()
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  }
  return {
    name,
    data,
    mimetype: mimeMap[extLower] || 'application/octet-stream',
    size: data.byteLength,
  }
}

const SEED_SOURCE_FILES = [
  'momh-assets/inner-banner-cropped.jpg', // shared cropped 4:1 inner-page top banner
  'momh-assets/thank-you/thank-you-architecture.jpg',
  'momh-assets/thank-you/thank-you-enamel-tiles.jpg',
  'momh-assets/thank-you/thank-you-blue-floral.jpg',
  'momh-assets/artboard-31.png', // white peacock icon
  'momh-assets/artboard-32.png', // brown phoenix icon
  'momh-assets/artboard-33.png', // white bouquet icon
]

async function wipeSeedFilesOnDisk(): Promise<void> {
  try {
    const files = await fs.readdir(MEDIA_DIR)
    // Skip any stem that the home-page seed owns. Sub-page seeds
    // reuse some of those source files (haveli top, peacock /
    // phoenix / bouquet icons) but must not delete them from disk —
    // doing so would break the home page's existing Media records.
    // See `seed-momh/sharedFiles.ts`.
    const stems = SEED_SOURCE_FILES
      .map((f) => path.parse(f).name)
      .filter((stem) => !PROTECTED_STEMS.has(stem))
    const toDelete = files.filter((f) => stems.some((stem) => f.startsWith(stem)))
    await Promise.all(
      toDelete.map((f) => fs.unlink(path.join(MEDIA_DIR, f)).catch(() => undefined)),
    )
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }
}

async function uploadImage(
  payload: Payload,
  relPath: string,
  alt: string,
  req: PayloadRequest,
): Promise<number> {
  const file = await readPublicFile(relPath)
  const doc = await payload.create({
    collection: 'media',
    data: { alt: `${SEED_ALT_MARKER} ${alt}` },
    file,
    req,
  })
  return doc.id as number
}

export const seedThankYou = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}) => {
  payload.logger.info('— Seeding MOMH Thank You page')

  payload.logger.info('  • clearing previous Thank You seed media')
  await payload.delete({
    collection: 'media',
    req,
    where: { alt: { contains: SEED_ALT_MARKER } },
  })

  payload.logger.info('  • clearing leftover media files on disk')
  await wipeSeedFilesOnDisk()

  payload.logger.info('  • removing existing thank-you page (if any)')
  await payload.delete({
    collection: 'pages',
    req,
    where: { slug: { equals: 'thank-you' } },
  })

  payload.logger.info('  • uploading 7 thank-you-page media')
  const uploads: Array<{ key: string; relPath: string; alt: string }> = [
    {
      key: 'haveliTop',
      relPath: 'momh-assets/inner-banner-cropped.jpg',
      alt: 'Shekhawat Haveli — cropped twilight façade banner',
    },
    {
      key: 'architectureImg',
      relPath: 'momh-assets/thank-you/thank-you-architecture.jpg',
      alt: 'Shekhawat Haveli close-up — Sanskrit "Shekhawat Haveli" text carved in stone',
    },
    {
      key: 'enamelTilesImg',
      relPath: 'momh-assets/thank-you/thank-you-enamel-tiles.jpg',
      alt: 'Enamel tile installation — grid of coloured meenakari samples on black panels',
    },
    {
      key: 'blueFloralImg',
      relPath: 'momh-assets/thank-you/thank-you-blue-floral.jpg',
      alt: 'Blue meenakari enamel close-up — white floral pattern on cobalt blue ground',
    },
    {
      key: 'iconPeacockWhite',
      relPath: 'momh-assets/artboard-31.png',
      alt: 'White peacock icon (Press / Blogs)',
    },
    {
      key: 'iconPhoenixBrown',
      relPath: 'momh-assets/artboard-32.png',
      alt: 'Brown phoenix icon (Architecture)',
    },
    {
      key: 'iconBouquetWhite',
      relPath: 'momh-assets/artboard-33.png',
      alt: 'White bouquet icon (Events)',
    },
  ]
  const ids: Record<string, number> = {}
  for (const u of uploads) {
    ids[u.key] = await uploadImage(payload, u.relPath, u.alt, req)
  }
  const {
    haveliTop,
    architectureImg,
    enamelTilesImg,
    blueFloralImg,
    iconPeacockWhite,
    iconPhoenixBrown,
    iconBouquetWhite,
  } = ids

  payload.logger.info('  • creating thank-you page')

  const page = await payload.create({
    collection: 'pages',
    req,
    data: {
      title: 'Thank You',
      slug: 'thank-you',
      _status: 'published',
      hero: { type: 'none' },
      layout: [
        // 1. Top haveli banner (natural aspect, dark header).
        {
          blockType: 'imageBanner',
          image: haveliTop,
          headerTheme: 'dark',
          height: 'natural',
        },

        // 2. "We Have Recieved Your *Request.*" centered intro on white.
        //    No eyebrow per PDF p7. Hairline divider above per the
        //    same convention as all other inner-page intros.
        {
          blockType: 'sectionIntro',
          backgroundColor: 'white',
          showTopDivider: true,
          tightBottom: true,
          headline: p('We Have Recieved Your *Request.*'),
          body: p(
            'Thank you for getting in touch. Our team has your details and will reach out shortly to confirm. In the meantime, we have left a few doors open, for you to wander a little further into MOMH.',
          ),
        },

        // 3. Architecture panel — cream LEFT, image RIGHT.
        //    `topSpacing: 'md'` adds a 40px white gap above this panel
        //    (and the 2 panels below) to break up the stack and match
        //    the PDF's airy "wander a little further" composition.
        {
          blockType: 'editorialSplit',
          image: architectureImg,
          imagePosition: 'right',
          backgroundColor: 'cream',
          topSpacing: 'md',
          icon: iconPhoenixBrown,
          iconPosition: 'left',
          eyebrow: "MoMH's Architecture",
          headline: p('The *Architecture*'),
          body: p(
            "A monument of stone and light, echoing Jaipur's heritage in a contemporary form.",
          ),
          ctaLabel: 'Explore The Space',
          ctaStyle: 'arrow',
          ctaArrowPosition: 'right',
          ctaLink: { type: 'custom', url: '/about', newTab: false },
        },

        // 4. Events panel — image LEFT, maroon RIGHT. featuredLine
        //    carries the "Upcoming:" preamble per the existing
        //    EditorialSplit convention (italicise the label in the
        //    Lexical doc via the * markers in `richText`).
        {
          blockType: 'editorialSplit',
          image: enamelTilesImg,
          imagePosition: 'left',
          backgroundColor: 'maroon',
          topSpacing: 'md',
          icon: iconBouquetWhite,
          iconPosition: 'right',
          eyebrow: 'Events At MoMH',
          headline: p('An Era of *Enamel* at MoMH'),
          body: p(
            'An ode to the hand, where every stroke of enamel carries centuries of mastery.',
          ),
          featuredLine: richText([
            { text: 'Upcoming:', italic: true },
            { text: ' An Era of Enamel at MOMH, September 7, 2025' },
          ]),
          ctaLabel: 'View All Events',
          ctaStyle: 'arrow',
          ctaArrowPosition: 'right',
          ctaLink: { type: 'custom', url: '/book-an-appointment', newTab: false },
        },

        // 5. Our Blogs panel — NAVY LEFT (new colour), image RIGHT.
        //    Header theme flips dark (navy is dark; EditorialSplit
        //    Component's isDarkBg list now includes 'navy').
        {
          blockType: 'editorialSplit',
          image: blueFloralImg,
          imagePosition: 'right',
          backgroundColor: 'navy',
          topSpacing: 'md',
          // Final panel — match the inter-panel gap below so the
          // page doesn't slam straight into the footer.
          bottomSpacing: 'md',
          icon: iconPeacockWhite,
          iconPosition: 'left',
          eyebrow: 'Press',
          headline: p('Our *Blogs*'),
          body: p(
            'History & Heritage · The Royal Roots of Meenakari: A Jaipur Legacy. Trace the centuries-old tradition of meenakari, from royal ateliers to today\'s contemporary jewellery houses. Locally sourced materials. Heritage-inspired detail. The spirit of Made in India, embedded in every surface.',
          ),
          ctaLabel: 'Read The Full Article',
          ctaStyle: 'arrow',
          ctaArrowPosition: 'right',
          ctaLink: {
            type: 'custom',
            url: '/blog/royal-roots-of-meenakari',
            newTab: false,
          },
        },
      ],
    },
  })

  payload.logger.info(`  • created thank-you page (id: ${page.id})`)

  return {
    pageId: page.id,
    uploadedMediaIds: ids,
  }
}
