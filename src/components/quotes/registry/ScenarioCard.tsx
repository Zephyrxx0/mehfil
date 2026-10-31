import React from 'react'
import type { PackageTier, VendorQuote } from '@/lib/engine/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScenarioDeliverables, ScenarioOverheads, ScenarioTotals } from './ScenarioCardSections'

interface ScenarioCardProps {
  quote: VendorQuote
  /** Selected tier for this quote; falls back to the first tier. */
  selectedTierId?: string
  baselinePaise: number
  showVariance: boolean
  onTierChange: (quoteId: string, tierId: string) => void
  onSelect: (quoteId: string, tierId: string) => void
}

interface ScenarioCardHeaderProps {
  quote: VendorQuote
  activeTierId: string | undefined
  activeTier: PackageTier | undefined
  onTierChange: (quoteId: string, tierId: string) => void
}

/** Vendor name, category, payment terms and the package tier selector. */
function ScenarioCardHeader({
  quote,
  activeTierId,
  activeTier,
  onTierChange,
}: ScenarioCardHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className="bg-soft-ivory border-royal-plum/15 text-royal-plum text-[11px] font-semibold uppercase px-2 py-0.5"
        >
          {quote.category}
        </Badge>

        {quote.paymentTerms && (
          <span className="text-[11px] text-royal-plum/70 truncate max-w-[150px]">
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
              onClick={() => onTierChange(quote.id, t.tierId)}
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
        <div className="text-xs font-medium text-royal-plum/70">{activeTier?.name}</div>
      )}
    </div>
  )
}

/** One vendor quote as a comparison column: tier, items, overheads, total and select action. */
export function ScenarioCard({
  quote,
  selectedTierId,
  baselinePaise,
  showVariance,
  onTierChange,
  onSelect,
}: ScenarioCardProps) {
  const activeTierId = selectedTierId || quote.tiers[0]?.tierId
  const activeTier = quote.tiers.find((t) => t.tierId === activeTierId) || quote.tiers[0]

  const activeTierTotalPaise = activeTier?.totalWithAddersPaise ?? 0
  const deltaPaise = activeTierTotalPaise - baselinePaise

  return (
    <div className="p-5 rounded-3xl bg-warm-ivory border border-royal-plum/10 shadow-xs flex flex-col justify-between gap-5 transition-all hover:border-royal-plum/25">
      <ScenarioCardHeader
        quote={quote}
        activeTierId={activeTierId}
        activeTier={activeTier}
        onTierChange={onTierChange}
      />
      <ScenarioDeliverables tier={activeTier} />
      <ScenarioOverheads adders={quote.omissionAdders} />
      <ScenarioTotals
        totalPaise={activeTierTotalPaise}
        deltaPaise={deltaPaise}
        showVariance={showVariance}
      />

      {/* Primary Action Button */}
      <Button
        onClick={() => onSelect(quote.id, activeTier?.tierId ?? '')}
        className="w-full rounded-full bg-marigold hover:bg-marigold/90 text-royal-plum font-semibold text-sm h-11 shadow-sm hover:scale-[1.01] active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
      >
        <Check className="w-4 h-4" />
        <span>Select This Scenario</span>
      </Button>
    </div>
  )
}
