import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { POST as quoteRoute } from '@/app/api/ai/quote-analyst/route'
import { POST as styleRoute } from '@/app/api/style-dna/route'
import { resetModelBudget } from '@/lib/security/model-budget'
import * as styleDna from '@/lib/ai/style-dna'
import * as quotePipeline from '@/lib/ai/quote-pipeline'

const json = (url: string, body: unknown) =>
  new Request(`http://localhost${url}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })

const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
const SWATCHES = ['art-deco-bombay', 'banarasi-zari-crimson', 'boho-marigold-fair']
const TRADEOFFS = {
  feastVsSpectacle: 'feast',
  intimateVsGrand: 'grand',
  heritageVsModern: 'modern',
}
const QUOTE = 'Royal Caterers\nPer plate Rs 950/- per plate for 250 guests'

describe('AI routes: input validation (S5, S8)', () => {
  beforeEach(() => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
    delete process.env.GEMINI_API_KEY
  })

  it('quote route accepts a real PNG data URL', async () => {
    const res = await quoteRoute(
      json('/api/ai/quote-analyst', {
        rawText: QUOTE,
        imageBase64: PNG_1X1,
        category: 'catering',
        guestCount: 250,
      })
    )
    expect(res.status).toBe(200)
  })

  it.each([
    ['a non-image payload', 'data:image/png;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='],
    ['an SVG', 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='],
    ['a bare base64 string', 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB'],
    ['a remote URL', 'https://evil.example/quote.png'],
  ])('quote route rejects %s with 400', async (_label, imageBase64) => {
    const res = await quoteRoute(
      json('/api/ai/quote-analyst', {
        rawText: QUOTE,
        imageBase64,
        category: 'catering',
        guestCount: 10,
      })
    )
    expect(res.status).toBe(400)
  })

  it('quote route rejects an oversized body with 413 from Content-Length', async () => {
    const req = new Request('http://localhost/api/ai/quote-analyst', {
      method: 'POST',
      body: '{}',
    })
    Object.defineProperty(req, 'headers', {
      value: new Headers({ 'content-length': '50000000' }),
    })
    expect((await quoteRoute(req)).status).toBe(413)
  })

  it('style route rejects unknown and duplicate swatch ids', async () => {
    const unknown = await styleRoute(
      json('/api/style-dna', {
        selectedSwatchIds: [...SWATCHES.slice(0, 2), 'not-a-real-swatch'],
        protectedMomentQuote: 'Grandma thali',
        tradeoffs: TRADEOFFS,
      })
    )
    expect(unknown.status).toBe(400)

    const duplicate = await styleRoute(
      json('/api/style-dna', {
        selectedSwatchIds: [SWATCHES[0], SWATCHES[0], SWATCHES[1]],
        protectedMomentQuote: 'Grandma thali',
        tradeoffs: TRADEOFFS,
      })
    )
    expect(duplicate.status).toBe(400)
  })

  it('style route strips control and invisible characters from the moment sentence', async () => {
    const res = await styleRoute(
      json('/api/style-dna', {
        selectedSwatchIds: SWATCHES,
        protectedMomentQuote: 'Grand\u200Bma\u0000 thali\u202E  night',
        tradeoffs: TRADEOFFS,
      })
    )
    const body = await res.json()
    expect(body.data.styleDNA.protectedMomentQuote).toBe('Grandma thali night')
  })
})

describe('AI routes: no internal error text and a spend ceiling (S3, S6)', () => {
  beforeEach(() => {
    resetModelBudget()
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key'
  })
  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
    delete process.env.MODEL_DAILY_CAP
  })

  it('style route returns a stable code, not the exception message', async () => {
    vi.spyOn(styleDna, 'extractStyleDNAWithFallbackLadder').mockRejectedValue(
      new Error('connect ECONNREFUSED 10.0.0.5:5432 password=hunter2')
    )
    const res = await styleRoute(
      json('/api/style-dna', {
        selectedSwatchIds: SWATCHES,
        protectedMomentQuote: 'Grandma thali',
        tradeoffs: TRADEOFFS,
      })
    )
    const text = await res.text()
    expect(JSON.parse(text).data.runRecord.fallbackReason).toBe('emergency_route_recovery')
    expect(text).not.toContain('hunter2')
    expect(text).not.toContain('ECONNREFUSED')
  })

  it('quote route returns a stable code, not the exception message', async () => {
    vi.spyOn(quotePipeline, 'analyzeQuoteWithFallbackLadder').mockRejectedValue(
      new Error('GOOGLE key AIzaSyD-leaked-key-value-0123456789 rejected')
    )
    const res = await quoteRoute(
      json('/api/ai/quote-analyst', { rawText: QUOTE, category: 'catering', guestCount: 250 })
    )
    const text = await res.text()
    expect(JSON.parse(text).data.runRecord.fallbackReason).toBe('emergency_route_recovery')
    expect(text).not.toContain('AIza')
  })

  it('once the daily cap is reached, requests use the deterministic tier and skip the model', async () => {
    process.env.MODEL_DAILY_CAP = '0'
    const res = await styleRoute(
      json('/api/style-dna', {
        selectedSwatchIds: SWATCHES,
        protectedMomentQuote: 'Grandma thali',
        tradeoffs: TRADEOFFS,
      })
    )
    const { data } = await res.json()
    expect(data.runRecord).toMatchObject({
      activeTier: 3,
      fallbackReason: 'daily_model_cap_reached',
    })
  })
})
