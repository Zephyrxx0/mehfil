import { NextRequest, NextResponse } from 'next/server'
import { CloudPlans, isCloudPlanId, type RpcClient } from '@/lib/storage/cloud-plans'
import { createLogger } from '@/lib/logger'
import { enforceRateLimit } from '@/lib/security/rate-limit'
import { readJsonBody } from '@/lib/security/request'
import { getServerSupabase } from '@/lib/supabase/server'

const logger = createLogger('api.claim')

const isProduction = () => process.env.NODE_ENV === 'production'

/**
 * Checks an organizer edit key against the database, behind a rate limit. The route does not
 * set a cookie: the browser keeps the key itself and sends it with each save, and the
 * database re-checks it every time (ADR-0010).
 */
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // 10 attempts per minute per client to slow down key guessing
  const rateLimitResponse = enforceRateLimit(req, 'claim-plan', 10, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const { id: planId } = await context.params
  const payload = await readJsonBody(req, 4_000)
  if (!payload.ok) return payload.response
  const key = (payload.body as { key?: unknown } | null)?.key

  if (!key || typeof key !== 'string') {
    return NextResponse.json({ error: 'Missing capability key' }, { status: 400 })
  }

  const supabase = await getServerSupabase()
  if (!supabase) {
    // Fail closed: with no database there is nothing to verify the key against.
    if (isProduction()) {
      return NextResponse.json({ error: 'Cloud editing is not available' }, { status: 503 })
    }
    // Local development only: plans live in this browser, so there is no key to check.
    return NextResponse.json({ authorized: true, mode: 'local' })
  }

  if (!isCloudPlanId(planId)) {
    return NextResponse.json({ error: 'Celebration not found' }, { status: 404 })
  }

  try {
    const cloud = new CloudPlans(supabase as unknown as RpcClient)
    if (!(await cloud.verifyEditKey(planId, key))) {
      // One answer for "wrong key" and "no such plan", so the route is not a lookup oracle.
      return NextResponse.json(
        { authorized: false, error: 'Invalid capability token' },
        { status: 401 }
      )
    }
    return NextResponse.json({ authorized: true })
  } catch (err) {
    logger.error('edit key check failed', { err })
    return NextResponse.json({ error: 'Could not verify the key right now' }, { status: 502 })
  }
}
