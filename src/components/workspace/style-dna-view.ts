import type { Plan, PlanVersionRecord } from '@/lib/engine/types'
import type { StyleDNA, StyleDimensions } from '@/lib/ai/schemas'

export interface PaletteColor {
  name: string
  hex: string
}

export type DimensionEntry = [keyof StyleDimensions, number]

export interface StyleDNAView {
  dimensions: StyleDimensions
  topDimensions: DimensionEntry[]
  palette: PaletteColor[]
  vibeStatement: string
  protectedQuote: string | undefined
  isFallbackTier: boolean
}

export const DIMENSION_LABELS: Record<keyof StyleDimensions, string> = {
  formality: 'Formality',
  energy: 'High Energy',
  scale: 'Grand Scale',
  heritageVsModern: 'Heritage',
  feastVsSpectacle: 'Spectacle',
  music: 'Music & Beats',
  decorDensity: 'Decor Density',
  indoorVsOutdoor: 'Open Air',
}

const DEFAULT_PALETTE: PaletteColor[] = [
  { name: 'Marigold Amber', hex: '#F7C873' },
  { name: 'Gulabi Rose', hex: '#F2A7B8' },
  { name: 'Royal Plum', hex: '#3A2442' },
  { name: 'Warm Ivory', hex: '#FFF8EE' },
]

const DEFAULT_VIBE_STATEMENT =
  'A vibrant Indian celebration balanced with rich cultural traditions and modern elegance.'

/** Fallback style profile used until a Style DNA is attached to the plan. */
function defaultDimensions(): StyleDimensions {
  // A fresh object per call: the retune sheet resets its sliders whenever this reference changes.
  return {
    formality: 65,
    energy: 70,
    scale: 60,
    heritageVsModern: 40,
    feastVsSpectacle: 55,
    music: 75,
    decorDensity: 70,
    indoorVsOutdoor: 60,
  }
}

/** The three strongest dimension traits, highest first. */
function topThree(dimensions: StyleDimensions): DimensionEntry[] {
  return (Object.entries(dimensions) as DimensionEntry[]).sort(([, a], [, b]) => b - a).slice(0, 3)
}

/** Resolves everything the Style DNA card shows, applying the standard-profile fallbacks. */
export function resolveStyleDNAView(plan: Plan, currentVersion?: PlanVersionRecord): StyleDNAView {
  const styleDNA: StyleDNA | undefined = plan.styleDNA || currentVersion?.meta?.styleDNA
  const dimensions = styleDNA?.dimensions || defaultDimensions()

  return {
    dimensions,
    topDimensions: topThree(dimensions),
    palette: styleDNA?.namedPalette || DEFAULT_PALETTE,
    vibeStatement: styleDNA?.vibeStatement || plan.brief.vibeStatement || DEFAULT_VIBE_STATEMENT,
    protectedQuote: styleDNA?.protectedMomentQuote || plan.brief.protectedMomentQuote,
    isFallbackTier: currentVersion?.meta?.run_record?.activeTier === 3,
  }
}
