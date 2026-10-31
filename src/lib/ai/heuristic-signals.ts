import type { BudgetCategory } from '@/lib/engine/types'
import type { StyleDimensions } from './schemas'

export interface VibeTradeoffs {
  feastVsSpectacle: 'feast' | 'spectacle'
  intimateVsGrand: 'intimate' | 'grand'
  heritageVsModern: 'heritage' | 'modern'
}

/** Dimension values used when no swatch is selected. */
export const DEFAULT_DIMENSIONS: Readonly<StyleDimensions> = {
  formality: 60,
  energy: 60,
  scale: 60,
  heritageVsModern: 50,
  feastVsSpectacle: 50,
  music: 60,
  decorDensity: 65,
  indoorVsOutdoor: 50,
}

export const DEFAULT_PALETTE = ['#F7C873', '#F2A7B8', '#3A2442', '#FFF8EE']
export const DEFAULT_COLOR_NAMES = ['Marigold Amber', 'Gulabi Rose', 'Royal Plum', 'Warm Ivory']

/** How far a forced-choice trade-off moves a dimension, and the range it is clamped to. */
export const TRADEOFF_SHIFT = 25

interface TradeoffRule {
  readonly dimension: 'feastVsSpectacle' | 'scale' | 'heritageVsModern'
  readonly tradeoff: keyof VibeTradeoffs
  /** The choice that moves the dimension down; any other choice moves it up. */
  readonly lowChoice: string
  readonly min: number
  readonly max: number
}

export const TRADEOFF_RULES: readonly TradeoffRule[] = [
  {
    dimension: 'feastVsSpectacle',
    tradeoff: 'feastVsSpectacle',
    lowChoice: 'feast',
    min: 10,
    max: 90,
  },
  { dimension: 'scale', tradeoff: 'intimateVsGrand', lowChoice: 'intimate', min: 15, max: 90 },
  {
    dimension: 'heritageVsModern',
    tradeoff: 'heritageVsModern',
    lowChoice: 'heritage',
    min: 10,
    max: 90,
  },
]

/**
 * Keyword signals for the Protected Moment category. The first matching entry wins, so order
 * matters ("mithai box" is caught by the catering "mithai" keyword before favors is reached).
 */
export const PROTECTED_CATEGORY_SIGNALS: ReadonlyArray<readonly [RegExp, BudgetCategory]> = [
  [/music|qawwali|dj|band|singer|dance|sangeet|dhol/i, 'entertainment'],
  [/photo|film|video|shoot|album|drone|cinemat/i, 'photo_film'],
  [/flower|mandap|decor|light|chandelier|stage|entry|floral/i, 'decor'],
  [/venue|palace|haveli|hall|lawn|resort|farmhouse/i, 'venue'],
  [/food|feast|dinner|mithai|chaat|dessert|cocktail|catering|menu/i, 'catering'],
  [/gift|favor|potli|box|hamper|mithai box/i, 'favors'],
]

export const DEFAULT_PROTECTED_CATEGORY: BudgetCategory = 'catering'
