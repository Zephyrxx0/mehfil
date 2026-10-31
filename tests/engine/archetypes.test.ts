import { describe, it, expect } from 'vitest'
import { ARCHETYPES, instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import type { EventBrief } from '@/lib/engine/types'

describe('ARCHETYPES', () => {
  it('has 3 archetypes', () => {
    expect(ARCHETYPES).toHaveLength(3)
  })

  it('each archetype line ratios sum to 1', () => {
    for (const archetype of ARCHETYPES) {
      const sum = archetype.lines.reduce((acc, l) => acc + l.ratio, 0)
      expect(sum).toBeCloseTo(1.0, 10)
    }
  })
})

describe('instantiatePlanFromBrief', () => {
  const weddingBrief: EventBrief = {
    title: 'Test Wedding',
    eventType: 'wedding',
    eventDate: '2025-02-14',
    city: 'Delhi',
    guestCount: 300,
    totalBudgetPaise: 250_000_000, // ₹25L
    protectedCategory: 'catering',
  }

  it('instantiates a wedding plan', () => {
    const plan = instantiatePlanFromBrief(weddingBrief)
    expect(plan.brief.eventType).toBe('wedding')
    expect(plan.lines).toHaveLength(8)
  })

  it('sum of line paise equals total budget (sum invariant)', () => {
    const plan = instantiatePlanFromBrief(weddingBrief)
    const sum = plan.lines.reduce((acc, l) => acc + l.currentPaise, 0)
    expect(sum).toBe(plan.totalBudgetPaise)
  })

  it('marks the correct Protected Moment', () => {
    const plan = instantiatePlanFromBrief(weddingBrief)
    const protected_ = plan.lines.filter((l) => l.isProtected)
    expect(protected_).toHaveLength(1)
    expect(protected_[0].category).toBe('catering')
  })

  it('birthday plan sum invariant', () => {
    const brief: EventBrief = {
      title: 'Test Birthday',
      eventType: 'birthday',
      eventDate: '2025-03-15',
      city: 'Mumbai',
      guestCount: 80,
      totalBudgetPaise: 50_000_000,
      protectedCategory: 'photo_film',
    }
    const plan = instantiatePlanFromBrief(brief)
    const sum = plan.lines.reduce((acc, l) => acc + l.currentPaise, 0)
    expect(sum).toBe(plan.totalBudgetPaise)
  })

  it('community plan sum invariant', () => {
    const brief: EventBrief = {
      title: 'Test Community',
      eventType: 'community',
      eventDate: '2025-04-10',
      city: 'Bengaluru',
      guestCount: 200,
      totalBudgetPaise: 80_000_000,
      protectedCategory: 'entertainment',
    }
    const plan = instantiatePlanFromBrief(brief)
    const sum = plan.lines.reduce((acc, l) => acc + l.currentPaise, 0)
    expect(sum).toBe(plan.totalBudgetPaise)
  })

  it('instantiation is fast (<10ms)', () => {
    const start = performance.now()
    for (let i = 0; i < 100; i++) {
      instantiatePlanFromBrief(weddingBrief)
    }
    const elapsed = performance.now() - start
    // 100 instantiations should be well under 1000ms (each <10ms)
    expect(elapsed).toBeLessThan(1000)
  })
})
