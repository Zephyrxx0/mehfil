import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  constantTimeCompare,
  generateCapabilityToken,
  hashCapabilityToken,
} from '@/lib/engine/crypto'
import { enforceRateLimit } from '@/lib/security/rate-limit'
import {
  editCookieName,
  isEditSessionConfigured,
  verifyEditSession,
} from '@/lib/security/edit-session'
import { readJsonBody } from '@/lib/security/request'
import { getServerSupabase } from '@/lib/supabase/server'

const isProduction = () => process.env.NODE_ENV === 'production'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const rateLimitResponse = enforceRateLimit(req, 'regenerate-share', 10, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const { id: planId } = await context.params
  const payload = await readJsonBody(req, 4_000)
  const keyFromBody =
    payload.ok && typeof (payload.body as { key?: unknown } | null)?.key === 'string'
      ? (payload.body as { key: string }).key
      : undefined

  if (isProduction() && !isEditSessionConfigured()) {
    return NextResponse.json({ error: 'Cloud editing is not available' }, { status: 503 })
  }

  const supabase = await getServerSupabase()
  if (!supabase && isProduction()) {
    return NextResponse.json({ error: 'Cloud editing is not available' }, { status: 503 })
  }

  const store = await cookies()
  const hasSession = await verifyEditSession(planId, store.get(editCookieName(planId))?.value)
  if (!hasSession && !keyFromBody) {
    return NextResponse.json({ error: 'Unauthorized to modify celebration' }, { status: 401 })
  }

  if (!supabase) {
    // Local development only: nothing is stored, so this token cannot resolve anywhere.
    return NextResponse.json({ shareToken: generateCapabilityToken(), status: 'regenerated_local' })
  }

  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('id, edit_key_hash')
    .eq('id', planId)
    .single()
  if (fetchError || !event) {
    return NextResponse.json({ error: 'Celebration not found' }, { status: 404 })
  }

  const hasValidKey =
    keyFromBody !== undefined &&
    constantTimeCompare(await hashCapabilityToken(keyFromBody), event.edit_key_hash)
  if (!hasSession && !hasValidKey) {
    return NextResponse.json({ error: 'Invalid capability authorization' }, { status: 401 })
  }

  const newShareToken = generateCapabilityToken()
  const { error } = await supabase
    .from('events')
    .update({
      share_key_hash: await hashCapabilityToken(newShareToken),
      updated_at: new Date().toISOString(),
    })
    .eq('id', planId)
  if (error) {
    return NextResponse.json({ error: 'Failed to regenerate share key' }, { status: 500 })
  }

  return NextResponse.json({ shareToken: newShareToken })
}
