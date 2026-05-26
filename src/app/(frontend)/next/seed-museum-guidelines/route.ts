/**
 * POST /next/seed-museum-guidelines — populates /museum-guidelines
 * with the editorial layout from PDF p5.
 *
 * Dev-only: returns 403 in production. Idempotent — re-running deletes
 * the previous [momh-mg-seed] media + the existing museum-guidelines
 * page doc and recreates fresh.
 */

import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'

import { seedMuseumGuidelines } from '@/endpoints/seed-museum-guidelines'

export const maxDuration = 60

export async function POST(): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Disabled in production.', { status: 403 })
  }

  const payload = await getPayload({ config })

  try {
    const req = await createLocalReq({}, payload)
    const result = await seedMuseumGuidelines({ payload, req })
    return Response.json({ success: true, ...result })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Museum Guidelines seed failed' })
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

export const GET = POST
