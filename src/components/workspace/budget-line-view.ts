import type { BudgetLine } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { elasticFloorPaise } from './plan-status'

export const LINE_TYPE_LABELS: Record<string, string> = {
  fixed: 'Fixed',
  per_guest: 'Per guest',
  flexible: 'Flexible',
  buffer: 'Buffer',
}

export interface BudgetLineView {
  /** Share of the total budget, unclamped, for the "x% of total budget" text. */
  rawPercentage: number
  /** The same share kept within 0-100, for the bar width. */
  percentageClamped: number
  /** Change against the baseline allocation, in paise. */
  delta: number
  /** The 40% floor of a flexible line, in paise. */
  floorAmount: number
}

/** The numbers a budget row shows, worked out once from the line and the plan total. */
export function deriveBudgetLineView(line: BudgetLine, totalBudgetPaise: number): BudgetLineView {
  const rawPercentage = totalBudgetPaise > 0 ? (line.currentPaise / totalBudgetPaise) * 100 : 0
  return {
    rawPercentage,
    percentageClamped: Math.min(100, Math.max(0, rawPercentage)),
    delta: line.currentPaise - line.baselinePaise,
    floorAmount: elasticFloorPaise(line.baselinePaise),
  }
}

/** Text colour for a signed amount: green when positive, terracotta when negative. */
export function signedAmountClass(value: number): string {
  if (value > 0) return 'text-[#2E5A44]'
  if (value < 0) return 'text-terracotta'
  return ''
}

/** What a committed line saved or overspent against its allocation. */
export function committedVarianceText(variancePaise: number): string {
  if (variancePaise > 0) return `Saved ${formatINR(variancePaise)}`
  if (variancePaise < 0) return `+${formatINR(Math.abs(variancePaise))} actual`
  return 'Exact to allocation'
}

/** The signed change against baseline, e.g. "+₹1,000" or "-₹500". */
export function baselineDeltaText(delta: number): string {
  return delta > 0 ? `+${formatINR(delta)}` : `-${formatINR(Math.abs(delta))}`
}
