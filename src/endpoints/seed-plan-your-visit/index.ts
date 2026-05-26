/**
 * MOMH "Plan Your Visit" page seed.
 *
 * Programmatic Payload Local API population for the second editorial page of
 * the MOMH site. Uploads 6 cropped images from `public/momh-assets/visit/`
 * into the Media collection, then creates (or replaces) the page at slug
 * `plan-your-visit` with the 8 blocks in PDF order:
 *
 *   1. ImageBanner   — top haveli exterior
 *   2. SectionIntro  — "Plan Your *Visit*"
 *   3. VisitInfo     — Getting Here (map + address + hours)
 *   4. Carousel      — Craft Your Jewellery (image right)
 *   5. Carousel      — Museum Guidelines (image left, ACCESSIBILITY note panel)
 *   6. FAQ           — Frequently Asked Questions (7 items)
 *   7. ImageBanner   — bottom haveli exterior
 *
 * Idempotent: re-running deletes the previous [momh-plan-visit-seed] media +
 * the page doc and recreates fresh. Designed to be invoked from
 * `src/app/(frontend)/next/seed-plan-your-visit/route.ts`.
 */

import type { Payload, PayloadRequest, File } from 'payload'
import fs from 'fs/promises'
import path from 'path'

import { p, pp } from '../seed-momh/lexical'
import { PROTECTED_STEMS } from '../seed-momh/sharedFiles'

const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const MEDIA_DIR = path.join(PUBLIC_DIR, 'media')

const SEED_ALT_MARKER = '[momh-plan-visit-seed]'

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

