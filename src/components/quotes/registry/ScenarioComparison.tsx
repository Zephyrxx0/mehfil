'use client'

import React from 'react'
import type { VendorQuote, Plan, BudgetLine } from '@/lib/engine/types'
import { cn } from '@/lib/utils'
import { useScenarioComparison } from './useScenarioComparison'
import { ScenarioBaselineBanner, ScenarioEmptyState } from './ScenarioComparisonStates'
import { ScenarioCard } from './ScenarioCard'

export interface ScenarioComparisonProps {
  quoteIds?: string[]
  lineId?: string
  quotes?: VendorQuote[]
  plan?: Plan
  onSelectScenario?: (quoteId: string, tierId: string) => void
  className?: string
}

function gridColumnsClass(quoteCount: number): string {
  if (quoteCount === 1) return 'grid-cols-1'
  if (quoteCount === 2) return 'grid-cols-1 md:grid-cols-2'
  return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
}

export function ScenarioComparison({
  quoteIds,
  lineId,
  quotes,
  plan: propPlan,
  onSelectScenario,
  className,
}: ScenarioComparisonProps) {
  const { plan, resolvedQuotes, selectedTiers, changeTier, commitScenario } = useScenarioComparison(
    { quoteIds, quotes, plan: propPlan, onSelectScenario }
  )

  if (resolvedQuotes.length === 0) {
    return (
      <ScenarioEmptyState
        hasRequestedIds={Boolean(quoteIds && quoteIds.length > 0)}
        className={className}
      />
    )
  }

  // Baseline paise from the target line, or from the first quote's category line
  const targetLine: BudgetLine | undefined = lineId
    ? plan?.lines.find((l) => l.id === lineId)
    : undefined
  const category = resolvedQuotes[0]?.category
  const matchingLine = targetLine || plan?.lines.find((l) => l.category === category)
  const baselinePaise = matchingLine?.baselinePaise ?? 0
  const guestCount = plan?.brief.guestCount ?? 200

  return (
    <div className={cn('flex flex-col gap-4', className)} data-testid="scenario-comparison">
      {matchingLine && (
        <ScenarioBaselineBanner
          line={matchingLine}
          baselinePaise={baselinePaise}
          guestCount={guestCount}
        />
      )}

      {/* Comparison Matrix Grid */}
      <div className={cn('grid gap-4', gridColumnsClass(resolvedQuotes.length))}>
        {resolvedQuotes.map((quote) => (
          <ScenarioCard
            key={quote.id}
            quote={quote}
            selectedTierId={selectedTiers[quote.id]}
            baselinePaise={baselinePaise}
            showVariance={Boolean(matchingLine)}
            onTierChange={changeTier}
            onSelect={commitScenario}
          />
        ))}
      </div>
    </div>
  )
}
