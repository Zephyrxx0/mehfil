'use client'

import React, { useState } from 'react'
import type { VendorQuote, Plan, QuoteDroppedItem, BudgetCategory } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { previewQuoteDisplacement } from '@/lib/engine/budget'
import { AlertTriangle, CheckCircle2, Lock, Quote, Sparkles, Info, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface QuoteCheckCardProps {
  quote: VendorQuote
  plan?: Plan
  guestCount?: number
  onCommit?: (tierId: string, activeAdderIds: string[]) => void
  onViewSource?: (sourceAnchor: string) => void
  onAddManualItem?: (droppedItem: QuoteDroppedItem) => void
  className?: string
}

const CATEGORY_NAMES: Record<BudgetCategory, string> = {
  venue: 'Venue',
  catering: 'Catering',
  decor: 'Decor',
  photo_film: 'Photo & Film',
  entertainment: 'Entertainment',
  favors: 'Favors',
  misc: 'Miscellaneous',
  contingency: 'Contingency',
}

export function QuoteCheckCard({
  quote,
  plan,
  onCommit,
  onViewSource,
  onAddManualItem,
  className,
}: QuoteCheckCardProps) {
  const [activeTierId, setActiveTierId] = useState<string>(quote.tiers[0]?.tierId || 'tier_default')
  const [activeAdderIds, setActiveAdderIds] = useState<string[]>(() =>
    (quote.omissionAdders || []).filter((a) => a.isEnabled).map((a) => a.id)
  )
  const [rawTextOpen, setRawTextOpen] = useState(false)
  const [highlightAnchor, setHighlightAnchor] = useState<string>('')
  const [isCommitting, setIsCommitting] = useState(false)

  const activeTier = quote.tiers.find((t) => t.tierId === activeTierId) ?? quote.tiers[0]

  const categoryName = CATEGORY_NAMES[quote.category] || quote.category

  // Calculate tier total dynamically with active adders
  const activeAdders = (quote.omissionAdders || []).filter((a) => activeAdderIds.includes(a.id))
  const activeAddersTotalPaise = activeAdders.reduce((sum, a) => sum + a.amountPaise, 0)
  const currentTotalPaise = (activeTier?.baseTierPaise ?? 0) + activeAddersTotalPaise

  // Compute live plan displacement preview if plan is provided
  const displacementPreview = plan
    ? previewQuoteDisplacement(plan, quote, activeTier?.tierId ?? '', activeAdderIds)
    : null

  const toggleAdder = (adderId: string) => {
    setActiveAdderIds((prev) =>
      prev.includes(adderId) ? prev.filter((id) => id !== adderId) : [...prev, adderId]
    )
  }

  const handleOpenSourceDrawer = (anchor: string) => {
    setHighlightAnchor(anchor)
    setRawTextOpen(true)
    onViewSource?.(anchor)
  }

  const handleCommit = () => {
    setIsCommitting(true)
    try {
      onCommit?.(activeTier.tierId, activeAdderIds)
    } finally {
      setIsCommitting(false)
    }
  }

  // Render raw text with highlighted anchor
  const renderHighlightedRawText = () => {
    if (!highlightAnchor || !quote.rawText.toLowerCase().includes(highlightAnchor.toLowerCase())) {
      return (
        <pre className="font-mono text-xs whitespace-pre-wrap text-royal-plum/80 leading-relaxed bg-soft-ivory p-4 rounded-xl border border-royal-plum/10">
          {quote.rawText}
        </pre>
      )
    }

    const lowerText = quote.rawText.toLowerCase()
    const lowerAnchor = highlightAnchor.toLowerCase()
    const startIndex = lowerText.indexOf(lowerAnchor)
    const endIndex = startIndex + highlightAnchor.length

    const before = quote.rawText.slice(0, startIndex)
    const match = quote.rawText.slice(startIndex, endIndex)
    const after = quote.rawText.slice(endIndex)

    return (
      <div className="font-mono text-xs whitespace-pre-wrap text-royal-plum/80 leading-relaxed bg-soft-ivory p-4 rounded-xl border border-royal-plum/10 max-h-[60vh] overflow-y-auto">
        <span>{before}</span>
        <mark className="bg-marigold text-royal-plum font-bold px-1.5 py-0.5 rounded-md border border-royal-plum/20">
          {match}
        </mark>
        <span>{after}</span>
      </div>
    )
  }

  return (
    <div
      data-testid="quote-check-card"
      className={cn(
        'rounded-3xl border border-royal-plum/10 bg-warm-ivory p-6 shadow-sm flex flex-col gap-5 text-royal-plum',
        className
      )}
    >
      {/* Vendor Header */}
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
          <span className="text-xs text-royal-plum/60 uppercase tracking-wider font-mono">
            Total Package
          </span>
          <div className="font-serif font-bold text-2xl text-royal-plum tabular-nums">
            {formatINR(currentTotalPaise)}
          </div>
        </div>
      </div>

      {/* Package Tier Selector Tabs */}
      {quote.tiers.length > 1 && (
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
            {quote.tiers.map((tier) => {
              const isSelected = tier.tierId === activeTierId
              return (
                <button
                  key={tier.tierId}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveTierId(tier.tierId)}
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
      )}

      {/* Extracted Line Items List */}
      <div className="flex flex-col gap-2.5 bg-soft-ivory/60 p-4 rounded-2xl border border-royal-plum/8">
        <div className="flex items-center justify-between text-xs font-semibold text-royal-plum/70 border-b border-royal-plum/8 pb-2">
          <span>Extracted Line Items ({activeTier?.lineItems.length || 0})</span>
          <span>Verbatim Source Evidence</span>
        </div>

        <div className="flex flex-col gap-2">
          {activeTier?.lineItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white/70 border border-royal-plum/6"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                <span className="text-sm font-medium text-royal-plum">{item.description}</span>
                <Badge
                  variant="outline"
                  className="text-3xs font-mono text-royal-plum/60 border-royal-plum/10"
                >
                  {item.pricingType === 'per_guest' ? 'Per Guest' : 'Flat'}
                </Badge>
              </div>

              <div className="flex items-center gap-3 justify-between sm:justify-end">
                <span className="font-semibold text-sm text-royal-plum tabular-nums">
                  {formatINR(item.itemPaise)}
                </span>

                {/* Verbatim Source Badge Pill (D-07) */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => handleOpenSourceDrawer(item.sourceAnchor)}
                        className="rounded-full bg-marigold/30 hover:bg-marigold text-royal-plum border border-marigold/60 px-2.5 py-1 text-2xs font-semibold flex items-center gap-1 transition-colors max-w-[200px] truncate"
                      >
                        <Quote className="w-2.5 h-2.5 shrink-0 fill-royal-plum" />
                        <span className="truncate">&ldquo;{item.sourceAnchor}&rdquo;</span>
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

      {/* Interactive Omission Adders Section (D-06) */}
      {quote.omissionAdders && quote.omissionAdders.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-royal-plum/80">
            <Info className="w-3.5 h-3.5 text-royal-plum/60 shrink-0" />
            <span>Unstated Costs &amp; Category Omissions Detected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {quote.omissionAdders.map((adder) => {
              const isEnabled = activeAdderIds.includes(adder.id)
              return (
                <button
                  key={adder.id}
                  type="button"
                  onClick={() => toggleAdder(adder.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border',
                    isEnabled
                      ? 'bg-marigold text-royal-plum border-royal-plum/30 shadow-2xs font-semibold'
                      : 'bg-white text-royal-plum/70 border-royal-plum/15 hover:border-royal-plum/30'
                  )}
                  title={adder.rationale}
                >
                  <span>{isEnabled ? '✓' : '+'}</span>
                  <span>{adder.name}</span>
                  <span className="tabular-nums font-semibold">
                    (+{formatINR(adder.amountPaise)})
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Dropped Items Calm Amber Alert Pill (D-08) */}
      {quote.droppedItems && quote.droppedItems.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-royal-plum">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#E09F3E] shrink-0" />
            <span>
              <strong>{quote.droppedItems.length} figure excluded:</strong>{' '}
              {formatINR(quote.droppedItems[0].amountStated * 100)} (no verbatim match in quote
              text)
            </span>
          </div>

          <button
            type="button"
            onClick={() => onAddManualItem?.(quote.droppedItems[0])}
            className="rounded-full border border-royal-plum/20 hover:bg-royal-plum/5 px-3 py-1 text-2xs font-semibold text-royal-plum transition-colors shrink-0"
          >
            Add Excluded Amount Manually
          </button>
        </div>
      )}

      {/* Real-Time Plan Impact Preview Bar (D-09) */}
      {displacementPreview && (
        <div
          data-testid="live-plan-impact-preview"
          className={cn(
            'p-3.5 rounded-2xl border text-xs font-medium flex items-center gap-2.5',
            displacementPreview.deltaPaise <= 0
              ? 'bg-[#4A7C59]/10 border-[#4A7C59]/30 text-[#4A7C59]'
              : displacementPreview.wouldTriggerShortfall
                ? 'bg-amber-100/90 border-amber-300 text-amber-900'
                : 'bg-marigold/15 border-marigold/40 text-royal-plum'
          )}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <div className="leading-snug">
            {displacementPreview.deltaPaise <= 0 ? (
              <span>
                <strong>
                  Saved {formatINR(Math.abs(displacementPreview.deltaPaise))} vs allocation
                </strong>{' '}
                — Surplus added to Contingency buffer.
              </span>
            ) : displacementPreview.wouldTriggerShortfall ? (
              <span>
                <strong>
                  Exceeds flexible donor capacity by {formatINR(displacementPreview.shortfallPaise)}
                </strong>{' '}
                — Permissive Shortfall active. 3 calculation remedies available.
              </span>
            ) : (
              <span>
                <strong>Requires +{formatINR(displacementPreview.deltaPaise)}</strong> — Funded by
                trimming flexible lines:{' '}
                {displacementPreview.displacedDonors
                  .map(
                    (d) =>
                      `${CATEGORY_NAMES[d.category] || d.category} (-${formatINR(d.displacedPaise)})`
                  )
                  .join(', ')}
                . Protected Moment held firm.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Group */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <Button
          type="button"
          onClick={handleCommit}
          disabled={isCommitting}
          className="h-12 w-full rounded-full bg-marigold text-royal-plum font-semibold text-base shadow-md hover:scale-[1.01] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 border border-royal-plum/20"
        >
          <Lock className="w-4 h-4" />
          <span>Commit {categoryName} Quote</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setHighlightAnchor('')
            setRawTextOpen(true)
          }}
          className="h-12 w-full sm:w-auto rounded-full border-royal-plum/15 text-royal-plum font-medium text-xs px-5 hover:bg-royal-plum/5 shrink-0"
        >
          <FileText className="w-3.5 h-3.5 mr-1" />
          <span>View Verbatim Quote Excerpt</span>
        </Button>
      </div>

      {/* Raw Quote Inspection Drawer / Dialog */}
      <Dialog open={rawTextOpen} onOpenChange={setRawTextOpen}>
        <DialogContent className="max-w-2xl bg-warm-ivory border-royal-plum/10 text-royal-plum">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold">
              Raw Vendor Quote Text
            </DialogTitle>
            <DialogDescription className="text-xs text-royal-plum/70">
              Quarantined vendor text. Yellow highlight indicates verbatim evidence for the selected
              item.
            </DialogDescription>
          </DialogHeader>

          {renderHighlightedRawText()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
