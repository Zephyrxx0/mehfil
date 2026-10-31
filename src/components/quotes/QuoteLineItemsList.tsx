import React from 'react'
import type { ExtractedQuoteItem } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { CheckCircle2, Quote } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface QuoteLineItemsListProps {
  lineItems: ExtractedQuoteItem[] | undefined
  onViewSource: (sourceAnchor: string) => void
}

/** Extracted line items for the active tier, each with a verbatim source pill (D-07). */
export function QuoteLineItemsList({ lineItems, onViewSource }: QuoteLineItemsListProps) {
  return (
    <div className="flex flex-col gap-2.5 bg-soft-ivory/60 p-4 rounded-2xl border border-royal-plum/8">
      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-royal-plum/70 border-b border-royal-plum/8 pb-2">
        <span>Extracted Line Items ({lineItems?.length || 0})</span>
        <span>Verbatim Source Evidence</span>
      </div>

      <div className="flex flex-col gap-2">
        {lineItems?.map((item) => (
          <div
            key={item.id}
            className="flex min-w-0 flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white/70 border border-royal-plum/6"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
              <span className="min-w-0 break-words text-sm font-medium text-royal-plum">
                {item.description}
              </span>
              <Badge
                variant="outline"
                className="text-3xs font-mono text-royal-plum/70 border-royal-plum/10"
              >
                {item.pricingType === 'per_guest' ? 'Per Guest' : 'Flat'}
              </Badge>
            </div>

            <div className="flex min-w-0 items-center gap-3 justify-between sm:justify-end">
              <span className="shrink-0 whitespace-nowrap font-semibold text-sm text-royal-plum tabular-nums">
                {formatINR(item.itemPaise)}
              </span>

              {/* Verbatim Source Badge Pill (D-07) */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onViewSource(item.sourceAnchor)}
                      className="rounded-full bg-marigold/30 hover:bg-marigold text-royal-plum border border-marigold/60 px-2.5 py-1 text-2xs font-semibold flex items-center gap-1 transition-colors min-w-0 max-w-[200px]"
                    >
                      <Quote className="w-2.5 h-2.5 shrink-0 fill-royal-plum" />
                      <span className="min-w-0 truncate">&ldquo;{item.sourceAnchor}&rdquo;</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-xs">
                    <p className="font-semibold">Verbatim Source Match</p>
                    <p className="text-3xs text-royal-plum/80 mt-0.5">
                      Matched in vendor quote: &ldquo;{item.sourceAnchor}&rdquo;. Click to inspect
                      in raw text.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
