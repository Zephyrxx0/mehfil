'use client'

import React from 'react'
import type { VendorQuote, Plan } from '@/lib/engine/types'
import { usePlanContext } from './PlanContext'
import { QuoteCheckCard } from '@/components/quotes/QuoteCheckCard'
import { cn } from '@/lib/utils'

export interface QuoteReportProps {
  quoteId?: string
  quote?: VendorQuote
  plan?: Plan
  onCommitQuote?: (tierId: string, adders: string[]) => void
  onUnlockQuote?: () => void
  className?: string
}

export function QuoteReport({
  quoteId,
  quote: propQuote,
  plan: propPlan,
  onCommitQuote,
  onUnlockQuote,
  className,
}: QuoteReportProps) {
  const context = usePlanContext()
  const plan = propPlan || context.plan

  const handleCommit = onCommitQuote || (context.onCommitQuote && quoteId ? (tierId, adders) => context.onCommitQuote!(quoteId, tierId, adders) : undefined)
  const handleUnlock = onUnlockQuote || (context.onUnlockQuote && quoteId ? () => context.onUnlockQuote!(quoteId) : undefined)

  // Resolve quote by entity ID from props, plan.quotes, or context.quotes
  const allQuotes = [
    ...(propQuote ? [propQuote] : []),
    ...(plan?.quotes || []),
    ...(context.quotes || []),
  ]

  const resolvedQuote: VendorQuote | undefined =
    propQuote ||
    (quoteId ? allQuotes.find((q) => q.id === quoteId) : allQuotes[0])

  if (!resolvedQuote) {
    return (
      <div
        className={cn(
          'p-8 rounded-3xl bg-warm-ivory border border-royal-plum/10 text-center flex flex-col items-center justify-center gap-2',
          className
        )}
        data-testid="quote-report-empty"
      >
        <h4 className="font-serif text-lg font-semibold text-royal-plum">
          No Vendor Quote Selected
        </h4>
        <p className="text-sm text-royal-plum/70 max-w-md">
          {quoteId
            ? `Quote entity ID "${quoteId}" is not present in active plan state.`
            : 'Check or ingest a vendor quote to review line items and statutory omissions.'}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)} data-testid="quote-report">
      <QuoteCheckCard
        quote={resolvedQuote}
        plan={plan}
        guestCount={plan?.brief.guestCount}
        onCommit={handleCommit}
        onUnlock={handleUnlock}
      />
    </div>
  )
}

