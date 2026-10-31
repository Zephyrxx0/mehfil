'use client'

import React, { createContext, useContext } from 'react'
import type { Plan, VendorQuote, BudgetCategory, CuratedIdea } from '@/lib/engine/types'

export interface PlanContextValue {
  plan?: Plan
  quotes?: VendorQuote[]
  onCheckQuote?: (category: BudgetCategory) => void
  onCommitQuote?: (quoteId: string, tierId: string, activeAdderIds: string[]) => void
  onUnlockQuote?: (quoteId: string) => void
  onAdoptIdea?: (idea: CuratedIdea) => void
  onRetractIdea?: (ideaId: string) => void
  onSelectLine?: (lineId: string) => void
}

const PlanContext = createContext<PlanContextValue>({})

export function usePlanContext(): PlanContextValue {
  return useContext(PlanContext)
}

export interface PlanProviderProps extends PlanContextValue {
  children: React.ReactNode
}

export function PlanProvider({
  children,
  plan,
  quotes,
  onCheckQuote,
  onCommitQuote,
  onUnlockQuote,
  onAdoptIdea,
  onRetractIdea,
  onSelectLine,
}: PlanProviderProps) {
  return (
    <PlanContext.Provider
      value={{
        plan,
        quotes: quotes ?? plan?.quotes,
        onCheckQuote,
        onCommitQuote,
        onUnlockQuote,
        onAdoptIdea,
        onRetractIdea,
        onSelectLine,
      }}
    >
      {children}
    </PlanContext.Provider>
  )
}
