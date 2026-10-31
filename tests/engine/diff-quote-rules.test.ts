import { describe, expect, it } from 'vitest'
import { commitQuote, unlockQuote } from '@/lib/engine/budget'
import { computePlanDiff, quoteCommitmentRule, type DiffContext } from '@/lib/engine/diff'
import type { BudgetLine, Plan, VendorQuote } from '@/lib/engine/types'

const line = (over: Partial<BudgetLine> & Pick<BudgetLine, 'id' | 'category'>): BudgetLine => ({
  name: over.category,
  lineType: 'flexible',
  baselinePaise: 10_000_000,
  currentPaise: 10_000_000,
  ...over,
})

function makePlan(): Plan {
  const lines: BudgetLine[] = [
    line({ id: 'l-venue', category: 'venue', name: 'Venue', lineType: 'fixed' }),
    line({
      id: 'l-catering',
      category: 'catering',
      name: 'Catering',
      lineType: 'per_guest',
      isProtected: true,
    }),
    line({
      id: 'l-decor',
      category: 'decor',
      name: 'Decor',
      elasticityRank: 3,
      baselinePaise: 20_000_000,
      currentPaise: 20_000_000,
    }),
    line({
      id: 'l-misc',
      category: 'misc',
      name: 'Miscellaneous',
      elasticityRank: 1,
      baselinePaise: 20_000_000,
      currentPaise: 20_000_000,
    }),
    line({
      id: 'l-photo',
      category: 'photo_film',
      name: 'Photo & Film',
      lineType: 'fixed',
    }),
  ]
  const total = lines.reduce((sum, l) => sum + l.currentPaise, 0)
  return {
    id: 'p-quote',
    brief: {
      title: 'Quote diff',
      eventType: 'wedding',
      eventDate: '2027-02-10',
      city: 'Jaipur',
      guestCount: 150,
      totalBudgetPaise: total,
      protectedCategory: 'catering',
    },
    lines,
    totalBudgetPaise: total,
    baselineGuestCount: 150,
  }
}

function makeQuote(over: Partial<VendorQuote> & { totalPaise: number }): VendorQuote {
  const { totalPaise, ...rest } = over
  return {
    id: 'q-1',
    vendorName: 'Royal Heritage Haveli',
    category: 'venue',
    rawText: 'quote',
    statedInclusions: [],
    statedExclusions: [],
    createdAt: '2027-01-01T00:00:00.000Z',
    omissionAdders: [],
    droppedItems: [],
    tiers: [
      {
        tierId: 't1',
        name: 'Standard',
        lineItems: [],
        baseTierPaise: totalPaise,
        totalWithAddersPaise: totalPaise,
        isStatedTotalConsistent: true,
      },
    ],
    ...rest,
  }
}

