import { describe, it, expect } from 'vitest'
import { calculateBackwardsTimeline } from '@/lib/engine/timeline'

describe('calculateBackwardsTimeline', () => {
  const futureEventDate = '2026-10-15' // ~180+ days away
  const anchorToday = '2026-03-01'

  it('standard 6-month timeline computes milestone dates backwards from event date', () => {
    const schedule = calculateBackwardsTimeline(futureEventDate, 150, anchorToday)

    expect(schedule.eventDate).toBe(futureEventDate)
    expect(schedule.isCompressedMode).toBe(false)

    const bandIds = schedule.milestoneBands.map(b => b.id)
    expect(bandIds).toContain('milestone_t6m')
    expect(bandIds).toContain('milestone_t3m')
    expect(bandIds).toContain('milestone_t1m')
    expect(bandIds).toContain('milestone_t2w')
    expect(bandIds).toContain('milestone_day0')

    const t6m = schedule.milestoneBands.find(b => b.id === 'milestone_t6m')!
    // 2026-10-15 minus 180 days:
    // Oct 15 -> Apr 18 (2026 is non-leap)
    expect(t6m.targetDate).toBe('2026-04-18')

    const day0 = schedule.milestoneBands.find(b => b.id === 'milestone_day0')!
    expect(day0.targetDate).toBe(futureEventDate)
  })

  it('large gathering (>250 guests) extends lead times for venue and catering (TIME-01)', () => {
    const standardSchedule = calculateBackwardsTimeline(futureEventDate, 150, anchorToday)
    const largeSchedule = calculateBackwardsTimeline(futureEventDate, 350, anchorToday)

    const standardT6m = standardSchedule.milestoneBands.find(b => b.id === 'milestone_t6m')!
    const largeT6m = largeSchedule.milestoneBands.find(b => b.id === 'milestone_t6m')!

    // Large gathering t6m is 210 days instead of 180 (earlier date)
    expect(largeT6m.targetDate < standardT6m.targetDate).toBe(true)

    const standardT3m = standardSchedule.milestoneBands.find(b => b.id === 'milestone_t3m')!
    const largeT3m = largeSchedule.milestoneBands.find(b => b.id === 'milestone_t3m')!
    expect(largeT3m.targetDate < standardT3m.targetDate).toBe(true)
  })

  it('intimate event (<=80 guests) shortens lead times', () => {
    const standardSchedule = calculateBackwardsTimeline(futureEventDate, 150, anchorToday)
    const intimateSchedule = calculateBackwardsTimeline(futureEventDate, 60, anchorToday)

    const standardT6m = standardSchedule.milestoneBands.find(b => b.id === 'milestone_t6m')!
    const intimateT6m = intimateSchedule.milestoneBands.find(b => b.id === 'milestone_t6m')!

    // Intimate event t6m is 120 days instead of 180 (later date)
    expect(intimateT6m.targetDate > standardT6m.targetDate).toBe(true)
  })

  it('short-notice event triggers Compressed Mode and triages past tasks into Immediate Action (D-14, ADR-0005)', () => {
    // Event is only 45 days away!
    const shortNoticeDate = '2026-04-15'
    const schedule = calculateBackwardsTimeline(shortNoticeDate, 150, anchorToday)

    expect(schedule.isCompressedMode).toBe(true)
    const firstBand = schedule.milestoneBands[0]
    expect(firstBand.id).toBe('milestone_immediate')
    expect(firstBand.isImmediateAction).toBe(true)
    expect(firstBand.targetDate).toBe(anchorToday)

    // Triage tasks are sorted by topological criticality: Venue first, Catering second, Photo third
    const immediateTaskCategories = firstBand.tasks.map(t => t.budgetCategory)
    expect(immediateTaskCategories[0]).toBe('venue')
    expect(immediateTaskCategories).toContain('catering')
    expect(immediateTaskCategories).toContain('photo_film')
  })

  it('all milestone tasks carry valid budgetCategory identifiers (D-16)', () => {
    const schedule = calculateBackwardsTimeline(futureEventDate, 150, anchorToday)
    const validCategories = [
      'venue',
      'catering',
      'decor',
      'photo_film',
      'entertainment',
      'favors',
      'misc',
      'contingency',
    ]

    for (const band of schedule.milestoneBands) {
      for (const task of band.tasks) {
        expect(validCategories).toContain(task.budgetCategory)
        expect(task.title.length).toBeGreaterThan(0)
      }
    }
  })
})

