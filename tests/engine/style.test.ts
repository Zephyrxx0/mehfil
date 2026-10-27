import { describe, it, expect } from 'vitest'
import {
  calculateMultipliersFromDimensions,
  applyStyleModulationToPlan,
  generateStyleModulationRationale,
} from '@/lib/engine/style'
import { extractDeterministicStyleDNA } from '@/lib/ai/heuristic'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { StyleDNASchema } from '@/lib/ai/schemas'
import type { EventBrief, BudgetCategory, Plan } from '@/lib/engine/types'
import { SWATCHES } from '@/data/swatches'

const sampleBrief: EventBrief = {
  title: 'Priya & Rahul Sangeet',
  eventType: 'wedding',
  eventDate: '2025-11-20',
  city: 'Jaipur',
  guestCount: 250,
  totalBudgetPaise: 350_000_000, // ₹35,00,000
  protectedCategory: 'entertainment',
}

const allCategories: BudgetCategory[] = [
  'venue',
  'catering',
  'decor',
  'photo_film',
  'entertainment',
  'favors',
  'misc',
  'contingency',
]

describe('Bounded Multiplier Modulation Engine (D-06, D-07, VIBE-04)', () => {
  it('strictly clamps multipliers within [0.75, 1.25] for extreme boundary dimensions (all 0)', () => {
    const zeroDimensions = {
      formality: 0,
      energy: 0,
      scale: 0,
      heritageVsModern: 0,
      feastVsSpectacle: 0,
      music: 0,
      decorDensity: 0,
      indoorVsOutdoor: 0,
    }

    const multipliers = calculateMultipliersFromDimensions(zeroDimensions, 'entertainment')
    for (const cat of allCategories) {
      expect(multipliers[cat]).toBeGreaterThanOrEqual(0.75)
      expect(multipliers[cat]).toBeLessThanOrEqual(1.25)
    }
  })

  it('strictly clamps multipliers within [0.75, 1.25] for extreme boundary dimensions (all 100)', () => {
    const maxDimensions = {
      formality: 100,
      energy: 100,
      scale: 100,
      heritageVsModern: 100,
      feastVsSpectacle: 100,
      music: 100,
      decorDensity: 100,
      indoorVsOutdoor: 100,
    }

    const multipliers = calculateMultipliersFromDimensions(maxDimensions, 'venue')
    for (const cat of allCategories) {
      expect(multipliers[cat]).toBeGreaterThanOrEqual(0.75)
      expect(multipliers[cat]).toBeLessThanOrEqual(1.25)
    }
  })

  it('PROTECTED FLOOR LOCKING (D-07): always locks 1.25x floor multiplier on protected category regardless of dimensions', () => {
    // Music is 0, so entertainment would naturally calculate to 0.75, but protectedCategory is entertainment
    const lowMusic = {
      formality: 50,
      energy: 50,
      scale: 50,
      heritageVsModern: 50,
      feastVsSpectacle: 50,
      music: 0,
      decorDensity: 50,
      indoorVsOutdoor: 50,
    }
    const multipliers1 = calculateMultipliersFromDimensions(lowMusic, 'entertainment')
    expect(multipliers1.entertainment).toBe(1.25)

    // feastVsSpectacle is 100, so catering would naturally calculate to 0.75, but protectedCategory is catering
    const maxFeast = {
      formality: 50,
      energy: 50,
      scale: 50,
      heritageVsModern: 50,
      feastVsSpectacle: 100,
      music: 50,
      decorDensity: 50,
      indoorVsOutdoor: 50,
    }
    const multipliers2 = calculateMultipliersFromDimensions(maxFeast, 'catering')
    expect(multipliers2.catering).toBe(1.25)

    // decorDensity is 0, so decor would naturally calculate to 0.75, but protectedCategory is decor
    const minDecor = {
      formality: 50,
      energy: 50,
      scale: 50,
      heritageVsModern: 50,
      feastVsSpectacle: 50,
      music: 50,
      decorDensity: 0,
      indoorVsOutdoor: 50,
    }
    const multipliers3 = calculateMultipliersFromDimensions(minDecor, 'decor')
    expect(multipliers3.decor).toBe(1.25)
  })

  it('applies style modulation to a plan and assigns protected quote and flag', () => {
    const basePlan = instantiatePlanFromBrief(sampleBrief)
    const styleDNA = extractDeterministicStyleDNA(
      ['royal-amber-courtyard', 'marigold-cascade', 'gulabi-rose-palace'],
      'Soulful sufi singing under fairy lights',
      {
        feastVsSpectacle: 'spectacle',
        intimateVsGrand: 'grand',
        heritageVsModern: 'heritage',
      }
    )

    const modulated = applyStyleModulationToPlan(basePlan, styleDNA)

    // Verify Protected Moment
    const protectedLine = modulated.lines.find((l) => l.category === styleDNA.protectedCategory)
    expect(protectedLine).toBeDefined()
    expect(protectedLine?.isProtected).toBe(true)
    expect(protectedLine?.protectedQuote).toBe(styleDNA.protectedMomentQuote)

    // Verify non-protected lines are not marked protected
    for (const line of modulated.lines) {
      if (line.category !== styleDNA.protectedCategory) {
        expect(line.isProtected).toBeFalsy()
      }
    }

    // Verify attached styleDNA
    expect(modulated.styleDNA).toBeDefined()
    expect(modulated.styleDNA?.vibeStatement).toBe(styleDNA.vibeStatement)

    // Verify brief updates
    expect(modulated.brief.protectedCategory).toBe(styleDNA.protectedCategory)
    expect(modulated.brief.vibeStatement).toBe(styleDNA.vibeStatement)
    expect(modulated.brief.protectedMomentQuote).toBe(styleDNA.protectedMomentQuote)
  })

  it('PROPERTY TEST: 1,000 random budgets with random Style DNA profiles preserve exact paise sum invariant', () => {
    const archetypes = ['wedding', 'birthday', 'community'] as const

    for (let i = 0; i < 1000; i++) {
      const randomRupees = Math.floor(Math.random() * (10_000_000 - 100_000) + 100_000)
      const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)]
      const randomArchetype = archetypes[Math.floor(Math.random() * archetypes.length)]

      const brief: EventBrief = {
        title: `Property Test ${i}`,
        eventType: randomArchetype,
        eventDate: '2026-01-01',
        city: 'Mumbai',
        guestCount: Math.floor(Math.random() * 500) + 50,
        totalBudgetPaise: randomRupees * 100,
        protectedCategory: randomCategory,
      }

      const plan = instantiatePlanFromBrief(brief)

      // Random Style DNA dimensions
      const randomStyleDNA = {
        dimensions: {
          formality: Math.floor(Math.random() * 101),
          energy: Math.floor(Math.random() * 101),
          scale: Math.floor(Math.random() * 101),
          heritageVsModern: Math.floor(Math.random() * 101),
          feastVsSpectacle: Math.floor(Math.random() * 101),
          music: Math.floor(Math.random() * 101),
          decorDensity: Math.floor(Math.random() * 101),
          indoorVsOutdoor: Math.floor(Math.random() * 101),
        },
        namedPalette: [
          { name: 'Color 1', hex: '#FF9F1C' },
          { name: 'Color 2', hex: '#F2A7B8' },
          { name: 'Color 3', hex: '#3A2442' },
        ],
        vibeStatement: 'Valid aesthetic vibe statement for property testing verification.',
        protectedCategory: randomCategory,
        protectedMomentQuote: 'Randomized protected quote for testing.',
      }

      const modulated = applyStyleModulationToPlan(plan, randomStyleDNA)

      const sum = modulated.lines.reduce((s, l) => s + l.currentPaise, 0)
      if (sum !== plan.totalBudgetPaise) {
        throw new Error(
          `Paise sum invariant failed on run ${i}: got ${sum}, expected ${plan.totalBudgetPaise}`
        )
      }

      // Check all line allocations are non-negative integers
      for (const line of modulated.lines) {
        expect(line.currentPaise).toBeGreaterThanOrEqual(0)
        expect(Number.isInteger(line.currentPaise)).toBe(true)
        if (line.baselinePaise > 0) {
          expect(line.currentPaise).toBeGreaterThan(0)
        }
      }
    }
  })

  it('generates plain-language style modulation rationale under 500 characters', () => {
    const styleDNA = extractDeterministicStyleDNA(
      ['royal-amber-courtyard', 'marigold-cascade'],
      'Grand royal entrance with dholak and trumpets',
      {
        feastVsSpectacle: 'spectacle',
        intimateVsGrand: 'grand',
        heritageVsModern: 'heritage',
      }
    )

    const deltas = [
      { category: 'decor' as BudgetCategory, deltaPaise: 450_000_00 },
      { category: 'entertainment' as BudgetCategory, deltaPaise: 300_000_00 },
      { category: 'favors' as BudgetCategory, deltaPaise: -250_000_00 },
      { category: 'misc' as BudgetCategory, deltaPaise: -500_000_00 },
    ]

    const rationale = generateStyleModulationRationale(styleDNA, deltas)
    expect(typeof rationale).toBe('string')
    expect(rationale.length).toBeGreaterThan(20)
    expect(rationale.length).toBeLessThanOrEqual(500)
    expect(rationale).toContain('Protected Moment')
    expect(rationale).toContain('1.25x floor')
  })
})

