import type { Paise, ExtractedQuoteItem, QuoteDroppedItem, PackageTier } from './types'
import type { ExtractedQuoteItemInput, PackageTierInput } from '../ai/schemas'
import { createId } from '@/lib/id'

/**
 * Extracts candidate numeric rupee values from a verbatim source anchor snippet.
 * Handles:
 * - Currency symbols: "₹", "Rs", "Rs.", "INR", "/-"
 * - Indian suffixes/words: "Lakh", "lakhs", "lac", "lacs", "k", "crore", "cr"
 * - Formatted numbers with commas: "1,50,000", "950", "2,10,000"
 */
export function parseAnchorNumber(anchor: string, targetAmount?: number): number | null {
  if (!anchor || typeof anchor !== 'string') return null

  const lower = anchor.toLowerCase().trim()

  const candidates: number[] = []

  // 1. Crores
  const croreMatches = Array.from(lower.matchAll(/(\d+(?:\.\d+)?)\s*(?:crores?|cr\b)/g))
  for (const m of croreMatches) {
    const val = Math.round(parseFloat(m[1]) * 10_000_000)
    if (!isNaN(val)) candidates.push(val)
  }

  // 2. Lakhs / Lacs
  const lakhMatches = Array.from(lower.matchAll(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|l\b)/g))
  for (const m of lakhMatches) {
    const val = Math.round(parseFloat(m[1]) * 100_000)
    if (!isNaN(val)) candidates.push(val)
  }

  // 3. 'k' abbreviation (e.g. "25k", "15 k")
  const kMatches = Array.from(lower.matchAll(/(\d+(?:\.\d+)?)\s*k\b/g))
  for (const m of kMatches) {
    const val = Math.round(parseFloat(m[1]) * 1_000)
    if (!isNaN(val)) candidates.push(val)
  }

  // 4. Currency-prefixed numbers (e.g. "₹1,50,000", "Rs. 40,000", "rs 950")
  const currMatches = Array.from(
    lower.matchAll(/(?:₹|rs\.?|inr)\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?|\d+(?:\.\d+)?)/g)
  )
  for (const m of currMatches) {
    const val = parseFloat(m[1].replace(/,/g, ''))
    if (!isNaN(val)) candidates.push(val)
  }

  // 5. General numbers with commas or standalone
  // Remove currency words so they don't break regex
  const cleaned = lower
    .replace(/[₹]/g, ' ')
    .replace(/\brs\.?\b/g, ' ')
    .replace(/\binr\b/g, ' ')
    .replace(/\/-/g, ' ')

  const genMatches = Array.from(
    cleaned.matchAll(/\b\d{1,3}(?:,\d{2,3})*(?:\.\d+)?\b|\b\d+(?:\.\d+)?\b/g)
  )
  for (const m of genMatches) {
    const val = parseFloat(m[0].replace(/,/g, ''))
    if (!isNaN(val)) candidates.push(val)
  }

  if (candidates.length === 0) return null

  // If a target amount was provided, see if any candidate is within 0.01 tolerance
  if (targetAmount !== undefined) {
    const exactMatch = candidates.find((c) => Math.abs(c - targetAmount) <= 0.01)
    if (exactMatch !== undefined) return exactMatch
  }

  // Otherwise return the first candidate
  return candidates[0]
}

export interface VerbatimVerificationResult {
  verifiedItems: ExtractedQuoteItem[]
  droppedItems: QuoteDroppedItem[]
  baseTierPaise: Paise
}

/**
 * Two-Phase Verbatim Evidence Guard
 * Phase 1: Case-insensitive normalized substring match in rawText
 * Phase 2: Numeric anchor parsing ensuring snippet contains the stated amount
 */
export function verifyVerbatimEvidence(
  rawText: string,
  rawItems: ExtractedQuoteItemInput[],
  guestCount: number
): VerbatimVerificationResult {
  const normRaw = rawText.toLowerCase()
  const verifiedItems: ExtractedQuoteItem[] = []
  const droppedItems: QuoteDroppedItem[] = []

  for (const item of rawItems) {
    const normAnchor = item.sourceAnchor.toLowerCase().trim()

    // Phase 1: Substring match check
    if (!normRaw.includes(normAnchor)) {
      droppedItems.push({
        description: item.description,
        amountStated: item.amountStated,
        sourceAnchor: item.sourceAnchor,
        reason: 'no_substring_match',
      })
      continue
    }

    // Phase 2: Numeric equivalence check
    const parsedAmount = parseAnchorNumber(item.sourceAnchor, item.amountStated)
    if (parsedAmount === null || Math.abs(parsedAmount - item.amountStated) > 0.01) {
      droppedItems.push({
        description: item.description,
        amountStated: item.amountStated,
        sourceAnchor: item.sourceAnchor,
        reason: 'numeric_mismatch',
      })
      continue
    }

    // Verified: Compute integer paise via pure TypeScript (ADR-0001)
    const unitPaise = Math.round(item.amountStated * 100)
    const itemPaise = item.pricingType === 'per_guest' ? unitPaise * guestCount : unitPaise

    verifiedItems.push({
      id: createId('item'),
      description: item.description,
      amountStated: item.amountStated,
      pricingType: item.pricingType,
      sourceAnchor: item.sourceAnchor,
      itemPaise,
      isVerified: true,
    })
  }

  const baseTierPaise = verifiedItems.reduce((acc, item) => acc + item.itemPaise, 0)
  return { verifiedItems, droppedItems, baseTierPaise }
}

/**
 * Assembles complete PackageTier[] by executing verbatim verification on each tier
 */
export function buildPackageTiers(
  extractedTiers: PackageTierInput[],
  rawText: string,
  guestCount: number
): { tiers: PackageTier[]; allDroppedItems: QuoteDroppedItem[] } {
  const allDroppedItems: QuoteDroppedItem[] = []

  const tiers: PackageTier[] = extractedTiers.map((tier) => {
    const { verifiedItems, droppedItems, baseTierPaise } = verifyVerbatimEvidence(
      rawText,
      tier.lineItems,
      guestCount
    )

    allDroppedItems.push(...droppedItems)

    // Check stated total consistency if supplied
    let isStatedTotalConsistent = true
    if (tier.tierTotalStated !== undefined) {
      const lineItemsSumRupees = verifiedItems.reduce((acc, it) => {
        return (
          acc + (it.pricingType === 'per_guest' ? it.amountStated * guestCount : it.amountStated)
        )
      }, 0)
      const flatSumRupees = verifiedItems.reduce((acc, it) => acc + it.amountStated, 0)

      const matchesScaled = Math.abs(lineItemsSumRupees - tier.tierTotalStated) <= 0.01
      const matchesFlat = Math.abs(flatSumRupees - tier.tierTotalStated) <= 0.01
      isStatedTotalConsistent = matchesScaled || matchesFlat
    }

    return {
      tierId: tier.tierId,
      name: tier.name,
      description: tier.description,
      lineItems: verifiedItems,
      baseTierPaise,
      totalWithAddersPaise: baseTierPaise,
      tierTotalStated: tier.tierTotalStated,
      isStatedTotalConsistent,
    }
  })

  return { tiers, allDroppedItems }
}
