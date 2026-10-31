import { describe, it, expect, vi, afterEach } from 'vitest'
import { CURATED_IDEAS, getPersonalizedIdeas } from '@/data/curatedIdeas'
import type { BudgetCategory, CuratedIdea, EventBrief, StyleDNA } from '@/lib/engine/types'

/**
 * `calculateAffinityScore` is a closure inside `getPersonalizedIdeas`, so its value is only
 * observable through the sort comparator. These tests recover the exact score of one idea by
 * capturing that comparator and comparing the idea to two zero-score reference ideas
 * (no tags, non-catering/decor category). `cmp(reference, idea)` returns `score(idea) - 0`
 * whenever |score| > 0.001, and an id-based tie-break (-1 / +1) otherwise. Using one reference
 * id that sorts before the idea and one that sorts after tells a real +/-1 score apart from a tie.
 */

type Dimensions = StyleDNA['dimensions']

const brief: EventBrief = {
  title: 'Affinity Test Wedding',
  eventType: 'wedding',
  eventDate: '2026-11-20',
  city: 'Jaipur',
  guestCount: 200,
  totalBudgetPaise: 250_000_000,
  protectedCategory: 'catering',
}

/** Every dimension at 50 gives every branch a weight of 0, so any single dimension can be isolated. */
const NEUTRAL: Dimensions = {
  formality: 50,
  energy: 50,
  scale: 50,
  heritageVsModern: 50,
  feastVsSpectacle: 50,
  music: 50,
  decorDensity: 50,
  indoorVsOutdoor: 50,
}

function dnaWith(overrides: Partial<Dimensions> = {}): StyleDNA {
  return {
    dimensions: { ...NEUTRAL, ...overrides },
    namedPalette: [
      { name: 'Warm Ivory', hex: '#FAF7F2' },
      { name: 'Marigold Gold', hex: '#F59E0B' },
      { name: 'Gulabi Rose', hex: '#E11D48' },
    ],
    vibeStatement: 'Affinity score test vibe.',
    protectedCategory: 'catering',
    protectedMomentQuote: 'A quote for testing',
  }
}

function makeIdea(
  id: string,
  styleTags: string[],
  category: BudgetCategory = 'entertainment'
): CuratedIdea {
  return {
    id,
    title: id,
    tagline: 'tagline',
    description: 'description',
    category,
    eventTypes: ['wedding'],
    costPaise: 100_00,
    leadDays: 10,
    styleTags,
    culturalNuance: 'nuance',
  }
}

type Comparator = (a: CuratedIdea, b: CuratedIdea) => number

/** Runs `getPersonalizedIdeas` over a temporary catalogue and returns the captured sort comparator. */
function withCatalogue<T>(ideas: CuratedIdea[], run: () => T): T {
  const original = CURATED_IDEAS.splice(0, CURATED_IDEAS.length, ...ideas)
  try {
    return run()
  } finally {
    CURATED_IDEAS.splice(0, CURATED_IDEAS.length, ...original)
  }
}

function captureComparator(styleDNA: StyleDNA, ideas: CuratedIdea[]): Comparator {
  let captured: Comparator | undefined
  const originalSort = Array.prototype.sort
  const spy = vi.spyOn(Array.prototype, 'sort').mockImplementation(function (
    this: unknown[],
    compareFn?: (a: unknown, b: unknown) => number
  ) {
    captured = compareFn as Comparator
    return originalSort.call(this, compareFn)
  })
  try {
    withCatalogue(ideas, () => getPersonalizedIdeas(brief, styleDNA))
  } finally {
    spy.mockRestore()
  }
  if (!captured) throw new Error('sort comparator was not captured')
  return captured
}

/** Exact affinity score of `idea` under `dimensions` (overrides on top of the neutral baseline). */
function scoreOf(idea: CuratedIdea, overrides: Partial<Dimensions> = {}): number {
  const target = { ...idea, id: 'mmm_target' }
  const low = makeIdea('aaa_reference', [])
  const high = makeIdea('zzz_reference', [])
  const cmp = captureComparator(dnaWith(overrides), [low, target, high])
  const viaLow = cmp(low, target)
  const viaHigh = cmp(high, target)
  // Different results mean both fell through to the id tie-break, i.e. the score is 0.
  return viaLow === viaHigh ? viaLow : 0
}

