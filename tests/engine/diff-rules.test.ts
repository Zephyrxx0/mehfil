import { describe, it, expect } from 'vitest'
import {
  budgetChangeRule,
  defaultRule,
  describeScaling,
  guestScaleRule,
  ideaAdoptedRule,
  ideaRetractedRule,
  protectedLockRule,
  remedyBudgetRule,
  remedyGuestsRule,
  remedyTrimRule,
  type DiffContext,
} from '@/lib/engine/diff'
import type { IdeaDisplacementRecord, Plan } from '@/lib/engine/types'

const plan: Plan = {
  id: 'p',
  brief: {
    title: 'T',
    eventType: 'wedding',
    eventDate: '2026-12-10',
    city: 'Delhi',
    guestCount: 100,
    totalBudgetPaise: 1000,
    protectedCategory: 'catering',
  },
  lines: [
    {
      id: 'l-decor',
      name: 'Decor',
      category: 'decor',
      lineType: 'flexible',
      baselinePaise: 600,
      currentPaise: 600,
    },
  ],
  totalBudgetPaise: 1000,
  baselineGuestCount: 100,
}

const idea: IdeaDisplacementRecord = {
  ideaId: 'i1',
  title: 'Floral arch',
  targetCategory: 'decor',
  costPaise: 50000,
  displacedDonors: [{ lineId: 'l-decor', category: 'decor', displacedPaise: 50000 }],
  adoptedAt: '2026-01-01T00:00:00.000Z',
}

function ctx(over: Partial<DiffContext> = {}): DiffContext {
  return {
    prevPlan: plan,
    nextPlan: plan,
    actionType: undefined,
    deltas: [],
    donorCategories: [],
    recipientCategories: [],
    isFloorProtected: true,
    protectedSuffix: '; Protected Moment held firm',
    prevIdeas: [],
    nextIdeas: [],
    ...over,
  }
}

describe('diff summary rules', () => {
  it('describeScaling covers all four donor/recipient combinations', () => {
    expect(describeScaling(['A'], ['B'])).toBe(' Scaled A by drawing from B')
    expect(describeScaling(['A', 'C'], [])).toBe(' Scaled A, C')
    expect(describeScaling([], ['B'])).toBe(' Scaled down B')
    expect(describeScaling([], [])).toBe('')
  })

  it('ideaAdoptedRule falls back to displaced donor names and requires adopted ideas', () => {
    expect(ideaAdoptedRule(ctx({ actionType: 'adopt_idea' }))).toBeNull()
    const out = ideaAdoptedRule(ctx({ nextIdeas: [idea] }))
    expect(out?.isFloorProtected).toBe(true)
    expect(out?.summary).toContain('funded by trimming Decor in elasticity order')
  })

  it('ideaRetractedRule names recipients, else displaced donors', () => {
    expect(ideaRetractedRule(ctx())).toBeNull()
    const viaDonors = ideaRetractedRule(ctx({ prevIdeas: [idea] }))
    expect(viaDonors?.summary).toBe(
      "Retracted curated idea 'Floral arch', restoring exact funds back to Decor."
    )
    const viaRecipients = ideaRetractedRule(
      ctx({ actionType: 'retract_idea', prevIdeas: [idea], recipientCategories: ['Venue'] })
    )
    expect(viaRecipients?.summary).toContain('back to Venue.')
  })

  it('remedy rules apply on explicit action type', () => {
    const next = { ...plan, totalBudgetPaise: 1500 }
    expect(remedyBudgetRule(ctx({ actionType: 'remedy_budget', nextPlan: next }))?.summary).toBe(
      'Applied Remedy: Increased total budget by ₹5 to balance shortfall.'
    )
    expect(remedyGuestsRule(ctx({ actionType: 'remedy_guests' }))?.summary).toContain(
      'Reduced guest count from 100 to 100'
    )
    expect(
      remedyTrimRule(ctx({ actionType: 'remedy_trim', donorCategories: ['Decor'] }))?.summary
    ).toContain('trimmed flexible lines (Decor)')
  })

  it('remedy rules need a resolved shortfall when no action type is given', () => {
    const infeasible = { ...plan, isInfeasible: true }
    const feasible = { ...plan, isInfeasible: false }
    expect(remedyTrimRule(ctx({ donorCategories: ['Decor'] }))).toBeNull()
    expect(
      remedyTrimRule(ctx({ prevPlan: infeasible, nextPlan: feasible, donorCategories: ['Decor'] }))
    ).not.toBeNull()
    expect(
      remedyTrimRule(ctx({ prevPlan: infeasible, nextPlan: feasible, donorCategories: [] }))
    ).toBeNull()
    expect(
      remedyBudgetRule(
        ctx({ prevPlan: infeasible, nextPlan: { ...feasible, totalBudgetPaise: 2000 } })
      )
    ).not.toBeNull()
    expect(
      remedyGuestsRule(
        ctx({
          prevPlan: infeasible,
          nextPlan: { ...feasible, brief: { ...plan.brief, guestCount: 80 } },
        })
      )
    ).not.toBeNull()
  })

  it('protectedLockRule fires on action or category change', () => {
    expect(protectedLockRule(ctx())).toBeNull()
    const next = { ...plan, brief: { ...plan.brief, protectedCategory: 'photo_film' as const } }
    expect(protectedLockRule(ctx({ nextPlan: next }))?.summary).toBe(
      'Locked Protected Moment for photo film; non-negotiable floor enforced'
    )
  })

  it('guestScaleRule signs the delta and appends the protected suffix', () => {
    expect(guestScaleRule(ctx())).toBeNull()
    const next = { ...plan, brief: { ...plan.brief, guestCount: 80 } }
    expect(guestScaleRule(ctx({ nextPlan: next, donorCategories: ['Decor'] }))?.summary).toBe(
      'Scaled guest count to 80 (-20 guests). Scaled down Decor; Protected Moment held firm.'
    )
  })

  it('budgetChangeRule picks the verb from the sign of the change', () => {
    expect(budgetChangeRule(ctx())).toBeNull()
    const lower = { ...plan, totalBudgetPaise: 500 }
    expect(budgetChangeRule(ctx({ nextPlan: lower }))?.summary).toMatch(/^Decreased total budget/)
    expect(budgetChangeRule(ctx({ actionType: 'budget_change' }))?.summary).toMatch(
      /^Increased total budget/
    )
  })

  it('defaultRule counts deltas or reports harmony', () => {
    expect(defaultRule(ctx()).summary).toBe('All allocations balanced in harmony.')
    const d = [{ category: 'Decor', deltaPaise: -1 }]
    expect(defaultRule(ctx({ deltas: d })).summary).toBe(
      'Adjusted allocations across 1 categories; Protected Moment held firm.'
    )
  })
})
