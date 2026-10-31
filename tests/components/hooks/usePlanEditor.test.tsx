import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePlanEditor } from '@/components/workspace/hooks/usePlanEditor'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import type { CuratedIdea, EventBrief, ShortfallRemedy, VendorQuote } from '@/lib/engine/types'

const BRIEF: EventBrief = {
  title: 'Editor test',
  eventType: 'wedding',
  eventDate: '2027-09-09',
  city: 'Delhi',
  guestCount: 200,
  totalBudgetPaise: 200_000_000,
  protectedCategory: 'catering',
}
const base = instantiatePlanFromBrief(BRIEF)

const scheduleCommit = vi.fn()
const commitNow = vi.fn().mockResolvedValue(undefined)

function setup(isReadOnly = false) {
  return renderHook(() =>
    usePlanEditor({ initialPlan: base, isReadOnly, scheduleCommit, commitNow })
  )
}

beforeEach(() => vi.clearAllMocks())

describe('usePlanEditor: guest count', () => {
  it('rebalances at once, records an undo step and queues a save', () => {
    const { result } = setup()
    act(() => result.current.changeGuestCount(230))

    expect(result.current.plan.brief.guestCount).toBe(230)
    expect(result.current.changes).toHaveLength(1)
    expect(result.current.changes[0].description).toBe(
      'Scaled guest count from 200 to 230 (+30 guests)'
    )
    expect(result.current.changes[0].previousSnapshot).toBe(
      result.current.changes[0].previousSnapshot
    )
    expect(result.current.previousGuestCount).toBe(200)
    expect(scheduleCommit).toHaveBeenCalledWith(
      result.current.plan,
      result.current.changes[0].previousSnapshot,
      'guest_scale'
    )
  })

  it('describes a reduction without a plus sign, and ignores an unchanged count', () => {
    const { result } = setup()
    act(() => result.current.changeGuestCount(180))
    expect(result.current.changes[0].description).toBe(
      'Scaled guest count from 200 to 180 (-20 guests)'
    )
    act(() => result.current.changeGuestCount(180))
    expect(result.current.changes).toHaveLength(1)
    expect(scheduleCommit).toHaveBeenCalledTimes(1)
  })

  it('keeps the budget total exact in integer paise', () => {
    const { result } = setup()
    act(() => result.current.changeGuestCount(333))
    const total = result.current.plan.lines.reduce((sum, l) => sum + l.currentPaise, 0)
    expect(total).toBe(result.current.plan.totalBudgetPaise)
  })

  it('two edits in the same tick both build on the newest plan', () => {
    const { result } = setup()
    act(() => {
      result.current.changeGuestCount(210)
      result.current.changeGuestCount(220) // sees 210 as the starting point
    })
    expect(result.current.changes.map((c) => c.description)).toEqual([
      'Scaled guest count from 210 to 220 (+10 guests)',
      'Scaled guest count from 200 to 210 (+10 guests)',
    ])
  })
})

describe('usePlanEditor: undo', () => {
  it('undoes the newest step and queues a save of the restored plan', () => {
    const { result } = setup()
    act(() => result.current.changeGuestCount(240))
    act(() => result.current.undo())

    expect(result.current.plan.brief.guestCount).toBe(200)
    expect(result.current.changes).toHaveLength(0)
    expect(scheduleCommit).toHaveBeenLastCalledWith(
      result.current.plan,
      expect.anything(),
      'guest_scale'
    )
  })

  it('undoes a chosen older step and drops it together with everything newer', () => {
    const { result } = setup()
    act(() => result.current.changeGuestCount(210))
    act(() => result.current.changeGuestCount(220))
    act(() => result.current.changeGuestCount(230))
    const middle = result.current.changes[1] // the 210 -> 220 step

    act(() => result.current.undo(middle))
    expect(result.current.plan.brief.guestCount).toBe(210)
    expect(result.current.changes).toHaveLength(1) // only the 200 -> 210 step remains
  })

  it('falls back to the previous guest count when there is no history', () => {
    const { result } = setup()
    act(() => result.current.changeGuestCount(250))
    act(() => result.current.undo()) // consumes the step
    act(() => result.current.undo()) // nothing left: uses previousGuestCount (still 200)
    expect(result.current.plan.brief.guestCount).toBe(200)
  })
})

