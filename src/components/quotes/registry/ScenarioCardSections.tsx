import React from 'react'
import type { PackageTier, QuoteOmissionAdder } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Stated rates breakdown for the active tier. */
export function ScenarioDeliverables({ tier }: { tier: PackageTier | undefined }) {
  return (
    <div className="space-y-2.5 pt-3 border-t border-royal-plum/10">
      <div className="text-xs font-semibold text-royal-plum/70 uppercase tracking-wider">
        Deliverables & Items
      </div>
      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
        {tier?.lineItems.map((item) => (
          <div
            key={item.id}
            className="text-xs text-royal-plum flex items-baseline justify-between gap-2"
          >
            <span className="truncate text-royal-plum/80">{item.description}</span>
            <span className="shrink-0 font-medium tabular-nums">{formatINR(item.itemPaise)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Statutory adders the vendor left out of the stated total. */
export function ScenarioOverheads({ adders }: { adders: QuoteOmissionAdder[] }) {
  return (
    <div className="space-y-2 pt-3 border-t border-royal-plum/10">
      <div className="text-xs font-semibold text-royal-plum/70 uppercase tracking-wider">
        Statutory Overheads
      </div>
      <div className="space-y-1">
        {adders.length > 0 ? (
          adders.map((adder) => (
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
          <div className="text-xs text-royal-plum/70 italic">
            All statutory costs included in quote.
          </div>
        )}
      </div>
    </div>
  )
}

interface ScenarioTotalsProps {
  totalPaise: number
  deltaPaise: number
  showVariance: boolean
}

/** Total package investment and, when a baseline line exists, the variance against it. */
export function ScenarioTotals({ totalPaise, deltaPaise, showVariance }: ScenarioTotalsProps) {
  const isUnderBaseline = deltaPaise <= 0

  return (
    <div className="pt-3 border-t border-royal-plum/10 space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-royal-plum/70">Total Package Investment</span>
        <span className="text-xl font-bold text-royal-plum tabular-nums">
          {formatINR(totalPaise)}
        </span>
      </div>

      {/* Net Baseline Delta */}
      {showVariance && (
        <div
          className={cn(
            'text-xs font-semibold p-2 rounded-xl flex items-center justify-between tabular-nums',
            isUnderBaseline ? 'bg-[#4A7C59]/10 text-[#4A7C59]' : 'bg-marigold/20 text-royal-plum'
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
  )
}
