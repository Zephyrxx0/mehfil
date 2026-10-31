'use client'

import React from 'react'
import type { VendorQuote, Plan, QuoteDroppedItem } from '@/lib/engine/types'
import { cn } from '@/lib/utils'
import { CATEGORY_NAMES } from './quoteCategoryNames'
import { useQuoteCheckState } from './useQuoteCheckState'
import { QuoteCheckHeader } from './QuoteCheckHeader'
import { QuoteTierTabs } from './QuoteTierTabs'
import { QuoteLineItemsList } from './QuoteLineItemsList'
import { QuoteOmissionAdders } from './QuoteOmissionAdders'
import { QuoteDroppedItemsAlert } from './QuoteDroppedItemsAlert'
import { QuotePlanImpactPreview } from './QuotePlanImpactPreview'
import { QuoteCheckActions } from './QuoteCheckActions'
import { QuoteRawTextDialog } from './QuoteRawTextDialog'

export interface QuoteCheckCardProps {
  quote: VendorQuote
  plan?: Plan
  guestCount?: number
  onCommit?: (tierId: string, activeAdderIds: string[]) => void
  onViewSource?: (sourceAnchor: string) => void
  onAddManualItem?: (droppedItem: QuoteDroppedItem) => void
  className?: string
}

export function QuoteCheckCard({
  quote,
  plan,
  onCommit,
  onViewSource,
  onAddManualItem,
  className,
}: QuoteCheckCardProps) {
  const state = useQuoteCheckState({ quote, plan, onCommit, onViewSource })
  const categoryName = CATEGORY_NAMES[quote.category] || quote.category

  return (
    <div
      data-testid="quote-check-card"
      className={cn(
        'rounded-3xl border border-royal-plum/10 bg-warm-ivory p-6 shadow-sm flex flex-col gap-5 text-royal-plum',
        className
      )}
    >
      <QuoteCheckHeader
        quote={quote}
        categoryName={categoryName}
        totalPaise={state.currentTotalPaise}
      />

      {quote.tiers.length > 1 && (
        <QuoteTierTabs
          tiers={quote.tiers}
          activeTierId={state.activeTierId}
          onSelect={state.setActiveTierId}
        />
      )}

      <QuoteLineItemsList
        lineItems={state.activeTier?.lineItems}
        onViewSource={state.openSourceDrawer}
      />

      {quote.omissionAdders && quote.omissionAdders.length > 0 && (
        <QuoteOmissionAdders
          adders={quote.omissionAdders}
          activeAdderIds={state.activeAdderIds}
          onToggle={state.toggleAdder}
        />
      )}

      {quote.droppedItems && quote.droppedItems.length > 0 && (
        <QuoteDroppedItemsAlert
          droppedItems={quote.droppedItems}
          onAddManualItem={onAddManualItem}
        />
      )}

      {state.displacementPreview && <QuotePlanImpactPreview preview={state.displacementPreview} />}

      <QuoteCheckActions
        categoryName={categoryName}
        isCommitting={state.isCommitting}
        onCommit={state.commit}
        onViewRawText={state.openRawText}
      />

      <QuoteRawTextDialog
        open={state.rawTextOpen}
        onOpenChange={state.setRawTextOpen}
        rawText={quote.rawText}
        highlightAnchor={state.highlightAnchor}
      />
    </div>
  )
}
