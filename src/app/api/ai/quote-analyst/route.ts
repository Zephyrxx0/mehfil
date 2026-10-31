import { NextResponse } from 'next/server'
import { z } from 'zod'
import { BudgetCategorySchema } from '@/lib/ai/schemas'
import { enforceRateLimit } from '@/lib/security/rate-limit'
import { analyzeQuoteWithFallbackLadder, extractDeterministicQuote } from '@/lib/ai/orchestrator'
import { buildPackageTiers } from '@/lib/engine/quote-guard'
import { detectQuoteOmissions } from '@/lib/engine/omission-rules'
import type { VendorQuote } from '@/lib/engine/types'
import { createLogger } from '@/lib/logger'
import { createId } from '@/lib/id'
const logger = createLogger('api.quote-analyst')

const QuoteAnalystRequestSchema = z.object({
  rawText: z.string().min(1).max(20000),
  imageBase64: z.string().max(10_000_000, 'Image payload exceeds 10MB limit').optional(),
  category: BudgetCategorySchema,
  guestCount: z.number().int().positive(),
})

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, 'quote-analyst', 15)
  if (rateLimitResponse) return rateLimitResponse

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON request payload' },
      { status: 400 }
    )
  }

  const parsed = QuoteAnalystRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues }, { status: 400 })
  }

  const { rawText, imageBase64, category, guestCount } = parsed.data

  try {
    const { extraction, runRecord } = await analyzeQuoteWithFallbackLadder(
      rawText,
      category,
      imageBase64
    )

    const { tiers, allDroppedItems } = buildPackageTiers(extraction.tiers, rawText, guestCount)

    const baseTierPaise = tiers[0]?.baseTierPaise ?? 0
    const omissionAdders = detectQuoteOmissions(rawText, extraction.category, baseTierPaise)

    const vendorQuote: VendorQuote = {
      id: createId('quote'),
      vendorName: extraction.vendorName,
      category: extraction.category,
      rawText,
      tiers,
      omissionAdders,
      droppedItems: allDroppedItems,
      statedInclusions: extraction.statedInclusions,
      statedExclusions: extraction.statedExclusions,
      paymentTerms: extraction.paymentTerms,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          vendorQuote,
          runRecord,
        },
      },
      { status: 200 }
    )
  } catch (err: any) {
    logger.error(
      '[API /api/ai/quote-analyst] Unexpected exception, executing Tier 3 emergency recovery:',
      err
    )

    const fallbackExtraction = extractDeterministicQuote(rawText, category)
    const { tiers, allDroppedItems } = buildPackageTiers(
      fallbackExtraction.tiers,
      rawText,
      guestCount
    )
    const baseTierPaise = tiers[0]?.baseTierPaise ?? 0
    const omissionAdders = detectQuoteOmissions(rawText, fallbackExtraction.category, baseTierPaise)

    const fallbackQuote: VendorQuote = {
      id: createId('quote'),
      vendorName: fallbackExtraction.vendorName,
      category: fallbackExtraction.category,
      rawText,
      tiers,
      omissionAdders,
      droppedItems: allDroppedItems,
      statedInclusions: fallbackExtraction.statedInclusions,
      statedExclusions: fallbackExtraction.statedExclusions,
      paymentTerms: fallbackExtraction.paymentTerms,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          vendorQuote: fallbackQuote,
          runRecord: {
            activeTier: 3,
            durationMs: 0,
            modelId: 'deterministic-heuristic-v1',
            fallbackReason: `Emergency route recovery: ${
              err instanceof Error ? err.message : String(err)
            }`,
            timestamp: new Date().toISOString(),
          },
        },
      },
      { status: 200 }
    )
  }
}
