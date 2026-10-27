import { describe, it, expect } from 'vitest'
import { computePlanDiff } from '@/lib/engine/diff'
import type { Plan } from '@/lib/engine/types'

describe('Pure TypeScript Deterministic Diff Engine (D-12, COLLAB-04, ADR-0004)', () => {
  const basePlan: Plan = {
    id: 'test-diff-plan',
    brief: {
      title: 'Dev & Natasha Wedding',
      eventType: 'wedding',
      eventDate: '2026-12-10',
      city: 'Delhi',
      guestCount: 200,
      totalBudgetPaise: 150000000, // ₹15,00,000
      protectedCategory: 'catering',
    },
    lines: [
      {
        id: 'line-venue',
        name: 'Venue',
        category: 'venue',
        lineType: 'fixed',
        baselinePaise: 45000000,
        currentPaise: 45000000,
      },
      {
        id: 'line-catering',
        name: 'Catering',
        category: 'catering',
        lineType: 'per_guest',
        baselinePaise: 50000000,
        currentPaise: 50000000,
        isProtected: true,
      },
      {
        id: 'line-decor',
        name: 'Decor',
        category: 'decor',
        lineType: 'flexible',
        baselinePaise: 30000000,
        currentPaise: 30000000,
        elasticityRank: 2,
      },
      {
        id: 'line-buffer',
        name: 'Contingency',
        category: 'contingency',
        lineType: 'buffer',
        baselinePaise: 25000000,
        currentPaise: 25000000,
      },
    ],
    totalBudgetPaise: 150000000,
    baselineGuestCount: 200,
  }

  it('computes exact guest count scaling sentence with donors and recipients', () => {
    const nextPlan: Plan = {
      ...basePlan,
      brief: { ...basePlan.brief, guestCount: 250 },
      lines: [
        { ...basePlan.lines[0] },
        { ...basePlan.lines[1], currentPaise: 62500000 }, // +12.5L paise (catering scaled)
        { ...basePlan.lines[2], currentPaise: 20000000 }, // -10.0L paise (decor trimmed)
        { ...basePlan.lines[3], currentPaise: 22500000 }, // -2.5L paise (buffer trimmed)
      ],
    }

    const start = performance.now()
    const result = computePlanDiff({ prevPlan: basePlan, nextPlan, actionType: 'guest_scale' })
    const elapsed = performance.now() - start

    expect(elapsed).toBeLessThan(10) // Pure TypeScript execution in <10ms
    expect(result.summary).toContain('Scaled guest count to 250 (+50 guests)')
    expect(result.summary).toContain('Scaled Catering by drawing from Decor, Contingency')
    expect(result.summary).toContain('Protected Moment held firm')
    expect(result.isFloorProtected).toBe(true)
    expect(result.deltas.length).toBe(3)
  })

  it('computes budget increase sentence with formatINR currency display', () => {
    const nextPlan: Plan = {
      ...basePlan,
      totalBudgetPaise: 200000000, // +₹5,00,000 (50000000 paise)
      brief: { ...basePlan.brief, totalBudgetPaise: 200000000 },
      lines: [
        { ...basePlan.lines[0] },
        { ...basePlan.lines[1] },
        { ...basePlan.lines[2], currentPaise: 55000000 }, // +25000000
        { ...basePlan.lines[3], currentPaise: 50000000 }, // +25000000
      ],
    }

    const result = computePlanDiff({ prevPlan: basePlan, nextPlan, actionType: 'budget_change' })

    expect(result.summary).toBe(
      'Increased total budget by ₹5,00,000; apportioned across flexible lines; Protected Moment held firm.'
    )
    expect(result.deltas.length).toBe(2)
  })

  it('computes budget decrease sentence', () => {
    const nextPlan: Plan = {
      ...basePlan,
      totalBudgetPaise: 130000000, // -₹2,00,000 (20000000 paise)
      brief: { ...basePlan.brief, totalBudgetPaise: 130000000 },
      lines: [
        { ...basePlan.lines[0] },
        { ...basePlan.lines[1] },
        { ...basePlan.lines[2], currentPaise: 20000000 }, // -10000000
        { ...basePlan.lines[3], currentPaise: 15000000 }, // -10000000
      ],
    }

    const result = computePlanDiff({ prevPlan: basePlan, nextPlan, actionType: 'budget_change' })

    expect(result.summary).toBe(
      'Decreased total budget by ₹2,00,000; apportioned across flexible lines; Protected Moment held firm.'
    )
  })

  it('computes Protected Moment lock sentence', () => {
    const nextPlan: Plan = {
      ...basePlan,
      brief: { ...basePlan.brief, protectedCategory: 'decor' },
    }

    const result = computePlanDiff({ prevPlan: basePlan, nextPlan, actionType: 'protected_lock' })

    expect(result.summary).toBe('Locked Protected Moment for decor; non-negotiable floor enforced')
    expect(result.isFloorProtected).toBe(true)
  })

  it('computes forward restore undo sentence', () => {
    const result = computePlanDiff({
      prevPlan: basePlan,
      nextPlan: basePlan,
      actionType: 'restore',
      restoredVersionNumber: 2,
      restoredReason: 'Scaled guests to 220',
    })

    expect(result.summary).toBe('Reverted to v2 (Scaled guests to 220)')
    expect(result.deltas.length).toBe(0)
    expect(result.isFloorProtected).toBe(true)
  })

  it('computes fallback sentence when plans are identical', () => {
    const result = computePlanDiff({ prevPlan: basePlan, nextPlan: basePlan })

    expect(result.summary).toBe('All allocations balanced in harmony.')
    expect(result.deltas.length).toBe(0)
  })

  it('computes plain-language idea adoption sentence with donor lines and Protected Moment immunity (IDEA-02, MOMENT-02)', () => {
    const nextPlan: Plan = {
      ...basePlan,
      lines: [
        { ...basePlan.lines[0] },
        { ...basePlan.lines[1], currentPaise: 55000000 }, // +50,000 rupees (Catering received idea)
        { ...basePlan.lines[2], currentPaise: 25000000 }, // -50,000 rupees (Decor donated)
        { ...basePlan.lines[3] },
      ],
      adoptedIdeas: [
        {
          ideaId: 'chai_bar',
          title: 'Artisanal Kulhad Chai Bar',
          targetCategory: 'catering',
          costPaise: 5000000, // ₹50,000
          displacedDonors: [
            { lineId: 'line-decor', category: 'decor', displacedPaise: 5000000 },
          ],
          adoptedAt: '2026-10-27T10:00:00.000Z',
        },
      ],
    }

    const result = computePlanDiff({ prevPlan: basePlan, nextPlan, actionType: 'adopt_idea' })

    expect(result.summary).toBe(
      "Adopted curated idea 'Artisanal Kulhad Chai Bar' (+₹50,000), funded by trimming Decor in elasticity order, with Protected Moment immune."
    )
    expect(result.isFloorProtected).toBe(true)
    expect(result.deltas).toHaveLength(2)
  })

  it('computes plain-language idea retraction sentence with restored donors (IDEA-03)', () => {
    const planWithIdea: Plan = {
      ...basePlan,
      lines: [
        { ...basePlan.lines[0] },
        { ...basePlan.lines[1], currentPaise: 55000000 },
        { ...basePlan.lines[2], currentPaise: 25000000 },
        { ...basePlan.lines[3] },
      ],
      adoptedIdeas: [
        {
          ideaId: 'chai_bar',
          title: 'Artisanal Kulhad Chai Bar',
          targetCategory: 'catering',
          costPaise: 5000000,
          displacedDonors: [
            { lineId: 'line-decor', category: 'decor', displacedPaise: 5000000 },
          ],
          adoptedAt: '2026-10-27T10:00:00.000Z',
        },
      ],
    }

    // Retracting the idea returns to basePlan
    const result = computePlanDiff({
      prevPlan: planWithIdea,
      nextPlan: basePlan,
      actionType: 'retract_idea',
    })

    expect(result.summary).toBe(
      "Retracted curated idea 'Artisanal Kulhad Chai Bar', restoring exact funds back to Decor."
    )
    expect(result.isFloorProtected).toBe(true)
  })

  it('computes plain-language diff for shortfall remedy: budget increase (BUDGET-03)', () => {
    const infeasiblePlan: Plan = {
      ...basePlan,
      isInfeasible: true,
      shortfallPaise: 10000000, // ₹1,00,000
    }
    const resolvedPlan: Plan = {
      ...basePlan,
      totalBudgetPaise: 160000000,
      brief: { ...basePlan.brief, totalBudgetPaise: 160000000 },
      isInfeasible: false,
    }

    const result = computePlanDiff({
      prevPlan: infeasiblePlan,
      nextPlan: resolvedPlan,
      actionType: 'remedy_budget',
    })

    expect(result.summary).toBe(
      'Applied Remedy: Increased total budget by ₹1,00,000 to balance shortfall.'
    )
  })

  it('computes plain-language diff for shortfall remedy: guest reduction (BUDGET-03)', () => {
    const infeasiblePlan: Plan = {
      ...basePlan,
      brief: { ...basePlan.brief, guestCount: 300 },
      isInfeasible: true,
      shortfallPaise: 5000000,
    }
    const resolvedPlan: Plan = {
      ...basePlan,
      brief: { ...basePlan.brief, guestCount: 220 },
      isInfeasible: false,
    }

    const result = computePlanDiff({
      prevPlan: infeasiblePlan,
      nextPlan: resolvedPlan,
      actionType: 'remedy_guests',
    })

    expect(result.summary).toBe(
      'Applied Remedy: Reduced guest count from 300 to 220 to restore feasible budget.'
    )
  })

  it('computes plain-language diff for shortfall remedy: flexible trimming (BUDGET-03)', () => {
    const infeasiblePlan: Plan = {
      ...basePlan,
      lines: [
        { ...basePlan.lines[0] },
        { ...basePlan.lines[1], currentPaise: 55000000 }, // +50,000
        { ...basePlan.lines[2] },
        { ...basePlan.lines[3] },
      ],
      isInfeasible: true,
      shortfallPaise: 5000000,
    }
    const resolvedPlan: Plan = {
      ...basePlan,
      lines: [
        { ...basePlan.lines[0] },
        { ...basePlan.lines[1], currentPaise: 55000000 },
        { ...basePlan.lines[2], currentPaise: 25000000 }, // trimmed Decor
        { ...basePlan.lines[3] },
      ],
      isInfeasible: false,
    }

    const result = computePlanDiff({
      prevPlan: infeasiblePlan,
      nextPlan: resolvedPlan,
      actionType: 'remedy_trim',
    })

    expect(result.summary).toBe(
      'Applied Remedy: Sequentially trimmed flexible lines (Decor) to absorb deficit while protecting floors.'
    )
  })
})
