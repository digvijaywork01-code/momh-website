/**
 * POST /next/seed-craft-your-jewellery — populates the
 * /craft-your-jewellery page with the editorial blocks from PDF p3.
 *
 * Dev-only: returns 403 in production. No auth required. Idempotent —
 * re-running deletes the previous [momh-craft-seed] media + the
 * existing craft-your-jewellery page document and recreates fresh.
 */

import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'

import { seedCraftYourJewellery } from '@/endpoints/seed-craft-your-jewellery'

export const maxDuration = 60

export async function POST(): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Disabled in production.', { status: 403 })
  }

  const payload = await getPayload({ config })

  try {
    const req = await createLocalReq({}, payload)
    const result = await seedCraftYourJewellery({ payload, req })
    return Response.json({ success: true, ...result })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Craft Your Jewellery seed failed' })
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// Allow GET so the page can be re-seeded with a plain browser visit
// during development.
export const GET = POST
