'use client'

import React from 'react'
import type { EnvironmentalAnalysis } from '@/lib/engine/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Calendar, CloudRain, Sun, Flame, AlertCircle } from 'lucide-react'

export interface SeasonalAdvisoryBannerProps {
  analysis?: EnvironmentalAnalysis
}

export function SeasonalAdvisoryBanner({ analysis }: SeasonalAdvisoryBannerProps) {
  if (!analysis || analysis.detectedRisks.length === 0) {
    return null
  }

  const getRiskIcon = (riskId: string) => {
    switch (riskId) {
      case 'peak_saya_winter':
      case 'peak_saya_summer':
        return <Sparkles className="w-3.5 h-3.5 text-marigold" />
      case 'monsoon_outdoor':
        return <CloudRain className="w-3.5 h-3.5 text-blue-600" />
      case 'extreme_summer_heat':
        return <Flame className="w-3.5 h-3.5 text-amber-600" />
      case 'holiday_clash':
        return <Calendar className="w-3.5 h-3.5 text-purple-600" />
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-royal-plum/60" />
    }
  }

  return (
    <Card
      data-testid="seasonal-advisory-banner"
      className="border-marigold/40 bg-warm-ivory/95 text-royal-plum shadow-xs transition-all overflow-hidden"
    >
      <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
        {/* Banner Title & Summary */}
        <div className="flex items-start gap-2.5">
          <div className="rounded-full bg-marigold/20 p-2 text-royal-plum mt-0.5 shrink-0">
            <Sparkles className="w-4 h-4 text-royal-plum" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-serif font-bold text-base text-royal-plum">
                {analysis.seasonalSummaryTitle}
              </h4>
              <Badge
                variant="outline"
                className="bg-marigold/15 border-marigold/50 text-royal-plum text-2xs font-semibold"
              >
                Calendar Intelligence
              </Badge>
            </div>
            <p className="text-xs text-royal-plum/80 leading-relaxed max-w-2xl">
              {analysis.seasonalSummaryText}
            </p>
          </div>
        </div>

        {/* Individual Risk Advisories & Lead Buffers */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-royal-plum/8">
          {analysis.detectedRisks.map((risk) => (
            <div
              key={risk.id}
              className="flex items-center gap-1.5 rounded-lg border border-royal-plum/15 bg-white/70 px-2.5 py-1 text-xs text-royal-plum/90 shadow-2xs"
            >
              {getRiskIcon(risk.id)}
              <span className="font-semibold text-2xs">{risk.title}</span>

              {risk.leadTimeBufferDays && (
                <Badge
                  variant="outline"
                  className="bg-marigold/25 text-royal-plum border-marigold/60 text-3xs font-bold px-1.5 py-0"
                >
                  +{risk.leadTimeBufferDays}d peak buffer
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
