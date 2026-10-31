import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useQuoteExtraction } from '@/components/quotes/useQuoteExtraction'
import type { BudgetCategory, VendorQuote } from '@/lib/engine/types'

const QUOTE = { id: 'q1', vendorName: 'Royal Caterers' } as VendorQuote
const TEXT = 'Rs 950 per plate, minimum 250 guests'

interface Props {
  open: boolean
  category: BudgetCategory
}

function setup(initialProps: Props = { open: true, category: 'venue' }) {
  return renderHook(
    (props: Props) =>
      useQuoteExtraction({ open: props.open, initialCategory: props.category, guestCount: 150 }),
    { initialProps }
  )
}

function mockFetchOk() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { vendorQuote: QUOTE } }),
    })
  )
}

async function extractQuote(result: ReturnType<typeof setup>['result']) {
  act(() => result.current.setRawText(TEXT))
  await act(async () => {
    await result.current.extract()
  })
  expect(result.current.extractedQuote).toBe(QUOTE)
}

function expectFreshIntake(result: ReturnType<typeof setup>['result']) {
  expect(result.current.extractedQuote).toBeNull()
  expect(result.current.rawText).toBe('')
  expect(result.current.imageFileName).toBeUndefined()
  expect(result.current.errorMessage).toBeNull()
  expect(result.current.isLoading).toBe(false)
}

describe('useQuoteExtraction intake reset', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts fresh when the sheet reopens for a different category', async () => {
    mockFetchOk()
    const { result, rerender } = setup()
    await extractQuote(result)

    rerender({ open: false, category: 'venue' })
    rerender({ open: true, category: 'catering' })

    expectFreshIntake(result)
    expect(result.current.category).toBe('catering')
  })

  it('starts fresh when the sheet reopens for the same category', async () => {
    mockFetchOk()
    const { result, rerender } = setup()
    await extractQuote(result)

    rerender({ open: false, category: 'venue' })
    rerender({ open: true, category: 'venue' })

    expectFreshIntake(result)
    expect(result.current.category).toBe('venue')
  })

  it('starts fresh when the requested category changes while the sheet stays open', async () => {
    mockFetchOk()
    const { result, rerender } = setup()
    await extractQuote(result)

    rerender({ open: true, category: 'catering' })

    expectFreshIntake(result)
    expect(result.current.category).toBe('catering')
  })

  it('keeps the extracted quote and input across re-renders with the same category', async () => {
    mockFetchOk()
    const { result, rerender } = setup()
    await extractQuote(result)

    rerender({ open: true, category: 'venue' })
    rerender({ open: true, category: 'venue' })

    expect(result.current.extractedQuote).toBe(QUOTE)
    expect(result.current.rawText).toBe(TEXT)
  })

  it('keeps an in-progress extraction alive across re-renders while open', async () => {
    let resolveResponse: (value: unknown) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise((resolve) => (resolveResponse = resolve)))
    )
    const { result, rerender } = setup()
    act(() => result.current.setRawText(TEXT))

    let pending: Promise<void> = Promise.resolve()
    act(() => {
      pending = result.current.extract()
    })
    expect(result.current.isLoading).toBe(true)

    rerender({ open: true, category: 'venue' })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.rawText).toBe(TEXT)

    await act(async () => {
      resolveResponse({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { vendorQuote: QUOTE } }),
      })
      await pending
    })
    expect(result.current.extractedQuote).toBe(QUOTE)
    expect(result.current.isLoading).toBe(false)
  })

  it('discards a response that arrives after the intake was reset by a reopen', async () => {
    let resolveResponse: (value: unknown) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise((resolve) => (resolveResponse = resolve)))
    )
    const onQuoteExtracted = vi.fn()
    const { result, rerender } = renderHook(
      (props: Props) =>
        useQuoteExtraction({
          open: props.open,
          initialCategory: props.category,
          guestCount: 150,
          onQuoteExtracted,
        }),
      { initialProps: { open: true, category: 'venue' } as Props }
    )
    act(() => result.current.setRawText(TEXT))
    let pending: Promise<void> = Promise.resolve()
    act(() => {
      pending = result.current.extract()
    })

    rerender({ open: false, category: 'venue' })
    rerender({ open: true, category: 'catering' })
    expectFreshIntake(result)

    await act(async () => {
      resolveResponse({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { vendorQuote: QUOTE } }),
      })
      await pending
    })

    expectFreshIntake(result)
    expect(onQuoteExtracted).not.toHaveBeenCalled()
  })

  it('still lets "Check Another Quote" (reset) clear the extraction', async () => {
    mockFetchOk()
    const { result } = setup()
    await extractQuote(result)

    act(() => result.current.reset())

    expectFreshIntake(result)
  })
})
