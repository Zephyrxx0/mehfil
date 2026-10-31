'use client'

import React, { useState, useEffect } from 'react'
import type { BudgetCategory, VendorQuote, Plan } from '@/lib/engine/types'
import { SAMPLE_QUOTES } from '@/data/sample-quotes'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  ShieldAlert,
  UploadCloud,
  FileText,
  Sparkles,
  RotateCcw,
  AlertCircle,
  X,
  Image as ImageIcon,
} from 'lucide-react'
import { QuoteCheckCard } from './QuoteCheckCard'
import { cn } from '@/lib/utils'
import { createLogger } from '@/lib/logger'
import { ImageUploadError, prepareQuoteImage } from '@/lib/client/image-resize'
const logger = createLogger('quote-intake')

export interface QuoteIntakeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: BudgetCategory
  guestCount?: number
  plan?: Plan
  onQuoteExtracted?: (quote: VendorQuote) => void
  onCommitQuote?: (quote: VendorQuote, tierId: string, adders: string[]) => void
}

const CATEGORIES: { id: BudgetCategory; label: string }[] = [
  { id: 'catering', label: 'Catering' },
  { id: 'venue', label: 'Venue' },
  { id: 'decor', label: 'Decor' },
  { id: 'photo_film', label: 'Photo & Film' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'favors', label: 'Favors' },
]

