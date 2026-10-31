import React from 'react'
import type { QuoteDroppedItem } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { AlertTriangle } from 'lucide-react'

interface QuoteDroppedItemsAlertProps {
  droppedItems: QuoteDroppedItem[]
  onAddManualItem?: (droppedItem: QuoteDroppedItem) => void
}

/** Calm amber pill for figures the quote text did not back up verbatim (D-08). */
export function QuoteDroppedItemsAlert({
  droppedItems,
  onAddManualItem,
}: QuoteDroppedItemsAlertProps) {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-royal-plum">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[#E09F3E] shrink-0" />
        <span>
          <strong>{droppedItems.length} figure excluded:</strong>{' '}
          {formatINR(droppedItems[0].amountStated * 100)} (no verbatim match in quote text)
        </span>
      </div>

      <button
        type="button"
        onClick={() => onAddManualItem?.(droppedItems[0])}
        className="rounded-full border border-royal-plum/20 hover:bg-royal-plum/5 px-3 py-1 text-2xs font-semibold text-royal-plum transition-colors shrink-0"
      >
        Add Excluded Amount Manually
      </button>
    </div>
  )
}
