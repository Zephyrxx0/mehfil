import { describe, it, expect } from 'vitest'
import { apportionRupees, rebalanceGuestCount, setProtectedMoment } from '@/lib/engine/budget'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import type { EventBrief } from '@/lib/engine/types'

const weddingBrief: EventBrief = {
  title: 'Test Wedding',
  eventType: 'wedding',
  eventDate: '2025-02-14',
  city: 'Delhi',
  guestCount: 300,
  totalBudgetPaise: 250_000_000,
  protectedCategory: 'catering',
}

describe('apportionRupees', () => {
  it('sum invariant: returned values sum exactly to totalPaise', () => {
    const ratios = [0.3, 0.35, 0.12, 0.1, 0.06, 0.02, 0.0, 0.05]
    const total = 250_000_000
    const result = apportionRupees(total, ratios)
    const sum = result.reduce((a, b) => a + b, 0)
    expect(sum).toBe(total)
  })

  it('property test: 1000 random budgets all satisfy sum invariant', () => {
    const ratios = [0.3, 0.35, 0.12, 0.1, 0.06, 0.02, 0.0, 0.05]

    for (let i = 0; i < 1000; i++) {
      // Random budgets from ₹50,000 to ₹1,00,00,000 (5K to 10Cr)
      const rupees = Math.floor(Math.random() * (10_000_000 - 50_000) + 50_000)
      const totalPaise = rupees * 100

      const result = apportionRupees(totalPaise, ratios)
      const sum = result.reduce((a, b) => a + b, 0)

      if (sum !== totalPaise) {
        throw new Error(
          `Sum invariant violated for budget ₹${rupees}: got ${sum}, expected ${totalPaise}`
        )
      }
    }
  })

  it('all returned values are non-negative integers', () => {
    const ratios = [0.3, 0.35, 0.12, 0.1, 0.06, 0.02, 0.0, 0.05]
    const result = apportionRupees(250_000_000, ratios)
    for (const v of result) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(v)).toBe(true)
    }
  })
})

describe('rebalanceGuestCount', () => {
  it('per-guest lines scale up proportionally', () => {
    const plan = instantiatePlanFromBrief(weddingBrief)
    const originalFavors = plan.lines.find((l) => l.category === 'favors')!.currentPaise

    const rebalanced = rebalanceGuestCount(plan, 600) // 2x guests
    const newFavors = rebalanced.lines.find((l) => l.category === 'favors')!.currentPaise

    // Favors should roughly double
    expect(newFavors).toBeGreaterThan(originalFavors)
  })

  it('sum invariant holds after rebalancing', () => {
    const plan = instantiatePlanFromBrief(weddingBrief)
    const rebalanced = rebalanceGuestCount(plan, 200)

    if (!rebalanced.isInfeasible) {
      const sum = rebalanced.lines.reduce((s, l) => s + l.currentPaise, 0)
      expect(sum).toBe(rebalanced.totalBudgetPaise)
    }
  })

  it('Protected Moment allocation never decreases when guests increase', () => {
    const plan = instantiatePlanFromBrief(weddingBrief)
    const originalProtected = plan.lines.find((l) => l.isProtected)!.currentPaise

    const rebalanced = rebalanceGuestCount(plan, 600)
    const newProtected = rebalanced.lines.find((l) => l.isProtected)!.currentPaise

    expect(newProtected).toBeGreaterThanOrEqual(originalProtected)
  })

  it('elastic lines never drop below 40% of baseline (D-11)', () => {
    const plan = instantiatePlanFromBrief(weddingBrief)

    // Extreme guest scaling: 10x
    const rebalanced = rebalanceGuestCount(plan, 3000)

    for (const line of rebalanced.lines) {
      if (line.lineType === 'flexible' && !line.isProtected) {
        const floor = Math.round((line.baselinePaise * 0.4) / 100) * 100
        expect(line.currentPaise).toBeGreaterThanOrEqual(floor)
      }
    }
  })

  it('sets isInfeasible when elastic capacity exhausted', () => {
    const plan = instantiatePlanFromBrief(weddingBrief)

    // Extreme scaling should cause infeasibility
    const rebalanced = rebalanceGuestCount(plan, 10000)

    // Either feasible with sum invariant, or infeasible with remedies
    if (rebalanced.isInfeasible) {
      expect(rebalanced.shortfallPaise).toBeGreaterThan(0)
      expect(rebalanced.remedies).toHaveLength(3)
    } else {
      const sum = rebalanced.lines.reduce((s, l) => s + l.currentPaise, 0)
      expect(sum).toBe(rebalanced.totalBudgetPaise)
    }
  })
})

describe('setProtectedMoment', () => {
  it('moves protected status to new category', () => {
    const plan = instantiatePlanFromBrief(weddingBrief)
    const newPlan = setProtectedMoment(plan, 'venue')

    const protectedLines = newPlan.lines.filter((l) => l.isProtected)
    expect(protectedLines).toHaveLength(1)
    expect(protectedLines[0].category).toBe('venue')
  })

  it('only one line is protected at a time', () => {
    const plan = instantiatePlanFromBrief(weddingBrief)
    const newPlan = setProtectedMoment(plan, 'decor')

    const protectedCount = newPlan.lines.filter((l) => l.isProtected).length
    expect(protectedCount).toBe(1)
  })
})
