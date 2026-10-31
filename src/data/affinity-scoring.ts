import type { BudgetCategory, CuratedIdea, StyleDNA } from '../lib/engine/types'

type Dimensions = StyleDNA['dimensions']

/**
 * One weighted signal: when an idea matches, `delta * weight` is added to its score.
 * An idea matches when it carries any of `tags` OR belongs to any of `categories` (the two
 * count once, never twice), unless its category is in `excludeCategories`.
 * A negative `delta` is a penalty.
 */
interface AffinitySignal {
  readonly delta: number
  readonly tags?: readonly string[]
  readonly categories?: readonly BudgetCategory[]
  readonly excludeCategories?: readonly BudgetCategory[]
}

/**
 * Signals for one Style DNA dimension. A value strictly below 50 uses `below` with weight
 * (50 - value) / 50; 50 or above uses `atOrAbove` with weight (value - 50) / 50.
 * At exactly 50 the weight is 0, so every signal contributes nothing.
 */
interface AffinityRule {
  readonly dimension: keyof Dimensions
  readonly below: readonly AffinitySignal[]
  readonly atOrAbove: readonly AffinitySignal[]
}

const NEUTRAL_POINT = 50

/**
 * Rule and signal order is part of the contract: scores are summed in this order, so changing it
 * could change floating-point results at the last digit.
 */
const AFFINITY_RULES: readonly AffinityRule[] = [
  {
    // 0 = Heritage, 100 = Modern
    dimension: 'heritageVsModern',
    below: [
      { tags: ['heritage'], delta: 30 },
      { tags: ['traditional'], delta: 25 },
      { tags: ['ceremonial', 'royal'], delta: 15 },
      { tags: ['modern'], delta: -20 },
    ],
    atOrAbove: [
      { tags: ['modern'], delta: 30 },
      { tags: ['playful'], excludeCategories: ['catering'], delta: 15 },
      { tags: ['heritage', 'traditional'], delta: -20 },
    ],
  },
  {
    // 0 = Intimate, 100 = Grand
    dimension: 'scale',
    below: [
      { tags: ['intimate', 'comfort'], delta: 20 },
      { tags: ['grand'], delta: -10 },
    ],
    atOrAbove: [
      { tags: ['grand', 'royal'], delta: 20 },
      { tags: ['intimate'], delta: -10 },
    ],
  },
  {
    // 0 = Feast, 100 = Spectacle
    dimension: 'feastVsSpectacle',
    below: [{ tags: ['feast'], categories: ['catering'], delta: 25 }],
    atOrAbove: [{ tags: ['spectacle'], categories: ['decor'], delta: 25 }],
  },
  {
    // 0 = Chill/Acoustic, 100 = High-Energy
    dimension: 'energy',
    below: [{ tags: ['acoustic', 'intimate'], delta: 15 }],
    atOrAbove: [{ tags: ['high-energy'], delta: 15 }],
  },
]

function signalMatches(
  signal: AffinitySignal,
  category: BudgetCategory,
  tags: ReadonlySet<string>
): boolean {
  if (signal.excludeCategories?.includes(category)) return false
  const hasTag = signal.tags?.some((tag) => tags.has(tag)) ?? false
  const inCategory = signal.categories?.includes(category) ?? false
  return hasTag || inCategory
}

/**
 * Deterministic affinity of an idea to a Style DNA: the sum of every matching, weighted signal.
 * Tags are compared case-insensitively.
 */
export function calculateAffinityScore(idea: CuratedIdea, dimensions: Dimensions): number {
  const tags = new Set(idea.styleTags.map((tag) => tag.toLowerCase()))
  let score = 0

  for (const rule of AFFINITY_RULES) {
    const value = dimensions[rule.dimension]
    const signals = value < NEUTRAL_POINT ? rule.below : rule.atOrAbove
    const weight = Math.abs(value - NEUTRAL_POINT) / NEUTRAL_POINT

    for (const signal of signals) {
      if (signalMatches(signal, idea.category, tags)) score += signal.delta * weight
    }
  }

  return score
}
