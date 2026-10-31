'use client'

import { useCallback, useRef, useState } from 'react'
import type { Plan, PlanChangeRecord, PlanVersionRecord } from '@/lib/engine/types'
import {
  buildChangeRecord,
  withEnvironmentalAnalysis,
  type ActionType,
  type ApplyChangeInput,
  type QuickUndo,
} from './planEdits'

export interface PlanEditorStateOptions {
  initialPlan: Plan
  scheduleCommit: (next: Plan, prev: Plan, actionType?: ActionType) => void
  commitNow: (
    next: Plan,
    reason: string,
    options?: { meta?: PlanVersionRecord['meta'] }
  ) => Promise<void>
}

/**
 * The state behind the plan editor: the plan on screen, its undo history, the floating
 * undo bar, and `applyChange`, which every edit goes through.
 */
export function usePlanEditorState({
  initialPlan,
  scheduleCommit,
  commitNow,
}: PlanEditorStateOptions) {
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

      const record = buildChangeRecord(prev, input)
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

  return {
    plan,
    changes,
    setChanges,
    previousGuestCount,
    setPreviousGuestCount,
    quickUndo,
    setQuickUndo,
    planRef,
    replacePlan,
    applyChange,
  }
}
