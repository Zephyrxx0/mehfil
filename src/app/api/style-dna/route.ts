import { NextResponse } from 'next/server'
import { z } from 'zod'
import { extractStyleDNAWithFallbackLadder } from '@/lib/ai/orchestrator'
import { extractDeterministicStyleDNA } from '@/lib/ai/heuristic'

const StyleDNARequestSchema = z.object({
  selectedSwatchIds: z.array(z.string()).min(6).max(8),
  protectedMomentQuote: z.string().max(200),
  tradeoffs: z.object({
    feastVsSpectacle: z.enum(['feast', 'spectacle']),
    intimateVsGrand: z.enum(['intimate', 'grand']),
    heritageVsModern: z.enum(['heritage', 'modern']),
  }),
})

export async function POST(request: Request) {
  let body: any
  try {
    body = await request.json()
  } catch (parseError) {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON request payload' },
      { status: 400 }
    )
  }

  const parsed = StyleDNARequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues },
      { status: 400 }
    )
  }

  const { selectedSwatchIds, protectedMomentQuote, tradeoffs } = parsed.data

  try {
    const result = await extractStyleDNAWithFallbackLadder(
      selectedSwatchIds,
      protectedMomentQuote,
      tradeoffs
    )

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    )
  } catch (err: any) {
    // Zero-failure fallback guarantee (GENUI-03, D-13)
    console.error('[API /api/style-dna] Unexpected exception, executing Tier 3 emergency recovery:', err)

    const fallbackDNA = extractDeterministicStyleDNA(
      selectedSwatchIds,
      protectedMomentQuote,
      tradeoffs
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          styleDNA: fallbackDNA,
          runRecord: {
            activeTier: 3,
            durationMs: 0,
            modelId: 'deterministic-heuristic-v1',
            fallbackReason: `Emergency route recovery: ${err instanceof Error ? err.message : String(err)}`,
            timestamp: new Date().toISOString(),
          },
        },
      },
      { status: 200 }
    )
  }
}
