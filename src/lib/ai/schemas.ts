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

// Quote Quarantine & Extraction Schemas (QUOTE-01, QUOTE-02, ADR-0003)

export const ExtractedQuoteItemSchema = z
  .object({
    description: z.string().min(1).max(200),
    amountStated: z.number().positive(), // Raw rupee figure from source text
    pricingType: z.enum(['flat', 'per_guest']),
    sourceAnchor: z.string().min(1).max(200), // Verbatim substring match
  })
  .strict()

export const PackageTierSchema = z
  .object({
    tierId: z.string().min(1).max(50),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    lineItems: z.array(ExtractedQuoteItemSchema).min(1),
    tierTotalStated: z.number().positive().optional(),
    tierTotalSourceAnchor: z.string().max(200).optional(),
  })
  .strict()

export const QuoteExtractionSchema = z
  .object({
    vendorName: z.string().min(1).max(100),
    category: BudgetCategorySchema,
    statedInclusions: z.array(z.string().max(200)),
    statedExclusions: z.array(z.string().max(200)),
    paymentTerms: z.string().max(300).optional(),
    tiers: z.array(PackageTierSchema).min(1),
  })
  .strict()

// Generative UI Closed Registry Schemas (GENUI-01, GENUI-02, GENUI-03, ADR-0008)

export const GenerativeUIComponentEnum = z.enum([
  'VendorChecklist',
  'IdeaGrid',
  'QuoteReport',
  'ScenarioComparison',
])

export const LayoutVariantEnum = z.enum([
  'compact',
  'detailed',
  'side_by_side',
])

export const GenerativeUISectionSchema = z
  .object({
    id: z.string(),
    component: GenerativeUIComponentEnum,
    variant: LayoutVariantEnum,
    title: z.string().min(1).max(100),
    rationale: z.string().min(10).max(500),
    lineIds: z.array(z.string()).optional(),
    quoteIds: z.array(z.string()).optional(),
    ideaIds: z.array(z.string()).optional(),
    highlightEntityId: z.string().optional(),
  })
  .strict() // Rejects any numeric or date keys

export const GenerativeUILayoutSchema = z
  .object({
    layoutTitle: z.string().min(1).max(100),
    layoutSummary: z.string().min(10).max(500),
    sections: z.array(GenerativeUISectionSchema).min(1).max(4),
  })
  .strict()

export type ExtractedQuoteItemInput = z.infer<typeof ExtractedQuoteItemSchema>
export type PackageTierInput = z.infer<typeof PackageTierSchema>
export type QuoteExtractionInput = z.infer<typeof QuoteExtractionSchema>
export type GenerativeUISectionInput = z.infer<typeof GenerativeUISectionSchema>
export type GenerativeUILayoutInput = z.infer<typeof GenerativeUILayoutSchema>

export type GenerativeUIComponent = z.infer<typeof GenerativeUIComponentEnum>
export type LayoutVariant = z.infer<typeof LayoutVariantEnum>
export type GenerativeUISection = GenerativeUISectionInput
export type GenerativeUILayout = GenerativeUILayoutInput

