import { describe, expect, it } from 'vitest'
import { computeCategoryDeltas, computeLineDeltas } from '@/lib/engine/diff'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { rebalanceGuestCount } from '@/lib/engine/budget'
import type { EventBrief, Plan } from '@/lib/engine/types'

const BRIEF: EventBrief = {
  title: 'Deltas',
  eventType: 'wedding',
  eventDate: '2027-09-09',
  city: 'Delhi',
  guestCount: 200,
  totalBudgetPaise: 200_000_000,
  protectedCategory: 'catering',
}
const base = instantiatePlanFromBrief(BRIEF)

describe('computeLineDeltas / computeCategoryDeltas', () => {
  it('is empty when nothing moved', () => {
    expect(computeLineDeltas(base, base)).toEqual([])
    expect(computeCategoryDeltas(base, base)).toEqual([])
  })

  it('reports each moved line in integer paise, named for the organizer', () => {
    const next = rebalanceGuestCount(base, 260)
    const deltas = computeLineDeltas(base, next)
    expect(deltas.length).toBeGreaterThan(0)
    for (const d of deltas) {
      expect(Number.isInteger(d.deltaPaise)).toBe(true)
      expect(d.deltaPaise).not.toBe(0)
      const line = next.lines.find((l) => l.name === d.category)!
      const before = base.lines.find((l) => l.id === line.id)!.currentPaise
      expect(d.deltaPaise).toBe(line.currentPaise - before)
    }
  })

  it('moves exactly zero in total when the budget is unchanged (zero-sum)', () => {
    const next = rebalanceGuestCount(base, 230)
    const total = computeLineDeltas(base, next).reduce((sum, d) => sum + d.deltaPaise, 0)
    expect(total).toBe(next.totalBudgetPaise - base.totalBudgetPaise)
  })

  it('keys the same movement by budget category', () => {
    const next = rebalanceGuestCount(base, 260)
    const byName = computeLineDeltas(base, next)
    const byCategory = computeCategoryDeltas(base, next)
    expect(byCategory).toHaveLength(byName.length)
    expect(byCategory.map((d) => d.deltaPaise)).toEqual(byName.map((d) => d.deltaPaise))
    expect(byCategory.every((d) => typeof d.category === 'string')).toBe(true)
  })

  it('measures a line that is new against its baseline', () => {
    const extra = {
      ...base.lines[0],
      id: 'brand-new',
      name: 'New line',
      baselinePaise: 1000,
      currentPaise: 1500,
    }
    const next: Plan = { ...base, lines: [...base.lines, extra] }
    expect(computeLineDeltas(base, next)).toEqual([{ category: 'New line', deltaPaise: 500 }])
  })
})
