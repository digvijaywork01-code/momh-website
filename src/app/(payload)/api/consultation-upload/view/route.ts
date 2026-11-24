/**
 * /api/consultation-upload/view?submission=<id> — the admin's "Open file"
 * link for a Personal Consultation enquiry's uploaded reference file.
 *
 * Only for people logged into the admin (anyone else is sent to the admin
 * login). It reads the stored enquiry with that person's own access, takes
 * the S3 key the enquiry stored (never a key from the URL), checks the file
 * is in the bucket, and redirects to a fresh 5-minute view link. So the
 * admin link itself always works, for as long as the file is kept; each
 * click makes a new short link. The bucket stays private.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { FORM_IDS } from '@/utilities/formIds'
import { createViewLink, isUploadConfigured, uploadExists } from '@/utilities/s3Upload'
import { UPLOAD_KEY_RE, safeFileName } from '@/utilities/uploadRules'

/** How long each link this route hands out works. */
const ADMIN_LINK_SECONDS = 5 * 60

const NO_STORE = { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' }

/** A plain message page (fixed text only, nothing from the request). */
const page = (status: number, message: string) =>
  new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Uploaded file</title></head>` +
      `<body style="font-family:system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem;line-height:1.5;color:#1a1a1a">` +
      `<p>${message}</p><p><a href="/admin/collections/form-submissions">Back to Form Submissions</a></p></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', ...NO_STORE } },
  )

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const payload = await getPayload({ config: configPromise })

  const { user } = await payload.auth({ headers: request.headers })
  if (!user) {
    const back = `${request.nextUrl.pathname}${request.nextUrl.search}`
    return NextResponse.redirect(
      new URL(`/admin/login?redirect=${encodeURIComponent(back)}`, request.url),
      { status: 302, headers: NO_STORE },
    )
  }

  const id = request.nextUrl.searchParams.get('submission') ?? ''
  if (!/^\d{1,12}$/.test(id)) return page(400, 'This link is missing the enquiry number.')

  let submission: {
    form?: unknown
    submissionData?: Array<{ field?: unknown; value?: unknown }> | null
  } | null = null
  try {
    submission = await payload.findByID({
      collection: 'form-submissions',
      id,
      depth: 0,
      overrideAccess: false,
      user,
    })
  } catch {
    submission = null
  }
  if (!submission) return page(404, 'This enquiry was not found.')

  const formId =
    typeof submission.form === 'object' && submission.form !== null
      ? (submission.form as { id?: unknown }).id
      : submission.form
  const rows = Array.isArray(submission.submissionData) ? submission.submissionData : []
  const key = rows.find((r) => r.field === 'referenceImage')?.value
  if (
    Number(formId) !== FORM_IDS.consultation ||
    typeof key !== 'string' ||
    !UPLOAD_KEY_RE.test(key)
  ) {
    return page(404, 'This enquiry has no uploaded file.')
  }

  if (!isUploadConfigured()) return page(503, 'File storage is not set up on this site.')

  let present = true
  try {
    present = await uploadExists(key)
  } catch (err) {
    console.error('[consultation-upload/view] could not check the file', err)
    // S3 itself answered with an error (5xx, after the SDK's retries): the
    // link would only show S3's raw error page, so say it plainly instead.
    const status = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode
    if (typeof status === 'number' && status >= 500) {
      return page(
        503,
        'File storage is not answering right now. Please try again in a few minutes.',
      )
    }
    // Could not check (network, time limit): the browser may still reach
    // S3, so still try the link.
  }
  if (!present) {
    return page(
      404,
      'The file is not in storage. It may not have finished uploading. Please ask the visitor to send it by email.',
    )
  }

  try {
    const name = safeFileName(rows.find((r) => r.field === 'referenceImageName')?.value, key)
    const url = await createViewLink(key, { expiresIn: ADMIN_LINK_SECONDS, fileName: name })
    if (!url) return page(503, 'File storage is not set up on this site.')
    return new NextResponse(null, { status: 302, headers: { location: url, ...NO_STORE } })
  } catch (err) {
    console.error('[consultation-upload/view] could not make the link', err)
    return page(500, 'The file could not be opened. Please try again.')
  }
}
