import { describe, it, expect } from 'vitest'
import {
  detectQuoteOmissions,
  calculateTierTotalWithAdders,
} from '@/lib/engine/omission-rules'
import type { PackageTier, QuoteOmissionAdder } from '@/lib/engine/types'

describe('Category Omission Rules Engine', () => {
  it('flags 5% GST and waitstaff for catering quotes omitting them', () => {
    const rawQuote = `
      Buffet rate: Rs 950 per plate.
      Includes bone china crockery and live chaat counter.
    `
    const baseTierPaise = 950 * 100 * 200 // ₹1,90,000 = 19,000,000 paise
    const omissions = detectQuoteOmissions(rawQuote, 'catering', baseTierPaise)

    expect(omissions.some(o => o.id === 'omission_gst_5')).toBe(true)
    expect(omissions.some(o => o.id === 'omission_waitstaff')).toBe(true)

    const gstAdder = omissions.find(o => o.id === 'omission_gst_5')!
    expect(gstAdder.rateType).toBe('percentage')
    expect(gstAdder.percentageValue).toBe(5)
    // 5% of 19,000,000 paise = 950,000 paise (₹9,500)
    expect(gstAdder.amountPaise).toBe(950000)

    const staffAdder = omissions.find(o => o.id === 'omission_waitstaff')!
    expect(staffAdder.rateType).toBe('fixed')
    expect(staffAdder.fixedPaise).toBe(800000)
  })

  it('does NOT flag GST when catering quote explicitly states "GST included"', () => {
    const rawQuote = `
      Buffet rate: Rs 950 per plate.
      All GST included. Service staff & waitstaff provided.
    `
    const omissions = detectQuoteOmissions(rawQuote, 'catering', 1000000)
    expect(omissions.some(o => o.id === 'omission_gst_5')).toBe(false)
    expect(omissions.some(o => o.id === 'omission_waitstaff')).toBe(false)
  })

  it('flags 18% GST and generator backup for decor quotes without them', () => {
    const quoteNoGen = `
      Grand Floral Arch: Rs 40,000
      Mandap Setup: Rs 95,000
    `
    const omissions = detectQuoteOmissions(quoteNoGen, 'decor', 13500000)

    const gstAdder = omissions.find(o => o.id === 'omission_gst_18')
    expect(gstAdder).toBeDefined()
    expect(gstAdder?.percentageValue).toBe(18)
    // 18% of 13,500,000 = 2,430,000 paise (₹24,300)
    expect(gstAdder?.amountPaise).toBe(2430000)

    const genAdder = omissions.find(o => o.id === 'omission_generator')
    expect(genAdder).toBeDefined()
    expect(genAdder?.fixedPaise).toBe(1500000)
  })

  it('flags overtime buffer for entertainment quotes without curfew mention', () => {
    const rawQuote = `
      DJ Live setup with Pioneer console and 2 line array speakers: Rs 60,000.
      Taxes included.
    `
    const omissions = detectQuoteOmissions(rawQuote, 'entertainment', 6000000)

    expect(omissions.some(o => o.id === 'omission_gst_18')).toBe(false) // taxes included
    const overtimeAdder = omissions.find(o => o.id === 'omission_overtime')
    expect(overtimeAdder).toBeDefined()
    expect(overtimeAdder?.fixedPaise).toBe(1000000) // ₹10,000
  })

  it('flags crew travel buffer for photo_film quotes without accommodation/travel', () => {
    const rawQuote = `
      Traditional + Candid photography: Rs 1,20,000.
      GST included.
    `
    const omissions = detectQuoteOmissions(rawQuote, 'photo_film', 12000000)
    const travelAdder = omissions.find(o => o.id === 'omission_crew_travel')
    expect(travelAdder).toBeDefined()
    expect(travelAdder?.fixedPaise).toBe(1500000) // ₹15,000
  })

  it('calculates tier total dynamically when omission adders are active', () => {
    const mockTier: PackageTier = {
      tierId: 't1',
      name: 'Standard Package',
      lineItems: [],
      baseTierPaise: 10000000, // ₹1,00,000
      totalWithAddersPaise: 10000000,
      isStatedTotalConsistent: true,
    }

    const adders: QuoteOmissionAdder[] = [
      {
        id: 'omission_gst_18',
        name: '+18% GST',
        category: 'decor',
        rateType: 'percentage',
        percentageValue: 18,
        amountPaise: 1800000,
        rationale: 'GST',
        isEnabled: false,
      },
      {
        id: 'omission_generator',
        name: 'Generator',
        category: 'decor',
        rateType: 'fixed',
        fixedPaise: 1500000,
        amountPaise: 1500000,
        rationale: 'Power',
        isEnabled: false,
      },
    ]

    // Neither active
    const totalNone = calculateTierTotalWithAdders(mockTier, adders, [])
    expect(totalNone).toBe(10000000)

    // Only GST active: 10,000,000 + 1,800,000 = 11,800,000 paise
    const totalGST = calculateTierTotalWithAdders(mockTier, adders, ['omission_gst_18'])
    expect(totalGST).toBe(11800000)

    // Both active: 10,000,000 + 1,800,000 + 1,500,000 = 13,300,000 paise
    const totalBoth = calculateTierTotalWithAdders(mockTier, adders, [
      'omission_gst_18',
      'omission_generator',
    ])
    expect(totalBoth).toBe(13300000)
  })
})
