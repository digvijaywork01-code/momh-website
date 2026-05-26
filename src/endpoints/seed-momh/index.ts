/**
 * MOMH home-page seed.
 *
 * Programmatic Payload Local API population: uploads a set of placeholder
 * images from public/ into the Media collection, then creates (or replaces)
 * the home page with the full MOMH editorial layout — one HeroBlock,
 * InfoHeroBlock, FounderQuoteBlock, seven EditorialSplitBlocks in PDF
 * order, one CardGridBlock, and one TwoColumnFeatureBlock.
 *
 * Idempotent: safe to re-run. Deletes the existing home page (if any) and
 * any media documents with `__momhSeed: true` in the alt text marker so we
 * don't pile up duplicates.
 *
 * Designed to be invoked from src/app/(frontend)/next/seed-momh/route.ts
 * (HTTP endpoint, dev-only) or anywhere else that has a Payload instance.
 */

import type { Payload, PayloadRequest, File } from 'payload'
import fs from 'fs/promises'
import path from 'path'

import { p, pp, richText } from './lexical'

const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const MEDIA_DIR = path.join(PUBLIC_DIR, 'media')

const SEED_ALT_MARKER = '[momh-seed]'

/** Read a file from public/ and shape it as a Payload `File`. */
async function readPublicFile(relPath: string): Promise<File> {
  const fullPath = path.join(PUBLIC_DIR, relPath)
  const data = await fs.readFile(fullPath)
  const name = path.basename(relPath)
  const extLower = path.extname(name).slice(1).toLowerCase()
  // Map common extensions to mime types so Payload accepts the upload.
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    gif: 'image/gif',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
  }
  return {
    name,
    data,
    mimetype: mimeMap[extLower] || 'application/octet-stream',
    size: data.byteLength,
  }
}

/** Source filenames (the ones we read out of public/). Each one + its
 *  resize derivatives gets purged from public/media/ before re-seeding.
 *
 *  These are the designer's home-page assets cropped + exported from
 *  Illustrator, sitting at `public/momh-assets/`. The mp4 is the haveli
 *  opener used as the InfoHero background video. */
const SEED_SOURCE_FILES = [
  // Big editorial images — switched to compressed JPG (artboard-15
  // through -28). The previous PNG set totalled ~145 MB; the JPGs
  // total ~10.7 MB while preserving visual quality at viewport
  // sizes. No transparency needed for these photos.
  'momh-assets/artboard-15.jpg',
  'momh-assets/artboard-16.jpg',
  'momh-assets/artboard-17.jpg',
  'momh-assets/artboard-18.jpg',
  'momh-assets/artboard-19.jpg',
  'momh-assets/artboard-20.jpg',
  'momh-assets/artboard-21.jpg',
  'momh-assets/artboard-22.jpg',
  'momh-assets/artboard-23.jpg',
  'momh-assets/artboard-24.jpg',
  'momh-assets/artboard-25.jpg',
  'momh-assets/artboard-26.jpg',
  'momh-assets/artboard-27.jpg',
  'momh-assets/artboard-28.jpg',
  // Decorative icons (29-34) — kept as trimmed PNG because they need
  // transparent backgrounds to sit on the colored section panels
  // (black, emerald, maroon, cream). The trimmed PNGs are already
  // tiny (~6-41 KB each) so no compression upside.
  'momh-assets/artboard-29.png',
  'momh-assets/artboard-30.png',
  'momh-assets/artboard-31.png',
  'momh-assets/artboard-32.png',
  'momh-assets/artboard-33.png',
  'momh-assets/artboard-34.png',
  'momh-assets/landing-page-opener.mp4',
  'momh-assets/founder-signature.png',
]

/** Delete any file in public/media whose name starts with a basename from
 *  SEED_SOURCE_FILES (covers the original + Payload's resize derivatives
 *  + auto-rename collisions like `Haveli-1.png` and `card4-2-1400x930.png`). */
async function wipeSeedFilesOnDisk(): Promise<void> {
  try {
    const files = await fs.readdir(MEDIA_DIR)
    const stems = SEED_SOURCE_FILES.map((f) => path.parse(f).name)
    const toDelete = files.filter((f) =>
      stems.some((stem) => f.startsWith(stem)),
    )
    await Promise.all(
      toDelete.map((f) =>
        fs.unlink(path.join(MEDIA_DIR, f)).catch(() => undefined),
      ),
    )
  } catch (err) {
    // Directory doesn't exist yet — nothing to do.
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }
}

