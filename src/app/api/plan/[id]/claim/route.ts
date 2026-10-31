import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { constantTimeCompare, hashCapabilityToken } from '@/lib/engine/crypto'
import { enforceRateLimit } from '@/lib/security/rate-limit'
import {
  EDIT_SESSION_TTL_SECONDS,
  createEditSession,
  editCookieName,
  isEditSessionConfigured,
} from '@/lib/security/edit-session'
import { readJsonBody } from '@/lib/security/request'
import { getServerSupabase } from '@/lib/supabase/server'

const isProduction = () => process.env.NODE_ENV === 'production'

function unavailable() {
  return NextResponse.json({ error: 'Cloud editing is not available' }, { status: 503 })
}

async function startEditSession(planId: string) {
  const store = await cookies()
  store.set(editCookieName(planId), await createEditSession(planId), {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
    maxAge: EDIT_SESSION_TTL_SECONDS,
  })
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // 10 attempts per minute per client to slow down key guessing
  const rateLimitResponse = enforceRateLimit(req, 'claim-plan', 10, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const { id: planId } = await context.params
  const payload = await readJsonBody(req, 4_000)
  if (!payload.ok) return payload.response
  const token = (payload.body as { key?: unknown } | null)?.key

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing capability key' }, { status: 400 })
  }

  // Fail closed: without a database or a signing secret there is nothing to verify the key
  // against, so production must refuse instead of granting access.
  if (isProduction() && !isEditSessionConfigured()) return unavailable()

  const supabase = await getServerSupabase()
  if (!supabase) {
    if (isProduction()) return unavailable()
    // Local development only: plans live in this browser, so there is no key to check.
    await startEditSession(planId)
    return NextResponse.json({ authorized: true, mode: 'local' })
  }

  const { data: event, error } = await supabase
    .from('events')
    .select('id, edit_key_hash')
    .eq('id', planId)
    .single()
  if (error || !event) {
    return NextResponse.json({ error: 'Celebration not found' }, { status: 404 })
  }

  const tokenHash = await hashCapabilityToken(token)
  if (!constantTimeCompare(tokenHash, event.edit_key_hash)) {
    return NextResponse.json(
      { authorized: false, error: 'Invalid capability token' },
      { status: 401 }
    )
  }

  await startEditSession(planId)
  return NextResponse.json({ authorized: true })
}
