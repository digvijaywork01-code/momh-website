/**
 * MOMH "Book An Appointment" page seed.
 *
 * Programmatic Payload Local API population for the visit-booking
 * enquiry form page (linked from the "Visit" / "Book An Appointment"
 * nav items and 6+ in-page CTAs across home / PYV / Museum Guidelines
 * / craft-your-jewellery / gallery). Uploads 2 images (top haveli
 * shared with home/PYV/CYJ + the moonlit haveli reused from
 * /personal-consultation) and creates the page at slug
 * `book-an-appointment` with 4 blocks:
 *
 *   1. ImageBanner    — top haveli (natural aspect, dark header)
 *   2. SectionIntro   — "Book An *Appointment*" with `Form` eyebrow
 *   3. AppointmentForm — visit-booking enquiry form (10 fields)
 *   4. ContactPanel   — maroon contact panel LEFT + night-haveli RIGHT
 *                       (mirror of /personal-consultation, which has
 *                        the image on the LEFT)
 *
 * Idempotent: re-running deletes the previous [momh-bka-seed] media +
 * the page doc and recreates fresh.
 */

import type { Payload, PayloadRequest, File } from 'payload'
import fs from 'fs/promises'
import path from 'path'

import { p, richText } from '../seed-momh/lexical'
import { PROTECTED_STEMS } from '../seed-momh/sharedFiles'

const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const MEDIA_DIR = path.join(PUBLIC_DIR, 'media')

const SEED_ALT_MARKER = '[momh-bka-seed]'

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
  'momh-assets/personal-consultation/consultation-haveli-night.jpg',
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

export const seedBookAnAppointment = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}) => {
  payload.logger.info('— Seeding MOMH Book An Appointment page')

  payload.logger.info('  • clearing previous Book An Appointment seed media')
  await payload.delete({
    collection: 'media',
    req,
    where: { alt: { contains: SEED_ALT_MARKER } },
  })

  payload.logger.info('  • clearing leftover media files on disk')
  await wipeSeedFilesOnDisk()

  payload.logger.info('  • removing existing book-an-appointment page (if any)')
  await payload.delete({
    collection: 'pages',
    req,
    where: { slug: { equals: 'book-an-appointment' } },
  })

  payload.logger.info('  • uploading 2 appointment-page images')
  const uploads: Array<{ key: string; relPath: string; alt: string }> = [
    {
      key: 'haveliTop',
      relPath: 'momh-assets/inner-banner-cropped.jpg',
      alt: 'Shekhawat Haveli — cropped twilight façade banner',
    },
    {
      key: 'haveliNight',
      relPath: 'momh-assets/personal-consultation/consultation-haveli-night.jpg',
      alt: 'Shekhawat Haveli at night — moon visible above the building',
    },
  ]
  const ids: Record<string, number> = {}
  for (const u of uploads) {
    ids[u.key] = await uploadImage(payload, u.relPath, u.alt, req)
  }
  const { haveliTop, haveliNight } = ids

  payload.logger.info('  • creating book-an-appointment page')

  const page = await payload.create({
    collection: 'pages',
    req,
    data: {
      title: 'Book An Appointment',
      slug: 'book-an-appointment',
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

        // 2. "Book An *Appointment*" centered intro with `Form` eyebrow.
        {
          blockType: 'sectionIntro',
          backgroundColor: 'white',
          showTopDivider: true,
          tightBottom: true,
          eyebrow: 'Form',
          headline: p('Book An *Appointment*'),
          body: p(
            'Tell us a little about your visit, and our team will be in touch within 24 hours to confirm your slot. Entry is by appointment only. This is how we keep the galleries calm and the conversation considered.',
          ),
        },

        // 3. The visit-booking form itself.
        {
          blockType: 'appointmentForm',
          backgroundColor: 'white',
          submitLabel: 'Book An Appointment',
          // Leave the submission endpoint BLANK for the initial seed.
          // The component falls through to a direct redirect to
          // `successRedirect` so the UX is demonstrable end-to-end
          // without a backend. Editor can wire `/api/form-submissions`
          // (or any other POST URL) via the block admin once the
          // Payload Forms doc schema is finalised.
          endpoint: '',
          // Both enquiry forms redirect to the shared /thank-you page.
          successRedirect: '/thank-you',
          faqLink: {
            type: 'custom',
            url: '/faq',
            newTab: false,
          },
        },

        // 4. Contact panel — FLIPPED relative to /personal-consultation.
        //    Here: maroon panel on the LEFT, night-haveli image on the
        //    RIGHT. The ContactPanel block already supports
        //    `imagePosition: 'right'` — no new field needed.
        {
          blockType: 'contactPanel',
          image: haveliNight,
          imagePosition: 'right',
          panelBackgroundColor: 'maroon',
          showLogo: true,
          headline: p('Museum of *Meenakari* Heritage'),
          body: p(
            "If you're looking for any specific information, our team is happy to help. We usually respond within 24 hours.",
          ),
          address: richText(
            [{ text: 'Shekhawat Haveli, E141, Sardar Patel Marg' }],
            [{ text: 'Durgadas Colony, C-Scheme, Ashok Nagar' }],
            [{ text: 'Jaipur, Rajasthan 302001' }],
          ),
          phone: '+91 6377 490 417',
          email: 'info@momhindia.org',
        },
      ],
    },
  })

  payload.logger.info(`  • created book-an-appointment page (id: ${page.id})`)

  return {
    pageId: page.id,
    uploadedMediaIds: ids,
  }
}
