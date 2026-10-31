import React from 'react'
import type { BudgetLine } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { cn } from '@/lib/utils'

/** Shown when no quote could be resolved for comparison. */
export function ScenarioEmptyState({
  hasRequestedIds,
  className,
}: {
  hasRequestedIds: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'p-8 rounded-3xl bg-warm-ivory border border-royal-plum/10 text-center flex flex-col items-center justify-center gap-2',
        className
      )}
      data-testid="scenario-comparison-empty"
    >
      <h4 className="font-serif text-lg font-semibold text-royal-plum">
        No Quotes Available for Comparison
      </h4>
      <p className="text-sm text-royal-plum/70 max-w-md">
        {hasRequestedIds
          ? 'The requested vendor quote entity IDs could not be resolved from active plan state.'
          : 'Check at least 2 vendor quotes to enable multi-vendor scenario comparison.'}
      </p>
    </div>
  )
}

interface ScenarioBaselineBannerProps {
  line: BudgetLine
  baselinePaise: number
  guestCount: number
}

/** Category baseline context banner above the comparison grid. */
export function ScenarioBaselineBanner({
  line,
  baselinePaise,
  guestCount,
}: ScenarioBaselineBannerProps) {
  return (
    <div className="p-3.5 rounded-2xl bg-soft-ivory border border-royal-plum/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-royal-plum">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-royal-plum">{line.name}</span>
        <span className="text-royal-plum/70">• Baseline Allocation:</span>
        <span className="font-bold tabular-nums">{formatINR(baselinePaise)}</span>
      </div>
      <div className="text-royal-plum/70">
        Computed for <span className="font-semibold text-royal-plum">{guestCount} guests</span>
      </div>
    </div>
  )
}
