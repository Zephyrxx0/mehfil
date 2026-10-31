'use client'

import React from 'react'
import type { BudgetLine } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { cn } from '@/lib/utils'
import {
  baselineDeltaText,
  committedVarianceText,
  LINE_TYPE_LABELS,
  signedAmountClass,
  type BudgetLineView,
} from './budget-line-view'
import { FLOOR_PERCENT_LABEL } from './plan-status'

interface BudgetLineFactsProps {
  line: BudgetLine
  view: BudgetLineView
}

/** The change shown last: variance for a committed line, otherwise the move against baseline. */
function ChangeFact({ line, delta }: { line: BudgetLine; delta: number }) {
  if (line.isCommitted && line.variancePaise !== undefined) {
    return (
      <span
        data-testid="committed-variance-badge"
        className={cn('tabular-nums', signedAmountClass(line.variancePaise))}
      >
        {committedVarianceText(line.variancePaise)}
      </span>
    )
  }
  if (delta === 0) return null
  return (
    <span className={cn('tabular-nums', signedAmountClass(delta))}>
      {baselineDeltaText(delta)} vs baseline
    </span>
  )
}

/** The dot-separated facts line under a budget row's name. */
export function BudgetLineFacts({ line, view }: BudgetLineFactsProps) {
  const { rawPercentage, delta, floorAmount } = view
  const showType = !line.isCommitted && !line.isProtected
  const showFloor = line.lineType === 'flexible' && !line.isProtected

  const facts: React.ReactNode[] = [
    <span key="pct" className="tabular-nums">
      {rawPercentage.toFixed(1)}% of total budget
    </span>,
  ]
  if (showType) {
    facts.push(<span key="type">{LINE_TYPE_LABELS[line.lineType] || line.lineType}</span>)
  }
  if (showFloor) {
    facts.push(
      <span key="floor" data-testid="floor-indicator" className="tabular-nums">
        {FLOOR_PERCENT_LABEL} floor: {formatINR(floorAmount)} protected
      </span>
    )
  }
  const hasVariance = line.isCommitted && line.variancePaise !== undefined
  if (hasVariance || delta !== 0) {
    facts.push(<ChangeFact key="change" line={line} delta={delta} />)
  }

  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      {facts.map((f, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span aria-hidden="true">·</span>}
          {f}
        </React.Fragment>
      ))}
    </p>
  )
}
