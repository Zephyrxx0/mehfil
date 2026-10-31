'use client'

import React from 'react'
import type { Plan, TimelineSchedule } from '@/lib/engine/types'
import { countCompletedTasks } from '@/lib/engine/timeline'
import { MilestoneBand } from './MilestoneBand'
import { SeasonalAdvisoryBanner } from './SeasonalAdvisoryBanner'
import { ICSExportButton } from './ICSExportButton'

export interface TimelineSectionProps {
  plan: Plan
  schedule: TimelineSchedule
}

export function TimelineSection({ plan, schedule }: TimelineSectionProps) {
  const { done, total } = countCompletedTasks(schedule)

  return (
    <div className="flex flex-col gap-8" data-testid="timeline-section">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 font-serif text-xl font-bold text-royal-plum">
            <span
              aria-hidden="true"
              className="h-4 w-1 shrink-0 origin-bottom rounded-full bg-gradient-to-b from-marigold to-gulabi-rose motion-safe:animate-[mehfil-flourish_0.5s_cubic-bezier(0.22,1,0.36,1)_both]"
            />
            <span>Backwards Milestone Roadmap</span>
          </h2>
          <p className="mt-0.5 text-sm text-royal-plum/70">
            Target dates scheduled backwards from celebration day ({plan.brief.eventDate})
          </p>
          {done > 0 && (
            <p
              className="mt-0.5 text-sm font-medium text-[#2E5A44]"
              data-testid="timeline-progress"
            >
              {done} of {total} tasks done
            </p>
          )}
        </div>
        <ICSExportButton plan={plan} schedule={schedule} />
      </div>

      {(plan.environmentalAnalysis?.detectedRisks.length ?? 0) > 0 || schedule.isCompressedMode ? (
        <div className="flex flex-col gap-4">
          <SeasonalAdvisoryBanner analysis={plan.environmentalAnalysis} />

          {schedule.isCompressedMode && (
            <aside
              data-testid="compressed-mode-banner"
              className="border-l-2 border-marigold bg-marigold/10 px-4 py-3 text-sm"
            >
              <p className="font-semibold text-royal-plum">
                Compressed Planning Mode &bull; Short-Notice Celebration Triage (ADR-0005)
              </p>
              <p className="mt-1 leading-relaxed text-royal-plum/80">
                Compressed Planning Mode: Immediate Action items for this week organized strictly by
                critical path blockers. Because your celebration is scheduled on short notice, past
                booking dates have been triaged into this week&apos;s sprint.
              </p>
            </aside>
          )}
        </div>
      ) : null}

      <ol className="flex flex-col gap-8">
        {schedule.milestoneBands.map((band) => (
          <MilestoneBand key={band.id} band={band} plan={plan} />
        ))}
      </ol>
    </div>
  )
}
