import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { generateCapabilityToken, hashCapabilityToken } from '@/lib/engine/crypto'
import { cookies } from 'next/headers'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await context.params
  const cookieStore = await cookies()
  const authCookie = cookieStore.get(`mehfil_edit_${planId}`)?.value

  // Verify edit authorization
  if (!authCookie) {
    return NextResponse.json({ error: 'Unauthorized to modify celebration' }, { status: 401 })
  }

  const supabase = await getServerSupabase()
  if (!supabase) {
    // Offline / Local development fallback
    const newShareToken = generateCapabilityToken()
    return NextResponse.json({ shareToken: newShareToken, status: 'regenerated_local' })
  }

  // Generate new unguessable share token and SHA-256 hash
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
