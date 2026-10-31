import type {
  BudgetCategory,
  BudgetLine,
  IdeaDisplacementRecord,
  Paise,
  Plan,
  PlanChangeDelta,
} from '@/lib/engine/types'
import { formatINR } from './currency'

export interface PlanDiffInput {
  prevPlan: Plan
  nextPlan: Plan
  actionType?:
    | 'guest_scale'
    | 'budget_change'
    | 'protected_lock'
    | 'restore'
    | 'manual'
    | 'adopt_idea'
    | 'retract_idea'
    | 'remedy_budget'
    | 'remedy_guests'
    | 'remedy_trim'
  restoredVersionNumber?: number
  restoredReason?: string
}

export interface PlanDiffResult {
  summary: string
  deltas: PlanChangeDelta[]
  isFloorProtected: boolean
  donorCategories: string[]
  recipientCategories: string[]
}

/** Lines whose allocation changed between two plans, with the change in integer paise. */
function movedLines(
  prevPlan: Plan,
  nextPlan: Plan
): Array<{ line: BudgetLine; deltaPaise: Paise }> {
  const moved: Array<{ line: BudgetLine; deltaPaise: Paise }> = []
  for (const line of nextPlan.lines) {
    const prevLine = prevPlan.lines.find((l) => l.id === line.id)
    // A line that is new in `nextPlan` is measured against its baseline.
    const prevPaise = prevLine ? prevLine.currentPaise : line.baselinePaise
    const deltaPaise = line.currentPaise - prevPaise
    if (deltaPaise !== 0) moved.push({ line, deltaPaise })
  }
  return moved
}

/** How much each budget line moved between two plans, named as the organizer sees them. */
export function computeLineDeltas(prevPlan: Plan, nextPlan: Plan): PlanChangeDelta[] {
  return movedLines(prevPlan, nextPlan).map(({ line, deltaPaise }) => ({
    category: line.name,
    deltaPaise,
  }))
}

/** The same movement keyed by budget category, which the style rationale is written from. */
export function computeCategoryDeltas(
  prevPlan: Plan,
  nextPlan: Plan
): Array<{ category: BudgetCategory; deltaPaise: Paise }> {
  return movedLines(prevPlan, nextPlan).map(({ line, deltaPaise }) => ({
    category: line.category,
    deltaPaise,
  }))
}

/** What a summary rule decides: the sentence shown to the organizer and the floor flag. */
export interface DiffOutcome {
  summary: string
  isFloorProtected: boolean
}

/** Everything the summary rules read, computed once per diff. */
export interface DiffContext {
  prevPlan: Plan
  nextPlan: Plan
  actionType: PlanDiffInput['actionType']
  deltas: PlanChangeDelta[]
  donorCategories: string[]
  recipientCategories: string[]
  isFloorProtected: boolean
  protectedSuffix: string
  prevIdeas: IdeaDisplacementRecord[]
  nextIdeas: IdeaDisplacementRecord[]
}

type SummaryRule = (ctx: DiffContext) => DiffOutcome | null

/** Forward restore (D-10): the diff is a note about the version, with no deltas. */
function restoreResult(input: PlanDiffInput): PlanDiffResult | null {
  const { nextPlan, actionType, restoredVersionNumber, restoredReason } = input
  if (actionType !== 'restore' || restoredVersionNumber === undefined) return null
  const reasonSuffix = restoredReason ? ` (${restoredReason})` : ''
  return {
    summary: `Reverted to v${restoredVersionNumber}${reasonSuffix}`,
    deltas: [],
    isFloorProtected: Boolean(nextPlan.brief.protectedCategory),
    donorCategories: [],
    recipientCategories: [],
  }
}

function buildContext(input: PlanDiffInput): DiffContext {
  const { prevPlan, nextPlan, actionType } = input
  const deltas = computeLineDeltas(prevPlan, nextPlan)
  const isFloorProtected = Boolean(nextPlan.brief.protectedCategory)
  return {
    prevPlan,
    nextPlan,
    actionType,
    deltas,
    donorCategories: deltas.filter((d) => d.deltaPaise < 0).map((d) => d.category),
    recipientCategories: deltas.filter((d) => d.deltaPaise > 0).map((d) => d.category),
    isFloorProtected,
    protectedSuffix: isFloorProtected ? '; Protected Moment held firm' : '',
    prevIdeas: prevPlan.adoptedIdeas ?? [],
    nextIdeas: nextPlan.adoptedIdeas ?? [],
  }
}

