import type {
  BudgetCategory,
  CuratedIdea,
  Plan,
  PlanChangeDelta,
  PlanChangeRecord,
  PlanVersionRecord,
  ShortfallRemedy,
  VendorQuote,
} from '@/lib/engine/types'
import {
  adoptIdea,
  applyTrimElasticRemedy,
  commitQuote,
  rebalanceGuestCount,
  retractIdea,
  setProtectedMoment,
  unlockQuote,
} from '@/lib/engine/budget'
import { formatINR } from '@/lib/engine/currency'
import { computeLineDeltas, type PlanDiffInput } from '@/lib/engine/diff'
import { detectEnvironmentalRisks } from '@/lib/engine/environmental'
import { createId } from '@/lib/id'

/**
 * Pure builders for the plan editor. Each takes the current plan and returns the
 * `ApplyChangeInput` for one edit, so the hooks only decide when to run it.
 */

export type ActionType = PlanDiffInput['actionType']

/** The floating "Undo" bar offered right after a bigger edit. */
export interface QuickUndo {
  message: string
  previousPlan: Plan
}

export interface ApplyChangeInput {
  next: Plan
  description: string
  /** Tells the version summary what kind of edit this was. */
  actionType?: ActionType
  /** When set, the floating undo bar offers to reverse this edit. */
  quickUndoMessage?: string
  isFloorProtected?: boolean
  /** Overrides the per-line deltas, for edits that are not line moves (the total budget). */
  deltas?: PlanChangeDelta[]
  /** How to save: after a pause (default) or at once. Immediate edits may carry details. */
  save?: { mode: 'debounced' } | { mode: 'immediate'; meta?: PlanVersionRecord['meta'] }
}

const categoryLabel = (category: BudgetCategory): string => category.replace('_', ' ')

export function withEnvironmentalAnalysis(plan: Plan): Plan {
  if (plan.environmentalAnalysis) return plan
  const analysis = detectEnvironmentalRisks(
    plan.brief.eventDate,
    plan.brief.city,
    plan.brief.eventType
  )
  return { ...plan, environmentalAnalysis: analysis }
}

/** The undo-history entry for an edit that takes `prev` to `input.next`. */
export function buildChangeRecord(prev: Plan, input: ApplyChangeInput): PlanChangeRecord {
  return {
    id: createId('change'),
    timestamp: new Date(),
    description: input.description,
    deltas: input.deltas ?? computeLineDeltas(prev, input.next),
    isFloorProtected: input.isFloorProtected ?? Boolean(input.next.brief.protectedCategory),
    previousSnapshot: prev,
  }
}

/** Null when the guest count would not change. */
export function guestCountEdit(current: Plan, newCount: number): ApplyChangeInput | null {
  const previous = current.brief.guestCount
  if (newCount === previous) return null
  const delta = newCount - previous
  const sign = delta > 0 ? '+' : ''
  return {
    next: rebalanceGuestCount(current, newCount),
    description: `Scaled guest count from ${previous} to ${newCount} (${sign}${delta} guests)`,
    actionType: 'guest_scale',
  }
}

export function protectedMomentEdit(current: Plan, category: BudgetCategory): ApplyChangeInput {
  const updated = setProtectedMoment(current, category)
  return {
    next: rebalanceGuestCount(updated, updated.brief.guestCount),
    description: `Locked Protected Moment for ${categoryLabel(category)} (floor locked)`,
    actionType: 'protected_lock',
    isFloorProtected: true,
  }
}

export function adoptEdit(current: Plan, idea: CuratedIdea): ApplyChangeInput {
  const description = `Adopted ${idea.title} (${formatINR(idea.costPaise)})`
  return {
    next: adoptIdea(current, idea),
    description,
    actionType: 'budget_change',
    quickUndoMessage: description,
  }
}

export function retractEdit(current: Plan, ideaId: string): ApplyChangeInput {
  const title = current.adoptedIdeas?.find((r) => r.ideaId === ideaId)?.title || 'idea'
  const description = `Retracted ${title}`
  return {
    next: retractIdea(current, ideaId),
    description,
    actionType: 'budget_change',
    quickUndoMessage: description,
  }
}

