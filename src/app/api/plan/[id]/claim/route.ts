import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { hashCapabilityToken, constantTimeCompare } from '@/lib/engine/crypto'
import { cookies } from 'next/headers'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await context.params
  const body = await req.json().catch(() => ({}))
  const token = body.key

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing capability key' }, { status: 400 })
  }

  const supabase = await getServerSupabase()
  if (!supabase) {
    // Offline / Local development fallback: authorize session cookie
    const cookieStore = await cookies()
    cookieStore.set(`mehfil_edit_${planId}`, 'local_authorized', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
    return NextResponse.json({ authorized: true, mode: 'local' })
  }

  // 1. Query event from database
  const { data: event, error } = await supabase
    .from('events')
    .select('id, edit_key_hash')
    .eq('id', planId)
    .single()

  if (error || !event) {
    return NextResponse.json({ error: 'Celebration not found' }, { status: 404 })
  }

  // 2. Hash incoming token and constant-time compare
  const tokenHash = await hashCapabilityToken(token)
  const isMatch = constantTimeCompare(tokenHash, event.edit_key_hash)

  if (!isMatch) {
    return NextResponse.json({ authorized: false, error: 'Invalid capability token' }, { status: 401 })
  }

  // 3. Set HttpOnly authorization cookie
  const cookieStore = await cookies()
  cookieStore.set(`mehfil_edit_${planId}`, tokenHash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  return NextResponse.json({ authorized: true })
}
