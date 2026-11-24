/**
 * /api/consultation-upload — hands the Personal Consultation form a
 * presigned S3 upload link for its optional reference image / sketch.
 *
 * Body: { contentType, size, _hp, _t }. Same spam gate as the forms
 * (src/utilities/formGuards.ts): origin, a cap per connection
 * (src/utilities/rateLimit.ts), hidden trap box, signed time pass.
 * Then the file must be an accepted type and at most MAX_UPLOAD_BYTES.
 * Answers { url, fields, key }: the browser POSTs the file to `url` with
 * `fields` (S3 enforces the key, type and size) and sends `key` with the
 * enquiry. Nothing is stored here.
 *
 * 503 when S3 is not configured (see src/utilities/s3Upload.ts); the form
 * then saves the enquiry without the file.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import {
  checkFormToken,
  isAllowedOrigin,
  isHoneypotFilled,
  requestIp,
} from '@/utilities/formGuards'
import { withinRateLimit } from '@/utilities/rateLimit'
import { createUploadLink, isUploadConfigured, newUploadKey } from '@/utilities/s3Upload'
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_SIZE_ERROR,
  UPLOAD_TYPE_ERROR,
  isUploadType,
} from '@/utilities/uploadRules'

const GENERIC_ERROR = 'Upload failed.'

type Body = { contentType?: unknown; size?: unknown; _hp?: unknown; _t?: unknown }

const refuse = (status: number, error: string) =>
  NextResponse.json({ ok: false, error }, { status })

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const ip = requestIp(req.headers)

  const origin = req.headers.get('origin') ?? ''
  const referer = req.headers.get('referer') ?? ''
  if (!isAllowedOrigin(origin, referer)) {
    console.warn('[consultation-upload] blocked: origin', { origin, referer, ip })
    return refuse(403, GENERIC_ERROR)
  }

  // A cap per connection; fails open if the count cannot be read. The form
  // then sends the enquiry without the file, as for any upload failure.
  try {
    const payload = await getPayload({ config: configPromise })
    if (!(await withinRateLimit(payload, 'upload', req.headers))) {
      console.warn('[consultation-upload] blocked: rate limit', { ip })
      return refuse(429, GENERIC_ERROR)
    }
  } catch (err) {
    console.warn('[consultation-upload] rate limit unavailable', err)
  }

  const raw: unknown = await req.json().catch(() => ({}))
  const body: Body = raw && typeof raw === 'object' ? (raw as Body) : {}

  if (isHoneypotFilled(body._hp)) {
    console.warn('[consultation-upload] blocked: honeypot', { ip })
    return refuse(400, GENERIC_ERROR)
  }
  const token = checkFormToken(body._t)
  if (!token.ok) {
    console.warn(`[consultation-upload] blocked: ${token.reason}`, { ip })
    return refuse(400, GENERIC_ERROR)
  }

  const contentType = body.contentType
  if (!isUploadType(contentType)) return refuse(400, UPLOAD_TYPE_ERROR)
  const size = typeof body.size === 'number' ? body.size : NaN
  if (!Number.isFinite(size) || size < 1 || size > MAX_UPLOAD_BYTES) {
    return refuse(400, UPLOAD_SIZE_ERROR)
  }

  if (!isUploadConfigured()) {
    console.warn('[consultation-upload] S3 not configured; upload skipped')
    return refuse(503, GENERIC_ERROR)
  }

  try {
    const key = newUploadKey(contentType)
    const { url, fields } = await createUploadLink(key, contentType)
    return NextResponse.json({ ok: true, url, fields, key })
  } catch (err) {
    console.error('[consultation-upload] could not create the upload link', err)
    return refuse(500, GENERIC_ERROR)
  }
}
