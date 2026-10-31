import React from 'react'
import type { PackageTier } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { cn } from '@/lib/utils'

interface QuoteTierTabsProps {
  tiers: PackageTier[]
  activeTierId: string
  onSelect: (tierId: string) => void
}

/** Package tier selector shown when a quote offers more than one tier. */
export function QuoteTierTabs({ tiers, activeTierId, onSelect }: QuoteTierTabsProps) {
  return (
    <div className="flex flex-col gap-2">
      <span
        id="package-tier-label"
        className="text-xs font-semibold text-royal-plum/70 uppercase tracking-wider font-mono"
      >
        Select Package Tier:
      </span>
      <div
        role="tablist"
        aria-labelledby="package-tier-label"
        className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
      >
        {tiers.map((tier) => {
          const isSelected = tier.tierId === activeTierId
          return (
            <button
              key={tier.tierId}
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelect(tier.tierId)}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 border',
                isSelected
                  ? 'bg-marigold text-royal-plum border-royal-plum/30 shadow-xs'
                  : 'bg-soft-ivory text-royal-plum/70 border-royal-plum/10 hover:border-royal-plum/25 hover:text-royal-plum'
              )}
            >
              <span>{tier.name}</span>
              <span className="ml-1.5 tabular-nums opacity-80">
                ({formatINR(tier.baseTierPaise)})
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
