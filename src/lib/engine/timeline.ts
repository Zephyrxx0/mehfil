import type {
  BudgetCategory,
  EnvironmentalAnalysis,
  EnvironmentalRiskId,
  IdeaDisplacementRecord,
  MilestoneBand,
  MilestoneBandId,
  Plan,
  TimelineSchedule,
  TimelineTask,
} from './types'

export type AdoptedIdeaTimelineInput = IdeaDisplacementRecord & {
  leadDays?: number
  timelineTask?: {
    title: string
    notes: string
  }
}

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
        notes:
          'Approve live food counters, dietary nuances (Jain/Vegan), and dinner service format.',
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
 * Map an adopted idea's leadDays to the most appropriate milestone band.
 */
function getTargetBandIdForLeadDays(leadDays: number): MilestoneBandId {
  if (leadDays >= 120) return 'milestone_t6m'
  if (leadDays >= 45) return 'milestone_t3m'
  if (leadDays >= 20) return 'milestone_t1m'
  if (leadDays >= 5) return 'milestone_t2w'
  return 'milestone_day0'
}

/**
 * Calculate backwards milestone timeline from event date with guest scale adjustments,
 * environmental peak Saya season buffers (+30d/+15d), seasonal weather advisories,
 * adopted idea timeline task injections, and ADR-0005 Compressed Mode triage.
 *
 * @param eventDateStr - 'YYYY-MM-DD'
 * @param guestCount - total guests
 * @param todayStr - optional 'YYYY-MM-DD' anchor (defaults to current UTC date)
 * @param environmentalAnalysis - optional environmental date risks and peak Saya flags
 * @param adoptedIdeas - optional list of adopted celebration enhancements to inject
 */