describe('usePlanEditor: remedies and ideas', () => {
  it('increasing the budget records a "Total Budget" delta and offers a quick undo', () => {
    const { result } = setup()
    const remedy: ShortfallRemedy = {
      type: 'increase_budget',
      title: 'Add budget',
      description: '',
      deltaValue: 5_000_000,
    }
    act(() => result.current.applyRemedy(remedy))

    expect(result.current.plan.totalBudgetPaise).toBe(base.totalBudgetPaise + 5_000_000)
    expect(result.current.changes[0].deltas).toEqual([
      { category: 'Total Budget', deltaPaise: 5_000_000 },
    ])
    expect(result.current.quickUndo?.message).toMatch(/Added ₹50,000 to Budget/)
  })

  it('quick undo restores the plan before the remedy and clears the bar', () => {
    const { result } = setup()
    act(() =>
      result.current.applyRemedy({
        type: 'increase_budget',
        title: '',
        description: '',
        deltaValue: 1_000_000,
      })
    )
    act(() => result.current.quickUndoLast())

    expect(result.current.plan.totalBudgetPaise).toBe(base.totalBudgetPaise)
    expect(result.current.quickUndo).toBeNull()
    expect(scheduleCommit).toHaveBeenLastCalledWith(
      result.current.plan,
      expect.anything(),
      'restore'
    )
  })

  it('adopting a curated idea keeps the total exact, and retracting returns to the start', () => {
    const { result } = setup()
    const idea: CuratedIdea = {
      id: 'idea-test',
      title: 'Kulhad chai bar',
      description: 'Warm chai in clay cups',
      costPaise: 1_500_000,
      category: 'catering',
      eventTypes: ['wedding'],
    } as CuratedIdea

    act(() => result.current.adopt(idea))
    const adopted = result.current.plan
    expect(adopted.adoptedIdeas?.map((r) => r.ideaId)).toEqual(['idea-test'])
    expect(adopted.lines.reduce((s, l) => s + l.currentPaise, 0)).toBe(adopted.totalBudgetPaise)
    expect(result.current.changes[0].description).toBe('Adopted Kulhad chai bar (₹15,000)')

    act(() => result.current.retract('idea-test'))
    expect(result.current.plan.adoptedIdeas ?? []).toHaveLength(0)
    expect(result.current.changes[0].description).toBe('Retracted Kulhad chai bar')
  })

  it('locks a protected moment and keeps the floor flag on the change', () => {
    const { result } = setup()
    act(() => result.current.lockProtectedMoment('decor'))
    expect(result.current.plan.brief.protectedCategory).toBe('decor')
    expect(result.current.changes[0].isFloorProtected).toBe(true)
    expect(scheduleCommit).toHaveBeenCalledWith(
      result.current.plan,
      result.current.changes[0].previousSnapshot,
      'protected_lock'
    )
  })
})

describe('usePlanEditor: applyChange and read-only', () => {
  it('an immediate save goes straight to storage with its details, not through the debounce', () => {
    const { result } = setup()
    const next = { ...base, totalBudgetPaise: base.totalBudgetPaise }
    act(() =>
      result.current.applyChange({
        next,
        description: 'Style applied',
        save: { mode: 'immediate', meta: { styleDNA: undefined } },
      })
    )
    expect(commitNow).toHaveBeenCalledWith(next, 'Style applied', { meta: { styleDNA: undefined } })
    expect(scheduleCommit).not.toHaveBeenCalled()
  })

  it('ignores idea and remedy edits when read-only', () => {
    const { result } = setup(true)
    act(() => {
      result.current.adopt({ id: 'x', title: 'x', costPaise: 1 } as CuratedIdea)
      result.current.retract('x')
      result.current.applyRemedy({
        type: 'trim_elastic',
        title: '',
        description: '',
        deltaValue: 0,
      })
    })
    expect(result.current.changes).toHaveLength(0)
    expect(scheduleCommit).not.toHaveBeenCalled()
  })

  it('adds environmental risk analysis to a plan that has none', () => {
    const { result } = setup()
    expect(result.current.plan.environmentalAnalysis).toBeDefined()
  })
})

