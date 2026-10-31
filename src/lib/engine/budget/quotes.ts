import type { BudgetCategory, BudgetLine, DisplacedDonor, Paise, Plan, VendorQuote } from '../types'
import {
  absorbRoundingDrift,
  applyShortfallStatus,
  calculateShortfallRemedies,
  cloneLines,
  drainDonors,
  findContingency,
  flexibleLines,
  inDrainOrder,
  inRestoreOrder,
  previewDonorDrain,
  restoreTowardBaseline,
  sumCurrentPaise,
} from './shared'

type QuoteTier = VendorQuote['tiers'][number]

export interface QuoteDisplacementPreview {
  committedPaise: Paise
  deltaPaise: Paise
  displacedDonors: DisplacedDonor[]
  wouldTriggerShortfall: boolean
  shortfallPaise: Paise
}

/** Pick the requested tier (falling back to the first) and total its base plus active omission adders. */
function resolveQuoteCommitment(
  quote: VendorQuote,
  tierId: string,
  activeAdderIds?: string[]
): { tier: QuoteTier; committedPaise: Paise } {
  const tier = quote.tiers.find((t) => t.tierId === tierId) ?? quote.tiers[0]
  if (!tier) {
    throw new Error(`Tier ${tierId} not found in quote ${quote.id}`)
  }

  if (activeAdderIds === undefined) {
    return { tier, committedPaise: tier.totalWithAddersPaise ?? tier.baseTierPaise }
  }
  const addersTotal = (quote.omissionAdders ?? [])
    .filter((a) => activeAdderIds.includes(a.id))
    .reduce((sum, a) => sum + a.amountPaise, 0)
  return { tier, committedPaise: tier.baseTierPaise + addersTotal }
}

function requireQuoteTargetLine(lines: BudgetLine[], category: BudgetCategory): BudgetLine {
  const targetLine = lines.find((l) => l.category === category)
  if (!targetLine) {
    throw new Error(`Target category line ${category} not found in plan`)
  }
  return targetLine
}

/** Flexible lines that may fund a quote: unprotected, uncommitted, not the target, cheapest-to-cut first. */
function quoteDonorCandidates(lines: BudgetLine[], targetLine: BudgetLine): BudgetLine[] {
  return inDrainOrder(flexibleLines(lines).filter((l) => !l.isCommitted && l.id !== targetLine.id))
}

/** Flexible lines (other than the target) that can be refilled, highest rank first. */
function quoteRestoreCandidates(lines: BudgetLine[], targetLine: BudgetLine): BudgetLine[] {
  return inRestoreOrder(flexibleLines(lines).filter((l) => l.id !== targetLine.id))
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
  const { committedPaise } = resolveQuoteCommitment(quote, tierId, activeAdderIds)
  const targetLine = requireQuoteTargetLine(plan.lines, quote.category)
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
  const { displaced, remainingPaise } = previewDonorDrain(
    quoteDonorCandidates(plan.lines, targetLine),
    deltaPaise
  )

  return {
    committedPaise,
    deltaPaise,
    displacedDonors: displaced,
    wouldTriggerShortfall: remainingPaise > 0,
    shortfallPaise: remainingPaise > 0 ? remainingPaise : 0,
  }
}

/**
 * Park surplus paise: contingency first, then (optionally) a buffer line, then the first fallback line.
 */
function parkSurplus(
  lines: BudgetLine[],
  surplusPaise: Paise,
  fallbackLine: BudgetLine | undefined,
  useBufferLine: boolean
): void {
  const contingency = findContingency(lines)
  const bufferLine = useBufferLine ? lines.find((l) => l.lineType === 'buffer') : undefined
  const receiver = contingency ?? bufferLine ?? fallbackLine
  if (receiver) receiver.currentPaise += surplusPaise
}

/** Under-budget quote: refill trimmed flexible lines toward baseline, then park what is left. */
function releaseSurplus(
  lines: BudgetLine[],
  targetLine: BudgetLine,
  surplusPaise: Paise,
  useBufferLine: boolean
): void {
  const restoreOrder = quoteRestoreCandidates(lines, targetLine)
  const leftover = restoreTowardBaseline(restoreOrder, surplusPaise)
  if (leftover > 0) {
    parkSurplus(lines, leftover, restoreOrder[0], useBufferLine)
  }
}