export function calculateBackwardsTimeline(
  eventDateStr: string,
  guestCount: number,
  todayStr?: string,
  environmentalAnalysis?: EnvironmentalAnalysis,
  adoptedIdeas?: AdoptedIdeaTimelineInput[]
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

  // Peak Saya season dynamic buffer expansion (TIME-02, TIME-03, D-11)
  let venueBufferDays = 0
  let photoBufferDays = 0
  const winterSayaRisk = environmentalAnalysis?.detectedRisks.find(
    (r) => r.id === 'peak_saya_winter'
  )
  const summerSayaRisk = environmentalAnalysis?.detectedRisks.find(
    (r) => r.id === 'peak_saya_summer'
  )

  if (winterSayaRisk?.leadTimeBufferDays) {
    venueBufferDays = winterSayaRisk.leadTimeBufferDays // +30d
    photoBufferDays = 30
    t6mOffset += venueBufferDays
  } else if (summerSayaRisk?.leadTimeBufferDays) {
    venueBufferDays = summerSayaRisk.leadTimeBufferDays // +15d
    t6mOffset += venueBufferDays
  }

  const monsoonRisk = environmentalAnalysis?.detectedRisks.find((r) => r.id === 'monsoon_outdoor')
  const heatRisk = environmentalAnalysis?.detectedRisks.find((r) => r.id === 'extreme_summer_heat')
  const holidayRisk = environmentalAnalysis?.detectedRisks.find((r) => r.id === 'holiday_clash')

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

  // Check days until event to evaluate short-notice / Compressed Mode
  const [ey, em, ed] = eventDateStr.split('-').map(Number)
  const [ty, tm, td] = today.split('-').map(Number)
  const daysUntilEvent = Math.round(
    (Date.UTC(ey, em - 1, ed) - Date.UTC(ty, tm - 1, td)) / 86_400_000
  )

  for (const template of BAND_TEMPLATES) {
    const leadDays = offsetMap[template.id]
    const bandTargetDate = subtractDaysUTC(eventDateStr, leadDays)

    const remainingBandTasks: TimelineTask[] = []

    // 1. Process standard tasks for this band
    for (const t of template.tasks) {
      const taskTargetDate = bandTargetDate
      let appliedBufferDays: number | undefined
      let environmentalRiskId: EnvironmentalRiskId | undefined
      let environmentalAdvisory: string | undefined

      // Annotate peak Saya season buffers on T-6M tasks
      if (template.id === 'milestone_t6m' && t.budgetCategory === 'venue' && venueBufferDays > 0) {
        appliedBufferDays = venueBufferDays
        environmentalRiskId = winterSayaRisk ? 'peak_saya_winter' : 'peak_saya_summer'
        environmentalAdvisory = winterSayaRisk
          ? 'Peak Winter Saya season: venues book 7-8 months in advance.'
          : 'Peak Summer Saya season: air-conditioned banquets in high demand.'
      } else if (
        template.id === 'milestone_t6m' &&
        t.budgetCategory === 'photo_film' &&
        photoBufferDays > 0
      ) {
        appliedBufferDays = photoBufferDays
        environmentalRiskId = 'peak_saya_winter'
        environmentalAdvisory =
          'Peak Winter Saya season: top photo & cinema teams book 8+ months out.'
      }

      // Annotate seasonal weather hazards
      if (
        monsoonRisk &&
        (t.budgetCategory === 'decor' || t.budgetCategory === 'venue') &&
        !environmentalRiskId
      ) {
        environmentalRiskId = 'monsoon_outdoor'
        environmentalAdvisory =
          'Monsoon season: secure waterproof shamiana and covered backup staging.'
      } else if (
        heatRisk &&
        (t.budgetCategory === 'catering' || t.budgetCategory === 'decor') &&
        !environmentalRiskId
      ) {
        environmentalRiskId = 'extreme_summer_heat'
        environmentalAdvisory =
          'Extreme summer heat: schedule ceremonies post-sunset and provide hydration counters.'
      } else if (holidayRisk && t.budgetCategory === 'entertainment' && !environmentalRiskId) {
        environmentalRiskId = 'holiday_clash'
        environmentalAdvisory =
          'Holiday / dry day: sound limits past 10 PM and civic transport restrictions apply.'
      }

      const task: TimelineTask = {
        id: t.id,
        title: t.title,
        budgetCategory: t.budgetCategory,
        leadDays,
        targetDate: taskTargetDate,
        isCompleted: false,
        isCriticalPath: t.isCriticalPath,
        notes: t.notes,
        appliedBufferDays,
        environmentalRiskId,
        environmentalAdvisory,
      }

      // Check if task date is in the past compared to today
      if (taskTargetDate < today && template.id !== 'milestone_day0') {
        pastTasks.push({ ...task, criticalityRank: t.criticalityRank })
      } else {
        remainingBandTasks.push(task)
      }
    }

    // 2. Inject adopted idea timeline tasks mapped to this band
    if (adoptedIdeas && adoptedIdeas.length > 0) {
      for (const idea of adoptedIdeas) {
        if (!idea.timelineTask) continue
        const ideaLeadDays = idea.leadDays ?? 30
        const targetBandId = getTargetBandIdForLeadDays(ideaLeadDays)

        if (targetBandId === template.id) {
          const ideaTaskTargetDate = subtractDaysUTC(eventDateStr, ideaLeadDays)
          const ideaTask: TimelineTask = {
            id: `task_idea_${idea.ideaId}`,
            title: idea.timelineTask.title,
            budgetCategory: idea.targetCategory,
            leadDays: ideaLeadDays,
            targetDate: ideaTaskTargetDate,
            isCompleted: false,
            isCriticalPath: false,
            notes: idea.timelineTask.notes,
            originIdeaId: idea.ideaId,
          }

          if (ideaTaskTargetDate < today && template.id !== 'milestone_day0') {
            pastTasks.push({ ...ideaTask, criticalityRank: 5 })
          } else {
            remainingBandTasks.push(ideaTask)
          }
        }
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

  const isCompressedMode = daysUntilEvent < 60 || pastTasks.length > 0
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

export const CATEGORY_PRIMARY_TASK_MAP: Record<BudgetCategory, string> = {
  venue: 'task_venue_contract',
  catering: 'task_catering_tasting',
  photo_film: 'task_photo_book',
  decor: 'task_decor_concept',
  entertainment: 'task_entertainment_permit',
  favors: 'task_invites_dispatch',
  misc: '',
  contingency: '',
}

/**
 * Complete the primary milestone booking task for a category upon vendor quote commitment (QUOTE-06, D-11).
 */
export function completePrimaryBookingTask(
  schedule: TimelineSchedule,
  category: BudgetCategory,
  quoteId: string,
  completedAt: string = new Date().toISOString()
): TimelineSchedule {
  const taskId = CATEGORY_PRIMARY_TASK_MAP[category]
  if (!taskId) return schedule

  const milestoneBands = schedule.milestoneBands.map((band) => ({
    ...band,
    tasks: band.tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          isCompleted: true,
          originQuoteId: quoteId,
          completedAt,
        }
      }
      return task
    }),
  }))

  return {
    ...schedule,
    milestoneBands,
  }
}

/**
 * Re-open the primary milestone booking task for a category when quote is unlocked (QUOTE-06, D-10).
 */
export function reopenPrimaryBookingTask(
  schedule: TimelineSchedule,
  category: BudgetCategory
): TimelineSchedule {
  const taskId = CATEGORY_PRIMARY_TASK_MAP[category]
  if (!taskId) return schedule

  const milestoneBands = schedule.milestoneBands.map((band) => ({
    ...band,
    tasks: band.tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          isCompleted: false,
          originQuoteId: undefined,
          completedAt: undefined,
        }
      }
      return task
    }),
  }))

  return {
    ...schedule,
    milestoneBands,
  }
}

/**
 * Marks the primary booking task of every committed budget line as done. The schedule is
 * derived from the plan, so a committed vendor shows as booked after a reload or on another
 * device, instead of depending on a click that happened in one browser tab.
 */
export function applyCommittedBookings(schedule: TimelineSchedule, plan: Plan): TimelineSchedule {
  return plan.lines.reduce(
    (current, line) =>
      line.isCommitted && line.committedQuoteId
        ? completePrimaryBookingTask(
            current,
            line.category,
            line.committedQuoteId,
            line.committedAt
          )
        : current,
    schedule
  )
}
