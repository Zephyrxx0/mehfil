import React from 'react'
import { AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuoteExtractActionProps {
  errorMessage: string | null
  isLoading: boolean
  disabled: boolean
  onExtract: () => void
}

/** Inline error message followed by the primary "extract" button. */
export function QuoteExtractAction({
  errorMessage,
  isLoading,
  disabled,
  onExtract,
}: QuoteExtractActionProps) {
  return (
    <>
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Button
        type="button"
        onClick={onExtract}
        disabled={disabled}
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
    </>
  )
}
