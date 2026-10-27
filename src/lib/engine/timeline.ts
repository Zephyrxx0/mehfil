import type {
  BudgetCategory,
  MilestoneBand,
  MilestoneBandId,
  TimelineSchedule,
  TimelineTask,
} from './types'

interface TaskTemplate {
  id: string
  title: string
  budgetCategory: BudgetCategory
  isCriticalPath: boolean
  criticalityRank: number // 1 = highest priority (venue), 2 = catering, 3 = photo, 4 = invites/favors, 5 = others
  notes?: string
}

interface BandTemplate {
  id: MilestoneBandId
  name: string
  baselineLeadDays: number
  tasks: TaskTemplate[]
}

const BAND_TEMPLATES: BandTemplate[] = [
  {
    id: 'milestone_t6m',
    name: 'Venue & Date Lock (T-6M)',
    baselineLeadDays: 180,
    tasks: [
      {
        id: 'task_venue_contract',
        title: 'Lock Venue & Date Contract',
        budgetCategory: 'venue',
        isCriticalPath: true,
        criticalityRank: 1,
        notes: 'Secures primary celebration date and staging slots.',
      },
      {
        id: 'task_photo_book',
        title: 'Book Lead Photographer & Cinematographer',
        budgetCategory: 'photo_film',
        isCriticalPath: false,
        criticalityRank: 3,
        notes: 'Top photo & film teams book 6+ months ahead for milestone dates.',
      },
    ],
  },
  {
    id: 'milestone_t3m',
    name: 'Catering & Core Vendors (T-3M)',
    baselineLeadDays: 90,
    tasks: [
      {
        id: 'task_catering_tasting',
        title: 'Catering Tasting & Menu Lock',
        budgetCategory: 'catering',
        isCriticalPath: true,
        criticalityRank: 2,
        notes: 'Approve live food counters, dietary nuances (Jain/Vegan), and dinner service format.',
      },
      {
        id: 'task_decor_concept',
        title: 'Finalize Decor & Floral Visuals',
        budgetCategory: 'decor',
        isCriticalPath: false,
        criticalityRank: 5,
        notes: 'Align color palette and mandap/stage mockups.',
      },
      {
        id: 'task_entertainment_permit',
        title: 'Book Music, DJ & Sound Permits',
        budgetCategory: 'entertainment',
        isCriticalPath: false,
        criticalityRank: 5,
        notes: 'Secure sound licenses for music past 10:00 PM if needed.',
      },
    ],
  },
  {
    id: 'milestone_t1m',
    name: 'Invites & Outfits (T-1M)',
    baselineLeadDays: 30,
    tasks: [
      {
        id: 'task_invites_dispatch',
        title: 'Dispatch Digital & Physical Invites',
        budgetCategory: 'favors',
        isCriticalPath: true,
        criticalityRank: 4,
        notes: 'Send RSVPs with itinerary links and Google Maps directions.',
      },
      {
        id: 'task_attire_fittings',
        title: 'Final Wardrobe & Attire Fittings',
        budgetCategory: 'misc',
        isCriticalPath: false,
        criticalityRank: 5,
        notes: 'Complete alterations for core family and hosts.',
      },
    ],
  },
  {
    id: 'milestone_t2w',
    name: 'Final Numbers & Logistics (T-2W)',
    baselineLeadDays: 14,
    tasks: [
      {
        id: 'task_headcount_lock',
        title: 'Lock Final Headcount with Caterer & Venue',
        budgetCategory: 'catering',
        isCriticalPath: true,
        criticalityRank: 2,
        notes: 'Submit verified plate guarantee with 5% buffer threshold.',
      },
      {
        id: 'task_cash_envelopes',
        title: 'Prepare Vendor Envelopes & Contingency Cash',
        budgetCategory: 'contingency',
        isCriticalPath: false,
        criticalityRank: 5,
        notes: 'Cash envelopes for tips, transport, and unexpected day-of runs.',
      },
    ],
  },
  {
    id: 'milestone_day0',
    name: 'Day-Of Execution & Celebration',
    baselineLeadDays: 0,
    tasks: [
      {
        id: 'task_venue_handover',
        title: 'Stage & Sound Check with Venue Manager',
        budgetCategory: 'venue',
        isCriticalPath: true,
        criticalityRank: 1,
        notes: 'Verify lighting, generator backup, and bridal green room access.',
      },
      {
        id: 'task_celebration_start',
        title: 'Celebration Kickoff & Guest Welcome',
        budgetCategory: 'entertainment',
        isCriticalPath: false,
        criticalityRank: 5,
        notes: 'Welcome drinks and welcome aarti / guest reception.',
      },
    ],
  },
]

