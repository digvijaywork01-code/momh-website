/**
 * MOMH "Personal Consultation" page seed.
 *
 * Programmatic Payload Local API population for the bespoke-jewellery
 * enquiry form page (linked from the "Book Your Personal Consultation"
 * CTA on /craft-your-jewellery). Uploads 2 images (top haveli shared
 * with home/PYV/CYJ + the moonlit haveli for the contact panel) and
 * creates the page at slug `personal-consultation` with 4 blocks:
 *
 *   1. ImageBanner   — top haveli (natural aspect, dark header)
 *   2. SectionIntro  — "Craft Your *Jewellery*" with `Form` eyebrow
 *   3. ConsultationForm — multi-section bespoke enquiry form
 *   4. ContactPanel  — night-haveli image + maroon contact panel
 *
 * Idempotent: re-running deletes the previous [momh-consult-seed]
 * media + the page doc and recreates fresh.
 */

import type { Payload, PayloadRequest, File } from 'payload'
import fs from 'fs/promises'
import path from 'path'

import { p, pp, richText } from '../seed-momh/lexical'
import { PROTECTED_STEMS } from '../seed-momh/sharedFiles'

const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const MEDIA_DIR = path.join(PUBLIC_DIR, 'media')

const SEED_ALT_MARKER = '[momh-consult-seed]'

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
    // Skip any stem the home-page seed owns — sub-pages reuse those
    // source files (e.g. `artboard-15.jpg` haveli top) but must not
    // delete them from disk or the home page's Media records break.
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

export const seedPersonalConsultation = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}) => {
  payload.logger.info('— Seeding MOMH Personal Consultation page')

  payload.logger.info('  • clearing previous Consultation seed media')
  await payload.delete({
    collection: 'media',
    req,
    where: { alt: { contains: SEED_ALT_MARKER } },
  })

  payload.logger.info('  • clearing leftover media files on disk')
  await wipeSeedFilesOnDisk()

  payload.logger.info('  • removing existing personal-consultation page (if any)')
  await payload.delete({
    collection: 'pages',
    req,
    where: { slug: { equals: 'personal-consultation' } },
  })

  payload.logger.info('  • uploading 2 consultation-page images')
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

  payload.logger.info('  • creating personal-consultation page')

  const page = await payload.create({
    collection: 'pages',
    req,
    data: {
      title: 'Personal Consultation',
      slug: 'personal-consultation',
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

        // 2. "Craft Your *Jewellery*" centered intro with `Form` eyebrow.
        {
          blockType: 'sectionIntro',
          backgroundColor: 'white',
          showTopDivider: true,
          tightBottom: true,
          eyebrow: 'Form',
          headline: p('Craft Your *Jewellery*'),
          body: p(
            'Tell us about the piece you have in mind, and we will be in touch to begin the conversation. A bespoke commission typically takes six to eight months, and starts with this short note.',
          ),
        },

        // 3. The form itself. Both enquiry forms redirect to the
        //    shared /thank-you confirmation page on successful
        //    submission (no inline success message). Endpoint blank
        //    for now — component skips POST and redirects directly,
        //    so the UX is demonstrable until Payload Forms is wired.
        {
          blockType: 'consultationForm',
          backgroundColor: 'white',
          submitLabel: 'Submit Enquiry',
          endpoint: '',
          successRedirect: '/thank-you',
        },

        // 4. Contact panel — night haveli image left + maroon panel right.
        {
          blockType: 'contactPanel',
          image: haveliNight,
          imagePosition: 'left',
          panelBackgroundColor: 'maroon',
          showLogo: true,
          headline: p('Museum of *Meenakari* Heritage'),
          body: p(
            "If you're looking for any specific information, our team is happy to help. We usually respond within 24 hours.",
          ),
          // Three SEPARATE paragraphs per PDF p4 — each centres
          // independently within the address block. Critically, the
          // first line is the LONGEST: it sets the wrapper width
          // (via `w-fit` in the component), so the pin icon sits
          // flush against the first line and the shorter lines
          // (line 2, line 3) centre visually under it. Joining lines
          // into a single long paragraph would force the wrapper
          // wider and push the visible text away from the icon.
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

  payload.logger.info(`  • created personal-consultation page (id: ${page.id})`)

  return {
    pageId: page.id,
    uploadedMediaIds: ids,
  }
}
