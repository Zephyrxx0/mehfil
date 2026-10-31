import { describe, it, expect } from 'vitest'
import { commitQuote, previewQuoteDisplacement, unlockQuote } from '@/lib/engine/budget'
import {
  calculateBackwardsTimeline,
  completePrimaryBookingTask,
  reopenPrimaryBookingTask,
  CATEGORY_PRIMARY_TASK_MAP,
} from '@/lib/engine/timeline'
import type { Plan, BudgetLine, VendorQuote } from '@/lib/engine/types'

function createSamplePlan(): Plan {
  const lines: BudgetLine[] = [
    {
      id: 'line_venue',
      name: 'Venue & Banquet',
      category: 'venue',
      lineType: 'fixed',
      baselinePaise: 25000000, // ₹2,50,000
      currentPaise: 25000000,
    },
    {
      id: 'line_catering',
      name: 'Festive Catering',
      category: 'catering',
      lineType: 'per_guest',
      baselinePaise: 25000000, // ₹2,50,000
      currentPaise: 25000000,
      isProtected: true, // Protected Moment!
      protectedQuote: 'Food must be warm and abundant',
    },
    {
      id: 'line_decor',
      name: 'Stage & Mandap Decor',
      category: 'decor',
      lineType: 'flexible',
      baselinePaise: 20000000, // ₹2,00,000
      currentPaise: 20000000,
      elasticityRank: 3,
    },
    {
      id: 'line_photo',
      name: 'Photography & Cinema',
      category: 'photo_film',
      lineType: 'fixed',
      baselinePaise: 15000000, // ₹1,50,000
      currentPaise: 15000000,
    },
    {
      id: 'line_entertainment',
      name: 'Music & Sangeet DJ',
      category: 'entertainment',
      lineType: 'flexible',
      baselinePaise: 10000000, // ₹1,00,000
      currentPaise: 10000000,
      elasticityRank: 2,
    },
    {
      id: 'line_favors',
      name: 'Invites & Mithai Boxes',
      category: 'favors',
      lineType: 'fixed',
      baselinePaise: 5000000, // ₹50,000
      currentPaise: 5000000,
    },
    {
      id: 'line_misc',
      name: 'Miscellaneous & Sundries',
      category: 'misc',
      lineType: 'flexible',
      baselinePaise: 5000000, // ₹50,000
      currentPaise: 5000000,
      elasticityRank: 1,
    },
    {
      id: 'line_contingency',
      name: 'Contingency Buffer',
      category: 'contingency',
      lineType: 'buffer',
      baselinePaise: 5000000, // ₹50,000
      currentPaise: 5000000,
    },
  ]

  const totalBudgetPaise = lines.reduce((s, l) => s + l.currentPaise, 0) // ₹10,50,000 = 105,000,000 paise

  return {
    id: 'test_plan_01',
    brief: {
      title: 'Aarav & Diya Wedding',
      eventType: 'wedding',
      eventDate: '2026-11-20',
      city: 'Delhi NCR',
      guestCount: 200,
      totalBudgetPaise,
      protectedCategory: 'catering',
    },
    lines,
    totalBudgetPaise,
    baselineGuestCount: 200,
  }
}

