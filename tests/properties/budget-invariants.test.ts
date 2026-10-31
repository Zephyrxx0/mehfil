import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  adoptIdea,
  apportionRupees,
  rebalanceGuestCount,
  retractIdea,
  setProtectedMoment,
} from '@/lib/engine/budget'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { CURATED_IDEAS } from '@/data/curatedIdeas'
import type { BudgetCategory, EventBrief, EventType, Plan } from '@/lib/engine/types'

/**
 * Property-based tests for the money engine (T5). Unlike hand-picked examples, fast-check tries
 * hundreds of generated plans per property, shrinks any failure to a minimal case, and prints
 * the seed so the failure can be replayed.
 */

const CATEGORIES: BudgetCategory[] = [
  'venue',
  'catering',
  'decor',
  'photo_film',
  'entertainment',
  'favors',
  'misc',
  'contingency',
]
const EVENT_TYPES: EventType[] = ['wedding', 'birthday', 'community']

const RUNS = { numRuns: Number(process.env.FC_RUNS ?? 300) }

/** A realistic celebration brief: budgets from Rs 50,000 to Rs 10 crore, 10 to 3,000 guests. */
const briefArb: fc.Arbitrary<EventBrief> = fc.record({
  title: fc.constant('Generated celebration'),
  eventType: fc.constantFrom(...EVENT_TYPES),
  eventDate: fc.constant('2028-03-15'),
  city: fc.constant('Jaipur'),
  guestCount: fc.integer({ min: 10, max: 3000 }),
  totalBudgetPaise: fc.integer({ min: 50_000, max: 100_000_000 }).map((rupees) => rupees * 100),
  protectedCategory: fc.constantFrom(...CATEGORIES),
})

const planArb: fc.Arbitrary<Plan> = briefArb.map(instantiatePlanFromBrief)

const sum = (plan: Plan) => plan.lines.reduce((total, line) => total + line.currentPaise, 0)

describe('apportionRupees', () => {
  it('always distributes exactly the total, in whole paise, for any ratios', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000_000 }).map((rupees) => rupees * 100),
        fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 12 }),
        (totalPaise, weights) => {
          const weightTotal = weights.reduce((a, b) => a + b, 0)
          const result = apportionRupees(
            totalPaise,
            weights.map((w) => w / weightTotal)
          )
          expect(result.reduce((a, b) => a + b, 0)).toBe(totalPaise)
          expect(result.every((v) => Number.isInteger(v) && v >= 0)).toBe(true)
        }
      ),
      RUNS
    )
  })

  it('gives every line within one rupee of its exact share (largest remainder)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100_000_000 }).map((rupees) => rupees * 100),
        fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 10 }),
        (totalPaise, weights) => {
          const weightTotal = weights.reduce((a, b) => a + b, 0)
          const ratios = weights.map((w) => w / weightTotal)
          const result = apportionRupees(totalPaise, ratios)
          result.forEach((paise, i) => {
            expect(Math.abs(paise - ratios[i] * totalPaise)).toBeLessThanOrEqual(100 + 1)
          })
        }
      ),
      RUNS
    )
  })
})

describe('instantiated plans', () => {
  it('start with line totals equal to the budget, to the paisa', () => {
    fc.assert(
      fc.property(planArb, (plan) => {
        expect(sum(plan)).toBe(plan.totalBudgetPaise)
        expect(
          plan.lines.every((l) => Number.isInteger(l.currentPaise) && l.currentPaise >= 0)
        ).toBe(true)
      }),
      RUNS
    )
  })

  it('mark exactly one line as the protected moment, in the chosen category', () => {
    fc.assert(
      fc.property(planArb, (plan) => {
        const protectedLines = plan.lines.filter((l) => l.isProtected)
        expect(protectedLines).toHaveLength(1)
        expect(protectedLines[0].category).toBe(plan.brief.protectedCategory)
      }),
      RUNS
    )
  })
})

