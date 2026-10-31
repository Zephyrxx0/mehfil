import * as React from 'react'
import type { SanitizedSharedPlan, BudgetCategory } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { formatCategoryLabel } from './share-view-format'

export interface ShareCategoryBreakdownProps {
  totalBudgetPaise: SanitizedSharedPlan['totalBudgetPaise']
  categoryTotals: SanitizedSharedPlan['categoryTotals']
  categoryPercentages: SanitizedSharedPlan['categoryPercentages']
}

function CategoryCard({
  category,
  paise,
  pct,
}: {
  category: string
  paise: SanitizedSharedPlan['totalBudgetPaise']
  pct: number
}) {
  return (
    <div className="rounded-2xl border border-royal-plum/8 bg-warm-ivory/50 p-4 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-royal-plum">{formatCategoryLabel(category)}</span>
        <span className="font-bold tabular-nums text-royal-plum">{formatINR(paise)}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2 w-full rounded-full bg-royal-plum/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-marigold"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <span className="text-xs font-semibold tabular-nums text-royal-plum/70 w-8 text-right">
          {pct}%
        </span>
      </div>
    </div>
  )
}

/** High-level category proportions (no vendor quotes or margins). */
export function ShareCategoryBreakdown({
  totalBudgetPaise,
  categoryTotals,
  categoryPercentages,
}: ShareCategoryBreakdownProps) {
  return (
    <section
      aria-labelledby="category-breakdown-heading"
      className="rounded-3xl border border-royal-plum/10 bg-white/70 p-6 sm:p-8 space-y-6 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-royal-plum/8 pb-4">
        <div>
          <h2
            id="category-breakdown-heading"
            className="font-serif text-xl font-bold text-royal-plum"
          >
            Celebration Overview
          </h2>
          <p className="text-xs text-royal-plum/70 mt-0.5">
            Harmonized resource distribution across celebration experiences
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xs uppercase tracking-wider text-royal-plum/70 font-bold block">
            Total Budget
          </span>
          <span className="text-lg font-bold tabular-nums text-royal-plum">
            {formatINR(totalBudgetPaise)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(categoryTotals).map(([cat, paise]) => (
          <CategoryCard
            key={cat}
            category={cat}
            paise={paise}
            pct={categoryPercentages[cat as BudgetCategory] || 0}
          />
        ))}
      </div>
    </section>
  )
}
