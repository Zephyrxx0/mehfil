import * as React from 'react'
import type { SanitizedSharedPlan } from '@/lib/engine/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, CalendarPlus } from 'lucide-react'
import { formatMilestoneDate } from './share-view-format'

type PublicMilestone = SanitizedSharedPlan['publicMilestones'][number]

export interface ShareCeremonyTimelineProps {
  milestones: PublicMilestone[]
  onExportICS: () => void
}

function MilestoneRow({ milestone, position }: { milestone: PublicMilestone; position: number }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl border border-royal-plum/8 bg-warm-ivory/40">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-marigold/20 text-royal-plum font-serif font-bold text-sm">
        {position}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-royal-plum">{milestone.title}</h3>
          {milestone.isCeremony && (
            <Badge variant="secondary" className="text-2xs">
              Ceremony
            </Badge>
          )}
        </div>
        <p className="text-xs text-royal-plum/70 mt-1 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatMilestoneDate(milestone.targetDate)}</span>
          {milestone.leadDays > 0 && <span>• T-{milestone.leadDays} days</span>}
        </p>
      </div>
    </div>
  )
}

/** Ceremony Timeline & Guest Calendar Export */
export function ShareCeremonyTimeline({ milestones, onExportICS }: ShareCeremonyTimelineProps) {
  return (
    <section
      aria-labelledby="ceremonies-timeline-heading"
      className="rounded-3xl border border-royal-plum/10 bg-white/70 p-6 sm:p-8 space-y-6 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-royal-plum/8 pb-4">
        <div>
          <h2
            id="ceremonies-timeline-heading"
            className="font-serif text-xl font-bold text-royal-plum"
          >
            Ceremony Milestones
          </h2>
          <p className="text-xs text-royal-plum/70 mt-0.5">
            Public celebration schedule for honored guests and family
          </p>
        </div>

        <Button
          type="button"
          onClick={onExportICS}
          className="bg-royal-plum text-warm-ivory hover:bg-royal-plum/90 gap-2 text-xs font-semibold self-start sm:self-center"
        >
          <CalendarPlus className="h-4 w-4 text-marigold" aria-hidden="true" />
          <span>Add Ceremonies to Calendar (.ics)</span>
        </Button>
      </div>

      {milestones.length > 0 ? (
        <div className="space-y-4">
          {milestones.map((milestone, idx) => (
            <MilestoneRow key={milestone.id} milestone={milestone} position={idx + 1} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-royal-plum/70 py-4 text-center">
          Ceremonies will be published as celebration details are finalized.
        </p>
      )}
    </section>
  )
}
