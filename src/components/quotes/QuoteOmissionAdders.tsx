import React from 'react'
import type { QuoteOmissionAdder } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuoteOmissionAddersProps {
  adders: QuoteOmissionAdder[]
  activeAdderIds: string[]
  onToggle: (adderId: string) => void
}

/** Toggleable unstated-cost chips that add to the tier total (D-06). */
export function QuoteOmissionAdders({
  adders,
  activeAdderIds,
  onToggle,
}: QuoteOmissionAddersProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-royal-plum/80">
        <Info className="w-3.5 h-3.5 text-royal-plum/70 shrink-0" />
        <span>Unstated Costs &amp; Category Omissions Detected</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {adders.map((adder) => {
          const isEnabled = activeAdderIds.includes(adder.id)
          return (
            <button
              key={adder.id}
              type="button"
              onClick={() => onToggle(adder.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border',
                isEnabled
                  ? 'bg-marigold text-royal-plum border-royal-plum/30 shadow-2xs font-semibold'
                  : 'bg-white text-royal-plum/70 border-royal-plum/15 hover:border-royal-plum/30'
              )}
              title={adder.rationale}
            >
              <span className="shrink-0">{isEnabled ? '✓' : '+'}</span>
              <span>{adder.name}</span>
              <span className="tabular-nums font-semibold whitespace-nowrap shrink-0">
                (+{formatINR(adder.amountPaise)})
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
