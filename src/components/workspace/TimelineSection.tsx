'use client'

import React from 'react'
import type { Plan, TimelineSchedule } from '@/lib/engine/types'
import { MilestoneBand } from './MilestoneBand'
import { ICSExportButton } from './ICSExportButton'
import { CalendarDays, AlertTriangle } from 'lucide-react'

interface TimelineSectionProps {
  plan: Plan
  schedule: TimelineSchedule
}

export function TimelineSection({ plan, schedule }: TimelineSectionProps) {
  return (
    <div className="flex flex-col gap-6">
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

      {/* Compressed Mode Notice Banner */}
      {schedule.isCompressedMode && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Short-Notice Celebration Triage (ADR-0005):</span>{' '}
            Because your celebration date is within standard vendor lead times, past booking milestones have been
            triaged into the <strong>Immediate Action (This Week)</strong> sprint group, ordered strictly by critical
            path blockers.
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
