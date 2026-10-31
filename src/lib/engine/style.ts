import type { Plan, BudgetLine, BudgetCategory, Paise } from './types'
import { apportionRupees } from './budget'
import type { StyleDNA, StyleDimensions } from '@/lib/ai/schemas'

/**
 * Calculates deterministic bounded multipliers [0.75, 1.25] for each budget category
 * from the 8-axis Style DNA dimensions profile, strictly locking a 1.25x floor multiplier
 * on the designated Protected Moment category (D-06, D-07, VIBE-04).
 */
export function calculateMultipliersFromDimensions(
  dimensions: StyleDimensions,
  protectedCategory: BudgetCategory
): Record<BudgetCategory, number> {
  const rawMultipliers: Record<BudgetCategory, number> = {
    entertainment: 0.75 + (dimensions.music / 100) * 0.5,
    decor: 0.75 + (dimensions.decorDensity / 100) * 0.5,
    catering: 1.25 - (dimensions.feastVsSpectacle / 100) * 0.5,
    venue: 0.75 + ((dimensions.scale + dimensions.formality) / 200) * 0.5,
    photo_film: 0.75 + (dimensions.formality / 100) * 0.5,
    contingency: 0.75 + (dimensions.indoorVsOutdoor / 100) * 0.5,
    favors: 0.75 + ((100 - dimensions.scale) / 100) * 0.5,
    misc: 1.0,
  }

  // Lock 1.25x floor multiplier on Protected Moment category (D-07)
  rawMultipliers[protectedCategory] = 1.25

  // Enforce strict clamping invariant [0.75, 1.25] (D-06)
  const multipliers: Record<BudgetCategory, number> = {} as Record<BudgetCategory, number>
  for (const cat of Object.keys(rawMultipliers) as BudgetCategory[]) {
    multipliers[cat] = Math.min(1.25, Math.max(0.75, rawMultipliers[cat]))
  }

  return multipliers
}

/**
 * Applies Style DNA modulation to an existing plan.
 * Rebalances baseline weights according to bounded multipliers [0.75, 1.25],
 * reapportions integer paise using Hare-Niemeyer largest-remainder method,
 * and immutably assigns Protected Moment immunity and quote.
 *
 * INVARIANT: sum(plan.lines.map(l => l.currentPaise)) === plan.totalBudgetPaise.
 */
export function applyStyleModulationToPlan(plan: Plan, styleDNA: StyleDNA): Plan {
  const { protectedCategory, protectedMomentQuote } = styleDNA
  const multipliers = calculateMultipliersFromDimensions(styleDNA.dimensions, protectedCategory)

  // 1. Modulate baseline ratios
  const baselineWeights = plan.lines.map((l) =>
    plan.totalBudgetPaise > 0 ? l.baselinePaise / plan.totalBudgetPaise : 0
  )
  const modulatedWeights = plan.lines.map((l, i) => baselineWeights[i] * multipliers[l.category])
  const sumWeights = modulatedWeights.reduce((a, b) => a + b, 0)

  const normalizedRatios =
    sumWeights > 0
      ? modulatedWeights.map((w) => w / sumWeights)
      : plan.lines.map(() => (plan.lines.length > 0 ? 1 / plan.lines.length : 0))

  // 2. Apportion integer paise with Hare-Niemeyer largest-remainder method
  const newPaiseAllocations = apportionRupees(plan.totalBudgetPaise, normalizedRatios)

  // 3. Update lines with integer paise and protected moment quote
  const updatedLines: BudgetLine[] = plan.lines.map((line, i) => {
    const isProt = line.category === protectedCategory
    return {
      ...line,
      currentPaise: newPaiseAllocations[i],
      isProtected: isProt,
      ...(isProt ? { protectedQuote: protectedMomentQuote } : {}),
    }
  })

  return {
    ...plan,
    lines: updatedLines,
    brief: {
      ...plan.brief,
      protectedCategory,
      vibeStatement: styleDNA.vibeStatement,
      protectedMomentQuote,
    },
    styleDNA,
  }
}

/**
 * Generates an audited, human plain-language explanation of which categories grew,
 * which trimmed, and confirmation that the Protected Moment held firm at its floor.
 */
export function generateStyleModulationRationale(
  styleDNA: StyleDNA,
  deltas: Array<{ category: BudgetCategory; deltaPaise: number }>
): string {
  const formatRupees = (paise: Paise) =>
    `₹${Math.abs(Math.round(paise / 100)).toLocaleString('en-IN')}`

  const elevated = deltas
    .filter((d) => d.deltaPaise > 0)
    .sort((a, b) => b.deltaPaise - a.deltaPaise)
    .map((d) => `${d.category.replace('_', ' ')} (+${formatRupees(d.deltaPaise)})`)

  const trimmed = deltas
    .filter((d) => d.deltaPaise < 0)
    .sort((a, b) => a.deltaPaise - b.deltaPaise)
    .map((d) => `${d.category.replace('_', ' ')} (-${formatRupees(d.deltaPaise)})`)

  const protectedName = styleDNA.protectedCategory.replace('_', ' ')

  let explanation = `Infused Style DNA: `
  if (elevated.length > 0) {
    explanation += `Elevated ${elevated.slice(0, 3).join(', ')}. `
  }
  if (trimmed.length > 0) {
    explanation += `Rebalanced ${trimmed.slice(0, 2).join(', ')}. `
  }
  explanation += `Protected Moment (${protectedName}) locked at 1.25x floor.`

  return explanation.length > 500 ? explanation.slice(0, 497) + '...' : explanation
}
