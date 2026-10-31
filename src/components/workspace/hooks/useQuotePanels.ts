'use client'

import { useState } from 'react'
import { generateDeterministicLayout } from '@/lib/ai/layout-heuristic'
import type { BudgetCategory, GenerativeUILayout, Plan, VendorQuote } from '@/lib/engine/types'

interface UseQuotePanelsOptions {
  plan: Plan
  onCheckQuote?: (category: BudgetCategory) => void
  onOpenSmartInspector?: (category?: BudgetCategory) => void
  onCommitQuote?: (quote: VendorQuote, tierId: string, activeAdderIds: string[]) => void
  onUnlockQuote?: (category: BudgetCategory) => void
}

/**
 * Open/closed state for the two quote side panels: the quote intake sheet and the smart
 * inspector. It holds no plan data. Committing or unlocking a quote is reported upward so the
 * editor can apply it as a saved edit.
 */
export function useQuotePanels({
  plan,
  onCheckQuote,
  onOpenSmartInspector,
  onCommitQuote,
  onUnlockQuote,
}: UseQuotePanelsOptions) {
  const [isIntakeOpen, setIsIntakeOpen] = useState(false)
  const [intakeCategory, setIntakeCategory] = useState<BudgetCategory | undefined>(undefined)
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)
  const [inspectorLayout, setInspectorLayout] = useState<GenerativeUILayout | undefined>(undefined)

  const quoteById = (quoteId: string) => plan.quotes?.find((q) => q.id === quoteId)

  const checkQuote = (category: BudgetCategory) => {
    setIntakeCategory(category)
    setIsIntakeOpen(true)
    onCheckQuote?.(category)
  }

  const openInspector = (category?: BudgetCategory) => {
    const target = category || intakeCategory || plan.brief.protectedCategory || 'catering'
    setInspectorLayout(generateDeterministicLayout(plan, target))
    setIsInspectorOpen(true)
    onOpenSmartInspector?.(category)
  }

  const commitFromIntake = (quote: VendorQuote, tierId: string, adders: string[]) => {
    onCommitQuote?.(quote, tierId, adders)
    setIsIntakeOpen(false)
  }

  const commitFromInspector = (quoteId: string, tierId: string, adders: string[]) => {
    const quote = quoteById(quoteId)
    if (quote) onCommitQuote?.(quote, tierId, adders)
  }

  const unlockFromInspector = (quoteId: string) => {
    const quote = quoteById(quoteId)
    if (quote) onUnlockQuote?.(quote.category)
  }

  return {
    intake: {
      open: isIntakeOpen,
      setOpen: setIsIntakeOpen,
      category: intakeCategory || ('catering' as BudgetCategory),
    },
    inspector: {
      open: isInspectorOpen,
      setOpen: setIsInspectorOpen,
      layout: inspectorLayout,
      // The inspector always shows the built-in layout, so it is always the pure-code tier.
      tier: 3 as const,
    },
    checkQuote,
    openInspector,
    commitFromIntake,
    commitFromInspector,
    unlockFromInspector,
  }
}
