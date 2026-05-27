/**
 * POST /next/seed-book-an-appointment — populates the
 * /book-an-appointment page with the visit-booking form layout from
 * PDF p6.
 *
 * Dev-only: returns 403 in production. No auth required. Idempotent —
 * re-running deletes the previous [momh-bka-seed] media + the existing
 * book-an-appointment page doc and recreates fresh.
 */

import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'

import { seedBookAnAppointment } from '@/endpoints/seed-book-an-appointment'

export const maxDuration = 60

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
    const result = await seedBookAnAppointment({ payload, req })
    return Response.json({ success: true, ...result })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Book An Appointment seed failed' })
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