function createSampleVenueQuote(): VendorQuote {
  return {
    id: 'quote_venue_01',
    vendorName: 'Royal Heritage Lawn & Haveli',
    category: 'venue',
    rawText: 'Lawn rental Rs 2,50,000. Overtime after 10 PM Rs 10,000.',
    statedInclusions: ['Valet parking', 'Housekeeping'],
    statedExclusions: ['GST', 'Overtime past midnight'],
    paymentTerms: '50% advance, 50% on event date',
    createdAt: '2026-10-28T10:00:00.000Z',
    omissionAdders: [
      {
        id: 'adder_overtime',
        name: 'Overtime buffer (after 10 PM)',
        category: 'venue',
        rateType: 'fixed',
        fixedPaise: 1000000, // ₹10,000
        amountPaise: 1000000,
        rationale: 'Late night music curfew',
        isEnabled: false,
      },
    ],
    droppedItems: [],
    tiers: [
      {
        tierId: 'tier_under',
        name: 'Daytime Lawn Only',
        lineItems: [
          {
            id: 'item_1',
            description: 'Lawn rental',
            amountStated: 225000,
            pricingType: 'flat',
            sourceAnchor: 'Rs 2,25,000',
            itemPaise: 22500000, // ₹2,25,000 (Saved ₹25,000 vs ₹2,50,000 baseline)
            isVerified: true,
          },
        ],
        baseTierPaise: 22500000,
        totalWithAddersPaise: 22500000,
        isStatedTotalConsistent: true,
      },
      {
        tierId: 'tier_moderate',
        name: 'Standard 12-Hour Lawn',
        lineItems: [
          {
            id: 'item_2',
            description: 'Main Lawn & Green Rooms',
            amountStated: 275000,
            pricingType: 'flat',
            sourceAnchor: 'Rs 2,75,000',
            itemPaise: 27500000, // ₹2,75,000 (Exceeds by ₹25,000)
            isVerified: true,
          },
        ],
        baseTierPaise: 27500000,
        totalWithAddersPaise: 27500000,
        isStatedTotalConsistent: true,
      },
      {
        tierId: 'tier_huge_excess',
        name: 'Grand Royal Estate Takeover',
        lineItems: [
          {
            id: 'item_3',
            description: 'Full Estate Takeover',
            amountStated: 600000,
            pricingType: 'flat',
            sourceAnchor: 'Rs 6,00,000',
            itemPaise: 60000000, // ₹6,00,000 (Exceeds by ₹3,50,000 — exceeds flexible donor capacity!)
            isVerified: true,
          },
        ],
        baseTierPaise: 60000000,
        totalWithAddersPaise: 60000000,
        isStatedTotalConsistent: true,
      },
    ],
  }
}

describe('previewQuoteDisplacement', () => {
  it('returns no displacement and no shortfall when quote is under budget', () => {
    const plan = createSamplePlan()
    const quote = createSampleVenueQuote()

    const preview = previewQuoteDisplacement(plan, quote, 'tier_under')
    expect(preview.deltaPaise).toBe(-2500000) // -₹25,000
    expect(preview.displacedDonors).toHaveLength(0)
    expect(preview.wouldTriggerShortfall).toBe(false)
    expect(preview.shortfallPaise).toBe(0)
  })

  it('accurately simulates donor line displacement in rank order (Misc -> Entertainment -> Decor)', () => {
    const plan = createSamplePlan()
    const quote = createSampleVenueQuote()

    // tier_moderate is ₹2,75,000 (+₹25,000 delta)
    const preview = previewQuoteDisplacement(plan, quote, 'tier_moderate')
    expect(preview.deltaPaise).toBe(2500000) // ₹25,000
    expect(preview.wouldTriggerShortfall).toBe(false)
    expect(preview.shortfallPaise).toBe(0)

    // Misc baseline is ₹50,000. 40% floor is ₹20,000. Available headroom is ₹30,000.
    // So the entire ₹25,000 is absorbed by Misc (Rank 1)!
    expect(preview.displacedDonors).toHaveLength(1)
    expect(preview.displacedDonors[0].category).toBe('misc')
    expect(preview.displacedDonors[0].displacedPaise).toBe(2500000)
  })

  it('flags wouldTriggerShortfall when excess exceeds flexible donor headroom', () => {
    const plan = createSamplePlan()
    const quote = createSampleVenueQuote()

    const preview = previewQuoteDisplacement(plan, quote, 'tier_huge_excess')
    expect(preview.deltaPaise).toBe(35000000) // +₹3,50,000
    expect(preview.wouldTriggerShortfall).toBe(true)
    expect(preview.shortfallPaise).toBeGreaterThan(0)
  })
})

