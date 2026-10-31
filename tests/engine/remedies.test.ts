import { describe, it, expect } from 'vitest'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { applyTrimElasticRemedy, rebalanceGuestCount } from '@/lib/engine/budget'
import type { EventBrief, Plan } from '@/lib/engine/types'

describe('Targeted Sequential Elasticity Trim Remedy & Permissive Shortfall Solver (BUDGET-03, BUDGET-04, ADR-0002)', () => {
  const weddingBrief: EventBrief = {
    title: 'Simran & Raj Wedding',
    eventType: 'wedding',
    eventDate: '2026-12-15',
    city: 'Delhi',
    guestCount: 300,
    totalBudgetPaise: 250_000_000, // ₹25,00,000
    protectedCategory: 'venue',
  }

  it('generates 3 deterministic shortfall remedies with whole integer paise numbers', () => {
    const basePlan = instantiatePlanFromBrief(weddingBrief)
    // Scale guest count way up to trigger infeasible shortfall
    const infeasiblePlan = rebalanceGuestCount(basePlan, 550)

    expect(infeasiblePlan.isInfeasible).toBe(true)
    expect(infeasiblePlan.shortfallPaise).toBeGreaterThan(0)
    expect(infeasiblePlan.remedies).toBeDefined()
    expect(infeasiblePlan.remedies).toHaveLength(3)

    const [r1, r2, r3] = infeasiblePlan.remedies!

    // Remedy 1: Increase budget
    expect(r1.type).toBe('increase_budget')
    expect(r1.deltaValue).toBe(infeasiblePlan.shortfallPaise)
    expect(Number.isInteger(r1.deltaValue)).toBe(true)
    expect(r1.description).toContain('total budget')

    // Remedy 2: Reduce guests
    expect(r2.type).toBe('reduce_guests')
    expect(r2.deltaValue).toBeLessThan(550)
    expect(Number.isInteger(r2.deltaValue)).toBe(true)
    expect(r2.description).toContain('Reduce guest count')

    // Remedy 3: Trim flexible lines
    expect(r3.type).toBe('trim_elastic')
    expect(Number.isInteger(r3.deltaValue)).toBe(true)
  })

  it('targeted trim: trims only lowest rank line when deficit is small, leaving higher ranks untouched (D-15)', () => {
    // Construct a plan where Misc (Rank 1), Entertainment (Rank 2), and Decor (Rank 3) all have headroom
    const plan: Plan = {
      id: 'test-custom-elastic',
      brief: weddingBrief,
      baselineGuestCount: 300,
      totalBudgetPaise: 250_000_000,
      isInfeasible: true,
      shortfallPaise: 1_000_000, // ₹10,000 deficit
      lines: [
        {
          id: 'l-catering',
          name: 'Catering',
          category: 'catering',
          lineType: 'per_guest',
          baselinePaise: 87_500_000,
          currentPaise: 88_500_000, // +10,000 rupees over budget
          isProtected: true,
        },
        {
          id: 'l-misc',
          name: 'Miscellaneous',
          category: 'misc',
          lineType: 'flexible',
          elasticityRank: 1,
          baselinePaise: 10_000_000, // ₹1,00,000, floor = 4,000,000, headroom = 6,000,000
          currentPaise: 10_000_000,
        },
        {
          id: 'l-entertainment',
          name: 'Entertainment',
          category: 'entertainment',
          lineType: 'flexible',
          elasticityRank: 2,
          baselinePaise: 15_000_000, // ₹1,50,000, floor = 6,000,000, headroom = 9,000,000
          currentPaise: 15_000_000,
        },
        {
          id: 'l-decor',
          name: 'Decor',
          category: 'decor',
          lineType: 'flexible',
          elasticityRank: 3,
          baselinePaise: 30_000_000, // ₹3,00,000, floor = 12,000,000
          currentPaise: 30_000_000,
        },
        {
          id: 'l-venue',
          name: 'Venue',
          category: 'venue',
          lineType: 'fixed',
          baselinePaise: 107_500_000,
          currentPaise: 107_500_000,
        },
      ],
    }

    // Apply targeted trim for the 1,000,000 paise deficit
    const resolvedPlan = applyTrimElasticRemedy(plan, 1_000_000)

    const miscL = resolvedPlan.lines.find((l) => l.category === 'misc')!
    const entL = resolvedPlan.lines.find((l) => l.category === 'entertainment')!
    const decorL = resolvedPlan.lines.find((l) => l.category === 'decor')!

    // Misc (Rank 1) should have absorbed the entire ₹10,000 (1,000,000 paise)
    expect(miscL.currentPaise).toBe(9_000_000)
    // Entertainment (Rank 2) and Decor (Rank 3) must be 100% untouched!
    expect(entL.currentPaise).toBe(15_000_000)
    expect(decorL.currentPaise).toBe(30_000_000)

    // Plan feasibility restored
    expect(resolvedPlan.isInfeasible).toBe(false)
    expect(resolvedPlan.shortfallPaise).toBeUndefined()
    expect(resolvedPlan.remedies).toBeUndefined()

    // Sum invariant holds exactly
    const sum = resolvedPlan.lines.reduce((s, l) => s + l.currentPaise, 0)
    expect(sum).toBe(plan.totalBudgetPaise)
  })

  it('sequential trim: exhausts lower elasticity rank to 40% floor before touching higher rank', () => {
    const plan: Plan = {
      id: 'test-custom-elastic-2',
      brief: weddingBrief,
      baselineGuestCount: 300,
      totalBudgetPaise: 250_000_000,
      isInfeasible: true,
      shortfallPaise: 8_000_000, // ₹80,000 deficit
      lines: [
        {
          id: 'l-catering',
          name: 'Catering',
          category: 'catering',
          lineType: 'per_guest',
          baselinePaise: 87_500_000,
          currentPaise: 95_500_000,
          isProtected: true,
        },
        {
          id: 'l-misc',
          name: 'Miscellaneous',
          category: 'misc',
          lineType: 'flexible',
          elasticityRank: 1,
          baselinePaise: 10_000_000, // floor = 4,000,000 => capacity = 6,000,000
          currentPaise: 10_000_000,
        },
        {
          id: 'l-entertainment',
          name: 'Entertainment',
          category: 'entertainment',
          lineType: 'flexible',
          elasticityRank: 2,
          baselinePaise: 15_000_000, // floor = 6,000,000 => capacity = 9,000,000
          currentPaise: 15_000_000,
        },
        {
          id: 'l-decor',
          name: 'Decor',
          category: 'decor',
          lineType: 'flexible',
          elasticityRank: 3,
          baselinePaise: 30_000_000,
          currentPaise: 30_000_000,
        },
        {
          id: 'l-venue',
          name: 'Venue',
          category: 'venue',
          lineType: 'fixed',
          baselinePaise: 107_500_000,
          currentPaise: 107_500_000,
        },
      ],
    }

    // 8,000,000 deficit requires draining all 6,000,000 from Misc (clamping it to floor 4M)
    // and remaining 2,000,000 from Entertainment (Rank 2). Decor remains untouched!
    const resolvedPlan = applyTrimElasticRemedy(plan, 8_000_000)

    const miscL = resolvedPlan.lines.find((l) => l.category === 'misc')!
    const entL = resolvedPlan.lines.find((l) => l.category === 'entertainment')!
    const decorL = resolvedPlan.lines.find((l) => l.category === 'decor')!

    expect(miscL.currentPaise).toBe(4_000_000) // Clamped to 40% floor
    expect(entL.currentPaise).toBe(13_000_000) // 15M - 2M
    expect(decorL.currentPaise).toBe(30_000_000) // Untouched!

    expect(resolvedPlan.isInfeasible).toBe(false)
    const sum = resolvedPlan.lines.reduce((s, l) => s + l.currentPaise, 0)
    expect(sum).toBe(plan.totalBudgetPaise)
  })

  it('guarantees Protected Moment is never trimmed by applyTrimElasticRemedy', () => {
    // If Decor is flexible AND Protected, it must not be touched
    const plan: Plan = {
      id: 'test-protected-trim',
      brief: { ...weddingBrief, protectedCategory: 'decor' },
      baselineGuestCount: 300,
      totalBudgetPaise: 250_000_000,
      isInfeasible: true,
      shortfallPaise: 5_000_000,
      lines: [
        {
          id: 'l-decor',
          name: 'Decor',
          category: 'decor',
          lineType: 'flexible',
          elasticityRank: 3,
          baselinePaise: 50_000_000,
          currentPaise: 50_000_000,
          isProtected: true,
        },
        {
          id: 'l-entertainment',
          name: 'Entertainment',
          category: 'entertainment',
          lineType: 'flexible',
          elasticityRank: 2,
          baselinePaise: 50_000_000,
          currentPaise: 50_000_000,
        },
        {
          id: 'l-venue',
          name: 'Venue',
          category: 'venue',
          lineType: 'fixed',
          baselinePaise: 150_000_000,
          currentPaise: 155_000_000,
        },
      ],
    }

    const resolvedPlan = applyTrimElasticRemedy(plan, 5_000_000)
    const decorL = resolvedPlan.lines.find((l) => l.category === 'decor')!
    const entL = resolvedPlan.lines.find((l) => l.category === 'entertainment')!

    expect(decorL.currentPaise).toBe(50_000_000) // Immune!
    expect(entL.currentPaise).toBe(45_000_000) // Absorbed trim
  })

  it('applying Remedy 1 (increasing total budget) restores feasibility and sum invariant', () => {
    const basePlan = instantiatePlanFromBrief(weddingBrief)
    const infeasiblePlan = rebalanceGuestCount(basePlan, 500)

    expect(infeasiblePlan.isInfeasible).toBe(true)
    const deficit = infeasiblePlan.shortfallPaise!
    expect(deficit).toBeGreaterThan(0)

    // Execute Remedy 1: update totalBudgetPaise and clear shortfall state
    const resolvedPlan: Plan = {
      ...infeasiblePlan,
      totalBudgetPaise: infeasiblePlan.totalBudgetPaise + deficit,
      brief: {
        ...infeasiblePlan.brief,
        totalBudgetPaise: infeasiblePlan.totalBudgetPaise + deficit,
      },
      isInfeasible: false,
      shortfallPaise: undefined,
      remedies: undefined,
    }

    expect(resolvedPlan.isInfeasible).toBe(false)
    const sum = resolvedPlan.lines.reduce((s, l) => s + l.currentPaise, 0)
    expect(sum).toBe(resolvedPlan.totalBudgetPaise)
  })
})
