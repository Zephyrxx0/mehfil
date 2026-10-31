'use client'

import { useCallback, useRef, useState } from 'react'
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
  rebalanceGuestCount,
  commitQuote,
  retractIdea,
  setProtectedMoment,
  unlockQuote,
} from '@/lib/engine/budget'
import { formatINR } from '@/lib/engine/currency'
import { computeLineDeltas, type PlanDiffInput } from '@/lib/engine/diff'
import { detectEnvironmentalRisks } from '@/lib/engine/environmental'
import { createId } from '@/lib/id'

type ActionType = PlanDiffInput['actionType']

/** The floating "Undo" bar offered right after a bigger edit. */
interface QuickUndo {
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

export interface UsePlanEditorOptions {
  initialPlan: Plan
  isReadOnly: boolean
  /** Saves the new plan. Supplied by `usePlanVersions`. */
  scheduleCommit: (next: Plan, prev: Plan, actionType?: ActionType) => void
  commitNow: (
    next: Plan,
    reason: string,
    options?: { meta?: PlanVersionRecord['meta'] }
  ) => Promise<void>
}

function withEnvironmentalAnalysis(plan: Plan): Plan {
  if (plan.environmentalAnalysis) return plan
  const analysis = detectEnvironmentalRisks(
    plan.brief.eventDate,
    plan.brief.city,
    plan.brief.eventType
  )
  return { ...plan, environmentalAnalysis: analysis }
}

/**
 * Owns the plan being edited, its undo history, and every edit the organizer can make.
 * Each edit is one pure engine call followed by `applyChange`, which records the undo step
 * and hands the new plan to storage.
 */
export function usePlanEditor({
  initialPlan,
  isReadOnly,
  scheduleCommit,
  commitNow,
}: UsePlanEditorOptions) {
  const [plan, setPlanState] = useState<Plan>(() => withEnvironmentalAnalysis(initialPlan))
  const [changes, setChanges] = useState<PlanChangeRecord[]>([])
  const [previousGuestCount, setPreviousGuestCount] = useState<number | undefined>(
    initialPlan.baselineGuestCount
  )
  const [quickUndo, setQuickUndo] = useState<QuickUndo | null>(null)

  // Always the newest plan, even between two events that land before React re-renders.
  const planRef = useRef(plan)

  /** Shows `next` without recording an undo step or saving it. */
  const replacePlan = useCallback((next: Plan) => {
    planRef.current = next
    setPlanState(next)
  }, [])

  const applyChange = useCallback(
    (input: ApplyChangeInput) => {
      const prev = planRef.current
      const { next, description, actionType } = input

      const record: PlanChangeRecord = {
        id: createId('change'),
        timestamp: new Date(),
        description,
        deltas: input.deltas ?? computeLineDeltas(prev, next),
        isFloorProtected: input.isFloorProtected ?? Boolean(next.brief.protectedCategory),
        previousSnapshot: prev,
      }
      setChanges((existing) => [record, ...existing])
      replacePlan(next)
      if (input.quickUndoMessage) {
        setQuickUndo({ message: input.quickUndoMessage, previousPlan: prev })
      }

      if (input.save?.mode === 'immediate') {
        void commitNow(next, description, { meta: input.save.meta })
      } else {
        scheduleCommit(next, prev, actionType)
      }
    },
    [commitNow, replacePlan, scheduleCommit]
  )

  const changeGuestCount = useCallback(
    (newCount: number) => {
      const current = planRef.current
      const previous = current.brief.guestCount
      if (newCount === previous) return

      setPreviousGuestCount(previous)
      const delta = newCount - previous
      const sign = delta > 0 ? '+' : ''
      applyChange({
        next: rebalanceGuestCount(current, newCount),
        description: `Scaled guest count from ${previous} to ${newCount} (${sign}${delta} guests)`,
        actionType: 'guest_scale',
      })
    },
    [applyChange]
  )

  const lockProtectedMoment = useCallback(
    (category: BudgetCategory) => {
      const current = planRef.current
      const updated = setProtectedMoment(current, category)
      applyChange({
        next: rebalanceGuestCount(updated, updated.brief.guestCount),
        description: `Locked Protected Moment for ${category.replace('_', ' ')} (floor locked)`,
        actionType: 'protected_lock',
        isFloorProtected: true,
      })
    },
    [applyChange]
  )

  const adopt = useCallback(
    (idea: CuratedIdea) => {
      if (isReadOnly) return
      const description = `Adopted ${idea.title} (${formatINR(idea.costPaise)})`
      applyChange({
        next: adoptIdea(planRef.current, idea),
        description,
        actionType: 'budget_change',
        quickUndoMessage: description,
      })
    },
    [applyChange, isReadOnly]
  )

  const retract = useCallback(
    (ideaId: string) => {
      if (isReadOnly) return
      const current = planRef.current
      const title = current.adoptedIdeas?.find((r) => r.ideaId === ideaId)?.title || 'idea'
      const description = `Retracted ${title}`
      applyChange({
        next: retractIdea(current, ideaId),
        description,
        actionType: 'budget_change',
        quickUndoMessage: description,
      })
    },
    [applyChange, isReadOnly]
  )

  /** Commits a vendor quote tier to its budget line, and keeps the quote with the plan. */
  const commitVendorQuote = useCallback(
    (quote: VendorQuote, tierId: string, activeAdderIds: string[]) => {
      if (isReadOnly) return
      const current = planRef.current
      const committed = commitQuote(current, quote, tierId, activeAdderIds)
      const quotes = [...(current.quotes ?? []).filter((q) => q.id !== quote.id), quote]
      applyChange({
        next: { ...committed, quotes },
        description: `Committed ${quote.vendorName} (${quote.category.replace('_', ' ')})`,
        actionType: 'budget_change',
      })
    },
    [applyChange, isReadOnly]
  )

  /** Releases a committed vendor, so the budget line is open to change again. */
  const unlockVendorQuote = useCallback(
    (category: BudgetCategory) => {
      if (isReadOnly) return
      const current = planRef.current
      const next = unlockQuote(current, category)
      if (next === current) return
      applyChange({
        next,
        description: `Unlocked ${category.replace('_', ' ')} quote`,
        actionType: 'budget_change',
      })
    },
    [applyChange, isReadOnly]
  )

  /** Applies one of the three shortfall remedies (ADR-0002, BUDGET-03). */
  const applyRemedy = useCallback(
    (remedy: ShortfallRemedy) => {
      if (isReadOnly) return
      const current = planRef.current

      if (remedy.type === 'reduce_guests') {
        changeGuestCount(remedy.deltaValue)
        setQuickUndo({
          message: `Applied remedy: Set Guests to ${remedy.deltaValue}`,
          previousPlan: current,
        })
        return
      }

      if (remedy.type === 'increase_budget') {
        const budget = current.totalBudgetPaise + remedy.deltaValue
        const widened: Plan = {
          ...current,
          totalBudgetPaise: budget,
          brief: { ...current.brief, totalBudgetPaise: budget },
          isInfeasible: false,
          shortfallPaise: undefined,
          remedies: undefined,
        }
        applyChange({
          next: rebalanceGuestCount(widened, current.brief.guestCount),
          description: `Increased total budget by ${formatINR(remedy.deltaValue)}`,
          actionType: 'budget_change',
          deltas: [{ category: 'Total Budget', deltaPaise: remedy.deltaValue }],
          quickUndoMessage: `Applied remedy: Added ${formatINR(remedy.deltaValue)} to Budget`,
        })
        return
      }

      applyChange({
        next: applyTrimElasticRemedy(current, current.shortfallPaise || 0),
        description: 'Applied remedy: Trimmed flexible lines to their floors',
        actionType: 'budget_change',
        quickUndoMessage: 'Applied remedy: Trimmed flexible lines',
      })
    },
    [applyChange, changeGuestCount, isReadOnly]
  )

  /** Goes back one step: the given history entry, or the newest one. */
  const undo = useCallback(
    (item?: PlanChangeRecord, index?: number) => {
      const current = planRef.current
      const restoreTo = (target: Plan) => {
        replacePlan(target)
        setPreviousGuestCount(target.brief.guestCount)
        scheduleCommit(target, current, 'guest_scale')
      }

      if (item?.previousSnapshot) {
        const at = index ?? changes.findIndex((c) => c.id === item.id)
        if (at !== -1) setChanges(changes.slice(at + 1))
        restoreTo(item.previousSnapshot)
        return
      }

      const [latest, ...rest] = changes
      if (latest?.previousSnapshot) {
        setChanges(rest)
        restoreTo(latest.previousSnapshot)
        return
      }

      if (previousGuestCount !== undefined) {
        const restored = rebalanceGuestCount(current, previousGuestCount)
        replacePlan(restored)
        scheduleCommit(restored, current, 'guest_scale')
      }
    },
    [changes, previousGuestCount, replacePlan, scheduleCommit]
  )

  /** Reverses the edit the floating undo bar is offering. */
  const quickUndoLast = useCallback(() => {
    if (!quickUndo) return
    const current = planRef.current
    replacePlan(quickUndo.previousPlan)
    scheduleCommit(quickUndo.previousPlan, current, 'restore')
    setQuickUndo(null)
  }, [quickUndo, replacePlan, scheduleCommit])

  return {
    plan,
    changes,
    previousGuestCount,
    quickUndo,
    dismissQuickUndo: () => setQuickUndo(null),
    getPlan: useCallback(() => planRef.current, []),
    replacePlan,
    applyChange,
    changeGuestCount,
    lockProtectedMoment,
    adopt,
    retract,
    applyRemedy,
    commitVendorQuote,
    unlockVendorQuote,
    undo,
    quickUndoLast,
  }
}
