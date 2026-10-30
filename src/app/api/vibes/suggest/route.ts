import { NextResponse } from 'next/server'
import { z } from 'zod'
import { MAX_DESCRIPTION_LENGTH, suggestVibes } from '@/lib/ai/vibe-suggest'
import { enforceRateLimit } from '@/lib/security/rate-limit'

const RequestSchema = z.object({
  description: z.string().trim().min(3, 'Describe the vibe in a few words').max(MAX_DESCRIPTION_LENGTH),
})

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, 'vibes-suggest', 15)
  if (rateLimitResponse) return rateLimitResponse

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON request payload' }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    )
  }

  // suggestVibes never throws: any model failure falls back to the deterministic matcher.
  const data = await suggestVibes(parsed.data.description)
  return NextResponse.json({ success: true, data }, { status: 200 })
}
