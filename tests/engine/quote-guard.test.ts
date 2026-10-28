import { describe, it, expect } from 'vitest'
import {
  parseAnchorNumber,
  verifyVerbatimEvidence,
  buildPackageTiers,
} from '@/lib/engine/quote-guard'
import type { ExtractedQuoteItemInput, PackageTierInput } from '@/lib/ai/schemas'

describe('Quote Guard — parseAnchorNumber', () => {
  it('parses formatted Indian currency strings with symbols and commas', () => {
    expect(parseAnchorNumber('₹1,50,000')).toBe(150000)
    expect(parseAnchorNumber('Rs 950/-')).toBe(950)
    expect(parseAnchorNumber('Rs. 40,000')).toBe(40000)
    expect(parseAnchorNumber('INR 2,50,000')).toBe(250000)
  })

  it('parses lakh and crore words and abbreviations', () => {
    expect(parseAnchorNumber('1.5 Lakh')).toBe(150000)
    expect(parseAnchorNumber('2.5 lacs')).toBe(250000)
    expect(parseAnchorNumber('1.8l')).toBe(180000)
    expect(parseAnchorNumber('2 crore')).toBe(20000000)
    expect(parseAnchorNumber('1.2 cr')).toBe(12000000)
  })

  it('parses "k" abbreviation for thousands', () => {
    expect(parseAnchorNumber('25k')).toBe(25000)
    expect(parseAnchorNumber('10 k')).toBe(10000)
  })

  it('matches targetAmount if multiple candidate numbers exist', () => {
    const anchor = '1. Entrance Arch: Rs 40,000'
    expect(parseAnchorNumber(anchor, 40000)).toBe(40000)
  })

  it('returns null for empty or non-numeric strings', () => {
    expect(parseAnchorNumber('')).toBeNull()
    expect(parseAnchorNumber('No pricing mentioned')).toBeNull()
  })
})

describe('Quote Guard — verifyVerbatimEvidence', () => {
  const sampleRawText = `
    *ROYAL CATERERS FESTIVE MENU*
    Welcome Drinks & Starters: Rs 350/- per plate
    Grand Buffet Main Course: Rs 600/- per plate
    Service and Crockery: Rs 50,000 flat
    Total Package: Rs 950 per plate
  `

  it('verifies exact and case-insensitive substring anchors with matching amounts', () => {
    const items: ExtractedQuoteItemInput[] = [
      {
        description: 'Welcome Drinks & Starters',
        amountStated: 350,
        pricingType: 'per_guest',
        sourceAnchor: 'Rs 350/- per plate',
      },
      {
        description: 'Service and Crockery',
        amountStated: 50000,
        pricingType: 'flat',
        sourceAnchor: 'Service and Crockery: Rs 50,000 flat',
      },
    ]

    const guestCount = 200
    const result = verifyVerbatimEvidence(sampleRawText, items, guestCount)

    expect(result.droppedItems).toHaveLength(0)
    expect(result.verifiedItems).toHaveLength(2)

    // First item is per-guest: 350 * 100 * 200 = 70,00,000 paise (₹70,000)
    expect(result.verifiedItems[0].itemPaise).toBe(7000000)
    expect(result.verifiedItems[0].isVerified).toBe(true)

    // Second item is flat: 50000 * 100 = 50,00,000 paise (₹50,000)
    expect(result.verifiedItems[1].itemPaise).toBe(5000000)
    expect(result.verifiedItems[1].isVerified).toBe(true)

    // Total base tier paise: 7,000,000 + 5,000,000 = 12,000,000 paise (₹1,20,000)
    expect(result.baseTierPaise).toBe(12000000)
  })

  it('drops items whose sourceAnchor is not present in raw text (Phase 1: no_substring_match)', () => {
    const items: ExtractedQuoteItemInput[] = [
      {
        description: 'Fabricated Diamond Champagne Fountain',
        amountStated: 85000,
        pricingType: 'flat',
        sourceAnchor: 'Rs 85,000 for champagne fountain', // Not in text!
      },
    ]

    const result = verifyVerbatimEvidence(sampleRawText, items, 100)

    expect(result.verifiedItems).toHaveLength(0)
    expect(result.droppedItems).toHaveLength(1)
    expect(result.droppedItems[0]).toEqual({
      description: 'Fabricated Diamond Champagne Fountain',
      amountStated: 85000,
      sourceAnchor: 'Rs 85,000 for champagne fountain',
      reason: 'no_substring_match',
    })
    expect(result.baseTierPaise).toBe(0)
  })

  it('drops items whose anchor exists but parsed numeric amount mismatches stated amount (Phase 2: numeric_mismatch)', () => {
    const items: ExtractedQuoteItemInput[] = [
      {
        description: 'Altered Main Course Rate',
        amountStated: 1200, // Quote actually says 600
        pricingType: 'per_guest',
        sourceAnchor: 'Rs 600/- per plate',
      },
    ]

    const result = verifyVerbatimEvidence(sampleRawText, items, 100)

    expect(result.verifiedItems).toHaveLength(0)
    expect(result.droppedItems).toHaveLength(1)
    expect(result.droppedItems[0]).toEqual({
      description: 'Altered Main Course Rate',
      amountStated: 1200,
      sourceAnchor: 'Rs 600/- per plate',
      reason: 'numeric_mismatch',
    })
    expect(result.baseTierPaise).toBe(0)
  })
})

