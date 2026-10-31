import type { BudgetLine, DisplacedDonor, Paise, Plan, ShortfallRemedy } from '../types'

/** Elastic lines never drop below 40% of baseline, rounded to a whole rupee (D-11, ADR-0002). */
export function elasticFloor(line: BudgetLine): Paise {
  return Math.round((line.baselinePaise * 0.4) / 100) * 100
}

/** Shallow-copy every line so callers can mutate without touching the source plan. */
export function cloneLines(plan: Plan): BudgetLine[] {
  return plan.lines.map((l) => ({ ...l }))
}

export function sumCurrentPaise(lines: BudgetLine[]): Paise {
  return lines.reduce((s, l) => s + l.currentPaise, 0)
}

/** Flexible lines that are not the Protected Moment: the only lines elasticity may touch. */
export function flexibleLines(lines: BudgetLine[]): BudgetLine[] {
  return lines.filter((l) => l.lineType === 'flexible' && !l.isProtected)
}

export function findContingency(lines: BudgetLine[]): BudgetLine | undefined {
  return lines.find((l) => l.category === 'contingency')
}

/** Rank 1 first: the order in which lines are drained. */
export function inDrainOrder(lines: BudgetLine[]): BudgetLine[] {
  return [...lines].sort((a, b) => (a.elasticityRank ?? 99) - (b.elasticityRank ?? 99))
}

/** Highest rank first: the order in which lines are refilled. */
export function inRestoreOrder(lines: BudgetLine[]): BudgetLine[] {
  return [...lines].sort((a, b) => (b.elasticityRank ?? 99) - (a.elasticityRank ?? 99))
}

export interface DonorDrain {
  displaced: DisplacedDonor[]
  /** Paise the donors could not cover (negative only if a negative amount was requested). */
  remainingPaise: Paise
}

/** Walk donors in order, taking at most (current - floor) from each until `neededPaise` is covered. */
function walkDonors(
  donors: BudgetLine[],
  neededPaise: Paise,
  take: (donor: BudgetLine, amountPaise: Paise) => void
): Paise {
  let remaining = neededPaise
  for (const donor of donors) {
    if (remaining <= 0) break
    const available = Math.max(0, donor.currentPaise - elasticFloor(donor))
    if (available > 0) {
      const amount = Math.min(remaining, available)
      take(donor, amount)
      remaining -= amount
    }
  }
  return remaining
}

function displacedEntry(donor: BudgetLine, displacedPaise: Paise): DisplacedDonor {
  return { lineId: donor.id, category: donor.category, displacedPaise }
}

/** Drain donors (mutates their currentPaise) and report who gave what. */
export function drainDonors(donors: BudgetLine[], neededPaise: Paise): DonorDrain {
  const displaced: DisplacedDonor[] = []
  const remainingPaise = walkDonors(donors, neededPaise, (donor, amount) => {
    donor.currentPaise -= amount
    displaced.push(displacedEntry(donor, amount))
  })
  return { displaced, remainingPaise }
}

/** Same walk as drainDonors, but leaves the donor lines untouched. */
export function previewDonorDrain(donors: BudgetLine[], neededPaise: Paise): DonorDrain {
  const displaced: DisplacedDonor[] = []
  const remainingPaise = walkDonors(donors, neededPaise, (donor, amount) => {
    displaced.push(displacedEntry(donor, amount))
  })
  return { displaced, remainingPaise }
}

/** Refill lines toward baseline in the given order; returns the surplus that did not fit. */
export function restoreTowardBaseline(order: BudgetLine[], surplusPaise: Paise): Paise {
  let surplus = surplusPaise
  for (const line of order) {
    if (surplus <= 0) break
    if (line.currentPaise < line.baselinePaise) {
      const restore = Math.min(surplus, line.baselinePaise - line.currentPaise)
      line.currentPaise += restore
      surplus -= restore
    }
  }
  return surplus
}

/**
 * Close any integer drift between the lines and the total budget by adjusting
 * `preferred` (or the last line when there is none). No-op when already exact.
 */
export function absorbRoundingDrift(
  lines: BudgetLine[],
  totalBudgetPaise: Paise,
  preferred: BudgetLine | undefined
): void {
  const sum = sumCurrentPaise(lines)
  if (sum !== totalBudgetPaise) {
    const target = preferred ?? lines[lines.length - 1]
    target.currentPaise += totalBudgetPaise - sum
  }
}

/** Mark the plan infeasible with remedies when there is a shortfall, otherwise clear all three. */
export function applyShortfallStatus(plan: Plan, shortfallPaise: Paise): void {
  if (shortfallPaise > 0) {
    plan.isInfeasible = true
    plan.shortfallPaise = shortfallPaise
    plan.remedies = calculateShortfallRemedies(plan, shortfallPaise)
  } else {
    plan.isInfeasible = false
    plan.shortfallPaise = undefined
    plan.remedies = undefined
  }
}

function formatRupees(paise: Paise): string {
  return `₹${Math.ceil(paise / 100).toLocaleString('en-IN')}`
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
    description: `Add ${formatRupees(deficitPaise)} to the total budget to accommodate current guest count`,
    deltaValue: deficitPaise,
  }

  // Remedy 2: Reduce Guest Count to feasible maximum
  // The elastic donor capacity = sum of (currentPaise - floor) across elastic lines
  const elasticLines = flexibleLines(plan.lines)
  const totalElasticCapacity = elasticLines.reduce((s, l) => {
    return s + Math.max(0, l.currentPaise - elasticFloor(l))
  }, 0)

  // Current demand from per-guest lines
  const perGuestLines = plan.lines.filter((l) => l.lineType === 'per_guest' && !l.isProtected)
  const perGuestBaseline = perGuestLines.reduce((s, l) => s + l.baselinePaise, 0)

  // Per-guest paise per person at baseline
  const paisePerGuest = baselineGuestCount > 0 ? perGuestBaseline / baselineGuestCount : 0

  // Maximum feasible guests: how many guests can we afford with available elastic capacity?
  const currentPerGuestTotal = sumCurrentPaise(perGuestLines)
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
  const trimableLines = inDrainOrder(elasticLines.filter((l) => l.currentPaise > elasticFloor(l)))

  const trimDescription =
    trimableLines.length > 0
      ? `Trim ${trimableLines.map((l) => l.name).join(', ')} to their minimum floors to free up ${formatRupees(totalElasticCapacity)}`
      : 'No additional flexible trim capacity available'

  const trimRemedy: ShortfallRemedy = {
    type: 'trim_elastic',
    title: 'Trim Flexible Lines',
    description: trimDescription,
    deltaValue: totalElasticCapacity,
  }

  return [increaseBudgetRemedy, reduceGuestsRemedy, trimRemedy]
}
