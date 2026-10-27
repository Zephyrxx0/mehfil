import type {
  Paise,
  Plan,
  BudgetLine,
  BudgetCategory,
  ShortfallRemedy,
  CuratedIdea,
  IdeaDisplacementRecord,
  DisplacedDonor,
} from './types'

/**
 * Hare-Niemeyer largest-remainder apportionment.
 * Distributes totalPaise across lines according to ratios.
 * INVARIANT: sum(returned values) === totalPaise exactly.
 *
 * @param totalPaise - integer paise to distribute
 * @param ratios - fractions for each line (must sum to 1.0)
 * @returns integer paise for each line
 */
export function apportionRupees(totalPaise: Paise, ratios: number[]): Paise[] {
  if (ratios.length === 0) return []

  // Work in whole rupees for apportionment, then convert back
  const totalRupees = Math.round(totalPaise / 100)

  // Compute quotas (floating point OK here — only for computing remainders)
  const quotas = ratios.map(r => r * totalRupees)

  // Take floors
  const floors = quotas.map(q => Math.floor(q))
  const remainders = quotas.map((q, i) => q - floors[i])

  // How many extra rupees to distribute?
  const sumFloors = floors.reduce((a, b) => a + b, 0)
  const extra = totalRupees - sumFloors

  // Largest-remainder: sort by remainder descending, give extra to top N
  const indices = remainders
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r - a.r)

  const rupees = [...floors]
  for (let k = 0; k < extra; k++) {
    rupees[indices[k].i] += 1
  }

  // Convert to paise
  const paises = rupees.map(r => r * 100)

  // Verify invariant
  const sum = paises.reduce((a, b) => a + b, 0)
  if (sum !== totalPaise) {
    // Adjust last element to fix any paise-level rounding from totalPaise not being divisible by 100
    paises[paises.length - 1] += totalPaise - sum
  }

  return paises
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
  const lines = plan.lines.map(l => ({ ...l }))  // shallow copy

  // Step 1: Fix per-guest lines based on new guest count
  const perGuestLines = lines.filter(l => l.lineType === 'per_guest' && !l.isProtected)
  const protectedLines = lines.filter(l => l.isProtected)
  const fixedLines = lines.filter(l => (l.lineType === 'fixed' || l.lineType === 'buffer') && !l.isProtected)
  const elasticLines = lines.filter(l => l.lineType === 'flexible' && !l.isProtected)

  // Compute fixed total (unchanged)
  const fixedTotal = fixedLines.reduce((s, l) => s + l.currentPaise, 0)

  // Protected lines: unchanged
  const protectedTotal = protectedLines.reduce((s, l) => s + l.currentPaise, 0)

  // Per-guest lines: scale proportionally using Hare-Niemeyer
  const baselinePerGuestTotal = perGuestLines.reduce((s, l) => s + l.baselinePaise, 0)
  const newPerGuestTotal = Math.round(baselinePerGuestTotal * ratio / 100) * 100  // round to nearest rupee

  if (perGuestLines.length > 0 && baselinePerGuestTotal > 0) {
    const perGuestRatios = perGuestLines.map(l => l.baselinePaise / baselinePerGuestTotal)
    const newAllocations = apportionRupees(newPerGuestTotal, perGuestRatios)
    perGuestLines.forEach((l, i) => { l.currentPaise = newAllocations[i] })
  }

  // Step 2: What's left for elastic lines?
  const allocatedSoFar = fixedTotal + protectedTotal + newPerGuestTotal
  const elasticBudget = plan.totalBudgetPaise - allocatedSoFar

  // Step 3: Apply elastic budget with 40% floor constraint (D-11, ADR-0002)
  const floorValues = elasticLines.map(l => Math.round(l.baselinePaise * 0.40 / 100) * 100)
  const sumFloors = floorValues.reduce((s, v) => s + v, 0)

  let isInfeasible = false
  let shortfallPaise = 0

  if (elasticBudget < sumFloors) {
    // Demand exceeds donor capacity: clamp all elastic lines to their 40% floor
    elasticLines.forEach((l, i) => {
      l.currentPaise = floorValues[i]
    })
    isInfeasible = true
    shortfallPaise = sumFloors - elasticBudget
  } else {
    // Elastic budget satisfies floors: give each line its floor, then apportion the surplus
    const extraBudget = elasticBudget - sumFloors
    const totalElasticBaseline = elasticLines.reduce((s, l) => s + l.baselinePaise, 0)

    if (totalElasticBaseline > 0) {
      const elasticRatios = elasticLines.map(l => l.baselinePaise / totalElasticBaseline)
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
  }

  // Merge updated lines back
  const lineMap = new Map([
    ...perGuestLines.map(l => [l.id, l] as [string, BudgetLine]),
    ...protectedLines.map(l => [l.id, l] as [string, BudgetLine]),
    ...fixedLines.map(l => [l.id, l] as [string, BudgetLine]),
    ...elasticLines.map(l => [l.id, l] as [string, BudgetLine]),
  ])
  const newLines = plan.lines.map(l => lineMap.get(l.id) ?? l)

  // Verify invariant (for feasible plans)
  if (!isInfeasible) {
    const sum = newLines.reduce((s, l) => s + l.currentPaise, 0)
    if (sum !== plan.totalBudgetPaise) {
      // Fix any integer rounding by adjusting the most elastic line
      const diff = plan.totalBudgetPaise - sum
      const adjustTarget = newLines.find(l => l.lineType === 'flexible' && !l.isProtected)
        ?? newLines[newLines.length - 1]
      adjustTarget.currentPaise += diff
    }
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
 * Compute 3 deterministic shortfall remedies (ADR-0002).
 * Models MUST NOT compute these — pure code only.
 */
export function calculateShortfallRemedies(plan: Plan, deficitPaise: Paise): ShortfallRemedy[] {
  const { brief, baselineGuestCount } = plan

  // Remedy 1: Increase Budget
  const increaseBudgetRemedy: ShortfallRemedy = {
    type: 'increase_budget',
    title: 'Increase Total Budget',
    description: `Add ₹${Math.ceil(deficitPaise / 100).toLocaleString('en-IN')} to the total budget to accommodate current guest count`,
    deltaValue: deficitPaise,
  }

  // Remedy 2: Reduce Guest Count to feasible maximum
  // The elastic donor capacity = sum of (currentPaise - floor) across elastic lines
  const elasticLines = plan.lines.filter(l => l.lineType === 'flexible' && !l.isProtected)
  const totalElasticCapacity = elasticLines.reduce((s, l) => {
    const floor = Math.round(l.baselinePaise * 0.40 / 100) * 100
    return s + Math.max(0, l.currentPaise - floor)
  }, 0)

  // Current demand from per-guest lines
  const perGuestLines = plan.lines.filter(l => l.lineType === 'per_guest' && !l.isProtected)
  const perGuestBaseline = perGuestLines.reduce((s, l) => s + l.baselinePaise, 0)

  // Per-guest paise per person at baseline
  const paisePerGuest = baselineGuestCount > 0 ? perGuestBaseline / baselineGuestCount : 0

  // Maximum feasible guests: how many guests can we afford with available elastic capacity?
  const currentPerGuestTotal = perGuestLines.reduce((s, l) => s + l.currentPaise, 0)
  const availableForPerGuest = currentPerGuestTotal + totalElasticCapacity
  const maxFeasibleGuests = paisePerGuest > 0
    ? Math.floor(availableForPerGuest / paisePerGuest)
    : brief.guestCount

  const reduceGuestsRemedy: ShortfallRemedy = {
    type: 'reduce_guests',
    title: 'Reduce Guest Count',
    description: `Reduce guest count from ${brief.guestCount} to ${maxFeasibleGuests} to balance within budget`,
    deltaValue: maxFeasibleGuests,
  }

  // Remedy 3: Trim elastic lines to their floors
  const trimableLines = elasticLines
    .filter(l => l.currentPaise > Math.round(l.baselinePaise * 0.40 / 100) * 100)
    .sort((a, b) => (a.elasticityRank ?? 99) - (b.elasticityRank ?? 99))

  const trimRemedy: ShortfallRemedy = {
    type: 'trim_elastic',
    title: 'Trim Flexible Lines',
    description: `Trim ${trimableLines.map(l => l.name).join(', ')} to their minimum floors to free up ₹${Math.ceil(totalElasticCapacity / 100).toLocaleString('en-IN')}`,
    deltaValue: totalElasticCapacity,
  }

  return [increaseBudgetRemedy, reduceGuestsRemedy, trimRemedy]
}

/**
 * Move the Protected Moment star/lock to a new category.
 * Only one line can be Protected at a time.
 */
export function setProtectedMoment(plan: Plan, category: BudgetCategory): Plan {
  const newLines = plan.lines.map(l => ({
    ...l,
    isProtected: l.category === category,
  }))

  return { ...plan, lines: newLines, brief: { ...plan.brief, protectedCategory: category } }
}

/**
 * Adopt a curated celebration idea via zero-sum displacement (IDEA-02, BUDGET-04, ADR-0004).
 * - Target category receives idea.costPaise
 * - Flexible donor lines are drained in strict elasticity order (Misc=1 -> Entertainment=2 -> Decor=3)
 * - Donor lines are never drained below 40% of their baselinePaise (D-11, D-06)
 * - Protected Moment is mathematically immune to displacement (!line.isProtected) (MOMENT-02)
 * - Permissive shortfall: if flexible capacity is exhausted, lines clamp to 40% floor,
 *   plan becomes infeasible with shortfallPaise, and deterministic remedies are computed (D-04, ADR-0002).
 */
export function adoptIdea(plan: Plan, idea: CuratedIdea): Plan {
  const lines = plan.lines.map(l => ({ ...l }))
  const targetLine = lines.find(l => l.category === idea.category)
  if (!targetLine) {
    throw new Error(`Target category ${idea.category} not found in plan`)
  }

  // Identify flexible donor candidate lines: flexible, not protected, and not the target category
  const donorCandidates = lines
    .filter(l => l.lineType === 'flexible' && !l.isProtected && l.category !== idea.category)
    .sort((a, b) => (a.elasticityRank ?? 99) - (b.elasticityRank ?? 99))

  let neededPaise = idea.costPaise
  const displacedDonors: DisplacedDonor[] = []

  for (const donor of donorCandidates) {
    if (neededPaise <= 0) break
    const floor = Math.round(donor.baselinePaise * 0.40 / 100) * 100
    const available = Math.max(0, donor.currentPaise - floor)
    if (available > 0) {
      const deduction = Math.min(neededPaise, available)
      donor.currentPaise -= deduction
      neededPaise -= deduction
      displacedDonors.push({
        lineId: donor.id,
        category: donor.category,
        displacedPaise: deduction,
      })
    }
  }

  // Target category line receives full idea.costPaise (permissive model, D-04)
  targetLine.currentPaise += idea.costPaise

  const record: IdeaDisplacementRecord = {
    ideaId: idea.id,
    title: idea.title,
    targetCategory: idea.category,
    costPaise: idea.costPaise,
    displacedDonors,
    shortfallPaise: neededPaise > 0 ? neededPaise : undefined,
    adoptedAt: new Date().toISOString(),
  }

  const adoptedIdeas = [...(plan.adoptedIdeas ?? []), record]

  const newPlan: Plan = {
    ...plan,
    lines,
    adoptedIdeas,
  }

  const existingShortfall = plan.shortfallPaise ?? 0
  const totalShortfall = existingShortfall + neededPaise

  if (totalShortfall > 0) {
    newPlan.isInfeasible = true
    newPlan.shortfallPaise = totalShortfall
    newPlan.remedies = calculateShortfallRemedies(newPlan, totalShortfall)
  } else {
    newPlan.isInfeasible = false
    newPlan.shortfallPaise = undefined
    newPlan.remedies = undefined
  }

  // Verify invariant for feasible plans
  if (!newPlan.isInfeasible) {
    const sum = newPlan.lines.reduce((s, l) => s + l.currentPaise, 0)
    if (sum !== newPlan.totalBudgetPaise) {
      const diff = newPlan.totalBudgetPaise - sum
      const adjustTarget = donorCandidates[0] ?? newPlan.lines[newPlan.lines.length - 1]
      adjustTarget.currentPaise += diff
    }
  }

  return newPlan
}

/**
 * Retract an adopted idea via exact inverse reversion (IDEA-03, D-07, ADR-0004).
 * - Debits idea.costPaise from target category
 * - Restores exact recorded displaced paise to donor lines in reverse order
 * - Cleanses shortfall and infeasible status if the idea caused shortfall
 */
export function retractIdea(plan: Plan, ideaId: string): Plan {
  const record = plan.adoptedIdeas?.find(r => r.ideaId === ideaId)
  if (!record) {
    return plan
  }

  const lines = plan.lines.map(l => ({ ...l }))
  const targetLine = lines.find(l => l.category === record.targetCategory)
  if (targetLine) {
    targetLine.currentPaise -= record.costPaise
  }

  // Reverse restore displaced paise: iterate record.displacedDonors in reverse order
  const reversedDonors = [...record.displacedDonors].reverse()
  for (const donor of reversedDonors) {
    const line = lines.find(l => l.id === donor.lineId)
    if (line) {
      line.currentPaise += donor.displacedPaise
    }
  }

  const remainingAdoptedIdeas = (plan.adoptedIdeas ?? []).filter(r => r.ideaId !== ideaId)

  const newPlan: Plan = {
    ...plan,
    lines,
    adoptedIdeas: remainingAdoptedIdeas.length > 0 ? remainingAdoptedIdeas : undefined,
  }

  const ideaShortfall = record.shortfallPaise ?? 0
  const remainingShortfall = Math.max(0, (plan.shortfallPaise ?? 0) - ideaShortfall)

  if (remainingShortfall > 0) {
    newPlan.isInfeasible = true
    newPlan.shortfallPaise = remainingShortfall
    newPlan.remedies = calculateShortfallRemedies(newPlan, remainingShortfall)
  } else {
    newPlan.isInfeasible = false
    newPlan.shortfallPaise = undefined
    newPlan.remedies = undefined
  }

  // Verify invariant for feasible plans
  if (!newPlan.isInfeasible) {
    const sum = newPlan.lines.reduce((s, l) => s + l.currentPaise, 0)
    if (sum !== newPlan.totalBudgetPaise) {
      const diff = newPlan.totalBudgetPaise - sum
      const adjustTarget = newPlan.lines.find(l => l.lineType === 'flexible' && !l.isProtected)
        ?? newPlan.lines[newPlan.lines.length - 1]
      adjustTarget.currentPaise += diff
    }
  }

  return newPlan
}