// One file per PDF slot (file names reflect ACTUAL image content):
//   visit-haveli-top       → ImageBanner (top, full-bleed) — twilight close-up of Shekhawat Haveli entrance
//   visit-2-map            → VisitInfo.mapImage (Getting Here)
//   visit-jewelry          → Carousel "Craft Your Jewellery" — gold leaf pendant on painted background
//   visit-artisan          → Carousel "Craft Your Jewellery" — enamel artisan's hand with colour palette
//   visit-museum-exhibit   → Carousel "Museum Guidelines" — dark gallery with vitrine + exhibit wall
//   visit-museum-lobby     → Carousel "Museum Guidelines" — lounge/lobby with elevator
//   visit-5-haveli-bottom  → ImageBanner (bottom, full-bleed) — daylight panoramic façade
//
// `visit-haveli-night.jpg` (moonlit haveli) and `visit-jewelry-2.jpg`
// (alt jewelry crop) are kept in public/ as spares but NOT uploaded
// here — the PDF layout uses the four canonical carousel images
// listed above (per the user's Drive folder).
const SEED_SOURCE_FILES = [
  'momh-assets/inner-banner-cropped.jpg', // shared cropped 4:1 inner-page top banner
  'momh-assets/visit/visit-haveli-top.jpg',
  'momh-assets/visit/visit-2-map.jpg',
  'momh-assets/visit/visit-jewelry.jpg',
  'momh-assets/visit/visit-artisan.jpg',
  'momh-assets/visit/visit-museum-exhibit.jpg',
  'momh-assets/visit/visit-museum-lobby.jpg',
  'momh-assets/visit/visit-5-haveli-bottom.jpg',
  // Third slide for each carousel — user-supplied. No repeats:
  // each carousel ends up with 3 unique slides.
  'momh-assets/visit/visit-jewelry-3.jpg',
  'momh-assets/visit/visit-museum-3.jpg',
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

export const seedPlanYourVisit = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}) => {
  payload.logger.info('— Seeding MOMH Plan Your Visit page')

  // 1. Clear previously-seeded media (anything with our marker).
  payload.logger.info('  • clearing previous Plan-Your-Visit seed media')
  await payload.delete({
    collection: 'media',
    req,
    where: { alt: { contains: SEED_ALT_MARKER } },
  })

  // 1a. Sweep leftover files on disk so the next upload doesn't collide.
  payload.logger.info('  • clearing leftover media files on disk')
  await wipeSeedFilesOnDisk()

  // 2. Delete existing Plan Your Visit page so we can recreate clean.
  payload.logger.info('  • removing existing plan-your-visit page (if any)')
  await payload.delete({
    collection: 'pages',
    req,
    where: { slug: { equals: 'plan-your-visit' } },
  })

  // 3. Upload the 9 layout images (7 originals + 2 carousel third
  //     slides from the user's later Drive drop). No repeats — each
  //     carousel ends up with 3 unique slides.
  payload.logger.info('  • uploading 9 visit-page images')
  const uploads: Array<{ key: string; relPath: string; alt: string }> = [
    {
      key: 'haveliTop',
      relPath: 'momh-assets/inner-banner-cropped.jpg',
      alt: 'Shekhawat Haveli — cropped twilight façade banner',
    },
    {
      key: 'mapShot',
      relPath: 'momh-assets/visit/visit-2-map.jpg',
      alt: 'Google Map showing the Museum of Meenakari Heritage location',
    },
    {
      key: 'jewelry',
      relPath: 'momh-assets/visit/visit-jewelry.jpg',
      alt: 'Meenakari gold leaf pendant set on a painted botanical study — bespoke consultation',
    },
    {
      key: 'artisan',
      relPath: 'momh-assets/visit/visit-artisan.jpg',
      alt: 'Master artisan applying enamel colour with a fine tool — colour palette in hand',
    },
    {
      key: 'museumExhibit',
      relPath: 'momh-assets/visit/visit-museum-exhibit.jpg',
      alt: 'MOMH gallery interior — dark exhibition hall with central vitrine and panel wall',
    },
    {
      key: 'museumLobby',
      relPath: 'momh-assets/visit/visit-museum-lobby.jpg',
      alt: 'MOMH lounge with round elevator column, beige armchairs and coffee-table books',
    },
    {
      key: 'haveliBottom',
      relPath: 'momh-assets/visit/visit-5-haveli-bottom.jpg',
      alt: 'Shekhawat Haveli at twilight — full façade with jali screens against blue sky',
    },
    // ─── Carousel third slides (Drive drop #2) ───
    {
      key: 'jewelry3',
      relPath: 'momh-assets/visit/visit-jewelry-3.jpg',
      alt: 'Artisan\'s hands holding a gold-and-purple meenakari piece in progress — palette tray in background',
    },
    {
      key: 'museum3',
      relPath: 'momh-assets/visit/visit-museum-3.jpg',
      alt: 'MOMH spiral staircase — sculpted wooden banister winding through the gallery interior',
    },
  ]

  const ids: Record<string, number> = {}
  for (const u of uploads) {
    ids[u.key] = await uploadImage(payload, u.relPath, u.alt, req)
  }
  const {
    haveliTop,
    mapShot,
    jewelry,
    artisan,
    museumExhibit,
    museumLobby,
    haveliBottom,
    jewelry3,
    museum3,
  } = ids

  payload.logger.info('  • creating plan-your-visit page')

  // 4. Build the page with all 7 blocks in PDF order.
  // Google Maps link for the museum address — no API key required.
  const MAPS_URL =
    'https://maps.google.com/?q=Shekhawat+Haveli+E141+Sardar+Patel+Marg+Durgadas+Colony+C-Scheme+Jaipur+Rajasthan+302001'

  const page = await payload.create({
    collection: 'pages',
    req,
    data: {
      title: 'Plan Your Visit',
      slug: 'plan-your-visit',
      _status: 'published',
      hero: { type: 'none' },
      layout: [
        // ─── 1. Top haveli — full-bleed dark-header banner at the
        // image's natural 4:1 aspect (matches the cropped inner-page
        // banner shared by every inner route, so the visitor sees a
        // consistent slim header across PYV / CYJ / MG / PC / BAA /
        // thank-you). Previously this used height: 'screen' which
        // gave a full-viewport haveli photo — over-sized once the
        // cropped banner asset was introduced.
        {
          blockType: 'imageBanner',
          image: haveliTop,
          headerTheme: 'dark',
          height: 'natural',
        },

        // ─── 2. "Plan Your *Visit*" centered intro with hairline divider.
        {
          blockType: 'sectionIntro',
          backgroundColor: 'ivory',
          showTopDivider: true,
          tightBottom: true,
          eyebrow: 'Events At MoMH',
          headline: p('Plan Your *Visit*'),
          body: p(
            'Located in the heart of Jaipur, the Museum of Meenakari Heritage unfolds across a heritage haveli estate, where Rajasthani architecture and contemporary design hold space for a single, focused conversation about craft.',
          ),
        },

        // ─── 3. "Getting *Here*" — map + visit info panel.
        {
          blockType: 'visitInfo',
          backgroundColor: 'ivory',
          mapPosition: 'left',
          mapImage: mapShot,
          mapImageLink: MAPS_URL,
          headline: p('Getting *Here*'),
          address: pp(
            'Shekhawat Haveli, E141, Sardar Patel Marg',
            'Durgadas Colony, C-Scheme, Ashok Nagar, Jaipur, Rajasthan 302001',
          ),
          helperText: 'Looking for something specific? Our team is happy to help.',
          contactEmail: 'info@momhindia.org',
          ctas: [
            { label: 'Get Directions', href: MAPS_URL, newTab: true },
            { label: 'Book An Appointment', href: '/book-an-appointment', newTab: false },
          ],
          hours: [
            { day: 'Monday', hours: '11:00 AM to 6:00 PM', isClosed: false },
            { day: 'Tuesday', hours: '11:00 AM to 6:00 PM', isClosed: false },
            { day: 'Wednesday', hours: '11:00 AM to 6:00 PM', isClosed: false },
            { day: 'Thursday', hours: '11:00 AM to 6:00 PM', isClosed: false },
            { day: 'Friday', hours: '11:00 AM to 6:00 PM', isClosed: false },
            { day: 'Saturday', hours: '11:00 AM to 6:00 PM', isClosed: false },
            { day: 'Sunday', hours: '', isClosed: true },
          ],
          hoursNote:
            'Closed on select Indian public holidays. Please confirm before your visit.',
        },

        // ─── 4. "Craft Your *Jewellery* With Us" carousel (image right).
        //         PDF p2 has NO eyebrow on this section — the body sits
        //         directly under the headline. Carousel slides are now
        //         two distinct jewellery shots (visit-jewelry + the
        //         alternate composition from Links/11.jpg).
        {
          blockType: 'carousel',
          backgroundColor: 'ivory',
          imagePosition: 'right',
          headline: p('Craft Your *Jewellery* With Us'),
          body: p(
            "The museum is also a beginning. For those who wish to carry a piece of this heritage forward, MOMH offers private consultations with our master artisans, a slow, considered process of designing a bespoke jewel that becomes part of your own family's archive.",
          ),
          ctaLabel: 'Book Your Consultation',
          ctaLink: {
            type: 'custom',
            url: '/book-an-appointment',
            newTab: false,
          },
          // Three unique slides — no repeats. Slide order: pendant
          // (still life) → artisan (process) → artisan close-up
          // (purple meenakari in hand). 3 slides give Embla enough
          // surplus for clean loop + peek cloning at the column edge.
          images: [
            { image: jewelry, alt: 'Meenakari gold leaf pendant on painted botanical study' },
            { image: artisan, alt: 'Master artisan applying enamel colour with a fine tool' },
            { image: jewelry3, alt: 'Artisan\'s hands holding a gold-and-purple meenakari piece in progress' },
          ],
          slidesPerView: 1.15,
          autoplay: true,
          autoplayInterval: 4000,
          notePanel: { enabled: false },
        },

        // ─── 5. "Museum *Guidelines*" carousel (image left) + ACCESSIBILITY note.
        //         PDF p2 has NO eyebrow here either — body sits directly
        //         under the headline; "Explore More" is the CTA label only.
        {
          blockType: 'carousel',
          backgroundColor: 'ivory',
          imagePosition: 'left',
          headline: p('Museum *Guidelines*'),
          body: p(
            'Plan your visit with care. From dress code and access to photography rules and the rhythm of the galleries, our guidelines are designed to protect both the work on display and the experience of every visitor who walks through Shekhawat Haveli.',
          ),
          ctaLabel: 'Explore More',
          ctaLink: {
            type: 'custom',
            url: '/museum-guidelines',
            newTab: false,
          },
          // Three unique slides — no repeats. Slide order: exhibit
          // hall → lounge → spiral staircase (architectural detail).
          images: [
            { image: museumExhibit, alt: 'MOMH gallery — exhibition hall with central vitrine' },
            { image: museumLobby, alt: 'MOMH lounge with round elevator and reading tables' },
            { image: museum3, alt: 'MOMH spiral staircase — sculpted wooden banister winding through the gallery interior' },
          ],
          slidesPerView: 1.15,
          autoplay: true,
          autoplayInterval: 4000,
          notePanel: {
            enabled: true,
            eyebrow: 'Accessibility',
            body: pp(
              'MOMH is fully wheelchair accessible, with ramps and elevator access throughout. If you have specific access requirements, our team is glad to help you plan a comfortable visit.',
              'Write to us at info@momhindia.org.',
            ),
          },
        },

        // ─── 6. "Frequently Asked *Questions*" — 7 items from the PDF.
        //         No eyebrow per user direction; the centered headline
        //         is enough to anchor the section.
        {
          blockType: 'faq',
          backgroundColor: 'ivory',
          headline: p('Frequently Asked *Questions*'),
          intro: p(
            'Find answers to the questions most often asked about visiting MOMH, from opening hours and access to bespoke jewellery consultations. Everything you need for a thoughtful, unhurried visit.',
          ),
          items: [
            {
              question: 'Where is the Museum of Meenakari Heritage located?',
              answer: p(
                "MOMH is located inside Shekhawat Haveli at E141, Sardar Patel Marg, Durgadas Colony, C-Scheme, Jaipur. We are minutes from the city's major heritage landmarks and well connected from both Jaipur Airport and the railway station.",
              ),
            },
            {
              question: 'Do I need to book in advance?',
              answer: p(
                'Yes. Entry is by prior appointment only. This allows us to keep the galleries calm and to give each visitor the attention the work deserves.',
              ),
            },
            {
              question: 'How long does a typical visit take?',
              answer: p(
                'Most visitors spend between 60 and 90 minutes. Private guided walkthroughs run longer, depending on your interest.',
              ),
            },
            {
              question: 'Is photography allowed inside the museum?',
              answer: p(
                'Photography is welcome in select zones. Flash and video are not permitted, in order to protect the works on display. Our team will guide you on arrival.',
              ),
            },
            {
              question: 'Is the museum accessible for visitors with reduced mobility?',
              answer: p(
                'Yes. The museum is fully wheelchair accessible, with ramps and elevator access throughout. If you have specific requirements, please write to us in advance.',
              ),
            },
            {
              question: 'Can I commission a piece of jewellery during my visit?',
              answer: p(
                'Yes. MOMH offers private consultations with our master artisans for bespoke commissions. A typical commission takes six to eight months from concept to completion.',
              ),
            },
            {
              question: 'Are children welcome at the museum?',
              answer: p(
                'Yes, we welcome thoughtful visitors of every age. We do ask that families plan ahead so younger guests can move through the galleries comfortably.',
              ),
            },
          ],
        },

        // ─── 7. Bottom haveli — full-bleed dark banner. Use `natural`
        //         so the section's aspect-ratio matches the image's
        //         own dimensions (~1920×944, panoramic) and nothing
        //         gets cropped. With `tall` (80vh = 864px) the
        //         image's 944px height was being trimmed top + bottom.
        {
          blockType: 'imageBanner',
          image: haveliBottom,
          headerTheme: 'dark',
          height: 'natural',
        },
      ],
    },
  })

  payload.logger.info(`  • created plan-your-visit page (id: ${page.id})`)

  return {
    pageId: page.id,
    uploadedMediaIds: ids,
  }
}

