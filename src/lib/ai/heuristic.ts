import { SWATCHES, type StyleSwatch } from '@/data/swatches'
import {
  StyleDNASchema,
  type StyleDNA,
  type StyleDimensions,
  type NamedPaletteColor,
} from './schemas'
import type { BudgetCategory } from '@/lib/engine/types'
import {
  DEFAULT_COLOR_NAMES,
  DEFAULT_DIMENSIONS,
  DEFAULT_PALETTE,
  DEFAULT_PROTECTED_CATEGORY,
  PROTECTED_CATEGORY_SIGNALS,
  TRADEOFF_RULES,
  TRADEOFF_SHIFT,
  type VibeTradeoffs,
} from './heuristic-signals'

export type { VibeTradeoffs }

const MAX_TEXT_LENGTH = 200
const FALLBACK_MOMENT_QUOTE = 'Soulful celebratory moment with cherished guests.'

function ellipsize(text: string): string {
  return text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH - 3) + '...' : text
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Average of each dimension across the selected swatches, or the defaults when none match. */
function averageDimensions(swatches: StyleSwatch[]): StyleDimensions {
  if (swatches.length === 0) return { ...DEFAULT_DIMENSIONS }

  const average = (key: keyof StyleDimensions): number =>
    Math.round(swatches.reduce((sum, s) => sum + s.dimensions[key], 0) / swatches.length)

  return {
    formality: average('formality'),
    energy: average('energy'),
    scale: average('scale'),
    heritageVsModern: average('heritageVsModern'),
    feastVsSpectacle: average('feastVsSpectacle'),
    music: average('music'),
    decorDensity: average('decorDensity'),
    indoorVsOutdoor: average('indoorVsOutdoor'),
  }
}

/** Shifts dimensions by the forced-choice trade-offs, clamping each to its allowed range. */
function applyTradeoffs(dimensions: StyleDimensions, tradeoffs: VibeTradeoffs): void {
  for (const rule of TRADEOFF_RULES) {
    const direction = tradeoffs[rule.tradeoff] === rule.lowChoice ? -1 : 1
    dimensions[rule.dimension] = clamp(
      dimensions[rule.dimension] + direction * TRADEOFF_SHIFT,
      rule.min,
      rule.max
    )
  }
}

function detectProtectedCategory(protectedMomentText: string): BudgetCategory {
  const lowerMoment = protectedMomentText.toLowerCase()
  const match = PROTECTED_CATEGORY_SIGNALS.find(([pattern]) => pattern.test(lowerMoment))
  return match ? match[1] : DEFAULT_PROTECTED_CATEGORY
}

function extractNamedPalette(swatches: StyleSwatch[]): NamedPaletteColor[] {
  const rawPalette =
    swatches.length > 0 && swatches[0].palette.length >= 3 ? swatches[0].palette : DEFAULT_PALETTE

  return rawPalette.slice(0, 4).map((hex, i) => ({
    name: DEFAULT_COLOR_NAMES[i] || `Shade ${i + 1}`,
    hex,
  }))
}

function buildVibeStatement(swatches: StyleSwatch[], protectedCategory: BudgetCategory): string {
  const emphasis = protectedCategory.replace('_', ' ')
  const titles = swatches
    .slice(0, 2)
    .map((s) => s.title)
    .join(' & ')
  return ellipsize(
    titles
      ? `A celebration infused with ${titles}, emphasizing ${emphasis}.`
      : `A festive celebration emphasizing ${emphasis}.`
  )
}

export function extractDeterministicStyleDNA(
  selectedSwatchIds: string[],
  protectedMomentText: string,
  tradeoffs: VibeTradeoffs
): StyleDNA {
  const swatches: StyleSwatch[] = selectedSwatchIds
    .map((id) => SWATCHES.find((s) => s.id === id))
    .filter((s): s is StyleSwatch => s !== undefined)

  const dimensions = averageDimensions(swatches)
  applyTradeoffs(dimensions, tradeoffs)

  const protectedCategory = detectProtectedCategory(protectedMomentText)

  const result: StyleDNA = {
    dimensions,
    namedPalette: extractNamedPalette(swatches),
    vibeStatement: buildVibeStatement(swatches, protectedCategory),
    protectedCategory,
    protectedMomentQuote: ellipsize(protectedMomentText.trim()) || FALLBACK_MOMENT_QUOTE,
  }

  // Ensure strict schema compliance
  return StyleDNASchema.parse(result)
}
