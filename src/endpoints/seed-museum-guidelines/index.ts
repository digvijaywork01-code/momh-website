/**
 * MOMH "Museum Guidelines" page seed.
 *
 * Programmatic Payload Local API population for the museum guidelines
 * page at slug `museum-guidelines`. Uploads 7 images (top haveli shared
 * with home/PYV/CYJ/PC + 6 unique museum images) + 3 decorative icons
 * (peacock/bird, fish, phoenix-leaf) from the home page's artboard set,
 * and creates the page with 8 blocks per PDF p5:
 *
 *   1. ImageBanner   — top haveli (natural aspect)
 *   2. SectionIntro  — eyebrow "Events At MoMH" + "Museum *Guidelines*"
 *   3. ImageBanner   — full-bleed flower-paintings wall (natural aspect)
 *   4. BulletList    — ESSENTIALS bullets (left) + necklace image (right)
 *   5. BulletList    — ceiling+lounge image (left) + EXPERIENCE bullets (right)
 *   6. EditorialSplit — staircase image (left) + black panel "Explore Gallery"
 *   7. EditorialSplit — emerald panel "Visit The Museum" + architectural map (right)
 *   8. QuestionPanel  — library image (left) + cream panel "Have a Question?"
 *
 * Idempotent: re-running deletes the previous [momh-mg-seed] media +
 * the page doc and recreates fresh.
 */

import type { Payload, PayloadRequest, File } from 'payload'
import fs from 'fs/promises'
import path from 'path'

import { p, richText } from '../seed-momh/lexical'
import { PROTECTED_STEMS } from '../seed-momh/sharedFiles'

const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const MEDIA_DIR = path.join(PUBLIC_DIR, 'media')

const SEED_ALT_MARKER = '[momh-mg-seed]'

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
  'momh-assets/museum-guidelines/mg-flower-wall.jpg',
  'momh-assets/museum-guidelines/mg-essentials.jpg',
  'momh-assets/museum-guidelines/mg-experience.jpg',
  'momh-assets/museum-guidelines/mg-staircase.jpg',
  'momh-assets/museum-guidelines/mg-archmap.jpg',
  'momh-assets/museum-guidelines/mg-library.jpg',
  // Icons reused from the home page's artboard set. These small
  // trimmed PNGs are already on disk from the seed-momh run.
  'momh-assets/artboard-30.png', // fish icon (white)
  'momh-assets/artboard-31.png', // peacock/bird icon (white)
  'momh-assets/artboard-32.png', // phoenix/leaf icon (brown)
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

/** Bullet item helper — wraps a plain string into the array shape
 *  expected by BulletList's `items` field (`{ text: richText }`). */
const bullet = (text: string) => ({ text: p(text) })