describe('commitQuote', () => {
  it('locks currentPaise at actuals and records variancePaise', () => {
    const plan = createSamplePlan()
    const quote = createSampleVenueQuote()

    const updatedPlan = commitQuote(plan, quote, 'tier_under')
    const venueLine = updatedPlan.lines.find((l) => l.category === 'venue')!

    expect(venueLine.isCommitted).toBe(true)
    expect(venueLine.committedQuoteId).toBe(quote.id)
    expect(venueLine.committedVendor).toBe(quote.vendorName)
    expect(venueLine.committedTierName).toBe('Daytime Lawn Only')
    expect(venueLine.committedPaise).toBe(22500000)
    expect(venueLine.currentPaise).toBe(22500000)
    expect(venueLine.variancePaise).toBe(2500000) // Saved ₹25,000
    expect(venueLine.committedAt).toBeDefined()
  })

  it('positive variance (savings) buffers contingency and preserves totalBudgetPaise invariant', () => {
    const plan = createSamplePlan()
    const quote = createSampleVenueQuote()

    const initialContingency = plan.lines.find((l) => l.category === 'contingency')!.currentPaise
    const updatedPlan = commitQuote(plan, quote, 'tier_under')
    const newContingency = updatedPlan.lines.find((l) => l.category === 'contingency')!.currentPaise

    // Surplus of ₹25,000 added to contingency buffer
    expect(newContingency).toBe(initialContingency + 2500000)

    // Total budget invariant holds
    const totalCurrent = updatedPlan.lines.reduce((s, l) => s + l.currentPaise, 0)
    expect(totalCurrent).toBe(updatedPlan.totalBudgetPaise)
  })

  it('negative variance trims donors in rank order down to 40% floor', () => {
    const plan = createSamplePlan()
    const quote = createSampleVenueQuote()

    // Moderate tier: +₹25,000
    const updatedPlan = commitQuote(plan, quote, 'tier_moderate')
    const miscLine = updatedPlan.lines.find((l) => l.category === 'misc')!
    const entLine = updatedPlan.lines.find((l) => l.category === 'entertainment')!
    const decorLine = updatedPlan.lines.find((l) => l.category === 'decor')!

    // Misc (Rank 1) trimmed by ₹25,000 (from ₹50,000 down to ₹25,000)
    expect(miscLine.currentPaise).toBe(2500000)
    // Entertainment & Decor untouched because Misc covered the deficit
    expect(entLine.currentPaise).toBe(10000000)
    expect(decorLine.currentPaise).toBe(20000000)

    // Invariant holds
    const totalCurrent = updatedPlan.lines.reduce((s, l) => s + l.currentPaise, 0)
    expect(totalCurrent).toBe(updatedPlan.totalBudgetPaise)
  })

  it('Protected Moment is strictly immune to downward displacement (ADR-0004)', () => {
    const plan = createSamplePlan()
    const quote = createSampleVenueQuote()

    // Catering is protected: baseline ₹2,50,000
    const updatedPlan = commitQuote(plan, quote, 'tier_moderate')
    const cateringLine = updatedPlan.lines.find((l) => l.category === 'catering')!

    expect(cateringLine.isProtected).toBe(true)
    expect(cateringLine.currentPaise).toBe(25000000) // Exactly unchanged
  })

  it('excess outlay beyond donor capacity triggers Permissive Shortfall and 3 remedies', () => {
    const plan = createSamplePlan()
    const quote = createSampleVenueQuote()

    // tier_huge_excess is ₹6,00,000 (+₹3,50,000). Total flexible headroom across Misc, Ent, Decor is ₹2,16,000.
    const updatedPlan = commitQuote(plan, quote, 'tier_huge_excess')

    expect(updatedPlan.isInfeasible).toBe(true)
    expect(updatedPlan.shortfallPaise).toBeGreaterThan(0)
    expect(updatedPlan.remedies).toHaveLength(3)
    expect(updatedPlan.remedies?.map((r) => r.type)).toEqual([
      'increase_budget',
      'reduce_guests',
      'trim_elastic',
    ])

    // Flexible lines are clamped at their 40% floor
    const misc = updatedPlan.lines.find((l) => l.category === 'misc')!
    const ent = updatedPlan.lines.find((l) => l.category === 'entertainment')!
    const decor = updatedPlan.lines.find((l) => l.category === 'decor')!

    expect(misc.currentPaise).toBe(Math.round((misc.baselinePaise * 0.4) / 100) * 100)
    expect(ent.currentPaise).toBe(Math.round((ent.baselinePaise * 0.4) / 100) * 100)
    expect(decor.currentPaise).toBe(Math.round((decor.baselinePaise * 0.4) / 100) * 100)
  })

  it('active omission adders are factored into committedPaise', () => {
    const plan = createSamplePlan()
    const quote = createSampleVenueQuote()

    // Add active adder_overtime (+₹10,000)
    const updatedPlan = commitQuote(plan, quote, 'tier_under', ['adder_overtime'])
    const venueLine = updatedPlan.lines.find((l) => l.category === 'venue')!

    // Base was ₹2,25,000 + ₹10,000 overtime adder = ₹2,35,000
    expect(venueLine.committedPaise).toBe(23500000)
    expect(venueLine.variancePaise).toBe(1500000) // ₹2,50,000 - ₹2,35,000 = ₹15,000 saved
  })
})