describe('rebalanceGuestCount', () => {
  it('keeps the sum exact for any feasible guest change, and never touches the budget total', () => {
    fc.assert(
      fc.property(planArb, fc.integer({ min: 1, max: 5000 }), (plan, guests) => {
        const next = rebalanceGuestCount(plan, guests)
        expect(next.totalBudgetPaise).toBe(plan.totalBudgetPaise)
        if (!next.isInfeasible) expect(sum(next)).toBe(next.totalBudgetPaise)
      }),
      RUNS
    )
  })

  it('never lowers the protected moment, whatever the guest count', () => {
    fc.assert(
      fc.property(planArb, fc.integer({ min: 1, max: 5000 }), (plan, guests) => {
        const before = plan.lines.find((l) => l.isProtected)!
        const after = rebalanceGuestCount(plan, guests).lines.find((l) => l.id === before.id)!
        expect(after.currentPaise).toBeGreaterThanOrEqual(before.currentPaise)
      }),
      RUNS
    )
  })

  it('keeps every flexible line at or above its 40% floor', () => {
    fc.assert(
      fc.property(planArb, fc.integer({ min: 1, max: 5000 }), (plan, guests) => {
        for (const line of rebalanceGuestCount(plan, guests).lines) {
          if (line.lineType === 'flexible' && !line.isProtected) {
            // The engine rounds each floor to whole rupees.
            expect(line.currentPaise).toBeGreaterThanOrEqual(
              Math.round((line.baselinePaise * 0.4) / 100) * 100
            )
          }
        }
      }),
      RUNS
    )
  })

  it('leaves fixed and buffer lines unchanged', () => {
    fc.assert(
      fc.property(planArb, fc.integer({ min: 1, max: 5000 }), (plan, guests) => {
        const next = rebalanceGuestCount(plan, guests)
        for (const before of plan.lines) {
          if (
            (before.lineType === 'fixed' || before.lineType === 'buffer') &&
            !before.isProtected
          ) {
            expect(next.lines.find((l) => l.id === before.id)!.currentPaise).toBe(
              before.currentPaise
            )
          }
        }
      }),
      RUNS
    )
  })

  it('flags a shortfall exactly when the lines no longer add up to the budget', () => {
    fc.assert(
      fc.property(planArb, fc.integer({ min: 1, max: 5000 }), (plan, guests) => {
        const next = rebalanceGuestCount(plan, guests)
        const gap = next.totalBudgetPaise - sum(next)
        if (next.isInfeasible) expect(next.shortfallPaise).toBe(-gap)
        else expect(gap).toBe(0)
      }),
      RUNS
    )
  })

  it('is stable: rebalancing to the same guest count twice changes nothing more', () => {
    fc.assert(
      fc.property(planArb, fc.integer({ min: 1, max: 5000 }), (plan, guests) => {
        const once = rebalanceGuestCount(plan, guests)
        const twice = rebalanceGuestCount(once, guests)
        expect(twice.lines.map((l) => l.currentPaise)).toEqual(
          once.lines.map((l) => l.currentPaise)
        )
      }),
      RUNS
    )
  })
})

describe('setProtectedMoment', () => {
  it('moves the single protected flag and never changes any amount', () => {
    fc.assert(
      fc.property(planArb, fc.constantFrom(...CATEGORIES), (plan, category) => {
        const next = setProtectedMoment(plan, category)
        expect(next.lines.map((l) => l.currentPaise)).toEqual(plan.lines.map((l) => l.currentPaise))
        expect(next.lines.filter((l) => l.isProtected).map((l) => l.category)).toEqual([category])
      }),
      RUNS
    )
  })
})

describe('adopting and retracting curated ideas', () => {
  const ideaArb = fc.constantFrom(...CURATED_IDEAS)

  it('keeps the sum exact and never drains the protected moment', () => {
    fc.assert(
      fc.property(planArb, ideaArb, (plan, idea) => {
        fc.pre(plan.lines.some((l) => l.category === idea.category))
        const protectedBefore = plan.lines.find((l) => l.isProtected)!
        const next = adoptIdea(plan, idea)

        expect(next.totalBudgetPaise).toBe(plan.totalBudgetPaise)
        if (!next.isInfeasible) expect(sum(next)).toBe(next.totalBudgetPaise)
        const protectedAfter = next.lines.find((l) => l.id === protectedBefore.id)!
        // The protected line may only gain, and only when the idea itself targets it.
        if (idea.category !== protectedBefore.category) {
          expect(protectedAfter.currentPaise).toBe(protectedBefore.currentPaise)
        }
      }),
      RUNS
    )
  })

  it('never takes a donor line below its 40% floor', () => {
    fc.assert(
      fc.property(planArb, ideaArb, (plan, idea) => {
        fc.pre(plan.lines.some((l) => l.category === idea.category))
        for (const line of adoptIdea(plan, idea).lines) {
          if (
            line.lineType === 'flexible' &&
            !line.isProtected &&
            line.category !== idea.category
          ) {
            expect(line.currentPaise).toBeGreaterThanOrEqual(
              Math.round((line.baselinePaise * 0.4) / 100) * 100
            )
          }
        }
      }),
      RUNS
    )
  })

  it('retracting an adopted idea returns every line to where it started', () => {
    fc.assert(
      fc.property(planArb, ideaArb, (plan, idea) => {
        fc.pre(plan.lines.some((l) => l.category === idea.category))
        const adopted = adoptIdea(plan, idea)
        fc.pre(!adopted.isInfeasible)
        const restored = retractIdea(adopted, idea.id)
        expect(sum(restored)).toBe(restored.totalBudgetPaise)
        expect(restored.lines.map((l) => l.currentPaise)).toEqual(
          plan.lines.map((l) => l.currentPaise)
        )
      }),
      RUNS
    )
  })
})
