'use client'

import React from 'react'
import type { Plan, TimelineSchedule } from '@/lib/engine/types'
import { MilestoneBand } from './MilestoneBand'
import { SeasonalAdvisoryBanner } from './SeasonalAdvisoryBanner'
import { ICSExportButton } from './ICSExportButton'
import { CalendarDays, Clock } from 'lucide-react'

export interface TimelineSectionProps {
  plan: Plan
  schedule: TimelineSchedule
}

export function TimelineSection({ plan, schedule }: TimelineSectionProps) {
  return (
    <div className="flex flex-col gap-6" data-testid="timeline-section">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-royal-plum/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-marigold" />
            <h3 className="font-serif font-bold text-xl text-royal-plum">
              Backwards Milestone Roadmap
            </h3>
          </div>
          <p className="text-xs text-royal-plum/60 mt-0.5">
            Target dates scheduled backwards from celebration day ({plan.brief.eventDate})
          </p>
        </div>

        {/* ICS Export Action */}
        <ICSExportButton plan={plan} schedule={schedule} />
      </div>

      {/* Ambient Seasonal Advisory Banner atop Timeline (D-09, TIME-02) */}
      <SeasonalAdvisoryBanner analysis={plan.environmentalAnalysis} />

      {/* Calm Compressed Planning Mode Banner (ADR-0005, D-12) */}
      {schedule.isCompressedMode && (
        <div
          data-testid="compressed-mode-banner"
          className="rounded-xl border border-marigold/60 bg-marigold/10 p-4 text-xs text-royal-plum flex items-start gap-3 shadow-2xs"
        >
          <div className="rounded-full bg-marigold/30 p-1.5 text-royal-plum mt-0.5 shrink-0">
            <Clock className="w-4 h-4 text-royal-plum" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-serif font-bold text-sm text-royal-plum">
              Compressed Planning Mode &bull; Short-Notice Celebration Triage (ADR-0005)
            </span>
            <p className="text-xs text-royal-plum/80 leading-relaxed">
              Compressed Planning Mode: Immediate Action items for this week organized strictly by critical path blockers.
              Because your celebration is scheduled on short notice, past booking dates have been triaged into this week&apos;s sprint.
            </p>
          </div>
        </div>
      )}

      {/* Milestone Bands */}
      <div className="flex flex-col gap-4">
        {schedule.milestoneBands.map((band) => (
          <MilestoneBand key={band.id} band={band} />
        ))}
      </div>
    </div>
  )
}
