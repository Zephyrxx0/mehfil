import { describe, it, expect } from 'vitest'
import {
  assembleSchedule,
  buildIdeaTasks,
  buildImmediateBand,
  buildStandardTask,
  computeLeadTimes,
  isCompressedMode,
  isLateTask,
  partitionByLateness,
  resolveAnchors,
  resolveEnvironment,
  resolveTaskEnvironment,
  scheduleBands,
  type AdoptedIdeaTimelineInput,
  type RankedTask,
  type TimelineEnvironment,
} from '@/lib/engine/timeline-steps'
import {
  BAND_TEMPLATES,
  getTargetBandIdForLeadDays,
  subtractDaysUTC,
} from '@/lib/engine/timeline-templates'
import type { EnvironmentalAnalysis, EnvironmentalRiskId, TimelineTask } from '@/lib/engine/types'

const NO_ENV: TimelineEnvironment = {
  winterSaya: false,
  venueBufferDays: 0,
  photoBufferDays: 0,
  monsoon: false,
  heat: false,
  holiday: false,
}

function analysis(...risks: [EnvironmentalRiskId, number?][]): EnvironmentalAnalysis {
  return {
    detectedRisks: risks.map(([id, leadTimeBufferDays]) => ({
      id,
      title: id,
      severity: 'advisory',
      description: '',
      affectedCategories: [],
      leadTimeBufferDays,
      recommendation: '',
    })),
    isPeakSayaSeason: false,
    hasWeatherHazards: false,
    hasHolidayClash: false,
    seasonalSummaryTitle: '',
    seasonalSummaryText: '',
  }
}

function task(id: string, targetDate: string): TimelineTask {
  return {
    id,
    title: id,
    budgetCategory: 'misc',
    leadDays: 0,
    targetDate,
    isCompleted: false,
    isCriticalPath: false,
  }
}

const idea = (ideaId: string, leadDays?: number, withTask = true): AdoptedIdeaTimelineInput =>
  ({
    ideaId,
    targetCategory: 'decor',
    leadDays,
    timelineTask: withTask ? { title: `Idea ${ideaId}`, notes: 'note' } : undefined,
  }) as AdoptedIdeaTimelineInput

describe('timeline templates helpers', () => {
  it('subtractDaysUTC crosses month and leap-year boundaries', () => {
    expect(subtractDaysUTC('2024-03-01', 1)).toBe('2024-02-29')
    expect(subtractDaysUTC('2026-10-15', 180)).toBe('2026-04-18')
  })

  it('maps idea lead days to band thresholds', () => {
    expect(getTargetBandIdForLeadDays(120)).toBe('milestone_t6m')
    expect(getTargetBandIdForLeadDays(119)).toBe('milestone_t3m')
    expect(getTargetBandIdForLeadDays(45)).toBe('milestone_t3m')
    expect(getTargetBandIdForLeadDays(20)).toBe('milestone_t1m')
    expect(getTargetBandIdForLeadDays(5)).toBe('milestone_t2w')
    expect(getTargetBandIdForLeadDays(4)).toBe('milestone_day0')
  })
})

describe('resolveAnchors', () => {
  it('computes whole days until the event in UTC', () => {
    expect(resolveAnchors('2026-04-15', '2026-03-01')).toEqual({
      eventDate: '2026-04-15',
      today: '2026-03-01',
      daysUntilEvent: 45,
    })
  })

  it('is negative for events in the past and defaults today to the current UTC date', () => {
    expect(resolveAnchors('2026-02-01', '2026-03-01').daysUntilEvent).toBe(-28)
    expect(resolveAnchors('2026-02-01').today).toBe(new Date().toISOString().slice(0, 10))
  })
})

describe('resolveEnvironment', () => {
  it('returns no flags without an analysis', () => {
    expect(resolveEnvironment(undefined)).toEqual(NO_ENV)
  })

  it('winter Saya buffers the venue by its own days and the photographer by 30', () => {
    expect(resolveEnvironment(analysis(['peak_saya_winter', 30]))).toMatchObject({
      winterSaya: true,
      venueBufferDays: 30,
      photoBufferDays: 30,
    })
  })

  it('summer Saya buffers only the venue', () => {
    expect(resolveEnvironment(analysis(['peak_saya_summer', 15]))).toMatchObject({
      winterSaya: false,
      venueBufferDays: 15,
      photoBufferDays: 0,
    })
  })

  it('a winter risk without buffer days does not buffer, but still labels a summer buffer as winter', () => {
    expect(
      resolveEnvironment(analysis(['peak_saya_winter'], ['peak_saya_summer', 15]))
    ).toMatchObject({ winterSaya: true, venueBufferDays: 15, photoBufferDays: 0 })
  })

  it('flags weather hazards', () => {
    expect(
      resolveEnvironment(analysis(['monsoon_outdoor'], ['extreme_summer_heat'], ['holiday_clash']))
    ).toMatchObject({ monsoon: true, heat: true, holiday: true })
  })
})

