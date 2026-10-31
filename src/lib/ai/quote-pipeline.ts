import { runLadder, type FallbackLadderOptions } from './ladder'
import { fenceUntrustedText } from './quarantine'
import { extractQuoteWithModel } from './quote-analyst'
import { extractDeterministicQuote } from './quote-heuristic'
import type { AgentRunRecord, QuoteExtractionInput } from './schemas'
import type { BudgetCategory } from '@/lib/engine/types'

export interface QuoteFallbackLadderResult {
  extraction: QuoteExtractionInput
  runRecord: AgentRunRecord
}

/**
 * Quarantined Quote Analyst through the three-tier ladder (ADR-0003, ADR-0007).
 * The quote is wrapped in a per-request random tag (S7), the model has no tools, and
 * every extracted number is verified against the quote text later by the Numeric Guard.
 */
export async function analyzeQuoteWithFallbackLadder(
  rawText: string,
  category: BudgetCategory,
  imageBase64?: string,
  options?: FallbackLadderOptions
): Promise<QuoteFallbackLadderResult> {
  const quarantined = fenceUntrustedText('untrusted_vendor_quote', rawText)

  const { value, runRecord } = await runLadder<QuoteExtractionInput>({
    agent: 'quote-analyst',
    options,
    callModel: (model, timeoutMs) =>
      extractQuoteWithModel(model, quarantined, imageBase64, timeoutMs),
    deterministic: () => extractDeterministicQuote(rawText, category),
  })
  return { extraction: value, runRecord }
}
