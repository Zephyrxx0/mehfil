import { describe, it, expect } from 'vitest'
import {
  clampToToday,
  formatDisplayDate,
  isPastDate,
  parseISODate,
  rollForwardToFuture,
  todayISO,
  toISODate,
} from '@/lib/dates'

// A fixed "now" in the afternoon, so local-time handling is exercised without depending on the real clock.
const NOW = new Date(2026, 9, 29, 15, 30) // 29 Oct 2026, local time

describe('calendar date helpers', () => {
  it('formats local dates without shifting the day (no toISOString)', () => {
    expect(toISODate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(toISODate(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31')
    expect(todayISO(NOW)).toBe('2026-10-29')
  })

  it('parses valid dates and rejects malformed or impossible ones', () => {
    expect(parseISODate('2026-11-20')).toEqual(new Date(2026, 10, 20))
    expect(parseISODate('2026-02-30')).toBeUndefined()
    expect(parseISODate('2026-13-01')).toBeUndefined()
    expect(parseISODate('20-11-2026')).toBeUndefined()
    expect(parseISODate('')).toBeUndefined()
    expect(parseISODate(undefined)).toBeUndefined()
  })

  it('treats today as allowed and yesterday as past', () => {
    expect(isPastDate('2026-10-28', NOW)).toBe(true)
    expect(isPastDate('2026-10-29', NOW)).toBe(false)
    expect(isPastDate('2026-10-30', NOW)).toBe(false)
    // Unparseable input is not "past"; it is simply invalid.
    expect(isPastDate('nonsense', NOW)).toBe(false)
  })

  it('clamps past and invalid dates to today and leaves future dates alone', () => {
    expect(clampToToday('2026-06-15', NOW)).toBe('2026-10-29')
    expect(clampToToday('garbage', NOW)).toBe('2026-10-29')
    expect(clampToToday('2026-10-29', NOW)).toBe('2026-10-29')
    expect(clampToToday('2027-01-01', NOW)).toBe('2027-01-01')
  })

  it('rolls stale starter dates forward a year at a time, keeping day and month', () => {
    expect(rollForwardToFuture('2026-06-15', NOW)).toBe('2027-06-15')
    expect(rollForwardToFuture('2023-06-15', NOW)).toBe('2027-06-15')
    expect(rollForwardToFuture('2026-10-30', NOW)).toBe('2026-10-30')
    expect(rollForwardToFuture('2026-10-29', NOW)).toBe('2026-10-29')
    expect(rollForwardToFuture('bad', NOW)).toBe('2026-10-29')
  })

  it('formats a readable label', () => {
    expect(formatDisplayDate('2026-11-20')).toMatch(/20/)
    expect(formatDisplayDate('2026-11-20')).toMatch(/2026/)
    expect(formatDisplayDate('nope')).toBe('')
  })
})
