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

export const maxDuration = 60

export async function POST(): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Disabled in production.', { status: 403 })
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
