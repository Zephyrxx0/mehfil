import React from 'react'
import type { VendorQuote } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { Badge } from '@/components/ui/badge'

interface QuoteCheckHeaderProps {
  quote: VendorQuote
  categoryName: string
  totalPaise: number
}

/** Vendor name, category badge, payment terms and the live package total. */
export function QuoteCheckHeader({ quote, categoryName, totalPaise }: QuoteCheckHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-royal-plum/8 pb-4">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-serif text-xl font-bold text-royal-plum">{quote.vendorName}</h3>
          <Badge
            variant="outline"
            className="bg-royal-plum/5 text-royal-plum border-royal-plum/15 text-xs font-semibold"
          >
            {categoryName}
          </Badge>
        </div>
        {quote.paymentTerms && (
          <p className="text-xs text-royal-plum/70 mt-1 font-medium flex items-center gap-1.5">
            <span className="font-semibold text-royal-plum/90">Terms:</span>
            <span>{quote.paymentTerms}</span>
          </p>
        )}
      </div>

      <div className="text-right shrink-0">
        <span className="text-xs text-royal-plum/70 uppercase tracking-wider font-mono">
          Total Package
        </span>
        <div className="font-serif font-bold text-2xl text-royal-plum tabular-nums">
          {formatINR(totalPaise)}
        </div>
      </div>
    </div>
  )
}
