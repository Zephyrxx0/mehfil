import React from 'react'
import type { QuoteDisplacementPreview } from '@/lib/engine/budget'
import { formatINR } from '@/lib/engine/currency'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_NAMES } from './quoteCategoryNames'

interface QuotePlanImpactPreviewProps {
  preview: QuoteDisplacementPreview
}

function PreviewMessage({ preview }: QuotePlanImpactPreviewProps) {
  if (preview.deltaPaise <= 0) {
    return (
      <span>
        <strong>Saved {formatINR(Math.abs(preview.deltaPaise))} vs allocation</strong> — Surplus
        added to Contingency buffer.
      </span>
    )
  }

  if (preview.wouldTriggerShortfall) {
    return (
      <span>
        <strong>Exceeds flexible donor capacity by {formatINR(preview.shortfallPaise)}</strong> —
        Permissive Shortfall active. 3 calculation remedies available.
      </span>
    )
  }

  return (
    <span>
      <strong>Requires +{formatINR(preview.deltaPaise)}</strong> — Funded by trimming flexible
      lines:{' '}
      {preview.displacedDonors
        .map((d) => `${CATEGORY_NAMES[d.category] || d.category} (-${formatINR(d.displacedPaise)})`)
        .join(', ')}
      . Protected Moment held firm.
    </span>
  )
}

/** Real-time bar showing how the selected tier and adders would shift the plan (D-09). */
export function QuotePlanImpactPreview({ preview }: QuotePlanImpactPreviewProps) {
  return (
    <div
      data-testid="live-plan-impact-preview"
      className={cn(
        'p-3.5 rounded-2xl border text-xs font-medium flex items-center gap-2.5',
        preview.deltaPaise <= 0
          ? 'bg-[#4A7C59]/10 border-[#4A7C59]/30 text-[#4A7C59]'
          : preview.wouldTriggerShortfall
            ? 'bg-amber-100/90 border-amber-300 text-amber-900'
            : 'bg-marigold/15 border-marigold/40 text-royal-plum'
      )}
    >
      <Sparkles className="w-4 h-4 shrink-0" />
      <div className="leading-snug">
        <PreviewMessage preview={preview} />
      </div>
    </div>
  )
}
