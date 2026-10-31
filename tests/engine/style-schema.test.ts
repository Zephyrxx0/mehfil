import { describe, it, expect } from 'vitest'
import {
  NamedPaletteColorSchema,
  NamedPaletteSchema,
  StyleDNASchema,
  AgentRunRecordSchema,
  type StyleDNA,
} from '@/lib/ai/schemas'

describe('Style DNA Zod Schemas & Identity Safeguards (D-05, D-06, VIBE-03)', () => {
  const validStyleDNA: StyleDNA = {
    dimensions: {
      formality: 75,
      energy: 80,
      scale: 65,
      heritageVsModern: 40,
      feastVsSpectacle: 70,
      music: 85,
      decorDensity: 60,
      indoorVsOutdoor: 50,
    },
    namedPalette: [
      { name: 'Marigold Amber', hex: '#FF9F1C' },
      { name: 'Gulabi Rose', hex: '#F2A7B8' },
      { name: 'Royal Plum', hex: '#3A2442' },
      { name: 'Warm Ivory', hex: '#FFF8EE' },
    ],
    vibeStatement:
      'An exuberant evening filled with energetic acoustic rhythms, warm ambient lanterns, and rich marigold garlands.',
    protectedCategory: 'entertainment',
    protectedMomentQuote: 'Soulful live sufi qawwali session under starry lanterns.',
  }

  it('successfully parses valid Style DNA', () => {
    const result = StyleDNASchema.safeParse(validStyleDNA)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.protectedCategory).toBe('entertainment')
      expect(result.data.namedPalette).toHaveLength(4)
    }
  })

  it('rejects dimensions outside [0, 100] and non-integers', () => {
    const tooLow = {
      ...validStyleDNA,
      dimensions: { ...validStyleDNA.dimensions, music: -1 },
    }
    expect(StyleDNASchema.safeParse(tooLow).success).toBe(false)

    const tooHigh = {
      ...validStyleDNA,
      dimensions: { ...validStyleDNA.dimensions, formality: 101 },
    }
    expect(StyleDNASchema.safeParse(tooHigh).success).toBe(false)

    const floatVal = {
      ...validStyleDNA,
      dimensions: { ...validStyleDNA.dimensions, energy: 55.5 },
    }
    expect(StyleDNASchema.safeParse(floatVal).success).toBe(false)
  })

  it('rejects invalid hex color strings (e.g. 3-digit hex or non-hex)', () => {
    const badHex1 = {
      name: 'Gold',
      hex: '#FFF',
    }
    expect(NamedPaletteColorSchema.safeParse(badHex1).success).toBe(false)

    const badHex2 = {
      name: 'Gold',
      hex: 'yellow',
    }
    expect(NamedPaletteColorSchema.safeParse(badHex2).success).toBe(false)
  })

  it('enforces namedPalette length between 3 and 4 colors', () => {
    const twoColors = [
      { name: 'Amber', hex: '#F7C873' },
      { name: 'Plum', hex: '#3A2442' },
    ]
    expect(NamedPaletteSchema.safeParse(twoColors).success).toBe(false)

    const fiveColors = [
      { name: 'Amber', hex: '#F7C873' },
      { name: 'Plum', hex: '#3A2442' },
      { name: 'Rose', hex: '#F2A7B8' },
      { name: 'Ivory', hex: '#FFF8EE' },
      { name: 'Crimson', hex: '#8B263E' },
    ]
    expect(NamedPaletteSchema.safeParse(fiveColors).success).toBe(false)
  })

  it('rejects vibe statement exceeding 200 characters or fewer than 10 characters', () => {
    const tooShort = {
      ...validStyleDNA,
      vibeStatement: 'Too short',
    }
    expect(StyleDNASchema.safeParse(tooShort).success).toBe(false)

    const tooLong = {
      ...validStyleDNA,
      vibeStatement: 'A'.repeat(201),
    }
    expect(StyleDNASchema.safeParse(tooLong).success).toBe(false)
  })

  it('STRICT IDENTITY SAFEGUARD (PRD §3.2, D-05, T-04-02): rejects demographic, ethnic, religious or caste fields', () => {
    const withReligion = {
      ...validStyleDNA,
      religion: 'Hindu',
    }
    const resultReligion = StyleDNASchema.safeParse(withReligion)
    expect(resultReligion.success).toBe(false)

    const withCaste = {
      ...validStyleDNA,
      caste: 'Brahmin',
    }
    const resultCaste = StyleDNASchema.safeParse(withCaste)
    expect(resultCaste.success).toBe(false)

    const withEthnicity = {
      ...validStyleDNA,
      ethnicity: 'Punjabi',
    }
    const resultEthnicity = StyleDNASchema.safeParse(withEthnicity)
    expect(resultEthnicity.success).toBe(false)
  })

  it('validates AgentRunRecord tiers 1, 2, and 3 correctly', () => {
    const t1 = {
      activeTier: 1,
      durationMs: 4120,
      modelId: 'gemma-4-31b-it',
      timestamp: new Date().toISOString(),
    }
    expect(AgentRunRecordSchema.safeParse(t1).success).toBe(true)

    const t2 = {
      activeTier: 2,
      durationMs: 2310,
      modelId: 'gemini-2.0-flash',
      fallbackReason: 'Tier 1 Gemma 4 timed out after 8000ms',
      timestamp: new Date().toISOString(),
    }
    expect(AgentRunRecordSchema.safeParse(t2).success).toBe(true)

    const t3 = {
      activeTier: 3,
      durationMs: 3,
      modelId: 'heuristic-deterministic-v1',
      fallbackReason: 'No Gemini API key in environment',
      timestamp: new Date().toISOString(),
    }
    expect(AgentRunRecordSchema.safeParse(t3).success).toBe(true)

    const invalidTier = {
      activeTier: 4,
      durationMs: 100,
      modelId: 'unknown',
      timestamp: new Date().toISOString(),
    }
    expect(AgentRunRecordSchema.safeParse(invalidTier).success).toBe(false)

    const negativeDuration = {
      activeTier: 1,
      durationMs: -50,
      modelId: 'gemma-4-31b-it',
      timestamp: new Date().toISOString(),
    }
    expect(AgentRunRecordSchema.safeParse(negativeDuration).success).toBe(false)
  })
})
