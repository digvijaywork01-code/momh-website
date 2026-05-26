/**
 * MOMH "Craft Your Jewellery" page seed.
 *
 * Programmatic Payload Local API population for the third editorial
 * page of the MOMH site. Uploads 5 images (top haveli shared with home
 * + PYV + 4 unique craft images) and creates the page at slug
 * `craft-your-jewellery` with the 5 blocks in PDF order:
 *
 *   1. ImageBanner   — top haveli (natural aspect, dark header)
 *   2. SectionIntro  — "Craft Your Own *Jewellery*"
 *   3. ProcessCarousel — INSPIRATION → DESIGN → DEVELOPMENT
 *   4. SectionIntro  — "A Creation That Begins With *You*" + red filled
 *                       CTA "Book Your Personal Consultation"
 *   5. NewsletterFeature — image left + maroon panel right with "Our
 *                          *Newsletter*" headline + Subscribe form
 *
 * Idempotent: re-running deletes the previous [momh-craft-seed] media
 * + the page doc and recreates fresh. Designed to be invoked from
 * `src/app/(frontend)/next/seed-craft-your-jewellery/route.ts`.
 */

import type { Payload, PayloadRequest, File } from 'payload'
import fs from 'fs/promises'
import path from 'path'

import { p, pp } from '../seed-momh/lexical'
import { PROTECTED_STEMS } from '../seed-momh/sharedFiles'

const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const MEDIA_DIR = path.join(PUBLIC_DIR, 'media')

const SEED_ALT_MARKER = '[momh-craft-seed]'

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

// File slots:
//   craft-haveli-top.jpg    → ImageBanner (top, full-bleed) — same shot
//                              as home Hero + PYV top haveli.
//   craft-inspiration.jpg   → ProcessCarousel slide 1 (jewellery sketches)
//   craft-design.jpg        → ProcessCarousel slide 2 (artisan filing a piece)
//   craft-development.jpg   → ProcessCarousel slide 3 (master jeweller w/ stones)
//   craft-newsletter.jpg    → NewsletterFeature image (artisan tools on wood)
const SEED_SOURCE_FILES = [
  'momh-assets/inner-banner-cropped.jpg', // shared cropped 4:1 inner-page top banner
  'momh-assets/craft-your-jewellery/craft-inspiration.jpg',
  'momh-assets/craft-your-jewellery/craft-design.jpg',
  'momh-assets/craft-your-jewellery/craft-development.jpg',
  'momh-assets/craft-your-jewellery/craft-newsletter.jpg',
]