function tagScore(
  tags: string[],
  overrides: Partial<Dimensions> = {},
  category: BudgetCategory = 'entertainment'
): number {
  return scoreOf(makeIdea('probe', tags, category), overrides)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('calculateAffinityScore harness', () => {
  it('scores an untagged idea at exactly 0 under neutral Style DNA', () => {
    expect(tagScore([])).toBeCloseTo(0, 10)
  })

  it('scores an untagged idea at 0 under extreme Style DNA', () => {
    expect(
      tagScore([], { heritageVsModern: 0, scale: 0, feastVsSpectacle: 0, energy: 0 })
    ).toBeCloseTo(0, 10)
    expect(
      tagScore([], { heritageVsModern: 100, scale: 100, feastVsSpectacle: 100, energy: 100 })
    ).toBeCloseTo(0, 10)
  })

  it('distinguishes a real score of +1 / -1 from a tie', () => {
    // heritageVsModern 40 => weight 0.2; ceremonial adds 15 * 0.2 = 3, modern subtracts 20 * 0.2 = 4
    // => 3 - 4 = -1 (an exact -1 would collide with a naive tie-break reading)
    expect(tagScore(['ceremonial', 'modern'], { heritageVsModern: 40 })).toBeCloseTo(-1, 10)
    // traditional 25 * 0.2 = 5, modern -4 => +1
    expect(tagScore(['traditional', 'modern'], { heritageVsModern: 40 })).toBeCloseTo(1, 10)
  })
})

describe('calculateAffinityScore: Heritage vs Modern (< 50 = heritage side)', () => {
  const H0 = { heritageVsModern: 0 } // weight 1

  it('heritage tag adds 30', () => {
    expect(tagScore(['heritage'], H0)).toBeCloseTo(30, 10)
  })

  it('traditional tag adds 25', () => {
    expect(tagScore(['traditional'], H0)).toBeCloseTo(25, 10)
  })

  it('ceremonial tag adds 15', () => {
    expect(tagScore(['ceremonial'], H0)).toBeCloseTo(15, 10)
  })

  it('royal tag adds 15', () => {
    expect(tagScore(['royal'], H0)).toBeCloseTo(15, 10)
  })

  it('ceremonial and royal together add 15 only once', () => {
    expect(tagScore(['ceremonial', 'royal'], H0)).toBeCloseTo(15, 10)
  })

  it('modern tag subtracts 20', () => {
    expect(tagScore(['modern'], H0)).toBeCloseTo(-20, 10)
  })

  it('sums heritage + traditional + ceremonial', () => {
    expect(tagScore(['heritage', 'traditional', 'ceremonial'], H0)).toBeCloseTo(70, 10)
  })

  it('heritage + modern nets +10', () => {
    expect(tagScore(['heritage', 'modern'], H0)).toBeCloseTo(10, 10)
  })

  it('ignores tags that carry no heritage signal', () => {
    expect(tagScore(['artisan', 'sensory', 'playful'], H0)).toBeCloseTo(0, 10)
  })

  it('scales linearly with the weight (25 => 0.5)', () => {
    expect(tagScore(['heritage'], { heritageVsModern: 25 })).toBeCloseTo(15, 10)
    expect(tagScore(['traditional'], { heritageVsModern: 25 })).toBeCloseTo(12.5, 10)
    expect(tagScore(['royal'], { heritageVsModern: 25 })).toBeCloseTo(7.5, 10)
    expect(tagScore(['modern'], { heritageVsModern: 25 })).toBeCloseTo(-10, 10)
  })

  it('boundary 49 gives the smallest heritage weight (0.02)', () => {
    expect(tagScore(['heritage'], { heritageVsModern: 49 })).toBeCloseTo(0.6, 10)
  })

  it('does not apply the playful bonus on the heritage side', () => {
    expect(tagScore(['playful'], H0)).toBeCloseTo(0, 10)
  })
})

describe('calculateAffinityScore: Heritage vs Modern (>= 50 = modern side)', () => {
  const M100 = { heritageVsModern: 100 } // weight 1

  it('modern tag adds 30', () => {
    expect(tagScore(['modern'], M100)).toBeCloseTo(30, 10)
  })

  it('playful tag adds 15 for non-catering categories', () => {
    expect(tagScore(['playful'], M100, 'entertainment')).toBeCloseTo(15, 10)
    expect(tagScore(['playful'], M100, 'favors')).toBeCloseTo(15, 10)
  })

  it('playful tag adds nothing for the catering category', () => {
    expect(tagScore(['playful'], M100, 'catering')).toBeCloseTo(0, 10)
  })

  it('heritage tag subtracts 20', () => {
    expect(tagScore(['heritage'], M100)).toBeCloseTo(-20, 10)
  })

  it('traditional tag subtracts 20', () => {
    expect(tagScore(['traditional'], M100)).toBeCloseTo(-20, 10)
  })

  it('heritage and traditional together subtract 20 only once', () => {
    expect(tagScore(['heritage', 'traditional'], M100)).toBeCloseTo(-20, 10)
  })

  it('modern + playful adds 45', () => {
    expect(tagScore(['modern', 'playful'], M100)).toBeCloseTo(45, 10)
  })

  it('does not apply the ceremonial/royal bonus on the modern side', () => {
    expect(tagScore(['ceremonial'], M100)).toBeCloseTo(0, 10)
  })

  it('scales linearly with the weight (75 => 0.5)', () => {
    expect(tagScore(['modern'], { heritageVsModern: 75 })).toBeCloseTo(15, 10)
    expect(tagScore(['playful'], { heritageVsModern: 75 })).toBeCloseTo(7.5, 10)
    expect(tagScore(['heritage'], { heritageVsModern: 75 })).toBeCloseTo(-10, 10)
  })

  it('boundary 50 belongs to the modern side with weight 0', () => {
    expect(tagScore(['modern', 'heritage', 'traditional', 'playful'], NEUTRAL)).toBeCloseTo(0, 10)
  })

  it('boundary 51 gives the smallest modern weight (0.02)', () => {
    expect(tagScore(['modern'], { heritageVsModern: 51 })).toBeCloseTo(0.6, 10)
  })
})

describe('calculateAffinityScore: Scale', () => {
  it('intimate tag adds 20 when scale is 0', () => {
    expect(tagScore(['intimate'], { scale: 0 })).toBeCloseTo(20, 10)
  })

  it('comfort tag adds 20 when scale is 0', () => {
    expect(tagScore(['comfort'], { scale: 0 })).toBeCloseTo(20, 10)
  })

  it('intimate and comfort together add 20 only once', () => {
    expect(tagScore(['intimate', 'comfort'], { scale: 0 })).toBeCloseTo(20, 10)
  })

  it('grand tag subtracts 10 when scale is 0', () => {
    expect(tagScore(['grand'], { scale: 0 })).toBeCloseTo(-10, 10)
  })

  it('grand + intimate nets +10 when scale is 0', () => {
    expect(tagScore(['grand', 'intimate'], { scale: 0 })).toBeCloseTo(10, 10)
  })

  it('scales linearly on the intimate side (25 => 0.5)', () => {
    expect(tagScore(['intimate'], { scale: 25 })).toBeCloseTo(10, 10)
    expect(tagScore(['grand'], { scale: 25 })).toBeCloseTo(-5, 10)
  })

  it('grand tag adds 20 when scale is 100', () => {
    expect(tagScore(['grand'], { scale: 100 })).toBeCloseTo(20, 10)
  })

  it('royal tag adds 20 when scale is 100', () => {
    expect(tagScore(['royal'], { scale: 100 })).toBeCloseTo(20, 10)
  })

  it('grand and royal together add 20 only once', () => {
    expect(tagScore(['grand', 'royal'], { scale: 100 })).toBeCloseTo(20, 10)
  })

  it('intimate tag subtracts 10 when scale is 100', () => {
    expect(tagScore(['intimate'], { scale: 100 })).toBeCloseTo(-10, 10)
  })

  it('comfort tag has no effect on the grand side', () => {
    expect(tagScore(['comfort'], { scale: 100 })).toBeCloseTo(0, 10)
  })

  it('scales linearly on the grand side (75 => 0.5)', () => {
    expect(tagScore(['grand'], { scale: 75 })).toBeCloseTo(10, 10)
    expect(tagScore(['intimate'], { scale: 75 })).toBeCloseTo(-5, 10)
  })

  it('boundary 50 has weight 0 on both tags', () => {
    expect(tagScore(['grand', 'royal', 'intimate', 'comfort'], { scale: 50 })).toBeCloseTo(0, 10)
  })

  it('boundary 49 and 51 give the smallest weight (0.02)', () => {
    expect(tagScore(['intimate'], { scale: 49 })).toBeCloseTo(0.4, 10)
    expect(tagScore(['grand'], { scale: 51 })).toBeCloseTo(0.4, 10)
  })
})

describe('calculateAffinityScore: Feast vs Spectacle', () => {
  it('feast tag adds 25 when feastVsSpectacle is 0', () => {
    expect(tagScore(['feast'], { feastVsSpectacle: 0 })).toBeCloseTo(25, 10)
  })

  it('catering category adds 25 without a feast tag', () => {
    expect(tagScore([], { feastVsSpectacle: 0 }, 'catering')).toBeCloseTo(25, 10)
  })

  it('feast tag plus catering category add 25 only once', () => {
    expect(tagScore(['feast'], { feastVsSpectacle: 0 }, 'catering')).toBeCloseTo(25, 10)
  })

  it('decor category and spectacle tag earn nothing on the feast side', () => {
    expect(tagScore(['spectacle'], { feastVsSpectacle: 0 }, 'decor')).toBeCloseTo(0, 10)
  })

  it('scales linearly on the feast side (40 => 0.2)', () => {
    expect(tagScore(['feast'], { feastVsSpectacle: 40 })).toBeCloseTo(5, 10)
  })

  it('spectacle tag adds 25 when feastVsSpectacle is 100', () => {
    expect(tagScore(['spectacle'], { feastVsSpectacle: 100 })).toBeCloseTo(25, 10)
  })

  it('decor category adds 25 without a spectacle tag', () => {
    expect(tagScore([], { feastVsSpectacle: 100 }, 'decor')).toBeCloseTo(25, 10)
  })

  it('spectacle tag plus decor category add 25 only once', () => {
    expect(tagScore(['spectacle'], { feastVsSpectacle: 100 }, 'decor')).toBeCloseTo(25, 10)
  })

  it('catering category and feast tag earn nothing on the spectacle side', () => {
    expect(tagScore(['feast'], { feastVsSpectacle: 100 }, 'catering')).toBeCloseTo(0, 10)
  })

  it('scales linearly on the spectacle side (60 => 0.2)', () => {
    expect(tagScore(['spectacle'], { feastVsSpectacle: 60 })).toBeCloseTo(5, 10)
  })

  it('boundary 50 has weight 0', () => {
    expect(tagScore(['feast', 'spectacle'], { feastVsSpectacle: 50 }, 'decor')).toBeCloseTo(0, 10)
    expect(tagScore(['feast', 'spectacle'], { feastVsSpectacle: 50 }, 'catering')).toBeCloseTo(
      0,
      10
    )
  })
})

describe('calculateAffinityScore: Energy', () => {
  it('high-energy tag adds 15 when energy is 100', () => {
    expect(tagScore(['high-energy'], { energy: 100 })).toBeCloseTo(15, 10)
  })

  it('scales linearly on the high-energy side (75 => 0.5)', () => {
    expect(tagScore(['high-energy'], { energy: 75 })).toBeCloseTo(7.5, 10)
  })

  it('acoustic tag earns nothing on the high-energy side', () => {
    expect(tagScore(['acoustic'], { energy: 100 })).toBeCloseTo(0, 10)
  })

  it('energy exactly 50 belongs to the high-energy side with weight 0', () => {
    expect(tagScore(['high-energy', 'acoustic'], { energy: 50 })).toBeCloseTo(0, 10)
  })

  it('acoustic tag adds 15 when energy is 0', () => {
    expect(tagScore(['acoustic'], { energy: 0 })).toBeCloseTo(15, 10)
  })

  it('intimate tag adds 15 when energy is 0', () => {
    expect(tagScore(['intimate'], { energy: 0 })).toBeCloseTo(15, 10)
  })

  it('acoustic and intimate together add 15 only once', () => {
    expect(tagScore(['acoustic', 'intimate'], { energy: 0 })).toBeCloseTo(15, 10)
  })

  it('high-energy tag earns nothing on the acoustic side', () => {
    expect(tagScore(['high-energy'], { energy: 0 })).toBeCloseTo(0, 10)
  })

  it('scales linearly on the acoustic side (25 => 0.5)', () => {
    expect(tagScore(['acoustic'], { energy: 25 })).toBeCloseTo(7.5, 10)
  })

  it('boundary 49 gives the smallest acoustic weight (0.02)', () => {
    expect(tagScore(['acoustic'], { energy: 49 })).toBeCloseTo(0.3, 10)
  })

  it('boundary 51 gives the smallest high-energy weight (0.02)', () => {
    expect(tagScore(['high-energy'], { energy: 51 })).toBeCloseTo(0.3, 10)
  })
})

describe('calculateAffinityScore: tag handling and combinations', () => {
  it('matches style tags case-insensitively', () => {
    expect(tagScore(['HERITAGE', 'Intimate'], { heritageVsModern: 0 })).toBeCloseTo(30, 10)
    expect(tagScore(['Spectacle'], { feastVsSpectacle: 100 })).toBeCloseTo(25, 10)
  })

  it('treats an empty styleTags array as a zero score for every dimension', () => {
    expect(tagScore([], { heritageVsModern: 0, scale: 0, energy: 0 })).toBeCloseTo(0, 10)
  })

  it('treats duplicate tags like a single tag', () => {
    expect(tagScore(['heritage', 'heritage'], { heritageVsModern: 0 })).toBeCloseTo(30, 10)
  })

  it('ignores dimensions the score does not use (formality, music, decorDensity, indoorVsOutdoor)', () => {
    expect(
      tagScore(['heritage', 'grand'], {
        formality: 0,
        music: 100,
        decorDensity: 0,
        indoorVsOutdoor: 100,
      })
    ).toBeCloseTo(0, 10)
  })

  it('sums all four dimensions at the intimate/heritage/feast/acoustic extreme (90)', () => {
    // heritage 30 + intimate 20 (scale) + feast 25 + intimate 15 (energy)
    expect(
      tagScore(['heritage', 'intimate', 'comfort', 'feast'], {
        heritageVsModern: 0,
        scale: 0,
        feastVsSpectacle: 0,
        energy: 0,
      })
    ).toBeCloseTo(90, 10)
  })

  it('sums all four dimensions at the modern/grand/spectacle extreme (75)', () => {
    // modern 30 + grand 20 + spectacle 25 + no energy tag
    expect(
      tagScore(
        ['grand', 'modern', 'spectacle'],
        { heritageVsModern: 100, scale: 100, feastVsSpectacle: 100, energy: 100 },
        'decor'
      )
    ).toBeCloseTo(75, 10)
  })

  it('combines mixed fractional weights (40.5)', () => {
    // heritage 30*.5 + royal(heritage) 15*.5 + royal(scale) 20*.5 + feast 25*.2 + high-energy 15*.2
    expect(
      tagScore(['heritage', 'royal', 'feast', 'high-energy'], {
        heritageVsModern: 25,
        scale: 75,
        feastVsSpectacle: 40,
        energy: 60,
      })
    ).toBeCloseTo(40.5, 10)
  })

  it('can go negative when penalties dominate (-30)', () => {
    // modern -20 (heritage side), grand -10 (intimate side)
    expect(tagScore(['modern', 'grand'], { heritageVsModern: 0, scale: 0 })).toBeCloseTo(-30, 10)
  })

  it('scores real catalogue ideas by their actual tags', () => {
    const kulhad = CURATED_IDEAS.find((i) => i.id === 'kulhad_chai_bar')!
    const shehnai = CURATED_IDEAS.find((i) => i.id === 'live_shehnai_jugalbandi')!
    // kulhad (catering; heritage, intimate, comfort, feast): 30 + 20 + 25 + 15
    expect(
      scoreOf(kulhad, { heritageVsModern: 0, scale: 0, feastVsSpectacle: 0, energy: 0 })
    ).toBeCloseTo(90, 10)
    // shehnai (heritage, grand, royal, acoustic): heritage 30 + royal 15, grand/royal 20, acoustic 15
    expect(
      scoreOf(shehnai, { heritageVsModern: 0, scale: 100, feastVsSpectacle: 50, energy: 0 })
    ).toBeCloseTo(80, 10)
  })

  it('is deterministic: the same input yields the same score every time', () => {
    const dims = { heritageVsModern: 13, scale: 77, feastVsSpectacle: 31, energy: 64 }
    const first = tagScore(['heritage', 'grand', 'feast', 'high-energy'], dims)
    for (let i = 0; i < 5; i++) {
      expect(tagScore(['heritage', 'grand', 'feast', 'high-energy'], dims)).toBe(first)
    }
  })
})

describe('getPersonalizedIdeas ranking driven by the affinity score', () => {
  const ranked = (ideas: CuratedIdea[], styleDNA?: StyleDNA) =>
    withCatalogue(ideas, () => getPersonalizedIdeas(brief, styleDNA)).map((i) => i.id)

  it('orders ideas by descending score', () => {
    const low = makeIdea('low', ['modern'])
    const mid = makeIdea('mid', [])
    const high = makeIdea('high', ['heritage'])
    expect(ranked([low, mid, high], dnaWith({ heritageVsModern: 0 }))).toEqual([
      'high',
      'mid',
      'low',
    ])
  })

  it('breaks exact ties by id (ascending) regardless of input order', () => {
    const a = makeIdea('a_idea', [])
    const b = makeIdea('b_idea', [])
    const c = makeIdea('c_idea', [])
    expect(ranked([c, a, b], dnaWith())).toEqual(['a_idea', 'b_idea', 'c_idea'])
    expect(ranked([b, c, a], dnaWith())).toEqual(['a_idea', 'b_idea', 'c_idea'])
  })

  it('treats score differences of 0.001 or less as ties and falls back to id order', () => {
    // energy 49.999 => weight 0.00002 => acoustic bonus 0.0003 (< 0.001)
    const acousticZ = makeIdea('z_acoustic', ['acoustic'])
    const plainA = makeIdea('a_plain', [])
    expect(ranked([acousticZ, plainA], dnaWith({ energy: 49.999 }))).toEqual([
      'a_plain',
      'z_acoustic',
    ])
    // energy 49 => bonus 0.3 (> 0.001) so the score wins over id order
    expect(ranked([plainA, acousticZ], dnaWith({ energy: 49 }))).toEqual(['z_acoustic', 'a_plain'])
  })

  it('keeps catalogue order unchanged and unscored when styleDNA is omitted', () => {
    const z = makeIdea('z_first', ['modern'])
    const a = makeIdea('a_second', ['heritage'])
    expect(ranked([z, a], undefined)).toEqual(['z_first', 'a_second'])
  })

  it('is deterministic across repeated calls on the real catalogue', () => {
    const dna = dnaWith({ heritageVsModern: 20, scale: 70, feastVsSpectacle: 35, energy: 80 })
    const first = getPersonalizedIdeas(brief, dna).map((i) => i.id)
    for (let i = 0; i < 5; i++) {
      expect(getPersonalizedIdeas(brief, dna).map((x) => x.id)).toEqual(first)
    }
  })

  it('does not mutate the shared catalogue order', () => {
    const before = CURATED_IDEAS.map((i) => i.id)
    getPersonalizedIdeas(brief, dnaWith({ heritageVsModern: 0, energy: 100 }))
    expect(CURATED_IDEAS.map((i) => i.id)).toEqual(before)
  })
})