describe('Quote Guard — buildPackageTiers', () => {
  const quoteText = `
    *SHADI MANDAP QUOTATION*
    Floral Entrance: Rs 40,000
    Mandap Stage: Rs 95,000
    Reception Draping: Rs 45,000
    Total Stated Package: Rs 1,80,000
  `

  it('assembles PackageTier[] and verifies stated package totals', () => {
    const extractedTiers: PackageTierInput[] = [
      {
        tierId: 'tier_classic',
        name: 'Classic Floral',
        description: 'Complete mandap setup',
        tierTotalStated: 180000,
        lineItems: [
          {
            description: 'Floral Entrance',
            amountStated: 40000,
            pricingType: 'flat',
            sourceAnchor: 'Floral Entrance: Rs 40,000',
          },
          {
            description: 'Mandap Stage',
            amountStated: 95000,
            pricingType: 'flat',
            sourceAnchor: 'Mandap Stage: Rs 95,000',
          },
          {
            description: 'Reception Draping',
            amountStated: 45000,
            pricingType: 'flat',
            sourceAnchor: 'Reception Draping: Rs 45,000',
          },
        ],
      },
    ]

    const { tiers, allDroppedItems } = buildPackageTiers(extractedTiers, quoteText, 150)

    expect(allDroppedItems).toHaveLength(0)
    expect(tiers).toHaveLength(1)
    const tier = tiers[0]
    expect(tier.lineItems).toHaveLength(3)
    // 40000 + 95000 + 45000 = 180,000 => 18,000,000 paise
    expect(tier.baseTierPaise).toBe(18000000)
    expect(tier.isStatedTotalConsistent).toBe(true)
  })

  it('marks isStatedTotalConsistent false when stated total differs from sum of line items', () => {
    const extractedTiers: PackageTierInput[] = [
      {
        tierId: 'tier_inconsistent',
        name: 'Inconsistent Tier',
        tierTotalStated: 250000, // Sum of items is 180,000
        lineItems: [
          {
            description: 'Floral Entrance',
            amountStated: 40000,
            pricingType: 'flat',
            sourceAnchor: 'Floral Entrance: Rs 40,000',
          },
        ],
      },
    ]

    const { tiers } = buildPackageTiers(extractedTiers, quoteText, 150)
    expect(tiers[0].isStatedTotalConsistent).toBe(false)
  })
})