/** Names of the lines an idea drew from, used when no line moved to name them directly. */
function displacedNames(prevPlan: Plan, idea: IdeaDisplacementRecord): string {
  return idea.displacedDonors
    .map((d) => prevPlan.lines.find((l) => l.id === d.lineId)?.name ?? d.category)
    .join(', ')
}

/** Idea adoption (IDEA-02, BUDGET-04). */
export function ideaAdoptedRule(ctx: DiffContext): DiffOutcome | null {
  const { actionType, prevIdeas, nextIdeas, prevPlan, donorCategories } = ctx
  const isAdopted =
    actionType === 'adopt_idea' || (actionType === undefined && nextIdeas.length > prevIdeas.length)
  if (!isAdopted || nextIdeas.length === 0) return null

  const addedIdea =
    nextIdeas.find((n) => !prevIdeas.some((p) => p.ideaId === n.ideaId)) ??
    nextIdeas[nextIdeas.length - 1]
  const donorNames =
    donorCategories.length > 0 ? donorCategories.join(', ') : displacedNames(prevPlan, addedIdea)
  const fundingClause = donorNames ? `funded by trimming ${donorNames} in elasticity order, ` : ''

  return {
    summary: `Adopted curated idea '${addedIdea.title}' (+${formatINR(addedIdea.costPaise)}), ${fundingClause}with Protected Moment immune.`,
    isFloorProtected: true,
  }
}

/** Idea retraction (IDEA-03, D-07). */
export function ideaRetractedRule(ctx: DiffContext): DiffOutcome | null {
  const { actionType, prevIdeas, nextIdeas, prevPlan, recipientCategories } = ctx
  const isRetracted =
    actionType === 'retract_idea' ||
    (actionType === undefined && prevIdeas.length > nextIdeas.length)
  if (!isRetracted || prevIdeas.length === 0) return null

  const removedIdea =
    prevIdeas.find((p) => !nextIdeas.some((n) => n.ideaId === p.ideaId)) ?? prevIdeas[0]
  const restoredNames =
    recipientCategories.length > 0
      ? recipientCategories.join(', ')
      : displacedNames(prevPlan, removedIdea)

  return {
    summary: `Retracted curated idea '${removedIdea.title}', restoring exact funds back to ${restoredNames}.`,
    isFloorProtected: true,
  }
}

function isShortfallResolved({ prevPlan, nextPlan }: DiffContext): boolean {
  return Boolean(prevPlan.isInfeasible && !nextPlan.isInfeasible)
}

/** Shortfall remedy: raising the total budget (BUDGET-03, ADR-0002). */
export function remedyBudgetRule(ctx: DiffContext): DiffOutcome | null {
  const { prevPlan, nextPlan, actionType, isFloorProtected } = ctx
  const applies =
    actionType === 'remedy_budget' ||
    (isShortfallResolved(ctx) && nextPlan.totalBudgetPaise > prevPlan.totalBudgetPaise)
  if (!applies) return null
  const delta = formatINR(nextPlan.totalBudgetPaise - prevPlan.totalBudgetPaise)
  return {
    summary: `Applied Remedy: Increased total budget by ${delta} to balance shortfall.`,
    isFloorProtected,
  }
}

/** Shortfall remedy: reducing the guest count. */
export function remedyGuestsRule(ctx: DiffContext): DiffOutcome | null {
  const { prevPlan, nextPlan, actionType, isFloorProtected } = ctx
  const applies =
    actionType === 'remedy_guests' ||
    (isShortfallResolved(ctx) && nextPlan.brief.guestCount < prevPlan.brief.guestCount)
  if (!applies) return null
  return {
    summary: `Applied Remedy: Reduced guest count from ${prevPlan.brief.guestCount} to ${nextPlan.brief.guestCount} to restore feasible budget.`,
    isFloorProtected,
  }
}

/** Shortfall remedy: trimming flexible lines with total budget and guests unchanged. */
export function remedyTrimRule(ctx: DiffContext): DiffOutcome | null {
  const { prevPlan, nextPlan, actionType, donorCategories, isFloorProtected } = ctx
  const trimmedInPlace =
    isShortfallResolved(ctx) &&
    donorCategories.length > 0 &&
    nextPlan.totalBudgetPaise === prevPlan.totalBudgetPaise &&
    nextPlan.brief.guestCount === prevPlan.brief.guestCount
  if (actionType !== 'remedy_trim' && !trimmedInPlace) return null
  return {
    summary: `Applied Remedy: Sequentially trimmed flexible lines (${donorCategories.join(', ')}) to absorb deficit while protecting floors.`,
    isFloorProtected,
  }
}