/** Re-fund the lines around a quote whose price moved by `deltaPaise`; returns uncovered shortfall. */
function rebalanceForQuoteDelta(
  lines: BudgetLine[],
  targetLine: BudgetLine,
  deltaPaise: Paise
): Paise {
  if (deltaPaise > 0) {
    // Excess outlay: drain flexible donor lines in elasticity order down to 40% floor
    return drainDonors(quoteDonorCandidates(lines, targetLine), deltaPaise).remainingPaise
  }
  if (deltaPaise < 0) {
    releaseSurplus(lines, targetLine, -deltaPaise, true)
  }
  return 0
}

/** Lock target line commitment metadata (D-10). */
function lockLineToQuote(
  line: BudgetLine,
  quote: VendorQuote,
  tier: QuoteTier,
  committedPaise: Paise
): void {
  line.isCommitted = true
  line.committedQuoteId = quote.id
  line.committedVendor = quote.vendorName
  line.committedTierName = tier.name
  line.committedPaise = committedPaise
  line.currentPaise = committedPaise
  line.variancePaise = line.baselinePaise - committedPaise
  line.committedAt = new Date().toISOString()
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
  const { tier, committedPaise } = resolveQuoteCommitment(quote, tierId, activeAdderIds)

  const lines = cloneLines(plan)
  const targetLine = requireQuoteTargetLine(lines, quote.category)
  const deltaPaise = committedPaise - targetLine.currentPaise
  const remainingShortfall = rebalanceForQuoteDelta(lines, targetLine, deltaPaise)

  lockLineToQuote(targetLine, quote, tier, committedPaise)

  const newPlan: Plan = {
    ...plan,
    lines,
    quotes: [...(plan.quotes ?? []).filter((q) => q.id !== quote.id), quote],
  }
  applyShortfallStatus(newPlan, (plan.shortfallPaise ?? 0) + remainingShortfall)

  // Invariant verification for feasible plans
  if (!newPlan.isInfeasible) {
    const preferred =
      findContingency(newPlan.lines) ?? flexibleLines(newPlan.lines).find((l) => !l.isCommitted)
    absorbRoundingDrift(newPlan.lines, newPlan.totalBudgetPaise, preferred)
  }

  return newPlan
}

/** Clear every commitment field on a line (key order matches lockLineToQuote). */
function clearLineCommitment(line: BudgetLine): void {
  line.isCommitted = false
  line.committedQuoteId = undefined
  line.committedVendor = undefined
  line.committedTierName = undefined
  line.committedPaise = undefined
  line.variancePaise = undefined
  line.committedAt = undefined
}

/** Target returned above its commitment: pay for it from excess contingency, then flexible donors. */
function fundReturnToBaseline(
  lines: BudgetLine[],
  targetLine: BudgetLine,
  neededPaise: Paise
): void {
  let needed = neededPaise
  const contingency = findContingency(lines)
  if (contingency && contingency.currentPaise > contingency.baselinePaise) {
    const take = Math.min(needed, contingency.currentPaise - contingency.baselinePaise)
    contingency.currentPaise -= take
    needed -= take
  }
  drainDonors(quoteDonorCandidates(lines, targetLine), needed)
}

/** Reconcile an unlocked plan: any overspend becomes a shortfall, any underspend lands on one line. */
function settleUnlockedPlan(plan: Plan, lines: BudgetLine[]): Plan {
  const sum = sumCurrentPaise(lines)
  let isInfeasible = false
  let shortfallPaise: number | undefined = undefined

  if (sum > plan.totalBudgetPaise) {
    isInfeasible = true
    shortfallPaise = sum - plan.totalBudgetPaise
  } else {
    const preferred = findContingency(lines) ?? lines.find((l) => l.lineType === 'flexible')
    absorbRoundingDrift(lines, plan.totalBudgetPaise, preferred)
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

/**
 * Unlock and release a committed quote on a budget line (QUOTE-06, D-10).
 * - Resets isCommitted = false and clears commitment metadata
 * - Restores category line back to baselinePaise and rebalances flexible lines / contingency
 */
export function unlockQuote(plan: Plan, category: BudgetCategory): Plan {
  const lines = cloneLines(plan)
  const targetLine = lines.find((l) => l.category === category)
  if (!targetLine || !targetLine.isCommitted) {
    return plan
  }

  const prevCommitted = targetLine.committedPaise ?? targetLine.currentPaise
  clearLineCommitment(targetLine)

  const delta = targetLine.baselinePaise - prevCommitted
  targetLine.currentPaise = targetLine.baselinePaise

  if (delta > 0) {
    fundReturnToBaseline(lines, targetLine, delta)
  } else if (delta < 0) {
    releaseSurplus(lines, targetLine, -delta, false)
  }

  return settleUnlockedPlan(plan, lines)
}