describe('timeline synchronization', () => {
  const futureEventDate = '2026-11-20'
  const anchorToday = '2026-04-01'

  it('completes primary booking task on timeline and sets originQuoteId', () => {
    const schedule = calculateBackwardsTimeline(futureEventDate, 200, anchorToday)
    const quote = createSampleVenueQuote()

    const updatedSchedule = completePrimaryBookingTask(schedule, 'venue', quote.id)

    const allTasks = updatedSchedule.milestoneBands.flatMap((b) => b.tasks)
    const venueTask = allTasks.find((t) => t.id === CATEGORY_PRIMARY_TASK_MAP.venue)!

    expect(venueTask).toBeDefined()
    expect(venueTask.isCompleted).toBe(true)
    expect(venueTask.originQuoteId).toBe(quote.id)
    expect(venueTask.completedAt).toBeDefined()
  })

  it('re-opens booking task upon quote unlock', () => {
    const schedule = calculateBackwardsTimeline(futureEventDate, 200, anchorToday)
    const quote = createSampleVenueQuote()

    const bookedSchedule = completePrimaryBookingTask(schedule, 'venue', quote.id)
    const reopenedSchedule = reopenPrimaryBookingTask(bookedSchedule, 'venue')

    const allTasks = reopenedSchedule.milestoneBands.flatMap((b) => b.tasks)
    const venueTask = allTasks.find((t) => t.id === CATEGORY_PRIMARY_TASK_MAP.venue)!

    expect(venueTask.isCompleted).toBe(false)
    expect(venueTask.originQuoteId).toBeUndefined()
    expect(venueTask.completedAt).toBeUndefined()
  })
})

describe('unlockQuote', () => {
  it('clears commitment metadata and restores line allocation', () => {
    const plan = createSamplePlan()
    const quote = createSampleVenueQuote()

    const committedPlan = commitQuote(plan, quote, 'tier_under')
    expect(committedPlan.lines.find((l) => l.category === 'venue')!.isCommitted).toBe(true)

    const unlockedPlan = unlockQuote(committedPlan, 'venue')
    const venueLine = unlockedPlan.lines.find((l) => l.category === 'venue')!

    expect(venueLine.isCommitted).toBe(false)
    expect(venueLine.committedQuoteId).toBeUndefined()
    expect(venueLine.committedVendor).toBeUndefined()
    expect(venueLine.currentPaise).toBe(venueLine.baselinePaise)

    // Invariant holds
    const totalCurrent = unlockedPlan.lines.reduce((s, l) => s + l.currentPaise, 0)
    expect(totalCurrent).toBe(unlockedPlan.totalBudgetPaise)
  })
})
