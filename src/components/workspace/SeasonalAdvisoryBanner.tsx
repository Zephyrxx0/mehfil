'use client'

import React from 'react'
import type { EnvironmentalAnalysis } from '@/lib/engine/types'

export interface SeasonalAdvisoryBannerProps {
  analysis?: EnvironmentalAnalysis
}

export function SeasonalAdvisoryBanner({ analysis }: SeasonalAdvisoryBannerProps) {
  if (!analysis || analysis.detectedRisks.length === 0) {
    return null
  }

  return (
    <aside
      data-testid="seasonal-advisory-banner"
      className="border-l-2 border-marigold bg-marigold/10 px-4 py-3"
    >
      <p className="text-base font-semibold text-royal-plum">{analysis.seasonalSummaryTitle}</p>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-royal-plum/80">
        {analysis.seasonalSummaryText}
      </p>
      <ul className="mt-2 flex flex-col gap-0.5 text-sm text-royal-plum/80">
        {analysis.detectedRisks.map((risk) => (
          <li key={risk.id}>
            {risk.title}
            {risk.leadTimeBufferDays ? (
              <span className="text-royal-plum/70"> · +{risk.leadTimeBufferDays}d peak buffer</span>
            ) : null}
          </li>
        ))}
      </ul>
    </aside>
  )
}
