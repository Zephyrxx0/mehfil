import { NextResponse } from 'next/server'
import { z } from 'zod'
import { BudgetCategorySchema } from '@/lib/ai/schemas'
import { deterministicRunRecord } from '@/lib/ai/run-record'
import { analyzeQuoteWithFallbackLadder } from '@/lib/ai/quote-pipeline'
import { extractDeterministicQuote } from '@/lib/ai/quote-heuristic'
import { buildVendorQuote } from '@/lib/ai/vendor-quote'
import { createLogger } from '@/lib/logger'
import { enforceRateLimit } from '@/lib/security/rate-limit'
import { readJsonBody } from '@/lib/security/request'
import { MAX_IMAGE_BYTES, validateImageDataUrl } from '@/lib/security/image-upload'

const logger = createLogger('api.quote-analyst')

const IMAGE_ERROR = `Image must be a PNG, JPEG or WebP file under ${MAX_IMAGE_BYTES / 1_000_000} MB`

const QuoteAnalystRequestSchema = z.object({
  rawText: z.string().min(1).max(20000),
  imageBase64: z
    .string()
    .refine((value) => validateImageDataUrl(value).ok, IMAGE_ERROR)
    .optional(),
  category: BudgetCategorySchema,
  guestCount: z.number().int().positive(),
})

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, 'quote-analyst', 15)
  if (rateLimitResponse) return rateLimitResponse

  const payload = await readJsonBody(request)
  if (!payload.ok) return payload.response

  const parsed = QuoteAnalystRequestSchema.safeParse(payload.body)
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
    const vendorQuote = buildVendorQuote(extraction, rawText, guestCount)
    return NextResponse.json({ success: true, data: { vendorQuote, runRecord } })
  } catch (err) {
    // Zero-failure guarantee (GENUI-03): recover with pure code. Details stay in the server log.
    logger.error('unexpected error, using deterministic recovery', { err })
    const vendorQuote = buildVendorQuote(
      extractDeterministicQuote(rawText, category),
      rawText,
      guestCount
    )
    return NextResponse.json({
      success: true,
      data: { vendorQuote, runRecord: deterministicRunRecord('emergency_route_recovery') },
    })
  }
}
