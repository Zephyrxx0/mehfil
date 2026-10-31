'use client'

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import type {
  BudgetCategory,
  CuratedIdea,
  Plan,
  ShortfallRemedy,
  VendorQuote,
} from '@/lib/engine/types'
import {
  adoptEdit,
  guestCountEdit,
  protectedMomentEdit,
  remedyEdit,
  retractEdit,
  vendorCommitEdit,
  vendorUnlockEdit,
  type ApplyChangeInput,
  type QuickUndo,
} from './planEdits'

export interface PlanEditsOptions {
  planRef: MutableRefObject<Plan>
  applyChange: (input: ApplyChangeInput) => void
  isReadOnly: boolean
  setPreviousGuestCount: Dispatch<SetStateAction<number | undefined>>
  setQuickUndo: Dispatch<SetStateAction<QuickUndo | null>>
}

/** The guest-count, protected-moment and shortfall-remedy edits. */
export function useBudgetEdits({
  planRef,
  applyChange,
  isReadOnly,
  setPreviousGuestCount,
  setQuickUndo,
}: PlanEditsOptions) {
  const changeGuestCount = useCallback(
    (newCount: number) => {
      const current = planRef.current
      const edit = guestCountEdit(current, newCount)
      if (!edit) return

      setPreviousGuestCount(current.brief.guestCount)
      applyChange(edit)
    },
    [applyChange, planRef, setPreviousGuestCount]
  )

  const lockProtectedMoment = useCallback(
    (category: BudgetCategory) => {
      applyChange(protectedMomentEdit(planRef.current, category))
    },
    [applyChange, planRef]
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
      applyChange(remedyEdit(current, remedy))
    },
    [applyChange, changeGuestCount, isReadOnly, planRef, setQuickUndo]
  )

  return { changeGuestCount, lockProtectedMoment, applyRemedy }
}

/** Adopting and retracting curated ideas. */
export function useIdeaEdits({ planRef, applyChange, isReadOnly }: PlanEditsOptions) {
  const adopt = useCallback(
    (idea: CuratedIdea) => {
      if (isReadOnly) return
      applyChange(adoptEdit(planRef.current, idea))
    },
    [applyChange, isReadOnly, planRef]
  )

  const retract = useCallback(
    (ideaId: string) => {
      if (isReadOnly) return
      applyChange(retractEdit(planRef.current, ideaId))
    },
    [applyChange, isReadOnly, planRef]
  )

  return { adopt, retract }
}

/** Committing a vendor quote to its line, and releasing it again. */
export function useVendorEdits({ planRef, applyChange, isReadOnly }: PlanEditsOptions) {
  const commitVendorQuote = useCallback(
    (quote: VendorQuote, tierId: string, activeAdderIds: string[]) => {
      if (isReadOnly) return
      applyChange(vendorCommitEdit(planRef.current, quote, tierId, activeAdderIds))
    },
    [applyChange, isReadOnly, planRef]
  )

  /** Releases a committed vendor, so the budget line is open to change again. */
  const unlockVendorQuote = useCallback(
    (category: BudgetCategory) => {
      if (isReadOnly) return
      const edit = vendorUnlockEdit(planRef.current, category)
      if (edit) applyChange(edit)
    },
    [applyChange, isReadOnly, planRef]
  )

  return { commitVendorQuote, unlockVendorQuote }
}
