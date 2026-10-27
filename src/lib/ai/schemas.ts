import { z } from 'zod'

export const BUDGET_CATEGORIES = [
  'venue',
  'catering',
  'decor',
  'photo_film',
  'entertainment',
  'favors',
  'misc',
  'contingency',
] as const

export const BudgetCategorySchema = z.enum(BUDGET_CATEGORIES)

export const StyleDimensionsSchema = z
  .object({
    formality: z.number().int().min(0).max(100),
    energy: z.number().int().min(0).max(100),
    scale: z.number().int().min(0).max(100),
    heritageVsModern: z.number().int().min(0).max(100),
    feastVsSpectacle: z.number().int().min(0).max(100),
    music: z.number().int().min(0).max(100),
    decorDensity: z.number().int().min(0).max(100),
    indoorVsOutdoor: z.number().int().min(0).max(100),
  })
  .strict()

export const NamedPaletteColorSchema = z
  .object({
    name: z.string().min(1).max(30),
    hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  })
  .strict()

export const NamedPaletteSchema = z.array(NamedPaletteColorSchema).min(3).max(4)

export const StyleDNASchema = z
  .object({
    dimensions: StyleDimensionsSchema,
    namedPalette: NamedPaletteSchema,
    vibeStatement: z.string().min(10).max(200),
    protectedCategory: BudgetCategorySchema,
    protectedMomentQuote: z.string().min(1).max(200),
  })
  .strict()

export const CategoryMultiplierSchema = z.number().min(0.75).max(1.25)

export const PlannerModulationSchema = z
  .object({
    multipliers: z.record(BudgetCategorySchema, CategoryMultiplierSchema),
    rationale: z.string().min(10).max(500),
  })
  .strict()

export const AgentRunRecordSchema = z
  .object({
    activeTier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    durationMs: z.number().int().nonnegative(),
    modelId: z.string().min(1),
    fallbackReason: z.string().optional(),
    timestamp: z.string(),
  })
  .strict()

export type StyleDimensions = z.infer<typeof StyleDimensionsSchema>
export type NamedPaletteColor = z.infer<typeof NamedPaletteColorSchema>
export type StyleDNA = z.infer<typeof StyleDNASchema>
export type PlannerModulation = z.infer<typeof PlannerModulationSchema>
export type AgentRunRecord = z.infer<typeof AgentRunRecordSchema>
