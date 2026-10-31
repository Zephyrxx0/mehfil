import {
  assembleSchedule,
  computeLeadTimes,
  resolveAnchors,
  resolveEnvironment,
  scheduleBands,
  type AdoptedIdeaTimelineInput,
} from './timeline-steps'
import type {
  BudgetCategory,
  EnvironmentalAnalysis,
  Plan,
  TimelineSchedule,
  TimelineTask,
} from './types'

export type { AdoptedIdeaTimelineInput }

/**
 * Calculate backwards milestone timeline from event date with guest scale adjustments,
 * environmental peak Saya season buffers (+30d/+15d), seasonal weather advisories,
 * adopted idea timeline task injections, and ADR-0005 Compressed Mode triage.
 *
 * The work is a pipeline of small pure steps (see timeline-steps.ts).
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
  const anchors = resolveAnchors(eventDateStr, todayStr)
  const environment = resolveEnvironment(environmentalAnalysis)
  const offsets = computeLeadTimes(guestCount, environment.venueBufferDays)
  const { lateTasks, futureBands } = scheduleBands({
    ...anchors,
    offsets,
    environment,
    adoptedIdeas,
  })
  return assembleSchedule(anchors, lateTasks, futureBands)
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
 * Apply `patch` to the primary booking task of `category` wherever it sits in the schedule.
 * Returns the schedule untouched for categories that have no primary task.
 */
function patchPrimaryBookingTask(
  schedule: TimelineSchedule,
  category: BudgetCategory,
  patch: Partial<TimelineTask>
): TimelineSchedule {
  const taskId = CATEGORY_PRIMARY_TASK_MAP[category]
  if (!taskId) return schedule

  const milestoneBands = schedule.milestoneBands.map((band) => ({
    ...band,
    tasks: band.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
  }))

  return {
    ...schedule,
    milestoneBands,
  }
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
  return patchPrimaryBookingTask(schedule, category, {
    isCompleted: true,
    originQuoteId: quoteId,
    completedAt,
  })
}

/**
 * Re-open the primary milestone booking task for a category when quote is unlocked (QUOTE-06, D-10).
 */
export function reopenPrimaryBookingTask(
  schedule: TimelineSchedule,
  category: BudgetCategory
): TimelineSchedule {
  return patchPrimaryBookingTask(schedule, category, {
    isCompleted: false,
    originQuoteId: undefined,
    completedAt: undefined,
  })
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

/** How far along the plan is: tasks marked done out of all tasks. */
export function countCompletedTasks(schedule: TimelineSchedule): { done: number; total: number } {
  const tasks = schedule.milestoneBands.flatMap((band) => band.tasks)
  return { done: tasks.filter((task) => task.isCompleted).length, total: tasks.length }
}

/**
 * The vendor a completed booking task was closed with, from the committed budget line.
 * Returns undefined for tasks that are not bookings or are not done.
 */
export function bookedVendorFor(task: TimelineTask, plan: Plan): string | undefined {
  if (!task.isCompleted || !task.originQuoteId) return undefined
  const line = plan.lines.find((l) => l.isCommitted && l.committedQuoteId === task.originQuoteId)
  if (line?.committedVendor) return line.committedVendor
  return plan.quotes?.find((q) => q.id === task.originQuoteId)?.vendorName
}
