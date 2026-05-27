/**
 * POST /next/seed-plan-your-visit — populates the /plan-your-visit page
 * with the editorial blocks from PDF page 2.
 *
 * Dev-only: returns 403 in production. No auth required. Idempotent —
 * re-running deletes the previous [momh-plan-visit-seed] media + the
 * existing plan-your-visit page document and recreates fresh.
 */

import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'

import { seedPlanYourVisit } from '@/endpoints/seed-plan-your-visit'

export const maxDuration = 300

export async function POST(req: Request): Promise<Response> {
  // Production guard with PAYLOAD_SECRET bypass: in prod, allow only
  // when Authorization: Bearer <PAYLOAD_SECRET>. Without it, returns
  // 403 to prevent accidental data wipes.
  if (process.env.NODE_ENV === 'production') {
    const expected = `Bearer ${process.env.PAYLOAD_SECRET || ''}`
    if (req.headers.get('authorization') !== expected) {
      return new Response('Disabled in production (auth required).', { status: 403 })
    }
  }

  const payload = await getPayload({ config })

  try {
    const req = await createLocalReq({}, payload)
    const result = await seedPlanYourVisit({ payload, req })
    return Response.json({ success: true, ...result })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Plan Your Visit seed failed' })
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// Allow GET as well so the page can be re-seeded with a plain browser visit
// during development.
export const GET = POST
