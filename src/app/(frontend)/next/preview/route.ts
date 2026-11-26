import type { CollectionSlug, PayloadRequest } from 'payload'
import { getPayload } from 'payload'

import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import configPromise from '@payload-config'

export async function GET(req: Request): Promise<Response> {
  const payload = await getPayload({ config: configPromise })

  const { searchParams } = new URL(req.url)

  const path = searchParams.get('path')
  const collection = searchParams.get('collection') as CollectionSlug
  const slug = searchParams.get('slug')
  const previewSecret = searchParams.get('previewSecret')

  if (previewSecret !== process.env.PREVIEW_SECRET) {
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  if (!path || !collection || !slug) {
    return new Response('Insufficient search params', { status: 404 })
  }

  // BUG FIX shipped with the stop-gap release. KEEP it after the upgrade.
  // The path must be a plain path on this site: letters, digits, "-", "_"
  // and "/" only, and never two slashes at the start. It used to be enough
  // that the path began with one slash. Was: `!path.startsWith('/')`.
  if (!/^\/(?!\/)[\w/-]*$/.test(path)) {
    return new Response('This endpoint can only be used for relative previews', { status: 500 })
  }

  let user

  try {
    // BUG FIX shipped with the stop-gap release. KEEP it after the upgrade.
    // payload.auth() answers with an object that holds the user. This line
    // used to keep the whole object, which is never empty, so the "no user"
    // check below never refused and the preview secret alone was enough.
    const authResult = await payload.auth({
      req: req as unknown as PayloadRequest,
      headers: req.headers,
    })
    user = authResult.user
  } catch (error) {
    payload.logger.error({ err: error }, 'Error verifying token for live preview')
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  const draft = await draftMode()

  if (!user) {
    draft.disable()
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  // You can add additional checks here to see if the user is allowed to preview this page

  draft.enable()

  redirect(path)
}
