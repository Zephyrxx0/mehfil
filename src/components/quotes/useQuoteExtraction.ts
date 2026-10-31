'use client'

import { useEffect, useState } from 'react'
import type React from 'react'
import type { BudgetCategory, VendorQuote } from '@/lib/engine/types'
import { SAMPLE_QUOTES } from '@/data/sample-quotes'
import { createLogger } from '@/lib/logger'
import { ImageUploadError, prepareQuoteImage } from '@/lib/client/image-resize'

const logger = createLogger('quote-intake')

interface QuoteExtractionRequest {
  rawText: string
  imageBase64?: string
  category: BudgetCategory
  guestCount: number
}

/** Posts the quote to the analyst route and returns the extracted quote, or throws a readable error. */
async function requestVendorQuote({
  rawText,
  imageBase64,
  category,
  guestCount,
}: QuoteExtractionRequest): Promise<VendorQuote> {
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

  return json.data.vendorQuote
}

interface UseQuoteExtractionOptions {
  open: boolean
  initialCategory: BudgetCategory
  guestCount: number
  onQuoteExtracted?: (quote: VendorQuote) => void
}

/**
 * Input and request state for the quote intake sheet: category, pasted text or screenshot, the
 * extraction call, and the extracted quote. The analyst route returns the figures; this hook only
 * passes them along.
 */
export function useQuoteExtraction({
  open,
  initialCategory,
  guestCount,
  onQuoteExtracted,
}: UseQuoteExtractionOptions) {
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

  const isInputValid = rawText.trim().length >= 10 || !!imageBase64

  const selectSample = (sampleId: string) => {
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

  const clearImage = () => {
    setImageBase64(undefined)
    setImageFileName(undefined)
  }

  const extract = async () => {
    if (!isInputValid || isLoading) return

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const quote = await requestVendorQuote({ rawText, imageBase64, category, guestCount })
      setExtractedQuote(quote)
      onQuoteExtracted?.(quote)
    } catch (err) {
      logger.error('[QuoteIntakeSheet] Extraction error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to extract vendor quote.')
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setExtractedQuote(null)
    setRawText('')
    setImageBase64(undefined)
    setImageFileName(undefined)
    setErrorMessage(null)
  }

  return {
    category,
    setCategory,
    rawText,
    setRawText,
    imageFileName,
    isInputValid,
    isLoading,
    errorMessage,
    extractedQuote,
    selectSample,
    handleFileChange,
    clearImage,
    extract,
    reset,
  }
}
