'use client'

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import type { Plan, PlanChangeRecord } from '@/lib/engine/types'
import { resolveUndo, type ActionType, type QuickUndo } from './planEdits'

export interface PlanUndoOptions {
  planRef: MutableRefObject<Plan>
  changes: PlanChangeRecord[]
  setChanges: Dispatch<SetStateAction<PlanChangeRecord[]>>
  previousGuestCount: number | undefined
  setPreviousGuestCount: Dispatch<SetStateAction<number | undefined>>
  quickUndo: QuickUndo | null
  setQuickUndo: Dispatch<SetStateAction<QuickUndo | null>>
  replacePlan: (next: Plan) => void
  scheduleCommit: (next: Plan, prev: Plan, actionType?: ActionType) => void
}

/** Going back: one step in the change history, or the edit the floating undo bar offers. */
export function usePlanUndo({
  planRef,
  changes,
  setChanges,
  previousGuestCount,
  setPreviousGuestCount,
  quickUndo,
  setQuickUndo,
  replacePlan,
  scheduleCommit,
}: PlanUndoOptions) {
  /** Goes back one step: the given history entry, or the newest one. */
  const undo = useCallback(
    (item?: PlanChangeRecord, index?: number) => {
      const current = planRef.current
      const step = resolveUndo({ current, changes, previousGuestCount }, item, index)
      if (!step) return

      if (step.changes) setChanges(step.changes)
      replacePlan(step.plan)
      if (step.syncGuestCount) setPreviousGuestCount(step.plan.brief.guestCount)
      scheduleCommit(step.plan, current, 'guest_scale')
    },
    [
      changes,
      planRef,
      previousGuestCount,
      replacePlan,
      scheduleCommit,
      setChanges,
      setPreviousGuestCount,
    ]
  )

  /** Reverses the edit the floating undo bar is offering. */
  const quickUndoLast = useCallback(() => {
    if (!quickUndo) return
    const current = planRef.current
    replacePlan(quickUndo.previousPlan)
    scheduleCommit(quickUndo.previousPlan, current, 'restore')
    setQuickUndo(null)
  }, [planRef, quickUndo, replacePlan, scheduleCommit, setQuickUndo])

  return { undo, quickUndoLast }
}
