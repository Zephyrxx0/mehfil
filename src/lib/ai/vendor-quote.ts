import { buildPackageTiers } from '@/lib/engine/quote-guard'
import { detectQuoteOmissions } from '@/lib/engine/omission-rules'
import type { VendorQuote } from '@/lib/engine/types'
import { createId } from '@/lib/id'
import type { QuoteExtractionInput } from './schemas'

/**
 * Turns a model or heuristic extraction into a VendorQuote. All arithmetic happens here, in
 * code: the Numeric Guard verifies each figure against the quote text and prices are scaled
 * by guest count (ADR-0001, ADR-0003).
 */
export function buildVendorQuote(
  extraction: QuoteExtractionInput,
  rawText: string,
  guestCount: number
): VendorQuote {
  const { tiers, allDroppedItems } = buildPackageTiers(extraction.tiers, rawText, guestCount)
  const baseTierPaise = tiers[0]?.baseTierPaise ?? 0

  return {
    id: createId('quote'),
    vendorName: extraction.vendorName,
    category: extraction.category,
    rawText,
    tiers,
    omissionAdders: detectQuoteOmissions(rawText, extraction.category, baseTierPaise),
    droppedItems: allDroppedItems,
    statedInclusions: extraction.statedInclusions,
    statedExclusions: extraction.statedExclusions,
    paymentTerms: extraction.paymentTerms,
    createdAt: new Date().toISOString(),
  }
}
