import type { BudgetCategory, BudgetLine, Paise, Plan } from '../types'
import { apportionRupees } from './allocate'
import {
  absorbRoundingDrift,
  applyShortfallStatus,
  calculateShortfallRemedies,
  cloneLines,
  elasticFloor,
  flexibleLines,
  inDrainOrder,
  sumCurrentPaise,
} from './shared'

/** Scale per-guest lines to the new guest count (Hare-Niemeyer); returns their new total. */
function scalePerGuestLines(perGuestLines: BudgetLine[], ratio: number): Paise {
  const baselineTotal = perGuestLines.reduce((s, l) => s + l.baselinePaise, 0)
  const newTotal = Math.round((baselineTotal * ratio) / 100) * 100 // round to nearest rupee

  if (perGuestLines.length > 0 && baselineTotal > 0) {
    const ratios = perGuestLines.map((l) => l.baselinePaise / baselineTotal)
    const allocations = apportionRupees(newTotal, ratios)
    perGuestLines.forEach((l, i) => {
      l.currentPaise = allocations[i]
    })
  }
  return newTotal
}

/**
 * Give elastic lines their 40% floor, then apportion any surplus by baseline weight (D-11, ADR-0002).
 * When the budget cannot cover the floors, every elastic line is clamped to its floor
 * and the uncovered amount is returned as the shortfall.
 */
function allocateElasticBudget(
  elasticLines: BudgetLine[],
  elasticBudget: Paise
): { isInfeasible: boolean; shortfallPaise: Paise } {
  const floorValues = elasticLines.map(elasticFloor)
  const sumFloors = floorValues.reduce((s, v) => s + v, 0)

  if (elasticBudget < sumFloors) {
    // Demand exceeds donor capacity: clamp all elastic lines to their 40% floor
    elasticLines.forEach((l, i) => {
      l.currentPaise = floorValues[i]
    })
    return { isInfeasible: true, shortfallPaise: sumFloors - elasticBudget }
  }

  // Elastic budget satisfies floors: give each line its floor, then apportion the surplus
  const extraBudget = elasticBudget - sumFloors
  const totalElasticBaseline = elasticLines.reduce((s, l) => s + l.baselinePaise, 0)

  if (totalElasticBaseline > 0) {
    const elasticRatios = elasticLines.map((l) => l.baselinePaise / totalElasticBaseline)
    const extraAllocations = apportionRupees(extraBudget, elasticRatios)
    elasticLines.forEach((l, i) => {
      l.currentPaise = floorValues[i] + extraAllocations[i]
    })
  } else if (elasticLines.length > 0) {
    elasticLines.forEach((l, i) => {
      l.currentPaise = floorValues[i]
    })
    elasticLines[elasticLines.length - 1].currentPaise += extraBudget
  }
  return { isInfeasible: false, shortfallPaise: 0 }
}

/**
 * Rebalance a plan when guest count changes.
 * - Per-guest lines scale proportionally
 * - Fixed and buffer lines are unchanged
 * - Protected line is immune to downward trimming
 * - Elastic lines absorb the difference (trimmed in elasticityRank order)
 * - Elastic lines never go below 40% of their baselinePaise (D-11)
 *
 * INVARIANT: sum(lines.currentPaise) === plan.totalBudgetPaise for feasible plans
 */