describe('computeLeadTimes', () => {
  it.each([
    [251, 210, 120],
    [250, 180, 90],
    [81, 180, 90],
    [80, 120, 60],
  ])('guest count %i gives T-6M %i and T-3M %i', (guests, t6m, t3m) => {
    const offsets = computeLeadTimes(guests, 0)
    expect(offsets.milestone_t6m).toBe(t6m)
    expect(offsets.milestone_t3m).toBe(t3m)
    expect(offsets.milestone_t1m).toBe(30)
    expect(offsets.milestone_t2w).toBe(14)
    expect(offsets.milestone_day0).toBe(0)
    expect(offsets.milestone_immediate).toBe(0)
  })

  it('adds the venue buffer to T-6M only', () => {
    const offsets = computeLeadTimes(150, 30)
    expect(offsets.milestone_t6m).toBe(210)
    expect(offsets.milestone_t3m).toBe(90)
  })
})

describe('resolveTaskEnvironment', () => {
  it('annotates winter Saya venue and photo tasks in T-6M', () => {
    const env = { ...NO_ENV, winterSaya: true, venueBufferDays: 30, photoBufferDays: 30 }
    expect(resolveTaskEnvironment('milestone_t6m', 'venue', env)).toMatchObject({
      appliedBufferDays: 30,
      environmentalRiskId: 'peak_saya_winter',
    })
    expect(resolveTaskEnvironment('milestone_t6m', 'photo_film', env)).toMatchObject({
      appliedBufferDays: 30,
      environmentalRiskId: 'peak_saya_winter',
    })
  })

  it('annotates summer Saya on the venue only', () => {
    const env = { ...NO_ENV, venueBufferDays: 15 }
    expect(resolveTaskEnvironment('milestone_t6m', 'venue', env).environmentalRiskId).toBe(
      'peak_saya_summer'
    )
    expect(resolveTaskEnvironment('milestone_t6m', 'photo_film', env)).toEqual({})
  })

  it('does not apply Saya annotations outside T-6M', () => {
    const env = { ...NO_ENV, winterSaya: true, venueBufferDays: 30, photoBufferDays: 30 }
    expect(resolveTaskEnvironment('milestone_day0', 'venue', env)).toEqual({})
  })

  it('weather rules apply in priority order and Saya wins over weather', () => {
    const weather = { ...NO_ENV, monsoon: true, heat: true, holiday: true }
    expect(resolveTaskEnvironment('milestone_t3m', 'decor', weather).environmentalRiskId).toBe(
      'monsoon_outdoor'
    )
    expect(resolveTaskEnvironment('milestone_t3m', 'catering', weather).environmentalRiskId).toBe(
      'extreme_summer_heat'
    )
    expect(
      resolveTaskEnvironment('milestone_t3m', 'entertainment', weather).environmentalRiskId
    ).toBe('holiday_clash')
    expect(resolveTaskEnvironment('milestone_t3m', 'misc', weather)).toEqual({})

    const both = { ...weather, venueBufferDays: 15 }
    expect(resolveTaskEnvironment('milestone_t6m', 'venue', both).environmentalRiskId).toBe(
      'peak_saya_summer'
    )
  })
})

describe('buildStandardTask', () => {
  it('builds a dated, uncompleted task from the template', () => {
    const template = BAND_TEMPLATES[0]
    const ranked = buildStandardTask(template, template.tasks[0], {
      offsets: computeLeadTimes(150, 0),
      environment: NO_ENV,
      bandTargetDate: '2026-04-18',
    })
    expect(ranked.criticalityRank).toBe(1)
    expect(ranked.task).toMatchObject({
      id: 'task_venue_contract',
      leadDays: 180,
      targetDate: '2026-04-18',
      isCompleted: false,
      isCriticalPath: true,
    })
  })
})

