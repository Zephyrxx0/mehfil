import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { sanitizePlanForSharing } from '@/lib/engine/sanitization'
import type { BudgetCategory, Plan, TimelineSchedule } from '@/lib/engine/types'

/**
 * The family view shows one integer percentage per visible category. They must add up to
 * exactly 100, which independent rounding cannot guarantee (33 + 33 + 33 = 99, 12.5 x 8 = 101).
 */

const PUBLIC_CATEGORIES: BudgetCategory[] = [
  'venue',
  'catering',
  'decor',
  'photo_film',
  'entertainment',
  'favors',
  'misc',
]

interface Allocation {
  category: BudgetCategory
  paise: number
}

const schedule: TimelineSchedule = {
  eventDate: '2026-12-18',
  isCompressedMode: false,
  milestoneBands: [],
}

function planFrom(allocations: Allocation[]): Plan {
  const lines = allocations.map(({ category, paise }, i) => ({
    id: `line-${i}`,
    name: `Line ${i}`,
    category,
    lineType: 'flexible' as const,
    baselinePaise: paise,
    currentPaise: paise,
  }))
  const total = allocations.reduce((sum, a) => sum + a.paise, 0)
  return {
    id: 'plan-pct',
    brief: {
      title: 'Percentages',
      eventType: 'wedding',
      eventDate: '2026-12-18',
      city: 'Jaipur',
      guestCount: 100,
      totalBudgetPaise: total,
      protectedCategory: 'catering',
      nuances: [],
    },
    lines,
    totalBudgetPaise: total,
    baselineGuestCount: 100,
  }
}

const percentagesOf = (allocations: Allocation[]) =>
  sanitizePlanForSharing(planFrom(allocations), schedule).categoryPercentages as Record<
    string,
    number
  >

const allocationArb = fc.record({
  category: fc.constantFrom<BudgetCategory>(...PUBLIC_CATEGORIES, 'contingency'),
  paise: fc.integer({ min: 0, max: 100_000_000_000 }),
})

describe('sanitizePlanForSharing category percentages', () => {
  it('shows integer percentages that sum to exactly 100, each within 1 of its exact share', () => {
    fc.assert(
      fc.property(fc.array(allocationArb, { minLength: 1, maxLength: 20 }), (allocations) => {
        const totals: Record<string, number> = {}
        for (const { category, paise } of allocations) {
          if (category === 'contingency') continue
          totals[category] = (totals[category] ?? 0) + paise
        }
        const total = Object.values(totals).reduce((a, b) => a + b, 0)
        fc.pre(total > 0)

        const percentages = percentagesOf(allocations)

        expect(Object.keys(percentages).sort()).toEqual(Object.keys(totals).sort())
        for (const [category, pct] of Object.entries(percentages)) {
          expect(Number.isInteger(pct)).toBe(true)
          expect(pct).toBeGreaterThanOrEqual(0)
          expect(pct).toBeLessThanOrEqual(100)
          // |pct - paise * 100 / total| < 1, compared in integers to avoid float error
          expect(Math.abs(pct * total - totals[category] * 100)).toBeLessThan(total)
        }
        expect(Object.values(percentages).reduce((a, b) => a + b, 0)).toBe(100)
      }),
      { numRuns: 300 }
    )
  })

  it('splits three equal categories as 34 / 33 / 33 rather than 33 / 33 / 33', () => {
    const percentages = percentagesOf([
      { category: 'venue', paise: 100_000 },
      { category: 'catering', paise: 100_000 },
      { category: 'decor', paise: 100_000 },
    ])

    expect(percentages).toEqual({ venue: 34, catering: 33, decor: 33 })
  })

  it('splits seven equal shares as two 15s and five 14s, not 98 from independent rounding', () => {
    // Each share is 14.28...; Math.round gives 14 for all seven, which adds up to 98.
    const percentages = percentagesOf(PUBLIC_CATEGORIES.map((category) => ({ category, paise: 1 })))

    expect(percentages).toEqual({
      venue: 15,
      catering: 15,
      decor: 14,
      photo_film: 14,
      entertainment: 14,
      favors: 14,
      misc: 14,
    })
    expect(Object.values(percentages).reduce((a, b) => a + b, 0)).toBe(100)
  })

  it('gives the same answer whatever order the lines arrive in', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.constantFrom(...PUBLIC_CATEGORIES), { minLength: 2 }),
        fc.integer({ min: 1, max: 1000 }),
        (categories, unit) => {
          // Equal amounts make every remainder a tie
          const allocations = categories.map((category) => ({ category, paise: unit }))
          const forward = percentagesOf(allocations)
          const backward = percentagesOf([...allocations].reverse())

          expect(backward).toEqual(forward)
        }
      )
    )
  })

  it('hands tied leftover points to the earliest categories first', () => {
    const percentages = percentagesOf([
      { category: 'misc', paise: 500 },
      { category: 'favors', paise: 500 },
      { category: 'venue', paise: 500 },
    ])

    expect(percentages).toEqual({ venue: 34, favors: 33, misc: 33 })
  })

  it('gives all zeros when there is no visible money', () => {
    expect(
      percentagesOf([
        { category: 'venue', paise: 0 },
        { category: 'decor', paise: 0 },
        { category: 'contingency', paise: 5_000_000 },
      ])
    ).toEqual({ venue: 0, decor: 0 })
  })

  it('gives a single visible category the full 100', () => {
    expect(
      percentagesOf([
        { category: 'decor', paise: 123_457 },
        { category: 'contingency', paise: 999_999 },
      ])
    ).toEqual({ decor: 100 })
  })

  it('leaves totalBudgetPaise and the contingency exclusion unchanged', () => {
    const plan = planFrom([
      { category: 'venue', paise: 70_000 },
      { category: 'catering', paise: 30_000 },
      { category: 'contingency', paise: 50_000 },
    ])
    const shared = sanitizePlanForSharing(plan, schedule)

    expect(shared.totalBudgetPaise).toBe(150_000)
    expect(shared.categoryTotals).toEqual({ venue: 70_000, catering: 30_000 })
    expect(shared.categoryPercentages).toEqual({ venue: 70, catering: 30 })
  })
})