/** Upload one image and return its ID. Reused everywhere a media field is needed. */
async function uploadImage(
  payload: Payload,
  relPath: string,
  alt: string,
  req: PayloadRequest,
): Promise<number> {
  const file = await readPublicFile(relPath)
  const doc = await payload.create({
    collection: 'media',
    data: { alt: `[momh-seed] ${alt}` },
    file,
    req,
  })
  return doc.id as number
}

export const seedMomhHome = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}) => {
  payload.logger.info('— Seeding MOMH home page')

  // 1. Clean previously-seeded media (anything with the SEED_ALT_MARKER).
  //    Using `contains` not `like` because Payload's `like` doesn't reliably
  //    match bracketed substrings.
  payload.logger.info('  • clearing previous MOMH seed media')
  await payload.delete({
    collection: 'media',
    req,
    where: { alt: { contains: SEED_ALT_MARKER } },
  })

  // 1a. Payload's filename uniqueness check inspects DISK too, not just the
  //     DB. If older seed runs crashed mid-flight, the resized derivatives
  //     and originals can stay behind in public/media/, causing the next
  //     upload to be auto-renamed (Haveli-1.png, card4-2.png, …) and then
  //     to collide a second time on the already-renamed name. Sweep the
  //     directory clean of any files that match our placeholder set.
  payload.logger.info('  • clearing leftover media files on disk')
  await wipeSeedFilesOnDisk()

  // 2. Delete existing home page so we can recreate clean.
  payload.logger.info('  • removing existing home page (if any)')
  await payload.delete({
    collection: 'pages',
    req,
    where: { slug: { equals: 'home' } },
  })

  // 3. Upload the designer's home-page assets (downloaded from gdrive and
  //    sitting in public/momh-assets/). Each file is uploaded once and the
  //    ID is shared across the blocks that need it.
  //
  //    Mapping of artboards → roles (identified by viewing each thumbnail):
  //      15 → haveli at dusk (Hero + InfoHero bg)
  //      16 → Sunita Shekhawat portrait (Founder)
  //      17 → pichvai aerial palace painting (About MoMH)
  //      18 → Mughal miniature, rider + falcon (Craftsmanship)
  //      19 → haveli arched entrance close-up (Architecture)
  //      20 → 4×4 enamel tile grid (Events)
  //      21 → macro hand + meenakari pendant (Collection)
  //      22 → spiral staircase interior (Gallery)
  //      23 → multiple meenakari pendants in hand (Craft Jewellery)
  //      24 → red mandala framed exhibits (Deccan Chronicle card)
  //      25 → museum exhibit wall (Lifestyle Asia card)
  //      26 → wall of flower paintings (Mint Lounge card)
  //      27 → museum guests / tour group (Newsletter)
  //      28 → red mandala close-up (Blog featured story)
  //      29 → red floral icon (Founder)
  //      30 → white fish icon (About + Craft Jewellery)
  //      31 → white peacock icon (Craftsmanship + Gallery)
  //      32 → brown phoenix icon (Architecture)
  //      33 → white bouquet icon (Events)
  //      34 → white floral icon (Collection)
  //      landing-page-opener.mp4 → InfoHero background video
  payload.logger.info('  • uploading 20 PNGs + 1 mp4 from public/momh-assets/')

  // Sequentialize uploads. Parallel inserts can race Payload's filename
  // uniqueness check, leading to phantom collisions ("Value must be unique"
  // even when filenames are distinct in the request set).
  const uploads: Array<{ key: string; relPath: string; alt: string }> = [
    { key: 'haveli', relPath: 'momh-assets/artboard-15.jpg', alt: 'Shekhawat Haveli at dusk' },
    { key: 'founderPortrait', relPath: 'momh-assets/artboard-16.jpg', alt: 'Sunita Shekhawat portrait' },
    { key: 'pichvai', relPath: 'momh-assets/artboard-17.jpg', alt: 'Pichvai-style palace painting' },
    { key: 'miniature', relPath: 'momh-assets/artboard-18.jpg', alt: 'Mughal miniature — rider with falcon' },
    { key: 'havelArch', relPath: 'momh-assets/artboard-19.jpg', alt: 'Shekhawat Haveli arched entrance' },
    { key: 'enamelTiles', relPath: 'momh-assets/artboard-20.jpg', alt: 'Enamel colour-tile grid' },
    { key: 'collectionPendant', relPath: 'momh-assets/artboard-21.jpg', alt: 'Meenakari pendant macro' },
    { key: 'staircase', relPath: 'momh-assets/artboard-22.jpg', alt: 'Museum spiral staircase' },
    { key: 'craftMacro', relPath: 'momh-assets/artboard-23.jpg', alt: 'Meenakari pendants in maker’s hand' },
    { key: 'pressDeccan', relPath: 'momh-assets/artboard-24.jpg', alt: 'Deccan Chronicle — red mandala exhibits' },
    { key: 'pressLifestyle', relPath: 'momh-assets/artboard-25.jpg', alt: 'Lifestyle Asia — museum exhibit wall' },
    { key: 'pressMint', relPath: 'momh-assets/artboard-26.jpg', alt: 'Mint Lounge — flower painting wall' },
    { key: 'newsletterImg', relPath: 'momh-assets/artboard-27.jpg', alt: 'Museum guests tour group' },
    { key: 'blogMandala', relPath: 'momh-assets/artboard-28.jpg', alt: 'Red mandala enamel piece' },
    // Section icons (the small silhouettes at the top of content panels)
    { key: 'iconFloralRed', relPath: 'momh-assets/artboard-29.png', alt: 'Red floral icon (Founder)' },
    { key: 'iconFishWhite', relPath: 'momh-assets/artboard-30.png', alt: 'White fish icon (About, Craft Jewellery)' },
    { key: 'iconPeacockWhite', relPath: 'momh-assets/artboard-31.png', alt: 'White peacock icon (Craftsmanship, Gallery)' },
    { key: 'iconPhoenixBrown', relPath: 'momh-assets/artboard-32.png', alt: 'Brown phoenix icon (Architecture)' },
    { key: 'iconBouquetWhite', relPath: 'momh-assets/artboard-33.png', alt: 'White bouquet icon (Events)' },
    { key: 'iconFloralWhite', relPath: 'momh-assets/artboard-34.png', alt: 'White floral icon (Collection)' },
    // Background video for InfoHero (PDF p2)
    { key: 'haveliVideo', relPath: 'momh-assets/landing-page-opener.mp4', alt: 'Haveli opener video' },
    // Sunita Shekhawat handwritten signature — sits between quote and attribution.
    { key: 'founderSignature', relPath: 'momh-assets/founder-signature.png', alt: 'Sunita Shekhawat signature' },
  ]

  const ids: Record<string, number> = {}
  for (const u of uploads) {
    ids[u.key] = await uploadImage(payload, u.relPath, u.alt, req)
  }
  const {
    haveli: haveliId,
    founderPortrait: founderPortraitId,
    pichvai: pichvaiId,
    miniature: miniatureId,
    havelArch: havelArchId,
    enamelTiles: enamelTilesId,
    collectionPendant: collectionPendantId,
    staircase: staircaseId,
    craftMacro: craftMacroId,
    pressMint: pressMintId,
    pressLifestyle: pressLifestyleId,
    pressDeccan: pressDeccanId,
    blogMandala: blogMandalaId,
    newsletterImg: newsletterImgId,
    iconFloralRed: iconFloralRedId,
    iconFishWhite: iconFishWhiteId,
    iconPeacockWhite: iconPeacockWhiteId,
    iconPhoenixBrown: iconPhoenixBrownId,
    iconBouquetWhite: iconBouquetWhiteId,
    iconFloralWhite: iconFloralWhiteId,
    haveliVideo: haveliVideoId,
    founderSignature: founderSignatureId,
  } = ids

  payload.logger.info('  • creating home page')

  // 4. Build the home page with all the new MOMH blocks in PDF order.
  const home = await payload.create({
    collection: 'pages',
    req,
    data: {
      title: 'Home',
      slug: 'home',
      _status: 'published',
      hero: {
        type: 'none',
      },
      layout: [
        // ─── PDF page 1 — Hero (editorial). No eyebrow on this page.
        //     Background uses the haveli opener video (Hero is the entry
        //     moment; InfoHero below uses the still image). ───
        {
          blockType: 'heroBlock',
          backgroundImage: haveliVideoId,
          headline: p('A Living Archive of *Meenakari*, in the *Heart of Jaipur*'),
          body: p(
            "The Museum of Meenakari Heritage is India's first museum devoted entirely to the centuries-old art of enamelling on gold. Set within Shekhawat Haveli, it is a quiet, deliberate space where craft is honoured as scholarship.",
          ),
          showScrollIndicator: true,
        },

        // ─── PDF page 2 — Info Hero (Book an Appointment).
        //     No headline / subline overlay — the PDF design is just the
        //     photo + nav + two info cards on the bottom-left. ───
        {
          blockType: 'infoHero',
          // Still haveli image — the video now lives on the Hero (above).
          // No dark overlay: PDF p2 shows the haveli at natural exposure.
          backgroundMedia: haveliId,
          overlayDarkness: 0,
          infoCards: [
            {
              label: 'Museum Hours',
              value: 'Monday to Saturday, 11 am to 6 pm',
              ctaLabel: 'Book an Appointment',
              ctaUrl: '/book-an-appointment',
            },
            {
              label: 'Museum Location',
              value: 'E141, Sardar Patel Marg, Jaipur, Rajasthan',
              ctaLabel: 'Museum Guidelines',
              ctaUrl: '/museum-guidelines',
            },
          ],
        },

        // ─── PDF page 3 — Founder Quote ───
        {
          blockType: 'founderQuote',
          portrait: founderPortraitId,
          portraitPosition: 'left',
          icon: iconFloralRedId,
          eyebrow: 'A Note By',
          title: 'The Founder',
          quote: p(
            "The Art of Meenakari is where centuries of devotion meet meticulous design. Each stroke, each shade is a testament to a legacy that continues to shape India's cultural soul.",
          ),
          signature: founderSignatureId,
          attribution: 'Sunita Shekhawat',
          attributionRole: 'Museum Director & Founder',
          backgroundColor: 'cream',
        },

        // ─── PDF page 4 — About MoMH (Editorial Split, black bg, image right) ───
        {
          blockType: 'editorialSplit',
          image: pichvaiId,
          imagePosition: 'right',
          backgroundColor: 'black',
          icon: iconFishWhiteId,
          iconPosition: 'left',
          eyebrow: 'About MoMH',
          headline: p('Museum of *Meenakari* Heritage'),
          body: richText([
            {
              text: "The House of Sunita Shekhawat unveils the Museum of Meenakari Heritage (MOMH). Housed within Shekhawat Haveli, the permanent gallery traces meenakari's journey from Renaissance Europe to the royal courts of Jaipur through 300+ archival images, faithful reproductions, and original creations by the House of Shekhawat.",
            },
          ]),
          featuredLine: pp(
            'It is, simply, the *first private museum* in India',
            'dedicated to a *local heritage craft*.',
          ),
          ctaLabel: 'Explore Our Story',
          ctaArrowPosition: 'right',
          ctaLink: { type: 'custom', url: '/about', newTab: false },
        },

        // ─── PDF page 5 — The Art of Craftsmanship (emerald, image left) ───
        {
          blockType: 'editorialSplit',
          image: miniatureId,
          imagePosition: 'left',
          backgroundColor: 'emerald',
          icon: iconPeacockWhiteId,
          iconPosition: 'right',
          eyebrow: 'Form & Foundation',
          headline: p('The Art of *Craftsmanship*'),
          body: p(
            'At MOMH, visitors trace the journey of meenakari from raw gold sheet to finished jewel, revealing the extraordinary precision behind every creation. The galleries explore historic enamelling traditions including cloisonné, champlevé, plique-à-jour, and basse-taille, alongside Indian techniques such as Ab-e-lehr, Boond-tila, and Ferozi-zamin — each preserving generations of artistry and craftsmanship.',
          ),
          ctaLabel: 'Explore The Craft',
          ctaArrowPosition: 'right',
          ctaLink: { type: 'custom', url: '/collections/craftsmanship', newTab: false },
        },

        // ─── PDF page 6 — The Architecture (cream, image right) ───
        {
          blockType: 'editorialSplit',
          image: havelArchId,
          imagePosition: 'right',
          backgroundColor: 'cream',
          icon: iconPhoenixBrownId,
          iconPosition: 'left',
          eyebrow: "MoMH's Architecture",
          headline: p('The *Architecture*'),
          body: richText(
            [
              {
                text: "Shekhawat Haveli rises in Jodhpuri red sandstone, its latticed jharokhas and hand-painted ceilings a quiet conversation with old Jaipur. Conceived by Siddhartha Das Studio, the building's interiors move through a palette of ivory, maroon, and brown, punctuated by teak wood and antique brass, to set a contemplative tone for the galleries within.",
              },
            ],
            [
              {
                text: 'Locally sourced materials. Heritage-inspired detail. The spirit of Made in India, embedded in every surface.',
              },
            ],
          ),
          ctaLabel: 'Explore The Space',
          ctaArrowPosition: 'right',
          ctaLink: { type: 'custom', url: '/architecture', newTab: false },
        },

        // ─── PDF page 7 — An Era of Enamel at MoMH (black, image left) ───
        {
          blockType: 'editorialSplit',
          image: enamelTilesId,
          imagePosition: 'left',
          backgroundColor: 'black',
          icon: iconBouquetWhiteId,
          iconPosition: 'right',
          eyebrow: 'Events At MoMH',
          headline: p('An *Era of Enamel* at MoMH'),
          body: p(
            'MOMH hosts a curated calendar of by-invitation events, masterclasses with artisans and historians, and editorial collaborations through the year.',
          ),
          featuredLine: richText([
            { text: 'Upcoming: ', italic: true },
            { text: 'An Era of Enamel at MOMH, September 7, 2025' },
          ]),
          ctaLabel: 'View All Events',
          ctaArrowPosition: 'right',
          ctaLink: { type: 'custom', url: '/book-an-appointment', newTab: false },
        },

        // ─── PDF page 8 — Explore Our Collection (maroon, image right, arrow LEFT) ───
        {
          blockType: 'editorialSplit',
          image: collectionPendantId,
          imagePosition: 'right',
          backgroundColor: 'maroon',
          icon: iconFloralWhiteId,
          iconPosition: 'left',
          eyebrow: 'Collection',
          headline: p('Explore Our *Collection*'),
          body: p(
            "A tribute to the enduring art of enamelling, the MOMH collection traces the craft's journey across continents and centuries. Each piece, whether faithful reproduction or contemporary creation, is documented, contextualised, and placed in conversation with the wider history of Indian and global jewellery.",
          ),
          featuredLine: richText([
            { text: 'Featured story: ', bold: true },
            { text: 'The Royal Roots of Meenakari: A Jaipur Legacy. Tracing the craft from royal ateliers to contemporary jewellery houses.' },
          ]),
          ctaLabel: 'View The Entire Collection',
          ctaArrowPosition: 'left',
          ctaLink: { type: 'custom', url: '/collections', newTab: false },
        },

        // ─── PDF page 9 — Explore Gallery (black, image left, text right-aligned) ───
        {
          blockType: 'editorialSplit',
          image: staircaseId,
          imagePosition: 'left',
          backgroundColor: 'black',
          icon: iconPeacockWhiteId,
          iconPosition: 'right',
          eyebrow: 'Gallery',
          headline: p('Explore *Gallery*'),
          body: p(
            'A visual archive of the museum, the pieces, and the hands that make them. From the engraver’s bench to the finished jewel laid in velvet, the gallery is the closest you can get to MOMH without crossing its threshold.',
          ),
          ctaLabel: 'Explore More',
          ctaArrowPosition: 'right',
          ctaLink: { type: 'custom', url: '/plan-your-visit', newTab: false },
        },

        // ─── PDF page 10 — Craft Your Jewellery With Us (emerald, image left) ───
        {
          blockType: 'editorialSplit',
          image: craftMacroId,
          imagePosition: 'left',
          backgroundColor: 'emerald',
          icon: iconFishWhiteId,
          iconPosition: 'right',
          eyebrow: 'Form & Foundation',
          headline: p('Craft Your *Jewellery* With Us'),
          body: p(
            "The museum is also a beginning. For those who wish to carry a piece of this heritage forward, MOMH offers private consultations with our master artisans, a slow, considered process of designing a bespoke jewel that becomes part of your own family’s archive.",
          ),
          ctaLabel: 'Book Your Consultation',
          ctaArrowPosition: 'right',
          ctaLink: { type: 'custom', url: '/book-an-appointment', newTab: false },
        },

        // ─── PDF page 11 — MoMH In News (CardGrid 3-up, black bg) ───
        {
          blockType: 'cardGrid',
          eyebrow: 'Press',
          headline: p('MoMH In *News*'),
          columns: '3',
          backgroundColor: 'black',
          cards: [
            {
              image: pressMintId,
              title: 'Mint Lounge',
              summary: 'Exploring the centuries-old tradition of meenakari.',
              ctaLabel: 'Read Full Article',
              ctaArrowPosition: 'right',
              ctaLink: {
                type: 'custom',
                url: 'https://www.livemint.com/mint-lounge/style/meenakari-museum-jaipur-sunita-shekhawat-jewellery-history-enamelling-mughal-111710417228358.html',
                newTab: true,
              },
            },
            {
              image: pressLifestyleId,
              title: 'Lifestyle Asia',
              summary:
                'How the museum preserves the elegance and excellence of meenakari craftsmanship.',
              ctaLabel: 'Read Full Article',
              ctaArrowPosition: 'right',
              ctaLink: {
                type: 'custom',
                url: 'https://www.lifestyleasia.com/ind/style/jewellery/sunita-shekhawat-museum-of-meenakari-heritage/',
                newTab: true,
              },
            },
            {
              image: pressDeccanId,
              title: 'Deccan Chronicle',
              summary:
                'An enchanting look at timeless gemstone and enamel creations now housed at MOMH.',
              ctaLabel: 'Read Full Article',
              ctaArrowPosition: 'right',
              ctaLink: {
                type: 'custom',
                url: 'https://www.deccanchronicle.com/tabloid/hyderabad-chronicle/the-magic-of-meenakari-889556',
                newTab: true,
              },
            },
          ],
        },

        // ─── PDF page 12 — Blogs + Newsletter (TwoColumnFeature, cream bg) ───
        // Left column = blog teaser promo. Right column = inline newsletter
        // widget (email input + SUBSCRIBE button) matching the PDF exactly.
        {
          blockType: 'twoColumnFeature',
          backgroundColor: 'cream',
          columnA: {
            enabled: true,
            type: 'promo',
            eyebrow: 'Press',
            headline: p('Our *Blogs*'),
            image: blogMandalaId,
            body: richText([
              { text: 'History & Heritage', bold: true },
              { text: ' · The Royal Roots of Meenakari: A Jaipur Legacy. Trace the centuries-old tradition of meenakari, from royal ateliers to today’s contemporary jewellery houses.' },
            ]),
            ctaLabel: 'Read Full Blog',
            ctaLink: { type: 'custom', url: '/blog/royal-roots-of-meenakari', newTab: false },
          },
          columnB: {
            enabled: true,
            type: 'newsletter',
            eyebrow: 'Press',
            headline: p('Our *Newsletter*'),
            image: newsletterImgId,
            body: p('Be the first to know about our events, exhibitions, artists, and much more.'),
            newsletterInputLabel: 'Email Address:',
            newsletterButtonLabel: 'SUBSCRIBE',
            // Submission endpoint left blank — widget shows a local
            // "Subscribed" confirmation. Wire to /api/newsletter or a
            // Payload Form when ready.
            newsletterEndpoint: '',
          },
        },
      ],
    },
  })

  payload.logger.info(`✓ Home page created: id=${home.id}, slug=${home.slug}`)

  return {
    homeId: home.id,
    mediaIds: {
      haveli: haveliId,
      haveliVideo: haveliVideoId,
      founderPortrait: founderPortraitId,
      pichvai: pichvaiId,
      miniature: miniatureId,
      havelArch: havelArchId,
      enamelTiles: enamelTilesId,
      collectionPendant: collectionPendantId,
      staircase: staircaseId,
      craftMacro: craftMacroId,
      pressMint: pressMintId,
      pressLifestyle: pressLifestyleId,
      pressDeccan: pressDeccanId,
      blogMandala: blogMandalaId,
      newsletterImg: newsletterImgId,
      iconFloralRed: iconFloralRedId,
      iconFishWhite: iconFishWhiteId,
      iconPeacockWhite: iconPeacockWhiteId,
      iconPhoenixBrown: iconPhoenixBrownId,
      iconBouquetWhite: iconBouquetWhiteId,
      iconFloralWhite: iconFloralWhiteId,
    },
  }
}
