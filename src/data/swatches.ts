import swatchesData from './swatches.json'

export interface StyleDimensionsBiases {
  formality: number
  energy: number
  scale: number
  heritageVsModern: number
  feastVsSpectacle: number
  music: number
  decorDensity: number
  indoorVsOutdoor: number
}

export type SwatchPresetTag =
  | 'Royal Heritage'
  | 'Garden Pastel'
  | 'Minimalist Festive'
  | 'High Energy Mela'
  | 'Intimate Classic'

export const SWATCH_PRESET_TAGS: readonly SwatchPresetTag[] = [
  'Royal Heritage',
  'Garden Pastel',
  'Minimalist Festive',
  'High Energy Mela',
  'Intimate Classic',
] as const

export interface StyleSwatch {
  id: string
  title: string
  description: string
  image: string
  svgFallback: string
  tags: SwatchPresetTag[]
  palette: string[]
  dimensions: StyleDimensionsBiases
}

export const SWATCHES: StyleSwatch[] = swatchesData as StyleSwatch[]

export function getSwatchById(id: string): StyleSwatch | undefined {
  return SWATCHES.find((s) => s.id === id)
}

export function getSwatchesByTag(tag: string): StyleSwatch[] {
  return SWATCHES.filter((s) => s.tags.includes(tag as SwatchPresetTag))
}