export function QuoteIntakeSheet({
  open,
  onOpenChange,
  category: initialCategory = 'catering',
  guestCount = 200,
  plan,
  onQuoteExtracted,
  onCommitQuote,
}: QuoteIntakeSheetProps) {
  const [category, setCategory] = useState<BudgetCategory>(initialCategory)
  const [rawText, setRawText] = useState('')
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined)
  const [imageFileName, setImageFileName] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [extractedQuote, setExtractedQuote] = useState<VendorQuote | null>(null)

  // Sync initial category when sheet opens
  useEffect(() => {
    if (open) {
      setCategory(initialCategory)
    }
  }, [open, initialCategory])

  const categoryName = CATEGORIES.find((c) => c.id === category)?.label || category

  const isInputValid = rawText.trim().length >= 10 || !!imageBase64

  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_QUOTES.find((s) => s.id === sampleId)
    if (!sample) return
    setCategory(sample.category)
    setRawText(sample.rawText)
    setImageBase64(undefined)
    setImageFileName(undefined)
    setErrorMessage(null)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMessage(null)
    try {
      setImageBase64(await prepareQuoteImage(file))
      setImageFileName(file.name)
    } catch (err) {
      setImageBase64(undefined)
      setImageFileName(undefined)
      setErrorMessage(err instanceof ImageUploadError ? err.message : 'Could not read that image.')
    }
    e.target.value = ''
  }

  const handleClearImage = () => {
    setImageBase64(undefined)
    setImageFileName(undefined)
  }

  const handleExtract = async () => {
    if (!isInputValid || isLoading) return

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/ai/quote-analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawText: rawText.trim() || 'Invoice attached in image.',
          imageBase64,
          category,
          guestCount,
        }),
      })

      const json = await response.json()

      if (!response.ok || !json.success) {
        throw new Error(
          typeof json.error === 'string' ? json.error : 'Quote extraction failed. Please try again.'
        )
      }

      const quote: VendorQuote = json.data.vendorQuote
      setExtractedQuote(quote)
      onQuoteExtracted?.(quote)
    } catch (err: any) {
      logger.error('[QuoteIntakeSheet] Extraction error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to extract vendor quote.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setExtractedQuote(null)
    setRawText('')
    setImageBase64(undefined)
    setImageFileName(undefined)
    setErrorMessage(null)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-warm-ivory border-l border-royal-plum/10 p-6 flex flex-col gap-6 overflow-y-auto text-royal-plum"
        data-testid="quote-intake-sheet"
      >
        <SheetHeader className="gap-2 text-left">
          <div className="flex items-center justify-between">
            <span className="font-devanagari text-xs text-royal-plum/60 tracking-wider">
              महफ़िल Quote Sandbox
            </span>
            {extractedQuote && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 text-xs font-semibold text-royal-plum/70 hover:text-royal-plum flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Check Another Quote</span>
              </Button>
            )}
          </div>

          <SheetTitle className="font-serif text-xl font-bold text-royal-plum">
            {extractedQuote
              ? `Quote Breakdown: ${extractedQuote.vendorName}`
              : `Check Vendor Quote: ${categoryName}`}
          </SheetTitle>

          <SheetDescription className="text-xs text-royal-plum/70 leading-relaxed bg-soft-ivory p-3 rounded-xl border border-royal-plum/8 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-marigold shrink-0 mt-0.5" />
            <span>
              Untrusted vendor quotes are safely quarantined with zero database access. Numbers are
              verified verbatim before touching your plan.
            </span>
          </SheetDescription>
        </SheetHeader>

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
            {/* Category Switcher */}
            <div className="flex flex-col gap-1.5">
              <span
                id="vendor-category-label"
                className="text-xs font-semibold text-royal-plum/80 uppercase tracking-wider font-mono"
              >
                Vendor Category
              </span>
              <div
                role="group"
                aria-labelledby="vendor-category-label"
                className="flex flex-wrap items-center gap-1.5"
              >
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                      category === cat.id
                        ? 'bg-marigold text-royal-plum border-royal-plum/30 font-semibold shadow-2xs'
                        : 'bg-white text-royal-plum/70 border-royal-plum/10 hover:border-royal-plum/25 hover:text-royal-plum'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 1-Click Realistic Starter Quotes (D-02) */}
            <div className="flex flex-col gap-2 bg-soft-ivory/80 p-3.5 rounded-2xl border border-royal-plum/8">
              <span className="text-xs font-semibold text-royal-plum/70">
                Try a realistic Indian celebration quote:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_QUOTES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample.id)}
                    className="p-2 text-left rounded-xl bg-white border border-royal-plum/10 hover:border-marigold hover:bg-marigold/10 transition-colors flex flex-col gap-0.5 text-xs text-royal-plum"
                  >
                    <span className="font-semibold truncate">{sample.name}</span>
                    <span className="text-3xs text-royal-plum/60 font-mono">
                      {sample.headlineRate}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dual Input Tabs: Raw Text Paste & Screenshot Dropzone */}
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid grid-cols-2 bg-soft-ivory border border-royal-plum/10 rounded-full p-1 h-10">
                <TabsTrigger
                  value="text"
                  className="rounded-full text-xs font-semibold data-[state=active]:bg-marigold data-[state=active]:text-royal-plum"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  <span>Raw Text Paste</span>
                </TabsTrigger>
                <TabsTrigger
                  value="dropzone"
                  className="rounded-full text-xs font-semibold data-[state=active]:bg-marigold data-[state=active]:text-royal-plum"
                >
                  <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                  <span>Screenshot / Dropzone</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Raw Text Paste */}
              <TabsContent value="text" className="mt-3 flex flex-col gap-2">
                <div className="relative">
                  <textarea
                    rows={7}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste a WhatsApp message, vendor email, or invoice breakdown here..."
                    className="w-full p-4 rounded-2xl bg-white border border-royal-plum/15 focus:border-royal-plum focus:ring-1 focus:ring-royal-plum text-sm text-royal-plum placeholder:text-royal-plum/40 font-normal resize-y min-h-[160px]"
                  />
                  {rawText && (
                    <button
                      type="button"
                      onClick={() => setRawText('')}
                      className="absolute top-3 right-3 text-2xs text-royal-plum/50 hover:text-royal-plum bg-soft-ivory px-2 py-0.5 rounded-full border border-royal-plum/10"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between text-2xs text-royal-plum/60 px-1 font-mono">
                  <span>Minimum 10 characters</span>
                  <span>{rawText.length} characters</span>
                </div>
              </TabsContent>

              {/* Tab 2: Screenshot / Dropzone */}
              <TabsContent value="dropzone" className="mt-3 flex flex-col gap-2">
                <label className="border-2 border-dashed border-royal-plum/15 hover:border-marigold rounded-2xl p-6 text-center bg-soft-ivory/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <UploadCloud className="w-8 h-8 text-royal-plum/50" />
                  <span className="text-xs font-semibold text-royal-plum">
                    Drop JPEG, PNG, or invoice screenshot here, or tap to browse
                  </span>
                  <span className="text-3xs text-royal-plum/50">
                    Supports estimates, WhatsApp screenshots &amp; PDF snapshots up to 10MB
                  </span>
                </label>

                {imageFileName && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-royal-plum/10 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <ImageIcon className="w-4 h-4 text-marigold shrink-0" />
                      <span className="font-medium truncate">{imageFileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="p-1 rounded-full hover:bg-royal-plum/5 text-royal-plum/60 hover:text-royal-plum"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <Button
              type="button"
              onClick={handleExtract}
              disabled={!isInputValid || isLoading}
              className="h-12 w-full rounded-full bg-marigold text-royal-plum font-semibold text-base shadow-md hover:scale-[1.01] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 border border-royal-plum/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-royal-plum" />
                  <span>Analyzing verbatim text &amp; unstated costs...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-royal-plum" />
                  <span>Extract Quote Breakdown</span>
                </>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
