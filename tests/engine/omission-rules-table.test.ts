import { describe, it, expect } from 'vitest'
import { OMISSION_RULES } from '@/lib/engine/omission-rules-table'
import type { BudgetCategory } from '@/lib/engine/types'

const rule = (id: string) => OMISSION_RULES.find((r) => r.id === id)!
const ctx = (category: BudgetCategory, baseTierPaise = 10_000_000) => ({ category, baseTierPaise })

describe('omission rule table', () => {
  it('lists the six rules in result order', () => {
    expect(OMISSION_RULES.map((r) => r.id)).toEqual([
      'omission_gst_5',
      'omission_waitstaff',
      'omission_gst_18',
      'omission_generator',
      'omission_overtime',
      'omission_crew_travel',
    ])
  })

  it('each rule builds an adder carrying its own id, disabled by default', () => {
    for (const r of OMISSION_RULES) {
      const adder = r.build(ctx(r.categories[0]))
      expect(adder.id).toBe(r.id)
      expect(adder.isEnabled).toBe(false)
      expect(adder.category).toBe(r.categories[0])
    }
  })

  it('category scoping per rule', () => {
    expect(rule('omission_gst_5').categories).toEqual(['catering'])
    expect(rule('omission_waitstaff').categories).toEqual(['catering'])
    expect(rule('omission_gst_18').categories).toEqual([
      'decor',
      'photo_film',
      'venue',
      'entertainment',
    ])
    expect(rule('omission_generator').categories).toEqual(['venue', 'decor'])
    expect(rule('omission_overtime').categories).toEqual(['entertainment', 'venue'])
    expect(rule('omission_crew_travel').categories).toEqual(['photo_film'])
  })

  it('percentage adders round to whole paise', () => {
    const gst5 = rule('omission_gst_5').build(ctx('catering', 19_000_001))
    expect(gst5.rateType).toBe('percentage')
    expect(gst5.percentageValue).toBe(5)
    expect(gst5.amountPaise).toBe(Math.round(19_000_001 * 0.05))
    const gst18 = rule('omission_gst_18').build(ctx('venue', 123_456_789))
    expect(gst18.percentageValue).toBe(18)
    expect(gst18.amountPaise).toBe(Math.round(123_456_789 * 0.18))
  })

  it('fixed adders carry exact paise amounts', () => {
    const fixed = (id: string, cat: BudgetCategory) => {
      const a = rule(id).build(ctx(cat))
      return [a.rateType, a.fixedPaise, a.amountPaise]
    }
    expect(fixed('omission_waitstaff', 'catering')).toEqual(['fixed', 800_000, 800_000])
    expect(fixed('omission_generator', 'venue')).toEqual(['fixed', 1_500_000, 1_500_000])
    expect(fixed('omission_overtime', 'venue')).toEqual(['fixed', 1_000_000, 1_000_000])
    expect(fixed('omission_crew_travel', 'photo_film')).toEqual(['fixed', 1_500_000, 1_500_000])
  })

  it('GST rules share the same coverage phrases', () => {
    expect(rule('omission_gst_5').coveredBy).toEqual(rule('omission_gst_18').coveredBy)
  })
})
