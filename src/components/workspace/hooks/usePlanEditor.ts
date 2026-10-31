'use client'

import { useCallback } from 'react'
import type { Plan, PlanVersionRecord } from '@/lib/engine/types'
import type { ActionType, ApplyChangeInput } from './planEdits'
import { useBudgetEdits, useIdeaEdits, useVendorEdits } from './usePlanEdits'
import { usePlanEditorState } from './usePlanEditorState'
import { usePlanUndo } from './usePlanUndo'

export type { ApplyChangeInput }

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

/**
 * Owns the plan being edited, its undo history, and every edit the organizer can make.
 * Each edit is one pure engine call (see `planEdits`) followed by `applyChange`, which
 * records the undo step and hands the new plan to storage.
 */
export function usePlanEditor({
  initialPlan,
  isReadOnly,
  scheduleCommit,
  commitNow,
}: UsePlanEditorOptions) {
  const state = usePlanEditorState({ initialPlan, scheduleCommit, commitNow })
  const { planRef, applyChange, setPreviousGuestCount, setQuickUndo } = state

  const editOptions = { planRef, applyChange, isReadOnly, setPreviousGuestCount, setQuickUndo }
  const budget = useBudgetEdits(editOptions)
  const ideas = useIdeaEdits(editOptions)
  const vendors = useVendorEdits(editOptions)
  const { undo, quickUndoLast } = usePlanUndo({ ...state, scheduleCommit })

  return {
    plan: state.plan,
    changes: state.changes,
    previousGuestCount: state.previousGuestCount,
    quickUndo: state.quickUndo,
    dismissQuickUndo: () => setQuickUndo(null),
    getPlan: useCallback(() => planRef.current, [planRef]),
    replacePlan: state.replacePlan,
    applyChange,
    changeGuestCount: budget.changeGuestCount,
    lockProtectedMoment: budget.lockProtectedMoment,
    adopt: ideas.adopt,
    retract: ideas.retract,
    applyRemedy: budget.applyRemedy,
    commitVendorQuote: vendors.commitVendorQuote,
    unlockVendorQuote: vendors.unlockVendorQuote,
    undo,
    quickUndoLast,
  }
}