describe('buildIdeaTasks', () => {
  it('returns only ideas that map to the band, with rank 5 and the default 30 lead days', () => {
    const ideas = [idea('far', 200), idea('mid', 60), idea('default'), idea('no-task', 200, false)]
    const t6m = buildIdeaTasks('milestone_t6m', '2026-10-15', ideas)
    expect(t6m.map((r) => r.task.id)).toEqual(['task_idea_far'])
    expect(t6m[0].criticalityRank).toBe(5)
    expect(t6m[0].task).toMatchObject({ leadDays: 200, targetDate: '2026-03-29' })

    const t1m = buildIdeaTasks('milestone_t1m', '2026-10-15', ideas)
    expect(t1m[0].task).toMatchObject({
      id: 'task_idea_default',
      leadDays: 30,
      originIdeaId: 'default',
    })
  })

  it('returns nothing without adopted ideas', () => {
    expect(buildIdeaTasks('milestone_t6m', '2026-10-15')).toEqual([])
  })
})

describe('lateness detection', () => {
  it('flags dates before today but never day-of tasks', () => {
    expect(isLateTask('2026-02-28', '2026-03-01', 'milestone_t1m')).toBe(true)
    expect(isLateTask('2026-03-01', '2026-03-01', 'milestone_t1m')).toBe(false)
    expect(isLateTask('2026-02-28', '2026-03-01', 'milestone_day0')).toBe(false)
  })

  it('partitions candidates, preserving order', () => {
    const candidates: RankedTask[] = [
      { task: task('a', '2026-02-01'), criticalityRank: 2 },
      { task: task('b', '2026-04-01'), criticalityRank: 1 },
      { task: task('c', '2026-01-01'), criticalityRank: 5 },
    ]
    const { late, onTime } = partitionByLateness(candidates, '2026-03-01', 'milestone_t3m')
    expect(late.map((r) => r.task.id)).toEqual(['a', 'c'])
    expect(onTime.map((t) => t.id)).toEqual(['b'])
  })
})

describe('buildImmediateBand', () => {
  it('returns undefined when nothing is late', () => {
    expect(buildImmediateBand([], '2026-03-01')).toBeUndefined()
  })

  it('orders by criticality (stable), re-dates to today and drops the rank', () => {
    const late: RankedTask[] = [
      { task: task('other1', '2026-01-01'), criticalityRank: 5 },
      { task: task('catering', '2026-01-02'), criticalityRank: 2 },
      { task: task('other2', '2026-01-03'), criticalityRank: 5 },
      { task: task('venue', '2026-01-04'), criticalityRank: 1 },
    ]
    const band = buildImmediateBand(late, '2026-03-01')!
    expect(band).toMatchObject({
      id: 'milestone_immediate',
      isImmediateAction: true,
      targetDate: '2026-03-01',
    })
    expect(band.tasks.map((t) => t.id)).toEqual(['venue', 'catering', 'other1', 'other2'])
    expect(band.tasks.every((t) => t.targetDate === '2026-03-01')).toBe(true)
    expect(band.tasks[0]).not.toHaveProperty('criticalityRank')
    expect(late[0].task.id).toBe('other1') // input is not reordered
  })
})

describe('compressed mode and assembly', () => {
  it('is compressed under 60 days or when any task is late', () => {
    expect(isCompressedMode(59, 0)).toBe(true)
    expect(isCompressedMode(60, 0)).toBe(false)
    expect(isCompressedMode(200, 1)).toBe(true)
  })

  it('puts the immediate band first', () => {
    const anchors = resolveAnchors('2026-04-15', '2026-03-01')
    const ctx = {
      ...anchors,
      offsets: computeLeadTimes(150, 0),
      environment: NO_ENV,
    }
    const { lateTasks, futureBands } = scheduleBands(ctx)
    const schedule = assembleSchedule(anchors, lateTasks, futureBands)
    expect(schedule.isCompressedMode).toBe(true)
    expect(schedule.milestoneBands[0].id).toBe('milestone_immediate')
    expect(schedule.milestoneBands.slice(1)).toEqual(futureBands)
  })

  it('omits the immediate band when nothing is late', () => {
    const anchors = resolveAnchors('2026-10-15', '2026-03-01')
    const { lateTasks, futureBands } = scheduleBands({
      ...anchors,
      offsets: computeLeadTimes(150, 0),
      environment: NO_ENV,
    })
    const schedule = assembleSchedule(anchors, lateTasks, futureBands)
    expect(lateTasks).toEqual([])
    expect(schedule.isCompressedMode).toBe(false)
    expect(schedule.milestoneBands.map((b) => b.id)).toEqual([
      'milestone_t6m',
      'milestone_t3m',
      'milestone_t1m',
      'milestone_t2w',
      'milestone_day0',
    ])
  })
})