/**
 * Pure UTC calendar arithmetic subtracting days from an ISO date string.
 */
function subtractDaysUTC(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const utcDate = new Date(Date.UTC(y, m - 1, d))
  const target = new Date(utcDate.getTime() - days * 86_400_000)
  return target.toISOString().slice(0, 10)
}

/**
 * Calculate backwards milestone timeline from event date with guest scale adjustments
 * and ADR-0005 Immediate Action sprint triage.
 *
 * @param eventDateStr - 'YYYY-MM-DD'
 * @param guestCount - total guests
 * @param todayStr - optional 'YYYY-MM-DD' anchor (defaults to current UTC date)
 */
export function calculateBackwardsTimeline(
  eventDateStr: string,
  guestCount: number,
  todayStr?: string
): TimelineSchedule {
  const today = todayStr || new Date().toISOString().slice(0, 10)

  // Compute lead day adjustments based on guest scale
  // >250 guests: add 30 days to T-6M (210d) and T-3M (120d)
  // <=80 guests: shorten T-6M to 120d (-60d) and T-3M to 60d (-30d)
  let t6mOffset = 180
  let t3mOffset = 90

  if (guestCount > 250) {
    t6mOffset = 210
    t3mOffset = 120
  } else if (guestCount <= 80) {
    t6mOffset = 120
    t3mOffset = 60
  }

  const offsetMap: Record<MilestoneBandId, number> = {
    milestone_immediate: 0,
    milestone_t6m: t6mOffset,
    milestone_t3m: t3mOffset,
    milestone_t1m: 30,
    milestone_t2w: 14,
    milestone_day0: 0,
  }

  const pastTasks: (TimelineTask & { criticalityRank: number })[] = []
  const futureBands: MilestoneBand[] = []

  let isCompressedMode = false

  for (const template of BAND_TEMPLATES) {
    const leadDays = offsetMap[template.id]
    const bandTargetDate = subtractDaysUTC(eventDateStr, leadDays)

    const remainingBandTasks: TimelineTask[] = []

    for (const t of template.tasks) {
      const taskTargetDate = bandTargetDate
      const task: TimelineTask = {
        id: t.id,
        title: t.title,
        budgetCategory: t.budgetCategory,
        leadDays,
        targetDate: taskTargetDate,
        isCompleted: false,
        isCriticalPath: t.isCriticalPath,
        notes: t.notes,
      }

      // Check if task date is in the past compared to today
      if (taskTargetDate < today && template.id !== 'milestone_day0') {
        isCompressedMode = true
        pastTasks.push({ ...task, criticalityRank: t.criticalityRank })
      } else {
        remainingBandTasks.push(task)
      }
    }

    if (remainingBandTasks.length > 0) {
      futureBands.push({
        id: template.id,
        name: template.name,
        targetDate: bandTargetDate,
        tasks: remainingBandTasks,
      })
    }
  }

  const resultBands: MilestoneBand[] = []

  // If past tasks exist, bundle them into Immediate Action (This Week) triage group (ADR-0005)
  if (pastTasks.length > 0) {
    // Sort strictly by topological criticality:
    // 1: Venue, 2: Catering, 3: Photo, 4: Invites, 5: Others
    pastTasks.sort((a, b) => a.criticalityRank - b.criticalityRank)

    resultBands.push({
      id: 'milestone_immediate',
      name: 'Immediate Action (This Week)',
      targetDate: today,
      isImmediateAction: true,
      tasks: pastTasks.map(({ criticalityRank: _, ...task }) => ({
        ...task,
        targetDate: today,
      })),
    })
  }

  resultBands.push(...futureBands)

  return {
    eventDate: eventDateStr,
    milestoneBands: resultBands,
    isCompressedMode,
  }
}

