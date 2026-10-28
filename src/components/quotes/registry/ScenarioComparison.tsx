'use client'

import React, { useState } from 'react'
import type { VendorQuote, Plan, BudgetLine } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { usePlanContext } from './PlanContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Check,
  TrendingDown,
  TrendingUp,
  FileCheck2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ScenarioComparisonProps {
  quoteIds?: string[]
  lineId?: string
  quotes?: VendorQuote[]
  plan?: Plan
  onSelectScenario?: (quoteId: string, tierId: string) => void
  className?: string
}

export function ScenarioComparison({
  quoteIds,
  lineId,
  quotes: propQuotes,
  plan: propPlan,
  onSelectScenario,
  className,
}: ScenarioComparisonProps) {
  const context = usePlanContext()
  const plan = propPlan || context.plan

  // Resolve target budget line
  const targetLine: BudgetLine | undefined = lineId
    ? plan?.lines.find((l) => l.id === lineId)
    : undefined

  // Resolve quotes from props, plan, or context
  const allAvailableQuotes: VendorQuote[] = [
    ...(propQuotes || []),
    ...(plan?.quotes || []),
    ...(context.quotes || []),
  ]

  // Filter quotes matching quoteIds if provided
  const resolvedQuotes: VendorQuote[] = quoteIds && quoteIds.length > 0
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

  const guestCount = plan?.brief.guestCount ?? 200

  const handleTierChange = (quoteId: string, tierId: string) => {
    setSelectedTiers((prev) => ({ ...prev, [quoteId]: tierId }))
  }

  const handleCommitScenario = (quoteId: string, tierId: string) => {
    if (onSelectScenario) {
      onSelectScenario(quoteId, tierId)
    } else if (context.onCommitQuote) {
      const q = resolvedQuotes.find((x) => x.id === quoteId)
      const defaultAdders = (q?.omissionAdders || []).filter((a) => a.isEnabled).map((a) => a.id)
      context.onCommitQuote(quoteId, tierId, defaultAdders)
    }
  }

  if (resolvedQuotes.length === 0) {
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
          {quoteIds && quoteIds.length > 0
            ? 'The requested vendor quote entity IDs could not be resolved from active plan state.'
            : 'Check at least 2 vendor quotes to enable multi-vendor scenario comparison.'}
        </p>
      </div>
    )
  }

  // Find baseline paise from targetLine or from first quote's category line
  const category = resolvedQuotes[0]?.category
  const matchingLine = targetLine || plan?.lines.find((l) => l.category === category)
  const baselinePaise = matchingLine?.baselinePaise ?? 0

  return (
    <div
      className={cn('flex flex-col gap-4', className)}
      data-testid="scenario-comparison"
    >
      {/* Category Baseline Context Banner */}
      {matchingLine && (
        <div className="p-3.5 rounded-2xl bg-soft-ivory border border-royal-plum/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-royal-plum">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-royal-plum">{matchingLine.name}</span>
            <span className="text-royal-plum/60">• Baseline Allocation:</span>
            <span className="font-bold tabular-nums">{formatINR(baselinePaise)}</span>
          </div>
          <div className="text-royal-plum/60">
            Computed for <span className="font-semibold text-royal-plum">{guestCount} guests</span>
          </div>
        </div>
      )}

      {/* Comparison Matrix Grid */}
      <div
        className={cn(
          'grid gap-4',
          resolvedQuotes.length === 1
            ? 'grid-cols-1'
            : resolvedQuotes.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        )}
      >
        {resolvedQuotes.map((quote) => {
          const activeTierId = selectedTiers[quote.id] || quote.tiers[0]?.tierId
          const activeTier =
            quote.tiers.find((t) => t.tierId === activeTierId) || quote.tiers[0]

          const activeTierTotalPaise = activeTier?.totalWithAddersPaise ?? 0
          const deltaPaise = activeTierTotalPaise - baselinePaise
          const isUnderBaseline = deltaPaise <= 0

          return (
            <div
              key={quote.id}
              className="p-5 rounded-3xl bg-warm-ivory border border-royal-plum/10 shadow-xs flex flex-col justify-between gap-5 transition-all hover:border-royal-plum/25"
            >
              {/* Header: Vendor Name & Category */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className="bg-soft-ivory border-royal-plum/15 text-royal-plum text-[11px] font-semibold uppercase px-2 py-0.5"
                  >
                    {quote.category}
                  </Badge>

                  {quote.paymentTerms && (
                    <span className="text-[11px] text-royal-plum/60 truncate max-w-[150px]">
                      {quote.paymentTerms}
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-xl font-semibold text-royal-plum leading-snug">
                  {quote.vendorName}
                </h3>

                {/* Package Tier Selector (if multiple tiers exist) */}
                {quote.tiers.length > 1 ? (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {quote.tiers.map((t) => (
                      <button
                        key={t.tierId}
                        onClick={() => handleTierChange(quote.id, t.tierId)}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-semibold transition-all',
                          t.tierId === activeTierId
                            ? 'bg-marigold text-royal-plum shadow-xs'
                            : 'bg-soft-ivory text-royal-plum/70 hover:bg-royal-plum/5'
                        )}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs font-medium text-royal-plum/70">
                    {activeTier?.name}
                  </div>
                )}
              </div>

              {/* Stated Rates Breakdown */}
              <div className="space-y-2.5 pt-3 border-t border-royal-plum/10">
                <div className="text-xs font-semibold text-royal-plum/60 uppercase tracking-wider">
                  Deliverables & Items
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {activeTier?.lineItems.map((item) => (
                    <div
                      key={item.id}
                      className="text-xs text-royal-plum flex items-baseline justify-between gap-2"
                    >
                      <span className="truncate text-royal-plum/80">
                        {item.description}
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">
                        {formatINR(item.itemPaise)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statutory Adders Comparison */}
              <div className="space-y-2 pt-3 border-t border-royal-plum/10">
                <div className="text-xs font-semibold text-royal-plum/60 uppercase tracking-wider">
                  Statutory Overheads
                </div>
                <div className="space-y-1">
                  {quote.omissionAdders.length > 0 ? (
                    quote.omissionAdders.map((adder) => (
                      <div
                        key={adder.id}
                        className="text-xs flex items-center justify-between text-royal-plum/75"
                      >
                        <span className="truncate">{adder.name}</span>
                        <span className="shrink-0 font-medium tabular-nums">
                          +{formatINR(adder.amountPaise)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-royal-plum/60 italic">
                      All statutory costs included in quote.
                    </div>
                  )}
                </div>
              </div>

              {/* Total Computed Package Investment & Plan Impact */}
              <div className="pt-3 border-t border-royal-plum/10 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-royal-plum/70">
                    Total Package Investment
                  </span>
                  <span className="text-xl font-bold text-royal-plum tabular-nums">
                    {formatINR(activeTierTotalPaise)}
                  </span>
                </div>

                {/* Net Baseline Delta */}
                {matchingLine && (
                  <div
                    className={cn(
                      'text-xs font-semibold p-2 rounded-xl flex items-center justify-between tabular-nums',
                      isUnderBaseline
                        ? 'bg-[#4A7C59]/10 text-[#4A7C59]'
                        : 'bg-marigold/20 text-royal-plum'
                    )}
                  >
                    <span>Baseline Variance</span>
                    <span className="flex items-center gap-1">
                      {isUnderBaseline ? (
                        <>
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>Saved {formatINR(Math.abs(deltaPaise))}</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>+{formatINR(deltaPaise)} over baseline</span>
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Primary Action Button */}
              <Button
                onClick={() => handleCommitScenario(quote.id, activeTier?.tierId ?? '')}
                className="w-full rounded-full bg-marigold hover:bg-marigold/90 text-royal-plum font-semibold text-sm h-11 shadow-sm hover:scale-[1.01] active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Select This Scenario</span>
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

