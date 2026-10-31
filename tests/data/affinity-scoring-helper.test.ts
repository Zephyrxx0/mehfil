import { describe, it, expect } from 'vitest'
import { calculateAffinityScore } from '@/data/affinity-scoring'
import type { BudgetCategory, CuratedIdea, StyleDNA } from '@/lib/engine/types'

type Dimensions = StyleDNA['dimensions']

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

function idea(styleTags: string[], category: BudgetCategory = 'entertainment'): CuratedIdea {
  return {
    id: 'probe',
    title: 'probe',
    tagline: 't',
    description: 'd',
    category,
    eventTypes: ['wedding'],
    costPaise: 100,
    leadDays: 1,
    styleTags,
    culturalNuance: 'n',
  }
}

const score = (tags: string[], overrides: Partial<Dimensions>, category?: BudgetCategory) =>
  calculateAffinityScore(idea(tags, category), { ...NEUTRAL, ...overrides })

describe('calculateAffinityScore (direct)', () => {
  it('scores 0 at the neutral point for any tags', () => {
    expect(score(['heritage', 'grand', 'feast', 'high-energy'], {})).toBe(0)
  })

  it('applies full weight at the extremes', () => {
    expect(score(['heritage'], { heritageVsModern: 0 })).toBe(30)
    expect(score(['modern'], { heritageVsModern: 100 })).toBe(30)
  })

  it('applies partial weight just off the neutral point (49 / 51)', () => {
    expect(score(['heritage'], { heritageVsModern: 49 })).toBeCloseTo(0.6, 10)
    expect(score(['modern'], { heritageVsModern: 51 })).toBeCloseTo(0.6, 10)
  })

  it('applies penalties as negative scores', () => {
    expect(score(['modern'], { heritageVsModern: 0 })).toBe(-20)
  })

  it('matches tags case-insensitively', () => {
    expect(score(['HERITAGE'], { heritageVsModern: 0 })).toBe(30)
  })

  it('counts a tag-or-category signal once', () => {
    expect(score(['feast'], { feastVsSpectacle: 0 }, 'catering')).toBe(25)
  })

  it('excludes catering from the playful bonus', () => {
    expect(score(['playful'], { heritageVsModern: 100 }, 'catering')).toBe(0)
    expect(score(['playful'], { heritageVsModern: 100 }, 'entertainment')).toBe(15)
  })

  it('sums signals across dimensions (90)', () => {
    const dims = { heritageVsModern: 0, scale: 100, feastVsSpectacle: 100, energy: 100 }
    // heritage 30 + royal 15 (heritage side) + royal 20 (scale) + spectacle 25 = 90 ... plus
    // high-energy 15 would exceed, so it is deliberately absent.
    expect(score(['heritage', 'royal', 'spectacle'], dims)).toBe(90)
  })
})
