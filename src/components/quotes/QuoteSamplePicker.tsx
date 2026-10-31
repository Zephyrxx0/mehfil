import React from 'react'
import { SAMPLE_QUOTES } from '@/data/sample-quotes'

interface QuoteSamplePickerProps {
  onSelect: (sampleId: string) => void
}

/** One-click realistic starter quotes (D-02). */
export function QuoteSamplePicker({ onSelect }: QuoteSamplePickerProps) {
  return (
    <div className="flex flex-col gap-2 bg-soft-ivory/80 p-3.5 rounded-2xl border border-royal-plum/8">
      <span className="text-xs font-semibold text-royal-plum/70">
        Try a realistic Indian celebration quote:
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SAMPLE_QUOTES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => onSelect(sample.id)}
            className="p-2 text-left rounded-xl bg-white border border-royal-plum/10 hover:border-marigold hover:bg-marigold/10 transition-colors flex flex-col gap-0.5 text-xs text-royal-plum"
          >
            <span className="font-semibold truncate">{sample.name}</span>
            <span className="text-3xs text-royal-plum/70 font-mono">{sample.headlineRate}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
