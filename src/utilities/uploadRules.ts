/**
 * Rules for the Personal Consultation reference upload, shared by the
 * browser (ConsultationForm), the upload-link route
 * (/api/consultation-upload) and the form-submissions spam hook.
 *
 * Client-safe: no secrets, no AWS code.
 */

/** Largest file accepted. S3 enforces it too (presigned POST policy). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const MAX_UPLOAD_LABEL = '10 MB'

/** Accepted types, and the extension each is stored with. */
export const UPLOAD_TYPES: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'application/pdf': 'pdf',
}

// Own keys only: a bare `UPLOAD_TYPES[t]` would also accept names every
// object inherits ('constructor', 'toString', '__proto__'). hasOwnProperty
// rather than Object.hasOwn, which older iPhones (Safari < 15.4) lack.
const own = (map: Readonly<Record<string, string>>, k: unknown): k is string =>
  typeof k === 'string' && Object.prototype.hasOwnProperty.call(map, k)

/** True only for one of the accepted types above. */
export const isUploadType = (t: unknown): t is string => own(UPLOAD_TYPES, t)

/** For the file picker: the same list, plus extensions for HEIC files some
 *  browsers report with no type. */
export const UPLOAD_ACCEPT = [...Object.keys(UPLOAD_TYPES), '.heic', '.heif', '.pdf'].join(',')

// Some browsers give HEIC/HEIF photos an empty type; fall back to the name.
const TYPE_BY_EXTENSION: Readonly<Record<string, string>> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  pdf: 'application/pdf',
}

/** The file's accepted type, or '' when it is not one of UPLOAD_TYPES. */
export const uploadContentType = (file: { type: string; name: string }): string => {
  if (file.type) return isUploadType(file.type) ? file.type : ''
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return own(TYPE_BY_EXTENSION, ext) ? TYPE_BY_EXTENSION[ext] : ''
}

export const UPLOAD_TYPE_ERROR = 'Please choose a JPG, PNG, WEBP, HEIC or PDF file.'
export const UPLOAD_SIZE_ERROR = `The file must be ${MAX_UPLOAD_LABEL} or smaller.`

/** Every stored file lives under this prefix with a random name:
 *  consultation-uploads/<yyyy>/<mm>/<uuid>.<ext> */
export const UPLOAD_PREFIX = 'consultation-uploads'
export const UPLOAD_KEY_RE =
  /^consultation-uploads\/\d{4}\/\d{2}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|heic|heif|pdf)$/

/**
 * A safe file name for the stored file: the visitor's own name for it, kept
 * to letters (any script, with their accents and vowel signs), digits,
 * spaces and ._()-, cut to 100 characters, with the extension of the
 * stored key (which matches the type S3 enforced). 'reference.<ext>' when
 * nothing usable is left. Used for the email attachment and the admin's
 * Open file link.
 */
export const safeFileName = (visitorName: unknown, key: string): string => {
  const ext = key.slice(key.lastIndexOf('.') + 1)
  // The form sends at most 200 characters, and the spam hook refuses more.
  // Cut again here, before the tidying below: normalize slows down sharply
  // on a long run of accent marks.
  const base =
    (typeof visitorName === 'string' ? visitorName.slice(0, 200) : '').split(/[\\/]/).pop() ?? ''
  const dot = base.lastIndexOf('.')
  const clean = (dot >= 0 ? base.slice(0, dot) : base)
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\p{N} ._()-]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.\p{M}]+/u, '')
  // Whole characters, never half of one.
  const stem = Array.from(clean)
    .slice(0, 100)
    .join('')
    .replace(/[\s.]+$/, '')
  return `${stem || 'reference'}.${ext}`
}
