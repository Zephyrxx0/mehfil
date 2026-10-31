import { OMISSION_RULES } from './omission-rules-table'
import type { BudgetCategory, Paise, QuoteOmissionAdder, PackageTier } from './types'

/**
 * Pure TypeScript Category Omission Detection Engine (QUOTE-04, D-06)
 * Flags unstated statutory taxes (5% or 18% GST) and operational hardware/fees
 * (generator backup, overtime, waitstaff, travel lodging).
 */
export function detectQuoteOmissions(
  rawText: string,
  category: BudgetCategory,
  baseTierPaise: Paise
): QuoteOmissionAdder[] {
  const norm = rawText.toLowerCase()
  const ctx = { category, baseTierPaise }

  // Rules live in `omission-rules-table.ts` (OMISSION_RULES); table order is result order.
  return OMISSION_RULES.filter(
    (rule) => rule.categories.includes(category) && !rule.coveredBy.some((p) => norm.includes(p))
  ).map((rule) => rule.build(ctx))
}

/**
 * Calculates a tier's total integer paise with active omission adders applied
 */
export function calculateTierTotalWithAdders(
  tier: PackageTier,
  adders: QuoteOmissionAdder[],
  activeAdderIds?: string[]
): Paise {
  let total = tier.baseTierPaise

  const activeAdders = activeAdderIds
    ? adders.filter((a) => activeAdderIds.includes(a.id))
    : adders.filter((a) => a.isEnabled)

  for (const adder of activeAdders) {
    if (adder.rateType === 'percentage') {
      const pct = adder.percentageValue ?? 0
      total += Math.round((tier.baseTierPaise * pct) / 100)
    } else {
      total += adder.fixedPaise ?? adder.amountPaise
    }
  }

  return total
}
