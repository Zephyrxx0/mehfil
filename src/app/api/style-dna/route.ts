import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSwatchById } from '@/data/swatches'
import { extractDeterministicStyleDNA } from '@/lib/ai/heuristic'
import { deterministicRunRecord } from '@/lib/ai/run-record'
import { sanitizeSingleLine } from '@/lib/ai/quarantine'
import { extractStyleDNAWithFallbackLadder } from '@/lib/ai/style-dna'
import { createLogger } from '@/lib/logger'
import { enforceRateLimit } from '@/lib/security/rate-limit'
import { readJsonBody } from '@/lib/security/request'

const logger = createLogger('api.style-dna')

const MAX_MOMENT_LENGTH = 200

const StyleDNARequestSchema = z.object({
  // Ids must exist in the swatch catalogue and may not repeat.
  selectedSwatchIds: z
    .array(z.string().refine((id) => getSwatchById(id) !== undefined, 'Unknown swatch id'))
    .min(3)
    .max(6)
    .refine((ids) => new Set(ids).size === ids.length, 'Swatch ids must be unique'),
  // Control and invisible characters are removed before the text goes anywhere near a prompt.
  protectedMomentQuote: z
    .string()
    .max(MAX_MOMENT_LENGTH * 2)
    .transform((text) => sanitizeSingleLine(text, MAX_MOMENT_LENGTH)),
  tradeoffs: z.object({
    feastVsSpectacle: z.enum(['feast', 'spectacle']),
    intimateVsGrand: z.enum(['intimate', 'grand']),
    heritageVsModern: z.enum(['heritage', 'modern']),
  }),
})

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, 'style-dna', 15)
  if (rateLimitResponse) return rateLimitResponse

  const payload = await readJsonBody(request, 64_000)
  if (!payload.ok) return payload.response

  const parsed = StyleDNARequestSchema.safeParse(payload.body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues }, { status: 400 })
  }
  const { selectedSwatchIds, protectedMomentQuote, tradeoffs } = parsed.data

  try {
    const data = await extractStyleDNAWithFallbackLadder(
      selectedSwatchIds,
      protectedMomentQuote,
      tradeoffs
    )
    return NextResponse.json({ success: true, data })
  } catch (err) {
    // Zero-failure guarantee (GENUI-03, D-13): recover with pure code.
    logger.error('unexpected error, using deterministic recovery', { err })
    return NextResponse.json({
      success: true,
      data: {
        styleDNA: extractDeterministicStyleDNA(selectedSwatchIds, protectedMomentQuote, tradeoffs),
        runRecord: deterministicRunRecord('emergency_route_recovery'),
      },
    })
  }
}