/** Commits a vendor quote tier to its line, and keeps the quote with the plan. */
export function vendorCommitEdit(
  current: Plan,
  quote: VendorQuote,
  tierId: string,
  activeAdderIds: string[]
): ApplyChangeInput {
  const committed = commitQuote(current, quote, tierId, activeAdderIds)
  const quotes = [...(current.quotes ?? []).filter((q) => q.id !== quote.id), quote]
  return {
    next: { ...committed, quotes },
    description: `Committed ${quote.vendorName} (${categoryLabel(quote.category)})`,
    actionType: 'budget_change',
  }
}

/** Null when nothing was committed for the category. */
export function vendorUnlockEdit(current: Plan, category: BudgetCategory): ApplyChangeInput | null {
  const next = unlockQuote(current, category)
  if (next === current) return null
  return {
    next,
    description: `Unlocked ${categoryLabel(category)} quote`,
    actionType: 'budget_change',
  }
}

function increaseBudgetEdit(current: Plan, amountPaise: number): ApplyChangeInput {
  const budget = current.totalBudgetPaise + amountPaise
  const widened: Plan = {
    ...current,
    totalBudgetPaise: budget,
    brief: { ...current.brief, totalBudgetPaise: budget },
    isInfeasible: false,
    shortfallPaise: undefined,
    remedies: undefined,
  }
  return {
    next: rebalanceGuestCount(widened, current.brief.guestCount),
    description: `Increased total budget by ${formatINR(amountPaise)}`,
    actionType: 'budget_change',
    deltas: [{ category: 'Total Budget', deltaPaise: amountPaise }],
    quickUndoMessage: `Applied remedy: Added ${formatINR(amountPaise)} to Budget`,
  }
}

function trimFlexibleEdit(current: Plan): ApplyChangeInput {
  return {
    next: applyTrimElasticRemedy(current, current.shortfallPaise || 0),
    description: 'Applied remedy: Trimmed flexible lines to their floors',
    actionType: 'budget_change',
    quickUndoMessage: 'Applied remedy: Trimmed flexible lines',
  }
}

/**
 * The edit for a shortfall remedy that is not a guest-count change: a wider budget, or
 * (for anything else) trimming flexible lines.
 */
export function remedyEdit(current: Plan, remedy: ShortfallRemedy): ApplyChangeInput {
  if (remedy.type === 'increase_budget') return increaseBudgetEdit(current, remedy.deltaValue)
  return trimFlexibleEdit(current)
}

/** What an undo does: the plan to show, and how the history changes. */
export interface UndoStep {
  plan: Plan
  /** The history left after the undo. Absent when the history stays as it is. */
  changes?: PlanChangeRecord[]
  /** Whether the remembered "previous guest count" follows the restored plan. */
  syncGuestCount: boolean
}

export interface UndoState {
  current: Plan
  changes: PlanChangeRecord[]
  previousGuestCount: number | undefined
}

/**
 * Decides how to go back one step: to the given history entry, else the newest one, else
 * (when only a guest count was remembered) a rebalance to that count. Null when there is
 * nothing to go back to.
 */
export function resolveUndo(
  state: UndoState,
  item?: PlanChangeRecord,
  index?: number
): UndoStep | null {
  const { current, changes, previousGuestCount } = state

  if (item?.previousSnapshot) {
    const at = index ?? changes.findIndex((c) => c.id === item.id)
    return {
      plan: item.previousSnapshot,
      changes: at !== -1 ? changes.slice(at + 1) : undefined,
      syncGuestCount: true,
    }
  }

  const [latest, ...rest] = changes
  if (latest?.previousSnapshot) {
    return { plan: latest.previousSnapshot, changes: rest, syncGuestCount: true }
  }

  if (previousGuestCount !== undefined) {
    return { plan: rebalanceGuestCount(current, previousGuestCount), syncGuestCount: false }
  }
  return null
}