async function wipeSeedFilesOnDisk(): Promise<void> {
  try {
    const files = await fs.readdir(MEDIA_DIR)
    // Skip stems owned by the home-page seed so we never delete its
    // files from disk (the home page's Media records would break).
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

export const seedCraftYourJewellery = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}) => {
  payload.logger.info('— Seeding MOMH Craft Your Jewellery page')

  // 1. Clear previously-seeded media (anything with our marker).
  payload.logger.info('  • clearing previous Craft seed media')
  await payload.delete({
    collection: 'media',
    req,
    where: { alt: { contains: SEED_ALT_MARKER } },
  })

  // 1a. Sweep leftover files on disk so the next upload doesn't collide.
  //     NOTE: the shared `artboard-15.jpg` haveli stem is also matched by
  //     the home-page seed. Re-seeding Craft will remove the home seed's
  //     copy of artboard-15 derivatives from disk if present, but those
  //     get re-generated on next request because the home page's media
  //     doc still references the file. Safe in practice.
  payload.logger.info('  • clearing leftover media files on disk')
  await wipeSeedFilesOnDisk()

  // 2. Delete existing Craft Your Jewellery page so we can recreate clean.
  payload.logger.info('  • removing existing craft-your-jewellery page (if any)')
  await payload.delete({
    collection: 'pages',
    req,
    where: { slug: { equals: 'craft-your-jewellery' } },
  })

  // 3. Upload the 5 layout images.
  payload.logger.info('  • uploading 5 craft-page images')
  const uploads: Array<{ key: string; relPath: string; alt: string }> = [
    {
      key: 'haveliTop',
      relPath: 'momh-assets/inner-banner-cropped.jpg',
      alt: 'Shekhawat Haveli — cropped twilight façade banner',
    },
    {
      key: 'inspiration',
      relPath: 'momh-assets/craft-your-jewellery/craft-inspiration.jpg',
      alt: 'Meenakari jewellery sketches with gold proof pieces in resin trays',
    },
    {
      key: 'design',
      relPath: 'momh-assets/craft-your-jewellery/craft-design.jpg',
      alt: 'Artisan filing a gold pendant with a jewellery saw — design refinement',
    },
    {
      key: 'development',
      relPath: 'momh-assets/craft-your-jewellery/craft-development.jpg',
      alt: 'Master jeweller setting kundan and rubies into a polki necklace',
    },
    {
      key: 'newsletter',
      relPath: 'momh-assets/craft-your-jewellery/craft-newsletter.jpg',
      alt: 'Workbench with traditional jewellery tools — newsletter feature',
    },
  ]

  const ids: Record<string, number> = {}
  for (const u of uploads) {
    ids[u.key] = await uploadImage(payload, u.relPath, u.alt, req)
  }
  const { haveliTop, inspiration, design, development, newsletter } = ids

  payload.logger.info('  • creating craft-your-jewellery page')

  const page = await payload.create({
    collection: 'pages',
    req,
    data: {
      title: 'Craft Your Jewellery',
      slug: 'craft-your-jewellery',
      _status: 'published',
      hero: { type: 'none' },
      layout: [
        // ─── 1. Top haveli — full-bleed dark banner, natural aspect.
        {
          blockType: 'imageBanner',
          image: haveliTop,
          headerTheme: 'dark',
          height: 'natural',
        },

        // ─── 2. "Craft Your Own *Jewellery*" centered intro.
        {
          blockType: 'sectionIntro',
          backgroundColor: 'ivory',
          showTopDivider: true,
          tightBottom: true,
          eyebrow: 'Brief',
          headline: p('Craft Your Own *Jewellery*'),
          body: p(
            'At the Museum of Meenakari Heritage, we hold that craft is a window into the history of a civilisation. Our work is devoted to preserving the old-world charm and age-old skill of meenakari, without flinching from the modern hands that wear it.',
          ),
        },

        // ─── 3. ProcessCarousel — 3 steps, all on a single cream bg.
        //         INSPIRATION body comes from the PDF verbatim; DESIGN
        //         and DEVELOPMENT bodies are transcribed from the
        //         user's attached screenshot (best-effort reading;
        //         editor can fix any words via Payload admin).
        {
          blockType: 'processCarousel',
          backgroundColor: 'cream',
          autoplay: true,
          autoplayInterval: 3500,
          slides: [
            {
              image: inspiration,
              stepLabel: 'INSPIRATION',
              body: p(
                "A piece often begins in the archive. A motif from a turra worn in a Mughal court. The curve of a peacock from a Rajputana miniature. The exact green of a parakeet's wing, fixed into enamel by a karigar four generations ago. At MOMH, inspiration is not invented. It is excavated, then offered to you.",
              ),
            },
            {
              image: design,
              stepLabel: 'DESIGN',
              body: p(
                "The next conversation is yours. Sitting with Sunita Shekhawat's design team in Shekhawat Haveli, you sketch, or describe, or simply point, towards the jewel that lives in your imagination. We translate. We bring out the colours that feel like weight in your hand. The piece begins to take its real shape.",
              ),
            },
            {
              image: development,
              stepLabel: 'DEVELOPMENT',
              body: p(
                'What follows is six to eight months of patient work. Goldsmith. Engraver. Enameller. Kundansaaz. Polisher. Each pair of hands meets the piece in turn, day by day, until what arrives, finally, is not a commission. It is an heirloom, with your name written quietly into its making.',
              ),
            },
          ],
        },

        // ─── 4. "A Creation That Begins With *You*" + red filled CTA.
        {
          blockType: 'sectionIntro',
          backgroundColor: 'ivory',
          showTopDivider: false,
          headline: p('A Creation That Begins With *You*'),
          body: p(
            'At the Museum of Meenakari Heritage, creation is a dialogue between your imagination and the hands of master artisans who have inherited centuries of craft. Each piece is not merely adorned. It is authored, in part, by you.',
          ),
          ctaLabel: 'Book Your Personal Consultation',
          ctaStyle: 'filled-red',
          ctaLink: {
            // Points at the new bespoke-enquiry form page (PDF p4)
            // instead of the generic /book-an-appointment route.
            type: 'custom',
            url: '/personal-consultation',
            newTab: false,
          },
        },

        // ─── 5. NewsletterFeature — image left + maroon panel right.
        {
          blockType: 'newsletterFeature',
          image: newsletter,
          imagePosition: 'left',
          panelBackgroundColor: 'maroon',
          headline: p('Our *Newsletter*'),
          body: p(
            'Discover the latest collections, news, and exclusive launches from the Museum of Meenakari Heritage.',
          ),
          inputLabel: 'Email Address:',
          buttonLabel: 'SUBSCRIBE',
          endpoint: '',
        },
      ],
    },
  })

  payload.logger.info(`  • created craft-your-jewellery page (id: ${page.id})`)

  // Suppress unused-warning for `pp` since this seed only uses `p` —
  // both are imported for shape parity with the other seeds.
  void pp

  return {
    pageId: page.id,
    uploadedMediaIds: ids,
  }
}
