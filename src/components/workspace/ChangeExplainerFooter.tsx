import React from 'react'
import type { Plan } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'

export interface ChangeExplainerFooterProps {
  plan?: Plan
}

export function ChangeExplainerFooter({ plan }: ChangeExplainerFooterProps) {
  if (!plan) return null

  return (
    <p className="border-t border-royal-plum/10 pt-4 text-sm text-royal-plum/70">
      Sum of allocations exactly equals{' '}
      <span className="font-semibold tabular-nums text-royal-plum">
        {formatINR(plan.totalBudgetPaise)}
      </span>
      . Zero paise leakage.
    </p>
  )
}