describe('quote commitment summaries', () => {
  it('names the vendor, category and amount when a quote is booked', () => {
    const prev = makePlan()
    const next = commitQuote(prev, makeQuote({ totalPaise: 29_500_000 }), 't1')

    const result = computePlanDiff({ prevPlan: prev, nextPlan: next, actionType: 'budget_change' })

    expect(result.summary).toBe(
      'Booked Royal Heritage Haveli for venue at ₹2,95,000; other flexible lines adjusted to fit'
    )
    expect(result.summary).not.toContain('₹0')
    expect(result.summary).not.toContain('Increased total budget')
  })

  it('says the plan returned to normal when a booking is released', () => {
    const base = makePlan()
    const committed = commitQuote(base, makeQuote({ totalPaise: 29_500_000 }), 't1')
    const released = unlockQuote(committed, 'venue')

    const result = computePlanDiff({
      prevPlan: committed,
      nextPlan: released,
      actionType: 'budget_change',
    })

    expect(result.summary).toBe('Released the venue booking; allocation returned to the plan')
  })

  it('uses the plain category label for multi-word categories', () => {
    const prev = makePlan()
    const quote = makeQuote({
      id: 'q-photo',
      vendorName: 'Lens & Light',
      category: 'photo_film',
      totalPaise: 12_000_000,
    })
    const next = commitQuote(prev, quote, 't1')

    const summary = computePlanDiff({
      prevPlan: prev,
      nextPlan: next,
      actionType: 'budget_change',
    }).summary

    expect(summary).toBe(
      'Booked Lens & Light for photo film at ₹1,20,000; other flexible lines adjusted to fit'
    )
  })

  it('omits the "adjusted to fit" clause when no other line moved', () => {
    const prev = makePlan()
    // Same price as the current allocation, so nothing else has to move.
    const next = commitQuote(prev, makeQuote({ totalPaise: 10_000_000 }), 't1')

    const summary = computePlanDiff({
      prevPlan: prev,
      nextPlan: next,
      actionType: 'budget_change',
    }).summary

    expect(summary).toBe('Booked Royal Heritage Haveli for venue at ₹1,00,000')
  })

  it('describes switching to another quote as a new booking', () => {
    const first = commitQuote(makePlan(), makeQuote({ totalPaise: 20_000_000 }), 't1')
    const second = commitQuote(
      first,
      makeQuote({ id: 'q-2', vendorName: 'Lakeview Palace', totalPaise: 18_000_000 }),
      't1'
    )

    const summary = computePlanDiff({
      prevPlan: first,
      nextPlan: second,
      actionType: 'budget_change',
    }).summary

    expect(summary).toMatch(/^Booked Lakeview Palace for venue at ₹1,80,000/)
  })

  it('also applies to untagged diffs', () => {
    const prev = makePlan()
    const next = commitQuote(prev, makeQuote({ totalPaise: 29_500_000 }), 't1')

    expect(computePlanDiff({ prevPlan: prev, nextPlan: next }).summary).toMatch(
      /^Booked Royal Heritage Haveli/
    )
  })

  it('keeps reporting the floor flag from the plan', () => {
    const prev = makePlan()
    const next = commitQuote(prev, makeQuote({ totalPaise: 29_500_000 }), 't1')

    expect(
      computePlanDiff({ prevPlan: prev, nextPlan: next, actionType: 'budget_change' })
        .isFloorProtected
    ).toBe(true)
  })

  it('beats the shortfall-trim rule when releasing a booking clears a shortfall', () => {
    const committed = commitQuote(makePlan(), makeQuote({ totalPaise: 29_500_000 }), 't1')
    const prev: Plan = { ...committed, isInfeasible: true, shortfallPaise: 100 }
    const released = unlockQuote(committed, 'venue')
    expect(released.isInfeasible).toBe(false)

    const summary = computePlanDiff({
      prevPlan: prev,
      nextPlan: released,
      actionType: 'budget_change',
    }).summary

    expect(summary).toBe('Released the venue booking; allocation returned to the plan')
  })

  it('leaves a plain budget change untouched', () => {
    const prev = makePlan()
    const widened: Plan = {
      ...prev,
      totalBudgetPaise: prev.totalBudgetPaise + 100_000,
      brief: { ...prev.brief, totalBudgetPaise: prev.totalBudgetPaise + 100_000 },
    }

    expect(
      computePlanDiff({ prevPlan: prev, nextPlan: widened, actionType: 'budget_change' }).summary
    ).toBe(
      'Increased total budget by ₹1,000; apportioned across flexible lines; Protected Moment held firm.'
    )
  })
})

describe('quoteCommitmentRule', () => {
  const plan = makePlan()
  const booked = commitQuote(plan, makeQuote({ totalPaise: 29_500_000 }), 't1')
  const ctx = (over: Partial<DiffContext> = {}): DiffContext => ({
    prevPlan: plan,
    nextPlan: booked,
    actionType: 'budget_change',
    deltas: [],
    donorCategories: [],
    recipientCategories: [],
    isFloorProtected: false,
    protectedSuffix: '',
    prevIdeas: [],
    nextIdeas: [],
    ...over,
  })

  it('returns null when no booking changed', () => {
    expect(quoteCommitmentRule(ctx({ nextPlan: plan }))).toBeNull()
  })

  it.each([
    'guest_scale',
    'protected_lock',
    'remedy_budget',
    'remedy_guests',
    'remedy_trim',
  ] as const)('defers to the %s action', (actionType) => {
    expect(quoteCommitmentRule(ctx({ actionType }))).toBeNull()
  })

  it('defers an untagged diff that also changed the guest count', () => {
    const scaled: Plan = { ...booked, brief: { ...booked.brief, guestCount: 200 } }
    expect(quoteCommitmentRule(ctx({ actionType: undefined, nextPlan: scaled }))).toBeNull()
  })

  it('defers an untagged diff that also moved the Protected Moment', () => {
    const moved: Plan = { ...booked, brief: { ...booked.brief, protectedCategory: 'decor' } }
    expect(quoteCommitmentRule(ctx({ actionType: undefined, nextPlan: moved }))).toBeNull()
  })

  it('falls back to neutral wording when the vendor name is missing', () => {
    const nameless: Plan = {
      ...booked,
      lines: booked.lines.map((l) =>
        l.category === 'venue' ? { ...l, committedVendor: undefined, committedPaise: undefined } : l
      ),
    }
    const out = quoteCommitmentRule(ctx({ nextPlan: nameless }))
    expect(out?.summary).toMatch(/^Booked a vendor for venue at ₹2,95,000/)
  })
})
