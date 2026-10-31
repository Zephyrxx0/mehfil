import type {
  Paise,
  Plan,
  BudgetLine,
  BudgetCategory,
  ShortfallRemedy,
  CuratedIdea,
  IdeaDisplacementRecord,
  DisplacedDonor,
  VendorQuote,
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
  const quotas = ratios.map((r) => r * totalRupees)

  // Take floors
  const floors = quotas.map((q) => Math.floor(q))
  const remainders = quotas.map((q, i) => q - floors[i])

  // How many extra rupees to distribute?
  const sumFloors = floors.reduce((a, b) => a + b, 0)
  const extra = totalRupees - sumFloors

  // Largest-remainder: sort by remainder descending, give extra to top N
  const indices = remainders.map((r, i) => ({ r, i })).sort((a, b) => b.r - a.r)

  const rupees = [...floors]
  for (let k = 0; k < extra; k++) {
    rupees[indices[k].i] += 1
  }

  // Convert to paise
  const paises = rupees.map((r) => r * 100)

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
  const lines = plan.lines.map((l) => ({ ...l })) // shallow copy

  // Step 1: Fix per-guest lines based on new guest count
  const perGuestLines = lines.filter((l) => l.lineType === 'per_guest' && !l.isProtected)
  const protectedLines = lines.filter((l) => l.isProtected)
  const fixedLines = lines.filter(
    (l) => (l.lineType === 'fixed' || l.lineType === 'buffer') && !l.isProtected
  )
  const elasticLines = lines.filter((l) => l.lineType === 'flexible' && !l.isProtected)

  // Compute fixed total (unchanged)
  const fixedTotal = fixedLines.reduce((s, l) => s + l.currentPaise, 0)

  // Protected lines: unchanged
  const protectedTotal = protectedLines.reduce((s, l) => s + l.currentPaise, 0)

  // Per-guest lines: scale proportionally using Hare-Niemeyer
  const baselinePerGuestTotal = perGuestLines.reduce((s, l) => s + l.baselinePaise, 0)
  const newPerGuestTotal = Math.round((baselinePerGuestTotal * ratio) / 100) * 100 // round to nearest rupee

  if (perGuestLines.length > 0 && baselinePerGuestTotal > 0) {
    const perGuestRatios = perGuestLines.map((l) => l.baselinePaise / baselinePerGuestTotal)
    const newAllocations = apportionRupees(newPerGuestTotal, perGuestRatios)
    perGuestLines.forEach((l, i) => {
      l.currentPaise = newAllocations[i]
    })
  }

  // Step 2: What's left for elastic lines?
  const allocatedSoFar = fixedTotal + protectedTotal + newPerGuestTotal
  const elasticBudget = plan.totalBudgetPaise - allocatedSoFar

  // Step 3: Apply elastic budget with 40% floor constraint (D-11, ADR-0002)
  const floorValues = elasticLines.map((l) => Math.round((l.baselinePaise * 0.4) / 100) * 100)
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
  }

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
    const sum = newLines.reduce((s, l) => s + l.currentPaise, 0)
    if (sum !== plan.totalBudgetPaise) {
      // Fix any integer rounding by adjusting the most elastic line
      const diff = plan.totalBudgetPaise - sum
      const adjustTarget =
        newLines.find((l) => l.lineType === 'flexible' && !l.isProtected) ??
        newLines[newLines.length - 1]
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
function calculateShortfallRemedies(plan: Plan, deficitPaise: Paise): ShortfallRemedy[] {
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
  const elasticLines = plan.lines.filter((l) => l.lineType === 'flexible' && !l.isProtected)
  const totalElasticCapacity = elasticLines.reduce((s, l) => {
    const floor = Math.round((l.baselinePaise * 0.4) / 100) * 100
    return s + Math.max(0, l.currentPaise - floor)
  }, 0)

  // Current demand from per-guest lines
  const perGuestLines = plan.lines.filter((l) => l.lineType === 'per_guest' && !l.isProtected)
  const perGuestBaseline = perGuestLines.reduce((s, l) => s + l.baselinePaise, 0)

  // Per-guest paise per person at baseline
  const paisePerGuest = baselineGuestCount > 0 ? perGuestBaseline / baselineGuestCount : 0

  // Maximum feasible guests: how many guests can we afford with available elastic capacity?
  const currentPerGuestTotal = perGuestLines.reduce((s, l) => s + l.currentPaise, 0)
  const availableForPerGuest = currentPerGuestTotal + totalElasticCapacity
  const maxFeasibleGuests =
    paisePerGuest > 0 ? Math.floor(availableForPerGuest / paisePerGuest) : brief.guestCount

  const reduceGuestsRemedy: ShortfallRemedy = {
    type: 'reduce_guests',
    title: 'Reduce Guest Count',
    description: `Reduce guest count from ${brief.guestCount} to ${maxFeasibleGuests} to balance within budget`,
    deltaValue: maxFeasibleGuests,
  }

  // Remedy 3: Trim elastic lines to their floors
  const trimableLines = elasticLines
    .filter((l) => l.currentPaise > Math.round((l.baselinePaise * 0.4) / 100) * 100)
    .sort((a, b) => (a.elasticityRank ?? 99) - (b.elasticityRank ?? 99))

  const trimDescription =
    trimableLines.length > 0
      ? `Trim ${trimableLines.map((l) => l.name).join(', ')} to their minimum floors to free up ₹${Math.ceil(totalElasticCapacity / 100).toLocaleString('en-IN')}`
      : 'No additional flexible trim capacity available'

  const trimRemedy: ShortfallRemedy = {
    type: 'trim_elastic',
    title: 'Trim Flexible Lines',
    description: trimDescription,
    deltaValue: totalElasticCapacity,
  }

  return [increaseBudgetRemedy, reduceGuestsRemedy, trimRemedy]
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

  const lines = plan.lines.map((l) => ({ ...l }))
  const elasticLines = lines
    .filter((l) => l.lineType === 'flexible' && !l.isProtected)
    .sort((a, b) => (a.elasticityRank ?? 99) - (b.elasticityRank ?? 99))

  let remainingDeficit = deficit

  for (const line of elasticLines) {
    if (remainingDeficit <= 0) break
    const floor = Math.round((line.baselinePaise * 0.4) / 100) * 100
    const available = Math.max(0, line.currentPaise - floor)
    if (available > 0) {
      const trimAmount = Math.min(remainingDeficit, available)
      line.currentPaise -= trimAmount
      remainingDeficit -= trimAmount
    }
  }

  const newPlan: Plan = {
    ...plan,
    lines,
  }

  if (remainingDeficit <= 0) {
    newPlan.isInfeasible = false
    newPlan.shortfallPaise = undefined
    newPlan.remedies = undefined

    // Verify invariant for feasible plan
    const sum = newPlan.lines.reduce((s, l) => s + l.currentPaise, 0)
    if (sum !== newPlan.totalBudgetPaise) {
      const diff = newPlan.totalBudgetPaise - sum
      const adjustTarget = elasticLines[0] ?? newPlan.lines[newPlan.lines.length - 1]
      adjustTarget.currentPaise += diff
    }
  } else {
    newPlan.isInfeasible = true
    newPlan.shortfallPaise = remainingDeficit
    newPlan.remedies = calculateShortfallRemedies(newPlan, remainingDeficit)
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
  const lines = plan.lines.map((l) => ({ ...l }))
  const targetLine = lines.find((l) => l.category === idea.category)
  if (!targetLine) {
    throw new Error(`Target category ${idea.category} not found in plan`)
  }

  // Identify flexible donor candidate lines: flexible, not protected, and not the target category
  const donorCandidates = lines
    .filter((l) => l.lineType === 'flexible' && !l.isProtected && l.category !== idea.category)
    .sort((a, b) => (a.elasticityRank ?? 99) - (b.elasticityRank ?? 99))

  let neededPaise = idea.costPaise
  const displacedDonors: DisplacedDonor[] = []

  for (const donor of donorCandidates) {
    if (neededPaise <= 0) break
    const floor = Math.round((donor.baselinePaise * 0.4) / 100) * 100
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
  const record = plan.adoptedIdeas?.find((r) => r.ideaId === ideaId)
  if (!record) {
    return plan
  }

  const lines = plan.lines.map((l) => ({ ...l }))
  const targetLine = lines.find((l) => l.category === record.targetCategory)
  if (targetLine) {
    targetLine.currentPaise -= record.costPaise
  }

  // Reverse restore displaced paise: iterate record.displacedDonors in reverse order
  const reversedDonors = [...record.displacedDonors].reverse()
  for (const donor of reversedDonors) {
    const line = lines.find((l) => l.id === donor.lineId)
    if (line) {
      line.currentPaise += donor.displacedPaise
    }
  }

  const remainingAdoptedIdeas = (plan.adoptedIdeas ?? []).filter((r) => r.ideaId !== ideaId)

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
      const adjustTarget =
        newPlan.lines.find((l) => l.lineType === 'flexible' && !l.isProtected) ??
        newPlan.lines[newPlan.lines.length - 1]
      adjustTarget.currentPaise += diff
    }
  }

  return newPlan
}

export interface QuoteDisplacementPreview {
  committedPaise: Paise
  deltaPaise: Paise
  displacedDonors: DisplacedDonor[]
  wouldTriggerShortfall: boolean
  shortfallPaise: Paise
}

/**
 * Preview the budget displacement and shortfall impact of committing a vendor quote tier (QUOTE-06, D-09, D-12).
 * Pure calculation — does not mutate plan state.
 */
export function previewQuoteDisplacement(
  plan: Plan,
  quote: VendorQuote,
  tierId: string,
  activeAdderIds?: string[]
): QuoteDisplacementPreview {
  const tier = quote.tiers.find((t) => t.tierId === tierId) ?? quote.tiers[0]
  if (!tier) {
    throw new Error(`Tier ${tierId} not found in quote ${quote.id}`)
  }

  // Calculate committedPaise: base tier paise + active omission adders
  let committedPaise = tier.baseTierPaise
  if (activeAdderIds !== undefined) {
    const addersTotal = (quote.omissionAdders ?? [])
      .filter((a) => activeAdderIds.includes(a.id))
      .reduce((sum, a) => sum + a.amountPaise, 0)
    committedPaise += addersTotal
  } else {
    committedPaise = tier.totalWithAddersPaise ?? tier.baseTierPaise
  }

  const targetLine = plan.lines.find((l) => l.category === quote.category)
  if (!targetLine) {
    throw new Error(`Target category line ${quote.category} not found in plan`)
  }

  const deltaPaise = committedPaise - targetLine.currentPaise

  if (deltaPaise <= 0) {
    return {
      committedPaise,
      deltaPaise,
      displacedDonors: [],
      wouldTriggerShortfall: false,
      shortfallPaise: 0,
    }
  }

  // Delta > 0: Need to fund excess outlay via flexible donor lines
  const donorCandidates = plan.lines
    .filter(
      (l) => l.lineType === 'flexible' && !l.isProtected && !l.isCommitted && l.id !== targetLine.id
    )
    .sort((a, b) => (a.elasticityRank ?? 99) - (b.elasticityRank ?? 99))

  let neededPaise = deltaPaise
  const displacedDonors: DisplacedDonor[] = []

  for (const donor of donorCandidates) {
    if (neededPaise <= 0) break
    const floor = Math.round((donor.baselinePaise * 0.4) / 100) * 100
    const available = Math.max(0, donor.currentPaise - floor)
    if (available > 0) {
      const deduction = Math.min(neededPaise, available)
      displacedDonors.push({
        lineId: donor.id,
        category: donor.category,
        displacedPaise: deduction,
      })
      neededPaise -= deduction
    }
  }

  return {
    committedPaise,
    deltaPaise,
    displacedDonors,
    wouldTriggerShortfall: neededPaise > 0,
    shortfallPaise: neededPaise > 0 ? neededPaise : 0,
  }
}

/**
 * Commit a vendor quote to the plan (QUOTE-06, D-10, D-11, D-12).
 * - Locks currentPaise at actuals and records variancePaise
 * - If delta > 0: drains flexible donor lines (Misc -> Entertainment -> Decor) down to 40% floor
 * - Protected Moment lines are strictly immune (!line.isProtected)
 * - If donor capacity is exhausted, clamps to 40% floor and triggers Permissive Shortfall with 3 remedies
 * - If delta < 0: restores trimmed flexible lines toward baseline, sends leftover surplus to contingency
 * - Invariant: sum(lines.currentPaise) === plan.totalBudgetPaise for feasible plans
 */
export function commitQuote(
  plan: Plan,
  quote: VendorQuote,
  tierId: string,
  activeAdderIds?: string[]
): Plan {
  const tier = quote.tiers.find((t) => t.tierId === tierId) ?? quote.tiers[0]
  if (!tier) {
    throw new Error(`Tier ${tierId} not found in quote ${quote.id}`)
  }

  let committedPaise = tier.baseTierPaise
  if (activeAdderIds !== undefined) {
    const addersTotal = (quote.omissionAdders ?? [])
      .filter((a) => activeAdderIds.includes(a.id))
      .reduce((sum, a) => sum + a.amountPaise, 0)
    committedPaise += addersTotal
  } else {
    committedPaise = tier.totalWithAddersPaise ?? tier.baseTierPaise
  }

  const lines = plan.lines.map((l) => ({ ...l }))
  const targetLine = lines.find((l) => l.category === quote.category)
  if (!targetLine) {
    throw new Error(`Target category line ${quote.category} not found in plan`)
  }

  const deltaPaise = committedPaise - targetLine.currentPaise
  let remainingShortfall = 0

  if (deltaPaise > 0) {
    // Excess outlay: drain flexible donor lines in elasticity order down to 40% floor
    const donorCandidates = lines
      .filter(
        (l) =>
          l.lineType === 'flexible' && !l.isProtected && !l.isCommitted && l.id !== targetLine.id
      )
      .sort((a, b) => (a.elasticityRank ?? 99) - (b.elasticityRank ?? 99))

    let neededPaise = deltaPaise

    for (const donor of donorCandidates) {
      if (neededPaise <= 0) break
      const floor = Math.round((donor.baselinePaise * 0.4) / 100) * 100
      const available = Math.max(0, donor.currentPaise - floor)
      if (available > 0) {
        const deduction = Math.min(neededPaise, available)
        donor.currentPaise -= deduction
        neededPaise -= deduction
      }
    }

    if (neededPaise > 0) {
      remainingShortfall = neededPaise
    }
  } else if (deltaPaise < 0) {
    // Under budget savings: restore previously trimmed flexible lines back toward baseline
    let surplusPaise = -deltaPaise
    const flexibleLinesToRestore = lines
      .filter((l) => l.lineType === 'flexible' && !l.isProtected && l.id !== targetLine.id)
      .sort((a, b) => (b.elasticityRank ?? 99) - (a.elasticityRank ?? 99))

    for (const line of flexibleLinesToRestore) {
      if (surplusPaise <= 0) break
      if (line.currentPaise < line.baselinePaise) {
        const room = line.baselinePaise - line.currentPaise
        const restore = Math.min(surplusPaise, room)
        line.currentPaise += restore
        surplusPaise -= restore
      }
    }

    // Allocate any leftover surplus to contingency buffer
    if (surplusPaise > 0) {
      const contingency = lines.find((l) => l.category === 'contingency')
      if (contingency) {
        contingency.currentPaise += surplusPaise
      } else {
        const bufferLine = lines.find((l) => l.lineType === 'buffer')
        if (bufferLine) {
          bufferLine.currentPaise += surplusPaise
        } else if (flexibleLinesToRestore.length > 0) {
          flexibleLinesToRestore[0].currentPaise += surplusPaise
        }
      }
    }
  }

  // Lock target line commitment metadata (D-10)
  targetLine.isCommitted = true
  targetLine.committedQuoteId = quote.id
  targetLine.committedVendor = quote.vendorName
  targetLine.committedTierName = tier.name
  targetLine.committedPaise = committedPaise
  targetLine.currentPaise = committedPaise
  targetLine.variancePaise = targetLine.baselinePaise - committedPaise
  targetLine.committedAt = new Date().toISOString()

  // Track quote in plan
  const existingQuotes = plan.quotes ?? []
  const quotes = [...existingQuotes.filter((q) => q.id !== quote.id), quote]

  const newPlan: Plan = {
    ...plan,
    lines,
    quotes,
  }

  const existingShortfall = plan.shortfallPaise ?? 0
  const totalShortfall = existingShortfall + remainingShortfall

  if (totalShortfall > 0) {
    newPlan.isInfeasible = true
    newPlan.shortfallPaise = totalShortfall
    newPlan.remedies = calculateShortfallRemedies(newPlan, totalShortfall)
  } else {
    newPlan.isInfeasible = false
    newPlan.shortfallPaise = undefined
    newPlan.remedies = undefined
  }

  // Invariant verification for feasible plans
  if (!newPlan.isInfeasible) {
    const sum = newPlan.lines.reduce((s, l) => s + l.currentPaise, 0)
    if (sum !== newPlan.totalBudgetPaise) {
      const diff = newPlan.totalBudgetPaise - sum
      const adjustTarget =
        newPlan.lines.find((l) => l.category === 'contingency') ??
        newPlan.lines.find((l) => l.lineType === 'flexible' && !l.isProtected && !l.isCommitted) ??
        newPlan.lines[newPlan.lines.length - 1]
      adjustTarget.currentPaise += diff
    }
  }

  return newPlan
}

/**
 * Unlock and release a committed quote on a budget line (QUOTE-06, D-10).
 * - Resets isCommitted = false and clears commitment metadata
 * - Restores category line back to baselinePaise and rebalances flexible lines / contingency
 */
export function unlockQuote(plan: Plan, category: BudgetCategory): Plan {
  const lines = plan.lines.map((l) => ({ ...l }))
  const targetLine = lines.find((l) => l.category === category)
  if (!targetLine || !targetLine.isCommitted) {
    return plan
  }

  const prevCommitted = targetLine.committedPaise ?? targetLine.currentPaise

  targetLine.isCommitted = false
  targetLine.committedQuoteId = undefined
  targetLine.committedVendor = undefined
  targetLine.committedTierName = undefined
  targetLine.committedPaise = undefined
  targetLine.variancePaise = undefined
  targetLine.committedAt = undefined

  const delta = targetLine.baselinePaise - prevCommitted
  targetLine.currentPaise = targetLine.baselinePaise

  if (delta > 0) {
    // Target was under baseline, returning to baseline requires more money
    let needed = delta
    const contingency = lines.find((l) => l.category === 'contingency')
    if (contingency && contingency.currentPaise > contingency.baselinePaise) {
      const take = Math.min(needed, contingency.currentPaise - contingency.baselinePaise)
      contingency.currentPaise -= take
      needed -= take
    }

    const donors = lines
      .filter(
        (l) =>
          l.lineType === 'flexible' && !l.isProtected && !l.isCommitted && l.id !== targetLine.id
      )
      .sort((a, b) => (a.elasticityRank ?? 99) - (b.elasticityRank ?? 99))

    for (const donor of donors) {
      if (needed <= 0) break
      const floor = Math.round((donor.baselinePaise * 0.4) / 100) * 100
      const avail = Math.max(0, donor.currentPaise - floor)
      if (avail > 0) {
        const take = Math.min(needed, avail)
        donor.currentPaise -= take
        needed -= take
      }
    }
  } else if (delta < 0) {
    // Target was over baseline, returning to baseline frees up money
    let surplus = -delta
    const flexibleLines = lines
      .filter((l) => l.lineType === 'flexible' && !l.isProtected && l.id !== targetLine.id)
      .sort((a, b) => (b.elasticityRank ?? 99) - (a.elasticityRank ?? 99))

    for (const line of flexibleLines) {
      if (surplus <= 0) break
      if (line.currentPaise < line.baselinePaise) {
        const room = line.baselinePaise - line.currentPaise
        const restore = Math.min(surplus, room)
        line.currentPaise += restore
        surplus -= restore
      }
    }

    if (surplus > 0) {
      const contingency = lines.find((l) => l.category === 'contingency')
      if (contingency) {
        contingency.currentPaise += surplus
      } else if (flexibleLines.length > 0) {
        flexibleLines[0].currentPaise += surplus
      }
    }
  }

  const sum = lines.reduce((s, l) => s + l.currentPaise, 0)
  let isInfeasible = false
  let shortfallPaise: number | undefined = undefined

  if (sum > plan.totalBudgetPaise) {
    isInfeasible = true
    shortfallPaise = sum - plan.totalBudgetPaise
  } else if (sum < plan.totalBudgetPaise) {
    const diff = plan.totalBudgetPaise - sum
    const cont =
      lines.find((l) => l.category === 'contingency') ??
      lines.find((l) => l.lineType === 'flexible') ??
      lines[lines.length - 1]
    cont.currentPaise += diff
  }

  return {
    ...plan,
    lines,
    isInfeasible,
    shortfallPaise,
    remedies:
      isInfeasible && shortfallPaise
        ? calculateShortfallRemedies({ ...plan, lines }, shortfallPaise)
        : undefined,
  }
}
