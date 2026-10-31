/**
 * Pipeline steps behind `calculateBackwardsTimeline`. Every step is a pure function of its
 * arguments; dates are computed in UTC only. Order of the pipeline:
 *
 *   resolveAnchors -> resolveEnvironment -> computeLeadTimes -> scheduleBands
 *     (buildStandardTask / buildIdeaTasks / partitionByLateness per band)
 *   -> buildImmediateBand (ADR-0005 triage) -> assembleSchedule
 */
import {
  BAND_TEMPLATES,
  getTargetBandIdForLeadDays,
  subtractDaysUTC,
  type BandTemplate,
  type TaskTemplate,
} from './timeline-templates'
import type {
  BudgetCategory,
  EnvironmentalAnalysis,
  EnvironmentalRiskId,
  IdeaDisplacementRecord,
  MilestoneBand,
  MilestoneBandId,
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

const MS_PER_DAY = 86_400_000
/** Fewer days than this between today and the event always means Compressed Mode (ADR-0005). */
const COMPRESSED_MODE_DAYS = 60
const DEFAULT_IDEA_LEAD_DAYS = 30
const LOWEST_PRIORITY_RANK = 5
const WINTER_SAYA_PHOTO_BUFFER_DAYS = 30

/** A task together with its ADR-0005 triage rank (1 = venue ... 5 = everything else). */
export interface RankedTask {
  task: TimelineTask
  criticalityRank: number
}

export interface TimelineAnchors {
  eventDate: string
  today: string
  daysUntilEvent: number
}

export interface TimelineEnvironment {
  winterSaya: boolean
  venueBufferDays: number
  photoBufferDays: number
  monsoon: boolean
  heat: boolean
  holiday: boolean
}

export interface TimelineContext extends TimelineAnchors {
  offsets: Record<MilestoneBandId, number>
  environment: TimelineEnvironment
  adoptedIdeas?: AdoptedIdeaTimelineInput[]
}

interface TaskEnvironmentFields {
  appliedBufferDays?: number
  environmentalRiskId?: EnvironmentalRiskId
  environmentalAdvisory?: string
}

function utcMillis(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** Step 1: pin down "today" and how many whole days remain until the event. */
export function resolveAnchors(eventDateStr: string, todayStr?: string): TimelineAnchors {
  const today = todayStr || new Date().toISOString().slice(0, 10)
  const daysUntilEvent = Math.round((utcMillis(eventDateStr) - utcMillis(today)) / MS_PER_DAY)
  return { eventDate: eventDateStr, today, daysUntilEvent }
}

/**
 * Peak Saya season buffers (TIME-02, TIME-03, D-11): winter adds its buffer to the venue and a
 * fixed 30 days to the photographer; summer only adds to the venue.
 */
function resolveSayaBuffers(analysis?: EnvironmentalAnalysis): {
  winterSaya: boolean
  venueBufferDays: number
  photoBufferDays: number
} {
  const risks = analysis?.detectedRisks ?? []
  const winter = risks.find((r) => r.id === 'peak_saya_winter')
  const summer = risks.find((r) => r.id === 'peak_saya_summer')

  if (winter?.leadTimeBufferDays) {
    return {
      winterSaya: true,
      venueBufferDays: winter.leadTimeBufferDays,
      photoBufferDays: WINTER_SAYA_PHOTO_BUFFER_DAYS,
    }
  }
  return {
    winterSaya: Boolean(winter),
    venueBufferDays: summer?.leadTimeBufferDays || 0,
    photoBufferDays: 0,
  }
}

/** Step 2: collapse the detected environmental risks into the flags the pipeline needs. */
export function resolveEnvironment(analysis?: EnvironmentalAnalysis): TimelineEnvironment {
  const has = (id: EnvironmentalRiskId) => analysis?.detectedRisks.some((r) => r.id === id) ?? false
  return {
    ...resolveSayaBuffers(analysis),
    monsoon: has('monsoon_outdoor'),
    heat: has('extreme_summer_heat'),
    holiday: has('holiday_clash'),
  }
}

/** T-6M and T-3M lead days by guest scale (TIME-01). */
function guestScaleOffsets(guestCount: number): { t6m: number; t3m: number } {
  if (guestCount > 250) return { t6m: 210, t3m: 120 }
  if (guestCount <= 80) return { t6m: 120, t3m: 60 }
  return { t6m: 180, t3m: 90 }
}

/** Step 3: lead days (before the event) for every milestone band. */
export function computeLeadTimes(
  guestCount: number,
  venueBufferDays: number
): Record<MilestoneBandId, number> {
  const { t6m, t3m } = guestScaleOffsets(guestCount)
  return {
    milestone_immediate: 0,
    milestone_t6m: t6m + venueBufferDays,
    milestone_t3m: t3m,
    milestone_t1m: 30,
    milestone_t2w: 14,
    milestone_day0: 0,
  }
}

/** Peak Saya annotations only ever apply to the venue and photo tasks of the T-6M band. */
function resolveSayaAnnotation(
  bandId: MilestoneBandId,
  category: BudgetCategory,
  env: TimelineEnvironment
): TaskEnvironmentFields | undefined {
  if (bandId !== 'milestone_t6m') return undefined

  if (category === 'venue' && env.venueBufferDays > 0) {
    return {
      appliedBufferDays: env.venueBufferDays,
      environmentalRiskId: env.winterSaya ? 'peak_saya_winter' : 'peak_saya_summer',
      environmentalAdvisory: env.winterSaya
        ? 'Peak Winter Saya season: venues book 7-8 months in advance.'
        : 'Peak Summer Saya season: air-conditioned banquets in high demand.',
    }
  }
  if (category === 'photo_film' && env.photoBufferDays > 0) {
    return {
      appliedBufferDays: env.photoBufferDays,
      environmentalRiskId: 'peak_saya_winter',
      environmentalAdvisory:
        'Peak Winter Saya season: top photo & cinema teams book 8+ months out.',
    }
  }
  return undefined
}

interface WeatherRule {
  flag: 'monsoon' | 'heat' | 'holiday'
  categories: BudgetCategory[]
  riskId: EnvironmentalRiskId
  advisory: string
}

/** First matching rule wins, so the order is the priority order. */
const WEATHER_RULES: WeatherRule[] = [
  {
    flag: 'monsoon',
    categories: ['decor', 'venue'],
    riskId: 'monsoon_outdoor',
    advisory: 'Monsoon season: secure waterproof shamiana and covered backup staging.',
  },
  {
    flag: 'heat',
    categories: ['catering', 'decor'],
    riskId: 'extreme_summer_heat',
    advisory:
      'Extreme summer heat: schedule ceremonies post-sunset and provide hydration counters.',
  },
  {
    flag: 'holiday',
    categories: ['entertainment'],
    riskId: 'holiday_clash',
    advisory: 'Holiday / dry day: sound limits past 10 PM and civic transport restrictions apply.',
  },
]

function resolveWeatherAnnotation(
  category: BudgetCategory,
  env: TimelineEnvironment
): TaskEnvironmentFields | undefined {
  const rule = WEATHER_RULES.find((r) => env[r.flag] && r.categories.includes(category))
  return rule && { environmentalRiskId: rule.riskId, environmentalAdvisory: rule.advisory }
}

/** Step 4: environmental annotation for one template task. Saya wins over weather. */
export function resolveTaskEnvironment(
  bandId: MilestoneBandId,
  category: BudgetCategory,
  env: TimelineEnvironment
): TaskEnvironmentFields {
  return (
    resolveSayaAnnotation(bandId, category, env) ?? resolveWeatherAnnotation(category, env) ?? {}
  )
}

/** Step 5: materialise one template task for its band. */
export function buildStandardTask(
  template: BandTemplate,
  t: TaskTemplate,
  ctx: Pick<TimelineContext, 'offsets' | 'environment'> & { bandTargetDate: string }
): RankedTask {
  const environment = resolveTaskEnvironment(template.id, t.budgetCategory, ctx.environment)
  const task: TimelineTask = {
    id: t.id,
    title: t.title,
    budgetCategory: t.budgetCategory,
    leadDays: ctx.offsets[template.id],
    targetDate: ctx.bandTargetDate,
    isCompleted: false,
    isCriticalPath: t.isCriticalPath,
    notes: t.notes,
    appliedBufferDays: environment.appliedBufferDays,
    environmentalRiskId: environment.environmentalRiskId,
    environmentalAdvisory: environment.environmentalAdvisory,
  }
  return { task, criticalityRank: t.criticalityRank }
}

function buildIdeaTask(
  idea: AdoptedIdeaTimelineInput,
  timelineTask: NonNullable<AdoptedIdeaTimelineInput['timelineTask']>,
  eventDate: string
): RankedTask {
  const leadDays = idea.leadDays ?? DEFAULT_IDEA_LEAD_DAYS
  return {
    criticalityRank: LOWEST_PRIORITY_RANK,
    task: {
      id: `task_idea_${idea.ideaId}`,
      title: timelineTask.title,
      budgetCategory: idea.targetCategory,
      leadDays,
      targetDate: subtractDaysUTC(eventDate, leadDays),
      isCompleted: false,
      isCriticalPath: false,
      notes: timelineTask.notes,
      originIdeaId: idea.ideaId,
    },
  }
}

/** Step 6: timeline tasks of adopted ideas that belong in the given band, in adoption order. */
export function buildIdeaTasks(
  bandId: MilestoneBandId,
  eventDate: string,
  adoptedIdeas: AdoptedIdeaTimelineInput[] = []
): RankedTask[] {
  return adoptedIdeas.flatMap((idea) => {
    const { timelineTask } = idea
    const leadDays = idea.leadDays ?? DEFAULT_IDEA_LEAD_DAYS
    if (!timelineTask || getTargetBandIdForLeadDays(leadDays) !== bandId) return []
    return [buildIdeaTask(idea, timelineTask, eventDate)]
  })
}

/** Step 7: a task is late when its date is before today. Day-of tasks are never late. */
export function isLateTask(targetDate: string, today: string, bandId: MilestoneBandId): boolean {
  return targetDate < today && bandId !== 'milestone_day0'
}

/** Step 8: split a band's tasks into late tasks (kept ranked for triage) and on-time tasks. */
export function partitionByLateness(
  candidates: RankedTask[],
  today: string,
  bandId: MilestoneBandId
): { late: RankedTask[]; onTime: TimelineTask[] } {
  const late: RankedTask[] = []
  const onTime: TimelineTask[] = []
  for (const candidate of candidates) {
    if (isLateTask(candidate.task.targetDate, today, bandId)) late.push(candidate)
    else onTime.push(candidate.task)
  }
  return { late, onTime }
}

function scheduleBand(
  template: BandTemplate,
  ctx: TimelineContext
): { late: RankedTask[]; band?: MilestoneBand } {
  const bandTargetDate = subtractDaysUTC(ctx.eventDate, ctx.offsets[template.id])
  const standard = template.tasks.map((t) =>
    buildStandardTask(template, t, { ...ctx, bandTargetDate })
  )
  const ideas = buildIdeaTasks(template.id, ctx.eventDate, ctx.adoptedIdeas)
  const { late, onTime } = partitionByLateness([...standard, ...ideas], ctx.today, template.id)

  if (onTime.length === 0) return { late }
  return {
    late,
    band: { id: template.id, name: template.name, targetDate: bandTargetDate, tasks: onTime },
  }
}

/** Step 9: walk every band template, collecting late tasks and the bands that still have work. */
export function scheduleBands(ctx: TimelineContext): {
  lateTasks: RankedTask[]
  futureBands: MilestoneBand[]
} {
  const lateTasks: RankedTask[] = []
  const futureBands: MilestoneBand[] = []
  for (const template of BAND_TEMPLATES) {
    const { late, band } = scheduleBand(template, ctx)
    lateTasks.push(...late)
    if (band) futureBands.push(band)
  }
  return { lateTasks, futureBands }
}

/**
 * Step 10 (ADR-0005): bundle late tasks into the "Immediate Action (This Week)" band, ordered by
 * criticality (1 venue, 2 catering, 3 photo, 4 invites, 5 others) and all dated today.
 */
export function buildImmediateBand(
  lateTasks: RankedTask[],
  today: string
): MilestoneBand | undefined {
  if (lateTasks.length === 0) return undefined
  const ordered = [...lateTasks].sort((a, b) => a.criticalityRank - b.criticalityRank)
  return {
    id: 'milestone_immediate',
    name: 'Immediate Action (This Week)',
    targetDate: today,
    isImmediateAction: true,
    tasks: ordered.map(({ task }) => ({ ...task, targetDate: today })),
  }
}

/** Compressed Mode applies to short-notice events or whenever any task is already late. */
export function isCompressedMode(daysUntilEvent: number, lateTaskCount: number): boolean {
  return daysUntilEvent < COMPRESSED_MODE_DAYS || lateTaskCount > 0
}

/** Step 11: final schedule, with the immediate triage band first. */
export function assembleSchedule(
  anchors: TimelineAnchors,
  lateTasks: RankedTask[],
  futureBands: MilestoneBand[]
): TimelineSchedule {
  const immediate = buildImmediateBand(lateTasks, anchors.today)
  return {
    eventDate: anchors.eventDate,
    milestoneBands: immediate ? [immediate, ...futureBands] : futureBands,
    isCompressedMode: isCompressedMode(anchors.daysUntilEvent, lateTasks.length),
  }
}
