'use client'

import { useState } from 'react'
import type { Plan, VendorQuote } from '@/lib/engine/types'
import { usePlanContext } from './PlanContext'

interface UseScenarioComparisonOptions {
  quoteIds?: string[]
  quotes?: VendorQuote[]
  plan?: Plan
  onSelectScenario?: (quoteId: string, tierId: string) => void
}

/**
 * Resolves which quotes to compare (by entity ID from props, the plan or the plan context), tracks
 * the chosen tier per quote, and routes a "select scenario" action to the caller or the context.
 */
export function useScenarioComparison({
  quoteIds,
  quotes: propQuotes,
  plan: propPlan,
  onSelectScenario,
}: UseScenarioComparisonOptions) {
  const context = usePlanContext()
  const plan = propPlan || context.plan

  // Resolve quotes from props, plan, or context
  const allAvailableQuotes: VendorQuote[] = [
    ...(propQuotes || []),
    ...(plan?.quotes || []),
    ...(context.quotes || []),
  ]

  // Filter quotes matching quoteIds if provided
  const resolvedQuotes: VendorQuote[] =
    quoteIds && quoteIds.length > 0
      ? quoteIds
          .map((id) => allAvailableQuotes.find((q) => q.id === id))
          .filter((q): q is VendorQuote => q !== undefined)
      : allAvailableQuotes.slice(0, 3)

  // Track selected tier per quote
  const [selectedTiers, setSelectedTiers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const q of resolvedQuotes) {
      if (q.tiers[0]) {
        init[q.id] = q.tiers[0].tierId
      }
    }
    return init
  })

  const changeTier = (quoteId: string, tierId: string) => {
    setSelectedTiers((prev) => ({ ...prev, [quoteId]: tierId }))
  }

  const commitScenario = (quoteId: string, tierId: string) => {
    if (onSelectScenario) {
      onSelectScenario(quoteId, tierId)
    } else if (context.onCommitQuote) {
      const q = resolvedQuotes.find((x) => x.id === quoteId)
      const defaultAdders = (q?.omissionAdders || []).filter((a) => a.isEnabled).map((a) => a.id)
      context.onCommitQuote(quoteId, tierId, defaultAdders)
    }
  }

  return { plan, resolvedQuotes, selectedTiers, changeTier, commitScenario }
}
