import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useQuoteExtraction } from '@/components/quotes/useQuoteExtraction'
import { SAMPLE_QUOTES } from '@/data/sample-quotes'
import type { VendorQuote } from '@/lib/engine/types'

const QUOTE = { id: 'q1', vendorName: 'Royal Caterers' } as VendorQuote

function setup(onQuoteExtracted?: (quote: VendorQuote) => void) {
  return renderHook(
    (props: { open: boolean }) =>
      useQuoteExtraction({
        open: props.open,
        initialCategory: 'catering',
        guestCount: 150,
        onQuoteExtracted,
      }),
    { initialProps: { open: true } }
  )
}

function mockFetch(response: { ok: boolean; json: unknown }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok,
    json: () => Promise.resolve(response.json),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('useQuoteExtraction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('needs at least 10 characters of text before extraction is allowed', () => {
    const { result } = setup()
    expect(result.current.isInputValid).toBe(false)
    act(() => result.current.setRawText('too short'))
    expect(result.current.isInputValid).toBe(false)
    act(() => result.current.setRawText('long enough text'))
    expect(result.current.isInputValid).toBe(true)
  })

  it('fills text and category from a sample and clears any error', () => {
    const sample = SAMPLE_QUOTES[0]
    const { result } = setup()
    act(() => result.current.selectSample(sample.id))
    expect(result.current.rawText).toBe(sample.rawText)
    expect(result.current.category).toBe(sample.category)
    expect(result.current.errorMessage).toBeNull()
  })

  it('posts the trimmed text, category and guest count, then exposes the quote', async () => {
    const fetchMock = mockFetch({ ok: true, json: { success: true, data: { vendorQuote: QUOTE } } })
    const onExtracted = vi.fn()
    const { result } = setup(onExtracted)
    act(() => result.current.setRawText('  Rs 950 per plate, minimum 250 guests  '))

    await act(async () => {
      await result.current.extract()
    })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/ai/quote-analyst')
    expect(JSON.parse(init.body)).toEqual({
      rawText: 'Rs 950 per plate, minimum 250 guests',
      category: 'catering',
      guestCount: 150,
    })
    expect(result.current.extractedQuote).toBe(QUOTE)
    expect(onExtracted).toHaveBeenCalledWith(QUOTE)
    expect(result.current.isLoading).toBe(false)
  })

  it('shows the server error message when extraction fails', async () => {
    mockFetch({ ok: false, json: { success: false, error: 'Quote too vague' } })
    const { result } = setup()
    act(() => result.current.setRawText('Rs 950 per plate, minimum 250 guests'))

    await act(async () => {
      await result.current.extract()
    })

    expect(result.current.errorMessage).toBe('Quote too vague')
    expect(result.current.extractedQuote).toBeNull()
  })

  it('does nothing when the input is not valid', async () => {
    const fetchMock = mockFetch({ ok: true, json: {} })
    const { result } = setup()
    await act(async () => {
      await result.current.extract()
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reset clears the quote and input', async () => {
    mockFetch({ ok: true, json: { success: true, data: { vendorQuote: QUOTE } } })
    const { result } = setup()
    act(() => result.current.setRawText('Rs 950 per plate, minimum 250 guests'))
    await act(async () => {
      await result.current.extract()
    })
    act(() => result.current.reset())
    expect(result.current.extractedQuote).toBeNull()
    expect(result.current.rawText).toBe('')
  })

  it('resets the category to the initial one when the sheet reopens', () => {
    const { result, rerender } = setup()
    act(() => result.current.setCategory('venue'))
    expect(result.current.category).toBe('venue')
    rerender({ open: false })
    expect(result.current.category).toBe('venue')
    rerender({ open: true })
    expect(result.current.category).toBe('catering')
  })
})
