import { describe, it, expect } from 'vitest'
import { ENVIRONMENTAL_RULES, type RiskContext } from '@/lib/engine/environmental-rules'

const ctx = (over: Partial<RiskContext>): RiskContext => ({
  month: 0,
  day: 1,
  normCity: 'nowhere',
  eventType: 'wedding',
  ...over,
})

const rule = (id: string) => ENVIRONMENTAL_RULES.find((r) => r.id === id)!

describe('environmental rule table', () => {
  it('lists the five rules in result order', () => {
    expect(ENVIRONMENTAL_RULES.map((r) => r.id)).toEqual([
      'peak_saya_winter',
      'peak_saya_summer',
      'monsoon_outdoor',
      'extreme_summer_heat',
      'holiday_clash',
    ])
  })

  it('each rule builds an advisory carrying its own id', () => {
    const c = ctx({ month: 0, day: 26 })
    for (const r of ENVIRONMENTAL_RULES) expect(r.build(c).id).toBe(r.id)
  })

  it('winter saya: Nov-Feb weddings only', () => {
    const r = rule('peak_saya_winter')
    expect(r.applies(ctx({ month: 10 }))).toBe(true)
    expect(r.applies(ctx({ month: 1 }))).toBe(true)
    expect(r.applies(ctx({ month: 2 }))).toBe(false)
    expect(r.applies(ctx({ month: 10, eventType: 'birthday' }))).toBe(false)
    expect(r.build(ctx({})).leadTimeBufferDays).toBe(30)
  })

  it('summer saya: Apr 15 - May 31 weddings only', () => {
    const r = rule('peak_saya_summer')
    expect(r.applies(ctx({ month: 3, day: 14 }))).toBe(false)
    expect(r.applies(ctx({ month: 3, day: 15 }))).toBe(true)
    expect(r.applies(ctx({ month: 4, day: 31 }))).toBe(true)
    expect(r.applies(ctx({ month: 5, day: 1 }))).toBe(false)
    expect(r.applies(ctx({ month: 4, eventType: 'community' }))).toBe(false)
    expect(r.build(ctx({})).leadTimeBufferDays).toBe(15)
  })

  it('monsoon: Jun 15 - Aug 31, extended to Sep 15 on the West Coast', () => {
    const r = rule('monsoon_outdoor')
    expect(r.applies(ctx({ month: 5, day: 14 }))).toBe(false)
    expect(r.applies(ctx({ month: 5, day: 15 }))).toBe(true)
    expect(r.applies(ctx({ month: 7, day: 31 }))).toBe(true)
    expect(r.applies(ctx({ month: 8, day: 10 }))).toBe(false)
    expect(r.applies(ctx({ month: 8, day: 10, normCity: 'mumbai' }))).toBe(true)
    expect(r.applies(ctx({ month: 8, day: 16, normCity: 'goa' }))).toBe(false)
    expect('leadTimeBufferDays' in r.build(ctx({}))).toBe(false)
  })

  it('extreme heat: May-Jun in north/central cities only', () => {
    const r = rule('extreme_summer_heat')
    expect(r.applies(ctx({ month: 4, normCity: 'jaipur' }))).toBe(true)
    expect(r.applies(ctx({ month: 5, normCity: 'new delhi' }))).toBe(true)
    expect(r.applies(ctx({ month: 6, normCity: 'jaipur' }))).toBe(false)
    expect(r.applies(ctx({ month: 4, normCity: 'bengaluru' }))).toBe(false)
  })

  it('holiday clash: Jan 26, Aug 15, Oct 2, Dec 31 with named title', () => {
    const r = rule('holiday_clash')
    const cases: Array<[number, number, string]> = [
      [0, 26, 'Republic Day'],
      [7, 15, 'Independence Day'],
      [9, 2, 'Gandhi Jayanti'],
      [11, 31, "New Year's Eve"],
    ]
    for (const [month, day, name] of cases) {
      const c = ctx({ month, day })
      expect(r.applies(c)).toBe(true)
      expect(r.build(c).title).toBe(`National Holiday / Civic Advisory (${name})`)
    }
    expect(r.applies(ctx({ month: 0, day: 27 }))).toBe(false)
  })
})
