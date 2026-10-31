import { describe, expect, it } from 'vitest'
import {
  computeDaysRemaining,
  formatEventDate,
  formatMilestoneDate,
} from '@/app/share/[token]/share-view-format'

/**
 * `now` is built from local calendar components, so these hold in whatever timezone the test
 * process runs in. The old code read the event date as UTC midnight, which is off by one for
 * anyone east of UTC (India at 00:30 local saw 20 instead of 19 days).
 */
describe('computeDaysRemaining', () => {
  it('counts 19 days at 00:30 local on 1 Nov for a 20 Nov event', () => {
    expect(computeDaysRemaining('2026-11-20', new Date(2026, 10, 1, 0, 30))).toBe(19)
  })

  it('counts 19 days at 23:30 local on 1 Nov for a 20 Nov event', () => {
    expect(computeDaysRemaining('2026-11-20', new Date(2026, 10, 1, 23, 30))).toBe(19)
  })

  it('gives 0 on the day of the event, at any time of day', () => {
    expect(computeDaysRemaining('2026-11-20', new Date(2026, 10, 20, 0, 0))).toBe(0)
    expect(computeDaysRemaining('2026-11-20', new Date(2026, 10, 20, 12, 0))).toBe(0)
    expect(computeDaysRemaining('2026-11-20', new Date(2026, 10, 20, 23, 59))).toBe(0)
  })

  it('gives -1 the day after the event', () => {
    expect(computeDaysRemaining('2026-11-20', new Date(2026, 10, 21, 0, 30))).toBe(-1)
    expect(computeDaysRemaining('2026-11-20', new Date(2026, 10, 21, 23, 30))).toBe(-1)
  })

  it('gives 1 the day before the event', () => {
    expect(computeDaysRemaining('2026-11-20', new Date(2026, 10, 19, 23, 59))).toBe(1)
  })

  it('counts whole calendar days across month and year boundaries', () => {
    expect(computeDaysRemaining('2027-01-01', new Date(2026, 11, 31, 18, 0))).toBe(1)
    expect(computeDaysRemaining('2027-03-01', new Date(2027, 1, 28, 9, 0))).toBe(1)
    expect(computeDaysRemaining('2028-03-01', new Date(2028, 1, 28, 9, 0))).toBe(2)
  })

  it('counts whole days across daylight-saving changes (23h and 25h days)', () => {
    // Europe/US shift in March and November; in zones without DST these are plain days.
    expect(computeDaysRemaining('2026-03-30', new Date(2026, 2, 1, 12, 0))).toBe(29)
    expect(computeDaysRemaining('2026-11-30', new Date(2026, 9, 1, 12, 0))).toBe(60)
  })
})

describe('formatMilestoneDate', () => {
  it('shows an ISO date as a short month, with the same calendar day', () => {
    expect(formatMilestoneDate('2026-10-31')).toBe('Oct 31, 2026')
    expect(formatMilestoneDate('2026-01-01')).toBe('Jan 1, 2026')
    expect(formatMilestoneDate('2026-12-31')).toBe('Dec 31, 2026')
  })

  it('uses the same calendar day as the header format', () => {
    expect(formatEventDate('2026-11-20')).toBe('November 20, 2026')
    expect(formatMilestoneDate('2026-11-20')).toBe('Nov 20, 2026')
  })

  it('returns an unparseable value unchanged', () => {
    expect(formatMilestoneDate('not-a-date')).toBe('not-a-date')
  })
})
