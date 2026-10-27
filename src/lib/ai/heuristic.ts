import { SWATCHES, type StyleSwatch } from '@/data/swatches'
import {
  StyleDNASchema,
  type StyleDNA,
  type StyleDimensions,
  type NamedPaletteColor,
} from './schemas'
import type { BudgetCategory } from '@/lib/engine/types'

export interface VibeTradeoffs {
  feastVsSpectacle: 'feast' | 'spectacle'
  intimateVsGrand: 'intimate' | 'grand'
  heritageVsModern: 'heritage' | 'modern'
}

const DEFAULT_PALETTE = ['#F7C873', '#F2A7B8', '#3A2442', '#FFF8EE']
const DEFAULT_COLOR_NAMES = ['Marigold Amber', 'Gulabi Rose', 'Royal Plum', 'Warm Ivory']

export function extractDeterministicStyleDNA(
  selectedSwatchIds: string[],
  protectedMomentText: string,
  tradeoffs: VibeTradeoffs
): StyleDNA {
  const swatches: StyleSwatch[] = selectedSwatchIds
    .map((id) => SWATCHES.find((s) => s.id === id))
    .filter((s): s is StyleSwatch => s !== undefined)

  const count = swatches.length > 0 ? swatches.length : 1

  // 1. Average the 8 dimensions across selected swatches
  const baseDim: StyleDimensions = {
    formality: Math.round(
      swatches.length > 0
        ? swatches.reduce((sum, s) => sum + s.dimensions.formality, 0) / count
        : 60
    ),
    energy: Math.round(
      swatches.length > 0
        ? swatches.reduce((sum, s) => sum + s.dimensions.energy, 0) / count
        : 60
    ),
    scale: Math.round(
      swatches.length > 0
        ? swatches.reduce((sum, s) => sum + s.dimensions.scale, 0) / count
        : 60
    ),
    heritageVsModern: Math.round(
      swatches.length > 0
        ? swatches.reduce((sum, s) => sum + s.dimensions.heritageVsModern, 0) / count
        : 50
    ),
    feastVsSpectacle: Math.round(
      swatches.length > 0
        ? swatches.reduce((sum, s) => sum + s.dimensions.feastVsSpectacle, 0) / count
        : 50
    ),
    music: Math.round(
      swatches.length > 0
        ? swatches.reduce((sum, s) => sum + s.dimensions.music, 0) / count
        : 60
    ),
    decorDensity: Math.round(
      swatches.length > 0
        ? swatches.reduce((sum, s) => sum + s.dimensions.decorDensity, 0) / count
        : 65
    ),
    indoorVsOutdoor: Math.round(
      swatches.length > 0
        ? swatches.reduce((sum, s) => sum + s.dimensions.indoorVsOutdoor, 0) / count
        : 50
    ),
  }

  // 2. Modulate dimensions with forced-choice trade-offs
  if (tradeoffs.feastVsSpectacle === 'feast') {
    baseDim.feastVsSpectacle = Math.max(10, Math.min(90, baseDim.feastVsSpectacle - 25))
  } else {
    baseDim.feastVsSpectacle = Math.max(10, Math.min(90, baseDim.feastVsSpectacle + 25))
  }

  if (tradeoffs.intimateVsGrand === 'intimate') {
    baseDim.scale = Math.max(15, Math.min(90, baseDim.scale - 25))
  } else {
    baseDim.scale = Math.max(15, Math.min(90, baseDim.scale + 25))
  }

  if (tradeoffs.heritageVsModern === 'heritage') {
    baseDim.heritageVsModern = Math.max(10, Math.min(90, baseDim.heritageVsModern - 25))
  } else {
    baseDim.heritageVsModern = Math.max(10, Math.min(90, baseDim.heritageVsModern + 25))
  }

  // 3. Keyword heuristic for Protected Moment category
  const lowerMoment = protectedMomentText.toLowerCase()
  let protectedCategory: BudgetCategory = 'catering'

  if (/music|qawwali|dj|band|singer|dance|sangeet|dhol/i.test(lowerMoment)) {
    protectedCategory = 'entertainment'
  } else if (/photo|film|video|shoot|album|drone|cinemat/i.test(lowerMoment)) {
    protectedCategory = 'photo_film'
  } else if (/flower|mandap|decor|light|chandelier|stage|entry|floral/i.test(lowerMoment)) {
    protectedCategory = 'decor'
  } else if (/venue|palace|haveli|hall|lawn|resort|farmhouse/i.test(lowerMoment)) {
    protectedCategory = 'venue'
  } else if (/food|feast|dinner|mithai|chaat|dessert|cocktail|catering|menu/i.test(lowerMoment)) {
    protectedCategory = 'catering'
  } else if (/gift|favor|potli|box|hamper|mithai box/i.test(lowerMoment)) {
    protectedCategory = 'favors'
  }

  // 4. Palette extraction
  const rawPalette =
    swatches.length > 0 && swatches[0].palette.length >= 3
      ? swatches[0].palette
      : DEFAULT_PALETTE

  const namedPalette: NamedPaletteColor[] = rawPalette.slice(0, 4).map((hex, i) => ({
    name: DEFAULT_COLOR_NAMES[i] || `Shade ${i + 1}`,
    hex,
  }))

  // 5. Clean vibe statement and quote
  const titles = swatches.slice(0, 2).map((s) => s.title).join(' & ')
  const baseStatement = titles
    ? `A celebration infused with ${titles}, emphasizing ${protectedCategory.replace('_', ' ')}.`
    : `A festive celebration emphasizing ${protectedCategory.replace('_', ' ')}.`

  const vibeStatement = baseStatement.length > 200 ? baseStatement.slice(0, 197) + '...' : baseStatement

  const trimmedQuote = protectedMomentText.trim()
  const protectedMomentQuote = trimmedQuote.length > 200
    ? trimmedQuote.slice(0, 197) + '...'
    : trimmedQuote || 'Soulful celebratory moment with cherished guests.'

  const result: StyleDNA = {
    dimensions: baseDim,
    namedPalette,
    vibeStatement,
    protectedCategory,
    protectedMomentQuote,
  }

  // Ensure strict schema compliance
  return StyleDNASchema.parse(result)
}