describe('Deterministic Heuristic Extractor - Tier 3 (D-16, ADR-0007)', () => {
  it('executes in < 5ms without network calls', () => {
    const swatches = SWATCHES.slice(0, 6).map((s) => s.id)
    const start = performance.now()

    for (let i = 0; i < 50; i++) {
      extractDeterministicStyleDNA(swatches, 'Soulful qawwali night', {
        feastVsSpectacle: 'spectacle',
        intimateVsGrand: 'intimate',
        heritageVsModern: 'heritage',
      })
    }

    const duration = (performance.now() - start) / 50
    expect(duration).toBeLessThan(5) // Average execution time < 5ms
  })

  it('maps keywords to appropriate protected categories and conforms strictly to StyleDNASchema', () => {
    const testCases: Array<{ quote: string; expectedCat: BudgetCategory }> = [
      { quote: 'Live soulful qawwali singer and dhol beats', expectedCat: 'entertainment' },
      { quote: 'Cinematic drone film shoot during sunset', expectedCat: 'photo_film' },
      { quote: 'Hanging lotus mandap and floral chandelier', expectedCat: 'decor' },
      { quote: 'Royal palace haveli terrace by the lake', expectedCat: 'venue' },
      { quote: 'Lavish 8-course Awadhi feast and chaat counter', expectedCat: 'catering' },
      { quote: 'Handcrafted silver potli gift hampers for all guests', expectedCat: 'favors' },
      { quote: 'A heartwarming celebration with all our closest family', expectedCat: 'catering' }, // default fallback
    ]

    for (const tc of testCases) {
      const dna = extractDeterministicStyleDNA(
        ['gulabi-rose-palace', 'marigold-cascade'],
        tc.quote,
        {
          feastVsSpectacle: 'feast',
          intimateVsGrand: 'intimate',
          heritageVsModern: 'modern',
        }
      )

      expect(dna.protectedCategory).toBe(tc.expectedCat)
      // Verify schema validity
      const parsed = StyleDNASchema.safeParse(dna)
      expect(parsed.success).toBe(true)
    }
  })

  it('correctly shifts dimensions with forced-choice trade-offs', () => {
    const swatches = ['royal-amber-courtyard']

    const feastDNA = extractDeterministicStyleDNA(swatches, 'Celebration', {
      feastVsSpectacle: 'feast',
      intimateVsGrand: 'intimate',
      heritageVsModern: 'heritage',
    })

    const spectacleDNA = extractDeterministicStyleDNA(swatches, 'Celebration', {
      feastVsSpectacle: 'spectacle',
      intimateVsGrand: 'grand',
      heritageVsModern: 'modern',
    })

    expect(feastDNA.dimensions.feastVsSpectacle).toBeLessThan(spectacleDNA.dimensions.feastVsSpectacle)
    expect(feastDNA.dimensions.scale).toBeLessThan(spectacleDNA.dimensions.scale)
    expect(feastDNA.dimensions.heritageVsModern).toBeLessThan(spectacleDNA.dimensions.heritageVsModern)
  })
})
