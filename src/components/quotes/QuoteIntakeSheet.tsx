'use client'

import React from 'react'
import type { BudgetCategory, VendorQuote, Plan } from '@/lib/engine/types'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { QuoteCheckCard } from './QuoteCheckCard'
import { INTAKE_CATEGORIES } from './quoteIntakeCategories'
import { useQuoteExtraction } from './useQuoteExtraction'
import { QuoteIntakeHeader } from './QuoteIntakeHeader'
import { QuoteCategoryPicker } from './QuoteCategoryPicker'
import { QuoteSamplePicker } from './QuoteSamplePicker'
import { QuoteInputTabs } from './QuoteInputTabs'
import { QuoteExtractAction } from './QuoteExtractAction'

export interface QuoteIntakeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: BudgetCategory
  guestCount?: number
  plan?: Plan
  onQuoteExtracted?: (quote: VendorQuote) => void
  onCommitQuote?: (quote: VendorQuote, tierId: string, adders: string[]) => void
}

export function QuoteIntakeSheet({
  open,
  onOpenChange,
  category: initialCategory = 'catering',
  guestCount = 200,
  plan,
  onQuoteExtracted,
  onCommitQuote,
}: QuoteIntakeSheetProps) {
  const intake = useQuoteExtraction({ open, initialCategory, guestCount, onQuoteExtracted })
  const { extractedQuote } = intake

  const categoryName =
    INTAKE_CATEGORIES.find((c) => c.id === intake.category)?.label || intake.category

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-warm-ivory border-l border-royal-plum/10 p-6 flex flex-col gap-6 overflow-y-auto text-royal-plum"
        data-testid="quote-intake-sheet"
      >
        <QuoteIntakeHeader
          title={
            extractedQuote
              ? `Quote Breakdown: ${extractedQuote.vendorName}`
              : `Check Vendor Quote: ${categoryName}`
          }
          showReset={Boolean(extractedQuote)}
          onReset={intake.reset}
        />

        {extractedQuote ? (
          /* Render Extracted Quote Breakdown via QuoteCheckCard */
          <div className="flex flex-col gap-4">
            <QuoteCheckCard
              quote={extractedQuote}
              plan={plan}
              guestCount={guestCount}
              onCommit={(tierId, adders) => {
                onCommitQuote?.(extractedQuote, tierId, adders)
                onOpenChange(false)
              }}
            />
          </div>
        ) : (
          /* Input State */
          <div className="flex flex-col gap-5">
            <QuoteCategoryPicker category={intake.category} onSelect={intake.setCategory} />
            <QuoteSamplePicker onSelect={intake.selectSample} />
            <QuoteInputTabs
              rawText={intake.rawText}
              onRawTextChange={intake.setRawText}
              imageFileName={intake.imageFileName}
              onFileChange={intake.handleFileChange}
              onClearImage={intake.clearImage}
            />
            <QuoteExtractAction
              errorMessage={intake.errorMessage}
              isLoading={intake.isLoading}
              disabled={!intake.isInputValid || intake.isLoading}
              onExtract={intake.extract}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
