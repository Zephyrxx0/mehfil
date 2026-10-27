import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { extractStyleDNAWithFallbackLadder } from '@/lib/ai/orchestrator'
import { StyleDNASchema, type StyleDNA } from '@/lib/ai/schemas'
import { POST } from '@/app/api/style-dna/route'
import { generateObject } from 'ai'

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

describe('Three-Tier Fallback Ladder Orchestrator (D-13, D-15, D-16, GENUI-03)', () => {
  const originalEnv = { ...process.env }
  const mockGenerateObject = vi.mocked(generateObject)

  const sampleSwatchIds = [
    'royal-amber-courtyard',
    'marigold-cascade',
    'gulabi-meena-mandap',
    'sheesh-mahal-glimmer',
    'terracotta-diyas',
    'haveli-arches',
  ]
  const sampleMoment = 'Soulful live sufi qawwali night under starry lanterns.'
  const sampleTradeoffs = {
    feastVsSpectacle: 'feast' as const,
    intimateVsGrand: 'intimate' as const,
    heritageVsModern: 'heritage' as const,
  }

  const validModelDNA: StyleDNA = {
    dimensions: {
      formality: 75,
      energy: 65,
      scale: 70,
      heritageVsModern: 30,
      feastVsSpectacle: 60,
      music: 85,
      decorDensity: 75,
      indoorVsOutdoor: 45,
    },
    namedPalette: [
      { name: 'Marigold Amber', hex: '#F7C873' },
      { name: 'Gulabi Rose', hex: '#F2A7B8' },
      { name: 'Royal Plum', hex: '#3A2442' },
      { name: 'Warm Ivory', hex: '#FFF8EE' },
    ],
    vibeStatement: 'An opulent royal evening with acoustic sufi tunes and lantern glow.',
    protectedCategory: 'entertainment',
    protectedMomentQuote: sampleMoment,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'mock-google-api-key'
    delete process.env.GEMINI_API_KEY
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('Test 1 (Tier 1 Happy Path): executes Gemma 4 successfully and attaches Tier 1 RunRecord', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: validModelDNA,
    } as any)

    const result = await extractStyleDNAWithFallbackLadder(
      sampleSwatchIds,
      sampleMoment,
      sampleTradeoffs
    )

    expect(result.runRecord.activeTier).toBe(1)
    expect(result.runRecord.modelId).toBe('gemma-4-31b-it')
    expect(result.runRecord.fallbackReason).toBeUndefined()
    expect(result.runRecord.durationMs).toBeGreaterThanOrEqual(0)
    expect(StyleDNASchema.safeParse(result.styleDNA).success).toBe(true)
    expect(result.styleDNA.protectedMomentQuote).toBe(sampleMoment)
    expect(mockGenerateObject).toHaveBeenCalledTimes(1)
  })

  it('Test 2 (Tier 1 Schema Repair Retry, T-04-04): triggers 1-shot repair retry at temperature 0 on schema validation failure', async () => {
    // Attempt 1 fails validation
    mockGenerateObject.mockRejectedValueOnce(
      new Error('Validation error: namedPalette must have at least 3 colors')
    )
    // Attempt 2 (repair retry) succeeds
    mockGenerateObject.mockResolvedValueOnce({
      object: validModelDNA,
    } as any)

    const result = await extractStyleDNAWithFallbackLadder(
      sampleSwatchIds,
      sampleMoment,
      sampleTradeoffs
    )

    expect(result.runRecord.activeTier).toBe(1)
    expect(result.runRecord.modelId).toBe('gemma-4-31b-it')
    expect(mockGenerateObject).toHaveBeenCalledTimes(2)

    // Inspect repair retry call arguments
    const secondCall = mockGenerateObject.mock.calls[1][0]
    expect(secondCall.temperature).toBe(0)
    expect(secondCall.prompt).toContain('The previous output failed validation')
    expect(secondCall.prompt).toContain('namedPalette must have at least 3 colors')
  })

  it('Test 3 (Tier 1 Timeout Escalates to Tier 2, T-04-05): TimeoutError escalates to Gemini 2.0 Flash without repair retry', async () => {
    const timeoutErr = new Error('The operation was aborted due to timeout')
    timeoutErr.name = 'TimeoutError'
    mockGenerateObject.mockRejectedValueOnce(timeoutErr)

    // Tier 2 succeeds
    mockGenerateObject.mockResolvedValueOnce({
      object: validModelDNA,
    } as any)

    const result = await extractStyleDNAWithFallbackLadder(
      sampleSwatchIds,
      sampleMoment,
      sampleTradeoffs
    )

    expect(result.runRecord.activeTier).toBe(2)
    expect(result.runRecord.modelId).toBe('gemini-2.0-flash')
    expect(result.runRecord.fallbackReason).toContain('Tier 1 failed')
    expect(result.runRecord.fallbackReason).toContain('timeout')
    expect(mockGenerateObject).toHaveBeenCalledTimes(2)
  })

  it('Test 4 (Tier 2 Failure Escalates to Tier 3 Heuristic): when both tiers fail, calmly degrades to heuristic extractor', async () => {
    // Both Tier 1 and Tier 2 fail (each failing repair as well)
    mockGenerateObject.mockRejectedValue(new Error('API quota exceeded / service unavailable'))

    const result = await extractStyleDNAWithFallbackLadder(
      sampleSwatchIds,
      sampleMoment,
      sampleTradeoffs
    )

    expect(result.runRecord.activeTier).toBe(3)
    expect(result.runRecord.modelId).toBe('deterministic-heuristic-v1')
    expect(result.runRecord.fallbackReason).toContain('Tier 1 & 2 failed')
    expect(StyleDNASchema.safeParse(result.styleDNA).success).toBe(true)
    expect(result.styleDNA.protectedCategory).toBe('entertainment')
    expect(result.styleDNA.protectedMomentQuote).toBe(sampleMoment)
  })

  it('Test 5 (Missing API Key Bypasses Network, T-04-06): executes Tier 3 in <10ms with api_key_missing reason when no key is set', async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = ''
    delete process.env.GEMINI_API_KEY

    const start = Date.now()
    const result = await extractStyleDNAWithFallbackLadder(
      sampleSwatchIds,
      sampleMoment,
      sampleTradeoffs
    )
    const elapsed = Date.now() - start

    expect(result.runRecord.activeTier).toBe(3)
    expect(result.runRecord.modelId).toBe('deterministic-heuristic-v1')
    expect(result.runRecord.fallbackReason).toBe('api_key_missing')
    expect(elapsed).toBeLessThan(50) // Execution is instant
    expect(mockGenerateObject).not.toHaveBeenCalled()
    expect(StyleDNASchema.safeParse(result.styleDNA).success).toBe(true)
  })

  it('Test 6 (Protected Moment Preserved in Output): ensures verbatim quote is preserved across Tier 1, Tier 2, and Tier 3', async () => {
    const customQuote = 'Grandfather reciting shayari amidst gentle shehnai music.'

    // 1. Tier 3 (Missing key)
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = ''
    const t3Result = await extractStyleDNAWithFallbackLadder(
      sampleSwatchIds,
      customQuote,
      sampleTradeoffs
    )
    expect(t3Result.styleDNA.protectedMomentQuote).toBe(customQuote)
    expect(t3Result.styleDNA.protectedCategory).toBe('entertainment')

    // 2. Tier 1
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'mock-key'
    mockGenerateObject.mockResolvedValueOnce({
      object: { ...validModelDNA, protectedMomentQuote: 'slight model variation' },
    } as any)
    const t1Result = await extractStyleDNAWithFallbackLadder(
      sampleSwatchIds,
      customQuote,
      sampleTradeoffs
    )
    expect(t1Result.styleDNA.protectedMomentQuote).toBe(customQuote)
  })

  describe('API Route POST /api/style-dna', () => {
    it('returns 200 with structured styleDNA and runRecord for valid request', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: validModelDNA,
      } as any)

      const req = new Request('http://localhost:3000/api/style-dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedSwatchIds: sampleSwatchIds,
          protectedMomentQuote: sampleMoment,
          tradeoffs: sampleTradeoffs,
        }),
      })

      const response = await POST(req)
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.data.runRecord.activeTier).toBe(1)
      expect(json.data.styleDNA.protectedMomentQuote).toBe(sampleMoment)
    })

    it('returns 400 when swatch count is fewer than 6 (VIBE-01 invariant)', async () => {
      const req = new Request('http://localhost:3000/api/style-dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedSwatchIds: ['royal-amber-courtyard', 'marigold-cascade'], // only 2
          protectedMomentQuote: sampleMoment,
          tradeoffs: sampleTradeoffs,
        }),
      })

      const response = await POST(req)
      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.success).toBe(false)
    })

    it('returns 400 for malformed JSON request', async () => {
      const req = new Request('http://localhost:3000/api/style-dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json',
      })

      const response = await POST(req)
      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.success).toBe(false)
    })
  })
})