export const seedMuseumGuidelines = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}) => {
  payload.logger.info('— Seeding MOMH Museum Guidelines page')

  payload.logger.info('  • clearing previous MG seed media')
  await payload.delete({
    collection: 'media',
    req,
    where: { alt: { contains: SEED_ALT_MARKER } },
  })

  payload.logger.info('  • clearing leftover media files on disk')
  await wipeSeedFilesOnDisk()

  payload.logger.info('  • removing existing museum-guidelines page (if any)')
  await payload.delete({
    collection: 'pages',
    req,
    where: { slug: { equals: 'museum-guidelines' } },
  })

  payload.logger.info('  • uploading 10 MG page assets (7 images + 3 icons)')
  const uploads: Array<{ key: string; relPath: string; alt: string }> = [
    {
      key: 'haveliTop',
      relPath: 'momh-assets/inner-banner-cropped.jpg',
      alt: 'Shekhawat Haveli — cropped twilight façade banner',
    },
    {
      key: 'flowerWall',
      relPath: 'momh-assets/museum-guidelines/mg-flower-wall.jpg',
      alt: 'MOMH gallery wall lined with framed botanical paintings and jewellery vitrine',
    },
    {
      key: 'essentials',
      relPath: 'momh-assets/museum-guidelines/mg-essentials.jpg',
      alt: 'Gold meenakari necklace displayed in a dark exhibition vitrine',
    },
    {
      key: 'experience',
      relPath: 'momh-assets/museum-guidelines/mg-experience.jpg',
      alt: 'Painted floral ceiling above a quiet visitor lounge with chairs and a low table',
    },
    {
      key: 'staircase',
      relPath: 'momh-assets/museum-guidelines/mg-staircase.jpg',
      alt: 'White spiral staircase rising above a dark marble floor — MOMH interior',
    },
    {
      key: 'archMap',
      relPath: 'momh-assets/museum-guidelines/mg-archmap.jpg',
      alt: "Top-down painted plan of Shekhawat Haveli's gardens and architecture",
    },
    {
      key: 'library',
      relPath: 'momh-assets/museum-guidelines/mg-library.jpg',
      alt: 'MOMH library / reading lounge with bookshelves, sofas and pendant lighting',
    },
    {
      key: 'iconFish',
      relPath: 'momh-assets/artboard-30.png',
      alt: 'White fish icon — Visit The Museum panel',
    },
    {
      key: 'iconBird',
      relPath: 'momh-assets/artboard-31.png',
      alt: 'White peacock icon — Explore Gallery panel',
    },
    {
      key: 'iconLeaf',
      relPath: 'momh-assets/artboard-32.png',
      alt: 'Brown phoenix/leaf icon — Have a Question panel',
    },
  ]
  const ids: Record<string, number> = {}
  for (const u of uploads) {
    ids[u.key] = await uploadImage(payload, u.relPath, u.alt, req)
  }
  const {
    haveliTop,
    flowerWall,
    essentials,
    experience,
    staircase,
    archMap,
    library,
    iconFish,
    iconBird,
    iconLeaf,
  } = ids

  payload.logger.info('  • creating museum-guidelines page')

  const page = await payload.create({
    collection: 'pages',
    req,
    data: {
      title: 'Museum Guidelines',
      slug: 'museum-guidelines',
      _status: 'published',
      hero: { type: 'none' },
      layout: [
        // 1. Top haveli — full-bleed dark banner, natural aspect.
        {
          blockType: 'imageBanner',
          image: haveliTop,
          headerTheme: 'dark',
          height: 'natural',
        },

        // 2. Centered intro.
        {
          blockType: 'sectionIntro',
          backgroundColor: 'ivory',
          showTopDivider: true,
          eyebrow: 'Events At MoMH',
          headline: p('Museum *Guidelines*'),
          body: p(
            'Welcome to the Museum of Meenakari Heritage. To ensure a safe, respectful, and unhurried experience for every visitor, please take a moment to review our guidelines before you arrive.',
          ),
        },

        // 3. Flower-paintings wall full-bleed image inset.
        {
          blockType: 'imageBanner',
          image: flowerWall,
          headerTheme: 'light',
          height: 'natural',
        },

        // 4. ESSENTIALS — bullets left, image right.
        {
          blockType: 'bulletList',
          backgroundColor: 'ivory',
          imagePosition: 'right',
          image: essentials,
          eyebrow: 'ESSENTIALS',
          items: [
            bullet(
              'The museum is open Monday to Saturday, 11:00 AM to 6:00 PM. Closed on Sundays and select Indian public holidays.',
            ),
            bullet('Entry is by prior appointment only. We do not sell tickets at the door.'),
            bullet(
              "The museum is located inside Shekhawat Haveli, E141, Sardar Patel Marg, in Jaipur's C-Scheme neighbourhood.",
            ),
            bullet(
              'We recommend arriving 15 minutes before your scheduled slot to allow for a calm beginning.',
            ),
            bullet('The galleries are designed for a contemplative, self-paced experience.'),
            bullet(
              'Private, guided walkthroughs are offered at curated hours each day. Request these at the time of booking.',
            ),
            bullet(
              'Smart casual or traditional Indian attire is preferred, to maintain the sanctity of the space.',
            ),
            bullet('Photography is permitted in select zones. Flash and video are not permitted.'),
            bullet(
              'The museum is fully wheelchair accessible, with ramps and elevator access throughout.',
            ),
            bullet('On-site valet service and private car drop-off are available.'),
          ],
        },

        // 5. EXPERIENCE — image left, bullets right.
        {
          blockType: 'bulletList',
          backgroundColor: 'ivory',
          imagePosition: 'left',
          image: experience,
          eyebrow: 'EXPERIENCE',
          items: [
            bullet(
              'The museum is set across a series of restored heritage courtyards, galleries, and salons, each curated to reflect a chapter in the journey of meenakari.',
            ),
            bullet('All exhibits carry bilingual labels in English and Hindi.'),
            bullet('QR-enabled audio insights are available at key installations.'),
            bullet(
              'Visitors are gently asked to move quietly through the exhibition rooms and to keep phones on silent.'),
            bullet(
              'The Museum Boutique offers a limited selection of enamel pieces, prints, and archival books, available exclusively on-site.',
            ),
            bullet(
              'Light refreshments and curated teas are served in our courtyard café, open 11:00 AM to 5:00 PM.',
            ),
            bullet(
              'We host monthly by-invitation events and masterclasses with artisans and historians. These are announced on our digital calendar and to our newsletter list.',
            ),
            bullet(
              'For private collection viewings, editorial collaborations, or international group visits, please write to us at least two weeks in advance.',
            ),
          ],
        },

        // 6. Gallery promo — staircase image left, BLACK panel right.
        //    Now using `editorialSplit` (same block as the home page)
        //    with the new `ctaStyle: 'arrow'` (default) for the italic
        //    "Explore More →" CTA. Section bg = black so the content
        //    column reads as the dark panel from PDF p5.
        {
          blockType: 'editorialSplit',
          image: staircase,
          imagePosition: 'left',
          backgroundColor: 'black',
          icon: iconBird,
          iconPosition: 'right',
          eyebrow: 'Gallery',
          headline: p('Explore *Gallery*'),
          body: p(
            'A visual archive of the museum, the pieces, and the hands that make them. From the engraver’s bench to the finished jewel laid in velvet, the gallery is the closest you can get to MOMH without crossing its threshold.',
          ),
          ctaLabel: 'Explore More',
          ctaStyle: 'arrow',
          ctaLink: { type: 'custom', url: '/plan-your-visit', newTab: false },
        },

        // 7. Visit The Museum promo — EMERALD panel left, archmap right.
        //    `editorialSplit` with `ctaStyle: 'filled-red'` for the
        //    rectangular "Book An Appointment" button.
        {
          blockType: 'editorialSplit',
          image: archMap,
          imagePosition: 'right',
          backgroundColor: 'emerald',
          // 40px white gap above so the emerald panel doesn't slam
          // directly against the black Gallery panel above it.
          topSpacing: 'md',
          icon: iconFish,
          iconPosition: 'left',
          eyebrow: "MoMH's Architecture",
          headline: p('Visit The *Museum*'),
          body: p(
            'Experience the timeless artistry of meenakari inside Jaipur’s Shekhawat Haveli, a space conceived, in equal measure, as a gallery, an archive, and a home for the craft.',
          ),
          ctaLabel: 'Book An Appointment',
          ctaStyle: 'filled-red',
          ctaLink: { type: 'custom', url: '/book-an-appointment', newTab: false },
        },

        // 8. Have a Question? — library image left, CREAM panel right.
        //    Dedicated `questionPanel` block: icon ABOVE headline, all
        //    content left-aligned, sitting at the INNER edge of the
        //    panel (toward the image seam at 50%vw), vertically centred.
        //    The "Question?" word is italicised via `richText()` and
        //    renders in brand red.
        {
          blockType: 'questionPanel',
          image: library,
          imagePosition: 'left',
          panelBackgroundColor: 'cream',
          // White gaps above + below — separate this final panel from
          // the emerald "Visit The Museum" block above and from the
          // global footer below, so the page breathes at the end.
          topSpacing: 'md',
          bottomSpacing: 'md',
          icon: iconLeaf,
          headline: richText([
            { text: 'Have a ' },
            { text: 'Question?', italic: true },
          ]),
          body: p(
            'If you are planning a research visit, a group programme, or a private viewing, our team is happy to help.',
          ),
          email: 'info@momhindia.org',
        },
      ],
    },
  })

  payload.logger.info(`  • created museum-guidelines page (id: ${page.id})`)

  return {
    pageId: page.id,
    uploadedMediaIds: ids,
  }
}