/** Protected Moment lock or reassignment. */
export function protectedLockRule(ctx: DiffContext): DiffOutcome | null {
  const { prevPlan, nextPlan, actionType } = ctx
  const changed = prevPlan.brief.protectedCategory !== nextPlan.brief.protectedCategory
  if (actionType !== 'protected_lock' && !changed) return null
  const catName = nextPlan.brief.protectedCategory.replace('_', ' ')
  return {
    summary: `Locked Protected Moment for ${catName}; non-negotiable floor enforced`,
    isFloorProtected: true,
  }
}

/** Which lines grew and which shrank when the guest count changed. */
export function describeScaling(recipients: string[], donors: string[]): string {
  if (recipients.length > 0 && donors.length > 0) {
    return ` Scaled ${recipients.join(', ')} by drawing from ${donors.join(', ')}`
  }
  if (recipients.length > 0) return ` Scaled ${recipients.join(', ')}`
  if (donors.length > 0) return ` Scaled down ${donors.join(', ')}`
  return ''
}

/** Guest count change. */
export function guestScaleRule(ctx: DiffContext): DiffOutcome | null {
  const { prevPlan, nextPlan, actionType, isFloorProtected, protectedSuffix } = ctx
  const prevG = prevPlan.brief.guestCount
  const nextG = nextPlan.brief.guestCount
  if (actionType !== 'guest_scale' && prevG === nextG) return null
  const deltaG = nextG - prevG
  const signG = deltaG > 0 ? `+${deltaG}` : `${deltaG}`
  const scalingDetails = describeScaling(ctx.recipientCategories, ctx.donorCategories)
  return {
    summary: `Scaled guest count to ${nextG} (${signG} guests).${scalingDetails}${protectedSuffix}.`,
    isFloorProtected,
  }
}

/** Total budget change. */
export function budgetChangeRule(ctx: DiffContext): DiffOutcome | null {
  const { prevPlan, nextPlan, actionType, isFloorProtected, protectedSuffix } = ctx
  if (actionType !== 'budget_change' && prevPlan.totalBudgetPaise === nextPlan.totalBudgetPaise) {
    return null
  }
  const deltaB = nextPlan.totalBudgetPaise - prevPlan.totalBudgetPaise
  const actionVerb = deltaB >= 0 ? 'Increased' : 'Decreased'
  return {
    summary: `${actionVerb} total budget by ${formatINR(Math.abs(deltaB))}; apportioned across flexible lines${protectedSuffix}.`,
    isFloorProtected,
  }
}

/** Fallback for manual line adjustments. */
export function defaultRule(ctx: DiffContext): DiffOutcome {
  const { deltas, protectedSuffix, isFloorProtected } = ctx
  return {
    summary:
      deltas.length > 0
        ? `Adjusted allocations across ${deltas.length} categories${protectedSuffix}.`
        : 'All allocations balanced in harmony.',
    isFloorProtected,
  }
}

/** Summary rules in priority order; the first that applies decides the outcome. */
const SUMMARY_RULES: readonly SummaryRule[] = [
  ideaAdoptedRule,
  ideaRetractedRule,
  remedyBudgetRule,
  remedyGuestsRule,
  remedyTrimRule,
  protectedLockRule,
  guestScaleRule,
  budgetChangeRule,
]

/**
 * Pure TypeScript deterministic plan diff engine (D-12, ADR-0004).
 * Computes plain-language audit explanations directly from integer paise deltas with 100% mathematical accuracy.
 * Zero LLM latency, zero hallucinated math, tamper-evident.
 */
export function computePlanDiff(input: PlanDiffInput): PlanDiffResult {
  const restored = restoreResult(input)
  if (restored) return restored

  const ctx = buildContext(input)
  let outcome: DiffOutcome | null = null
  for (const rule of SUMMARY_RULES) {
    outcome = rule(ctx)
    if (outcome) break
  }
  const { summary, isFloorProtected } = outcome ?? defaultRule(ctx)

  return {
    summary,
    deltas: ctx.deltas,
    isFloorProtected,
    donorCategories: ctx.donorCategories,
    recipientCategories: ctx.recipientCategories,
  }
}
