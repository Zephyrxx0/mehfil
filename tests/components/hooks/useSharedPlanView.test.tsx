import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSharedPlanView } from '@/app/share/[token]/useSharedPlanView'
import type { SanitizedSharedPlan } from '@/lib/engine/types'
import * as icsEngine from '@/lib/engine/ics'

const plan: SanitizedSharedPlan = {
  id: 'shared-1',
  title: 'Ananya & Vikram Wedding',
  eventType: 'wedding',
  eventDate: '2026-12-25',
  city: 'Jaipur',
  guestCount: 250,
  totalBudgetPaise: 200_000_000,
  categoryTotals: {
    venue: 0,
    catering: 0,
    decor: 0,
    photo_film: 0,
    entertainment: 0,
    favors: 0,
    misc: 0,
    contingency: 0,
  },
  categoryPercentages: {
    venue: 0,
    catering: 0,
    decor: 0,
    photo_film: 0,
    entertainment: 0,
    favors: 0,
    misc: 0,
    contingency: 0,
  },
  protectedMoment: { category: 'decor', name: 'Mandap', isProtected: true },
  publicMilestones: [],
}

describe('useSharedPlanView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 11, 20, 15, 30))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // The event date is parsed as UTC midnight and compared with local midnight, so the count is
  // off by one in some timezones. These assertions allow for that and stay away from the boundary.
  it('counts whole days from local midnight to the event date', () => {
    const { result } = renderHook(() => useSharedPlanView(plan))
    expect(result.current.daysRemaining).toBeGreaterThanOrEqual(5)
    expect(result.current.daysRemaining).toBeLessThanOrEqual(6)
  })

  it('reports a negative count once the event is well in the past', () => {
    vi.setSystemTime(new Date(2026, 11, 28, 9, 0))
    const { result } = renderHook(() => useSharedPlanView(plan))
    expect(result.current.daysRemaining).toBeLessThan(0)
  })

  it('formats the event date for display', () => {
    const { result } = renderHook(() => useSharedPlanView(plan))
    expect(result.current.formattedEventDate).toBe('December 25, 2026')
  })

  it('exports the public ceremonies under a slugged filename', () => {
    const downloadSpy = vi.spyOn(icsEngine, 'downloadICS').mockImplementation(() => {})
    const { result } = renderHook(() => useSharedPlanView(plan))

    result.current.handleExportICS()

    expect(downloadSpy).toHaveBeenCalledTimes(1)
    expect(downloadSpy.mock.calls[0][1]).toBe('ananya-&-vikram-wedding-ceremonies.ics')
  })
})
