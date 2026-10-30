import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { generateCapabilityToken, hashCapabilityToken, constantTimeCompare } from '@/lib/engine/crypto'
import { cookies } from 'next/headers'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await context.params
  const cookieStore = await cookies()
  const authCookie = cookieStore.get(`mehfil_edit_${planId}`)?.value

  const body = await req.json().catch(() => ({}))
  const keyFromBody = typeof body?.key === 'string' ? body.key : undefined

  // Verify edit authorization
  if (!authCookie && !keyFromBody) {
    return NextResponse.json({ error: 'Unauthorized to modify celebration' }, { status: 401 })
  }

  const supabase = await getServerSupabase()
  if (!supabase) {
    // Offline / Local development fallback
    const newShareToken = generateCapabilityToken()
    return NextResponse.json({ shareToken: newShareToken, status: 'regenerated_local' })
  }

  // 1. Fetch event edit_key_hash to verify authorization
  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('id, edit_key_hash')
    .eq('id', planId)
    .single()

  if (fetchError || !event) {
    return NextResponse.json({ error: 'Celebration not found' }, { status: 404 })
  }

  // 2. Validate authorization via constant-time comparison
  let isAuthorized = false
  if (authCookie && constantTimeCompare(authCookie, event.edit_key_hash)) {
    isAuthorized = true
  } else if (keyFromBody) {
    const keyHash = await hashCapabilityToken(keyFromBody)
    if (constantTimeCompare(keyHash, event.edit_key_hash)) {
      isAuthorized = true
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Invalid capability authorization' }, { status: 401 })
  }

  // 3. Generate new unguessable share token and SHA-256 hash
  const newShareToken = generateCapabilityToken()
  const newShareHash = await hashCapabilityToken(newShareToken)

  const { error } = await supabase
    .from('events')
    .update({ share_key_hash: newShareHash, updated_at: new Date().toISOString() })
    .eq('id', planId)

  if (error) {
    return NextResponse.json({ error: 'Failed to regenerate share key' }, { status: 500 })
  }

  return NextResponse.json({ shareToken: newShareToken })
}
