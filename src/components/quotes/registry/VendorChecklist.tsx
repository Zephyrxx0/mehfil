'use client'

import React from 'react'
import type { BudgetCategory, BudgetLine, Plan } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { usePlanContext } from './PlanContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface VendorChecklistProps {
  lineIds?: string[]
  highlightEntityId?: string
  onSelectLine?: (lineId: string) => void
  onCheckQuote?: (category: BudgetCategory) => void
  plan?: Plan
  className?: string
}

export function VendorChecklist({
  lineIds,
  highlightEntityId,
  onSelectLine,
  onCheckQuote,
  plan: propPlan,
  className,
}: VendorChecklistProps) {
  const context = usePlanContext()
  const plan = propPlan || context.plan

  const handleCheckQuote = onCheckQuote || context.onCheckQuote
  const handleSelectLine = onSelectLine || context.onSelectLine

  if (!plan || !plan.lines) {
    return (
      <div className="p-6 rounded-2xl bg-soft-ivory border border-royal-plum/10 text-center text-sm text-royal-plum/70">
        No active plan lines available for checklist resolution.
      </div>
    )
  }

  // Resolve lines: if lineIds is provided, pick those lines; otherwise show all lines
  const resolvedLines: BudgetLine[] = lineIds && lineIds.length > 0
    ? lineIds
        .map((id) => plan.lines.find((l) => l.id === id))
        .filter((l): l is BudgetLine => l !== undefined)
    : plan.lines

  return (
    <ul
      className={cn('divide-y divide-royal-plum/10 border-y border-royal-plum/10', className)}
      data-testid="vendor-checklist"
    >
      {resolvedLines.map((line) => {
        const isHighlighted = highlightEntityId === line.id
        const isCommitted = Boolean(line.isCommitted)

        return (
          <li
            key={line.id}
            onClick={() => handleSelectLine?.(line.id)}
            className={cn(
              'relative flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
              isHighlighted && 'bg-marigold/10',
              line.isProtected && 'bg-gulabi-rose/10 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-gulabi-rose'
            )}
          >
            <div className="min-w-0">
              <p className="text-base font-semibold text-royal-plum">
                {line.name}
                {line.isProtected && (
                  <span className="ml-2 text-sm font-normal text-royal-plum/70">Protected Moment</span>
                )}
              </p>
              <p className="mt-0.5 text-sm tabular-nums text-royal-plum/60">
                Baseline: {formatINR(line.baselinePaise)}
                <span aria-hidden="true"> · </span>
                <span className="font-medium text-royal-plum/80">Allocated: {formatINR(line.currentPaise)}</span>
              </p>
            </div>

            <div className="shrink-0 text-sm sm:text-right">
              {isCommitted ? (
                <>
                  <p className="font-medium text-royal-plum">Committed: {line.committedVendor || 'Vendor'}</p>
                  {line.variancePaise !== undefined && line.variancePaise !== 0 && (
                    <p
                      className={cn(
                        'tabular-nums',
                        line.variancePaise < 0 ? 'text-[#2E5A44]' : 'text-royal-plum/70'
                      )}
                    >
                      {line.variancePaise < 0
                        ? `Saved ${formatINR(Math.abs(line.variancePaise))}`
                        : `+${formatINR(line.variancePaise)} actual`}
                    </p>
                  )}
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCheckQuote?.(line.category)
                  }}
                >
                  Check Quote
                </Button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
