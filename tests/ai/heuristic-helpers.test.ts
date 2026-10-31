import { describe, it, expect } from 'vitest'
import {
  DEFAULT_PROTECTED_CATEGORY,
  PROTECTED_CATEGORY_SIGNALS,
  TRADEOFF_RULES,
} from '@/lib/ai/heuristic-signals'
import { extractDeterministicStyleDNA } from '@/lib/ai/heuristic'
import { extractDeterministicQuote } from '@/lib/ai/quote-heuristic'
import { QUOTE_FIXTURES } from '@/lib/ai/quote-fixtures'

const tradeoffs = {
  feastVsSpectacle: 'feast',
  intimateVsGrand: 'grand',
  heritageVsModern: 'modern',
} as const

function categoryFor(text: string) {
  return extractDeterministicStyleDNA([], text, tradeoffs).protectedCategory
}

describe('heuristic signal tables', () => {
  it('keeps the first-match-wins category order', () => {
    expect(PROTECTED_CATEGORY_SIGNALS.map(([, c]) => c)).toEqual([
      'entertainment',
      'photo_film',
      'decor',
      'venue',
      'catering',
      'favors',
    ])
  })

  it('resolves each keyword family and the default', () => {
    expect(categoryFor('Qawwali night')).toBe('entertainment')
    expect(categoryFor('drone shots')).toBe('photo_film')
    expect(categoryFor('flower mandap')).toBe('decor')
    expect(categoryFor('haveli courtyard')).toBe('venue')
    expect(categoryFor('chaat counter')).toBe('catering')
    expect(categoryFor('potli hamper')).toBe('favors')
    expect(categoryFor('nothing relevant')).toBe(DEFAULT_PROTECTED_CATEGORY)
  })

  it('clamps trade-off shifts into each rule range', () => {
    const dna = extractDeterministicStyleDNA([], 'x', tradeoffs)
    for (const rule of TRADEOFF_RULES) {
      expect(dna.dimensions[rule.dimension]).toBeGreaterThanOrEqual(rule.min)
      expect(dna.dimensions[rule.dimension]).toBeLessThanOrEqual(rule.max)
    }
    // defaults: feast 50-25, scale 60+25, heritage 50+25
    expect(dna.dimensions.feastVsSpectacle).toBe(25)
    expect(dna.dimensions.scale).toBe(85)
    expect(dna.dimensions.heritageVsModern).toBe(75)
  })

  it('truncates long moment text to 200 chars and falls back when empty', () => {
    const long = extractDeterministicStyleDNA([], 'a'.repeat(300), tradeoffs)
    expect(long.protectedMomentQuote).toBe('a'.repeat(197) + '...')
    const empty = extractDeterministicStyleDNA([], '   ', tradeoffs)
    expect(empty.protectedMomentQuote).toBe('Soulful celebratory moment with cherished guests.')
  })
})

describe('quote heuristic parse steps', () => {
  it('returns an independent copy of a fixture', () => {
    const a = extractDeterministicQuote('Royal Caterers quote', 'catering')
    a.vendorName = 'mutated'
    const b = extractDeterministicQuote('Royal Caterers quote', 'catering')
    expect(b.vendorName).toBe('Royal Caterers & Banquet Services')
    expect(QUOTE_FIXTURES[0].quote.vendorName).toBe('Royal Caterers & Banquet Services')
  })

  it('matches the alternate Dhanshree needle', () => {
    expect(extractDeterministicQuote('dhanshree cinema', 'catering').vendorName).toBe(
      'Dhanshree Cinematic Wedding Films'
    )
  })

  it('parses generic text: vendor name, per-guest and flat items in order', () => {
    const quote = extractDeterministicQuote(
      '## Moti Events ##\nBuffet: Rs 800 per plate\nDecor - Rs 500\nthanks',
      'decor'
    )
    expect(quote.vendorName).toBe('Moti Events')
    expect(quote.category).toBe('decor')
    const items = quote.tiers[0].lineItems
    expect(items.map((i) => i.pricingType)).toEqual(['per_guest', 'flat'])
    expect(items.map((i) => i.amountStated)).toEqual([800, 500])
  })

  it('falls back to a placeholder item when no price is found', () => {
    const quote = extractDeterministicQuote('Just a hello', 'venue')
    expect(quote.tiers[0].lineItems).toEqual([
      {
        description: 'Vendor Service Package',
        amountStated: 10000,
        pricingType: 'flat',
        sourceAnchor: 'Just a hello',
      },
    ])
  })
})
