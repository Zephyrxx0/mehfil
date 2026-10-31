import { describe, expect, it } from 'vitest'
import {
  adoptEdit,
  buildChangeRecord,
  guestCountEdit,
  protectedMomentEdit,
  remedyEdit,
  resolveUndo,
  retractEdit,
  vendorUnlockEdit,
  withEnvironmentalAnalysis,
} from '@/components/workspace/hooks/planEdits'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import type { CuratedIdea, EventBrief, ShortfallRemedy } from '@/lib/engine/types'

const BRIEF: EventBrief = {
  title: 'Pure edits',
  eventType: 'wedding',
  eventDate: '2027-09-09',
  city: 'Delhi',
  guestCount: 200,
  totalBudgetPaise: 200_000_000,
  protectedCategory: 'catering',
}
const base = instantiatePlanFromBrief(BRIEF)

const IDEA: CuratedIdea = {
  id: 'idea-1',
  title: 'Marigold arch',
  costPaise: 500_000,
  category: 'decor',
  eventTypes: ['wedding'],
} as CuratedIdea

const sum = (p: typeof base) => p.lines.reduce((s, l) => s + l.currentPaise, 0)

describe('planEdits: guest count', () => {
  it('returns null for an unchanged count', () => {
    expect(guestCountEdit(base, 200)).toBeNull()
  })

  it('describes growth with a plus sign and shrinkage without', () => {
    expect(guestCountEdit(base, 230)?.description).toBe(
      'Scaled guest count from 200 to 230 (+30 guests)'
    )
    expect(guestCountEdit(base, 180)?.description).toBe(
      'Scaled guest count from 200 to 180 (-20 guests)'
    )
  })

  it('keeps the total exact', () => {
    const edit = guestCountEdit(base, 333)
    expect(edit?.next.brief.guestCount).toBe(333)
    expect(sum(edit!.next)).toBe(edit!.next.totalBudgetPaise)
  })
})

describe('planEdits: moments, ideas, vendors', () => {
  it('marks a protected-moment lock as floor protected', () => {
    const edit = protectedMomentEdit(base, 'decor')
    expect(edit.isFloorProtected).toBe(true)
    expect(edit.actionType).toBe('protected_lock')
    expect(edit.description).toContain('decor')
  })

  it('offers a quick undo when adopting and retracting an idea', () => {
    const adopted = adoptEdit(base, IDEA)
    expect(adopted.quickUndoMessage).toBe(adopted.description)
    expect(adopted.description).toMatch(/^Adopted Marigold arch \(/)

    const retracted = retractEdit(adopted.next, IDEA.id)
    expect(retracted.description).toBe('Retracted Marigold arch')
    expect(retracted.quickUndoMessage).toBe('Retracted Marigold arch')
  })

  it('falls back to "idea" when retracting an unknown id', () => {
    expect(retractEdit(base, 'nope').description).toBe('Retracted idea')
  })

  it('returns null when unlocking a category with nothing committed', () => {
    expect(vendorUnlockEdit(base, 'catering')).toBeNull()
  })
})

describe('planEdits: remedies', () => {
  const remedy = (type: ShortfallRemedy['type'], deltaValue: number): ShortfallRemedy => ({
    type,
    title: type,
    description: type,
    deltaValue,
  })

  it('widens the budget and records a Total Budget delta', () => {
    const edit = remedyEdit(base, remedy('increase_budget', 5_000_000))
    expect(edit.next.totalBudgetPaise).toBe(base.totalBudgetPaise + 5_000_000)
    expect(edit.next.brief.totalBudgetPaise).toBe(base.totalBudgetPaise + 5_000_000)
    expect(edit.deltas).toEqual([{ category: 'Total Budget', deltaPaise: 5_000_000 }])
    expect(sum(edit.next)).toBe(edit.next.totalBudgetPaise)
  })

  it('trims flexible lines for any other remedy', () => {
    const edit = remedyEdit(base, remedy('trim_elastic', 0))
    expect(edit.description).toBe('Applied remedy: Trimmed flexible lines to their floors')
    expect(edit.quickUndoMessage).toBe('Applied remedy: Trimmed flexible lines')
  })
})

describe('planEdits: change records and environment', () => {
  it('records the plan it came from, and derives the floor flag from the plan', () => {
    const edit = guestCountEdit(base, 210)!
    const record = buildChangeRecord(base, edit)
    expect(record.previousSnapshot).toBe(base)
    expect(record.isFloorProtected).toBe(true)
    expect(record.deltas).toEqual(edit.deltas ?? record.deltas)
  })

  it('adds the environmental analysis once and keeps an existing one', () => {
    const analysed = withEnvironmentalAnalysis(base)
    expect(analysed.environmentalAnalysis).toBeDefined()
    expect(withEnvironmentalAnalysis(analysed)).toBe(analysed)
  })
})

describe('planEdits: resolveUndo', () => {
  const first = buildChangeRecord(base, guestCountEdit(base, 210)!)
  const secondPlan = guestCountEdit(base, 210)!.next
  const second = buildChangeRecord(secondPlan, guestCountEdit(secondPlan, 220)!)
  const history = [second, first] // newest first

  it('undoes the newest entry and drops it from the history', () => {
    const step = resolveUndo({ current: base, changes: history, previousGuestCount: 200 })
    expect(step).toEqual({ plan: second.previousSnapshot, changes: [first], syncGuestCount: true })
  })

  it('undoes to a chosen entry and drops it and everything newer', () => {
    const step = resolveUndo({ current: base, changes: history, previousGuestCount: 200 }, first)
    expect(step?.plan).toBe(first.previousSnapshot)
    expect(step?.changes).toEqual([])
  })

  it('trusts an explicit index over a lookup', () => {
    const step = resolveUndo({ current: base, changes: history, previousGuestCount: 200 }, first, 0)
    expect(step?.changes).toEqual([first])
  })

  it('leaves the history alone when the entry is not in it', () => {
    const stranger = buildChangeRecord(base, guestCountEdit(base, 250)!)
    const step = resolveUndo({ current: base, changes: history, previousGuestCount: 200 }, stranger)
    expect(step?.plan).toBe(stranger.previousSnapshot)
    expect(step?.changes).toBeUndefined()
  })

  it('falls back to the remembered guest count when the history is empty', () => {
    const grown = guestCountEdit(base, 260)!.next
    const step = resolveUndo({ current: grown, changes: [], previousGuestCount: 200 })
    expect(step?.plan.brief.guestCount).toBe(200)
    expect(step?.changes).toBeUndefined()
    expect(step?.syncGuestCount).toBe(false)
  })

  it('does nothing when there is nothing to go back to', () => {
    expect(resolveUndo({ current: base, changes: [], previousGuestCount: undefined })).toBeNull()
  })
})