export function rebalanceGuestCount(plan: Plan, newGuestCount: number): Plan {
  if (newGuestCount <= 0) throw new Error('Guest count must be positive')

  const ratio = newGuestCount / plan.baselineGuestCount
  const lines = cloneLines(plan)

  // Step 1: Fix per-guest lines based on new guest count
  const perGuestLines = lines.filter((l) => l.lineType === 'per_guest' && !l.isProtected)
  const protectedLines = lines.filter((l) => l.isProtected)
  const fixedLines = lines.filter(
    (l) => (l.lineType === 'fixed' || l.lineType === 'buffer') && !l.isProtected
  )
  const elasticLines = flexibleLines(lines)

  // Fixed and protected lines are unchanged
  const fixedTotal = sumCurrentPaise(fixedLines)
  const protectedTotal = sumCurrentPaise(protectedLines)
  const newPerGuestTotal = scalePerGuestLines(perGuestLines, ratio)

  // Step 2: What's left for elastic lines?
  const allocatedSoFar = fixedTotal + protectedTotal + newPerGuestTotal
  const elasticBudget = plan.totalBudgetPaise - allocatedSoFar

  // Step 3: Apply elastic budget with 40% floor constraint (D-11, ADR-0002)
  const { isInfeasible, shortfallPaise } = allocateElasticBudget(elasticLines, elasticBudget)

  // Merge updated lines back
  const lineMap = new Map([
    ...perGuestLines.map((l) => [l.id, l] as [string, BudgetLine]),
    ...protectedLines.map((l) => [l.id, l] as [string, BudgetLine]),
    ...fixedLines.map((l) => [l.id, l] as [string, BudgetLine]),
    ...elasticLines.map((l) => [l.id, l] as [string, BudgetLine]),
  ])
  const newLines = plan.lines.map((l) => lineMap.get(l.id) ?? l)

  // Verify invariant (for feasible plans)
  if (!isInfeasible) {
    absorbRoundingDrift(newLines, plan.totalBudgetPaise, flexibleLines(newLines)[0])
  }

  const newPlan: Plan = {
    ...plan,
    lines: newLines,
    brief: { ...plan.brief, guestCount: newGuestCount },
  }

  if (isInfeasible) {
    newPlan.isInfeasible = true
    newPlan.shortfallPaise = shortfallPaise
    newPlan.remedies = calculateShortfallRemedies(newPlan, shortfallPaise)
  }

  return newPlan
}

/**
 * Targeted Sequential Elasticity Trim Remedy (BUDGET-03, BUDGET-04, ADR-0002).
 * Trims flexible lines in strict elasticity order (Rank 1 -> 2 -> 3) only until
 * the deficit is absorbed, stopping immediately when covered (D-15).
 * Flexible lines are protected by their 40% baseline floor.
 * Protected Moment is strictly immune to trimming (!line.isProtected).
 */
export function applyTrimElasticRemedy(plan: Plan, deficitPaise?: Paise): Plan {
  const deficit = deficitPaise !== undefined ? deficitPaise : (plan.shortfallPaise ?? 0)
  if (deficit <= 0) {
    return {
      ...plan,
      isInfeasible: false,
      shortfallPaise: undefined,
      remedies: undefined,
    }
  }

  const lines = cloneLines(plan)
  const elasticLines = inDrainOrder(flexibleLines(lines))

  let remainingDeficit = deficit
  for (const line of elasticLines) {
    if (remainingDeficit <= 0) break
    const available = Math.max(0, line.currentPaise - elasticFloor(line))
    if (available > 0) {
      const trimAmount = Math.min(remainingDeficit, available)
      line.currentPaise -= trimAmount
      remainingDeficit -= trimAmount
    }
  }

  const newPlan: Plan = { ...plan, lines }
  applyShortfallStatus(newPlan, remainingDeficit)

  // Verify invariant for feasible plan
  if (!newPlan.isInfeasible) {
    absorbRoundingDrift(newPlan.lines, newPlan.totalBudgetPaise, elasticLines[0])
  }

  return newPlan
}

/**
 * Move the Protected Moment star/lock to a new category.
 * Only one line can be Protected at a time.
 */
export function setProtectedMoment(plan: Plan, category: BudgetCategory): Plan {
  const newLines = plan.lines.map((l) => ({
    ...l,
    isProtected: l.category === category,
  }))

  return { ...plan, lines: newLines, brief: { ...plan.brief, protectedCategory: category } }
}