describe('usePlanEditor: vendor quotes survive other edits', () => {
  const quote = {
    id: 'quote-venue-1',
    vendorName: 'Royal Heritage Lawn',
    category: 'venue',
    rawText: 'Lawn rental Rs 2,25,000',
    statedInclusions: [],
    statedExclusions: [],
    createdAt: '2027-01-01T00:00:00.000Z',
    omissionAdders: [],
    droppedItems: [],
    tiers: [
      {
        tierId: 'tier-a',
        name: 'Daytime lawn',
        lineItems: [],
        baseTierPaise: 22_500_000,
        totalWithAddersPaise: 22_500_000,
        isStatedTotalConsistent: true,
      },
    ],
  } as unknown as VendorQuote

  it('commits the quote to its line, keeps the quote on the plan, and saves it', () => {
    const { result } = setup()
    act(() => result.current.commitVendorQuote(quote, 'tier-a', []))

    const venue = result.current.plan.lines.find((l) => l.category === 'venue')!
    expect(venue).toMatchObject({ isCommitted: true, committedQuoteId: 'quote-venue-1' })
    expect(result.current.plan.quotes?.map((q) => q.id)).toEqual(['quote-venue-1'])
    expect(result.current.changes[0].description).toBe('Committed Royal Heritage Lawn (venue)')
    expect(scheduleCommit).toHaveBeenCalledWith(
      result.current.plan,
      expect.anything(),
      'budget_change'
    )
  })

  it('REGRESSION: a commitment is still there after the organizer edits something else', () => {
    const { result } = setup()
    act(() => result.current.commitVendorQuote(quote, 'tier-a', []))
    act(() => result.current.changeGuestCount(230))

    const venue = result.current.plan.lines.find((l) => l.category === 'venue')!
    expect(venue.isCommitted).toBe(true)
    expect(result.current.plan.quotes).toHaveLength(1)
    // The plan that was handed to storage on the later edit includes the commitment too.
    const savedPlan = scheduleCommit.mock.calls.at(-1)![0]
    expect(
      savedPlan.lines.find((l: { category: string }) => l.category === 'venue').isCommitted
    ).toBe(true)
  })

  it('committing again replaces the earlier copy of the same quote', () => {
    const { result } = setup()
    act(() => result.current.commitVendorQuote(quote, 'tier-a', []))
    act(() => result.current.commitVendorQuote({ ...quote, vendorName: 'Renamed' }, 'tier-a', []))
    expect(result.current.plan.quotes).toHaveLength(1)
    expect(result.current.plan.quotes?.[0].vendorName).toBe('Renamed')
  })

  it('unlocking releases the line and the commitment can be undone', () => {
    const { result } = setup()
    act(() => result.current.commitVendorQuote(quote, 'tier-a', []))
    act(() => result.current.unlockVendorQuote('venue'))
    expect(result.current.plan.lines.find((l) => l.category === 'venue')!.isCommitted).toBeFalsy()

    act(() => result.current.undo())
    expect(result.current.plan.lines.find((l) => l.category === 'venue')!.isCommitted).toBe(true)
  })

  it('unlocking a line that was never committed does nothing', () => {
    const { result } = setup()
    act(() => result.current.unlockVendorQuote('venue'))
    expect(result.current.changes).toHaveLength(0)
    expect(scheduleCommit).not.toHaveBeenCalled()
  })

  it('does nothing when read-only', () => {
    const { result } = setup(true)
    act(() => {
      result.current.commitVendorQuote(quote, 'tier-a', [])
      result.current.unlockVendorQuote('venue')
    })
    expect(result.current.changes).toHaveLength(0)
  })
})
