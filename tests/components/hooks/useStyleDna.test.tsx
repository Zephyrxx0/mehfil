import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useStyleDna } from '@/components/workspace/hooks/useStyleDna'
import type { ApplyChangeInput } from '@/components/workspace/hooks/usePlanEditor'
import { extractDeterministicStyleDNA } from '@/lib/ai/heuristic'
import { deterministicRunRecord } from '@/lib/ai/run-record'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import type { EventBrief, Plan } from '@/lib/engine/types'

const SWATCHES = [
  'royal-amber-courtyard',
  'marigold-cascade',
  'gulabi-rose-palace',
  'chandni-chowk-night',
  'mogra-minimalist-canopy',
  'jaipur-terracotta-arch',
]
const TRADEOFFS = {
  feastVsSpectacle: 'feast',
  intimateVsGrand: 'grand',
  heritageVsModern: 'modern',
} as const
const BRIEF: EventBrief = {
  title: 'Style test',
  eventType: 'wedding',
  eventDate: '2027-09-09',
  city: 'Delhi',
  guestCount: 200,
  totalBudgetPaise: 200_000_000,
  protectedCategory: 'catering',
}
const plainPlan = instantiatePlanFromBrief(BRIEF)
const stylePlan: Plan = instantiatePlanFromBrief({
  ...BRIEF,
  vibeSwatches: SWATCHES,
  protectedMomentQuote: 'Grandmother’s thali',
  tradeoffs: TRADEOFFS,
})
const validDna = extractDeterministicStyleDNA(SWATCHES, 'Grandmother’s thali', TRADEOFFS)
const serverRunRecord = {
  activeTier: 1 as const,
  durationMs: 40,
  modelId: 'gemma-4-31b-it',
  timestamp: new Date().toISOString(),
}

const applyChange = vi.fn<(input: ApplyChangeInput) => void>()
const commitNow = vi.fn().mockResolvedValue(undefined)
const replacePlan = vi.fn()
const discardPending = vi.fn()

function setup(plan: Plan, extra: { isReadOnly?: boolean; first?: Plan } = {}) {
  return renderHook(() =>
    useStyleDna({
      plan,
      isReadOnly: extra.isReadOnly ?? false,
      snapshotOf: (n) => (n === 1 ? extra.first : undefined),
      getPlan: () => plan,
      replacePlan,
      applyChange,
      commitNow,
      discardPending,
    })
  )
}

function stubFetch(impl: () => Promise<Partial<Response>>) {
  const fetchMock = vi.fn(impl)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
const jsonResponse =
  (body: unknown, ok = true) =>
  async () =>
    ({ ok, status: ok ? 200 : 500, json: async () => body }) as Partial<Response>

// Generous: these tests wait on a faked network call while the whole suite runs in parallel.
const SLOW_CI = { timeout: 5000 }

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.unstubAllGlobals())

describe('useStyleDna: extraction', () => {
  it('applies a valid style from the server as one immediate version with its details', async () => {
    stubFetch(
      jsonResponse({ success: true, data: { styleDNA: validDna, runRecord: serverRunRecord } })
    )
    const { result } = setup(stylePlan)

    await waitFor(() => expect(applyChange).toHaveBeenCalledTimes(1), SLOW_CI)
    const call = applyChange.mock.calls[0][0]
    expect(call.save).toEqual({
      mode: 'immediate',
      meta: { run_record: serverRunRecord, styleDNA: validDna },
    })
    expect(result.current.banner?.rationale).toBe(call.description)
  })

  it('does nothing when the plan has no swatches to describe', async () => {
    const fetchMock = stubFetch(jsonResponse({}))
    const { result } = setup(plainPlan)
    await act(async () => {
      await result.current.retry()
    })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(applyChange).not.toHaveBeenCalled()
  })

  it('sends the swatches, the user’s sentence and the tradeoffs to the style route', async () => {
    const fetchMock = stubFetch(
      jsonResponse({ success: true, data: { styleDNA: validDna, runRecord: serverRunRecord } })
    )
    setup(stylePlan)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled(), SLOW_CI)

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/style-dna')
    expect(JSON.parse(init.body as string)).toEqual({
      selectedSwatchIds: SWATCHES,
      protectedMomentQuote: 'Grandmother’s thali',
      tradeoffs: TRADEOFFS,
    })
  })

  it('asks only once, even if the component renders again', async () => {
    const fetchMock = stubFetch(
      jsonResponse({ success: true, data: { styleDNA: validDna, runRecord: serverRunRecord } })
    )
    const { rerender } = setup(stylePlan)
    await waitFor(() => expect(applyChange).toHaveBeenCalled(), SLOW_CI)
    rerender()
    rerender()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not ask when the plan already has a style', () => {
    const fetchMock = stubFetch(jsonResponse({}))
    setup({ ...stylePlan, styleDNA: validDna })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    ['a network failure', () => Promise.reject(new Error('offline'))],
    ['an HTTP error', jsonResponse({}, false)],
    ['an unsuccessful payload', jsonResponse({ success: false })],
    ['a payload missing the style', jsonResponse({ success: true, data: {} })],
    [
      'a style outside the allowed ranges',
      jsonResponse({
        success: true,
        data: {
          styleDNA: { ...validDna, dimensions: { ...validDna.dimensions, energy: 9999 } },
          runRecord: serverRunRecord,
        },
      }),
    ],
  ])('falls back to the built-in estimate on %s', async (_label, impl) => {
    stubFetch(impl as () => Promise<Partial<Response>>)
    setup(stylePlan)

    await waitFor(() => expect(applyChange).toHaveBeenCalledTimes(1), SLOW_CI)
    const call = applyChange.mock.calls[0][0]
    const meta = (
      call.save as { meta: { run_record: { fallbackReason: string; activeTier: number } } }
    ).meta
    expect(meta.run_record.activeTier).toBe(3)
    expect(meta.run_record.fallbackReason).toBe(
      deterministicRunRecord('client_fallback').fallbackReason
    )
  })

  it('clears the loading flag when it finishes', async () => {
    stubFetch(
      jsonResponse({ success: true, data: { styleDNA: validDna, runRecord: serverRunRecord } })
    )
    const { result } = setup(stylePlan)
    await waitFor(() => expect(result.current.isExtracting).toBe(false), SLOW_CI)
    expect(applyChange).toHaveBeenCalled()
  })

  it('retry asks again, and can dismiss the banner', async () => {
    const fetchMock = stubFetch(
      jsonResponse({ success: true, data: { styleDNA: validDna, runRecord: serverRunRecord } })
    )
    const { result } = setup({ ...stylePlan, styleDNA: validDna }) // no automatic first call
    await act(async () => {
      await result.current.retry()
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.current.banner).not.toBeNull()
    act(() => result.current.dismissBanner())
    expect(result.current.banner).toBeNull()
  })
})

describe('useStyleDna: retune and reset', () => {
  it('retuning applies the new sliders as a version carrying the retuned style', () => {
    const plan = { ...plainPlan, styleDNA: validDna }
    const { result } = setup(plan)
    const dimensions = { ...validDna.dimensions, energy: 90 }

    act(() => result.current.retune(dimensions))

    const call = applyChange.mock.calls[0][0]
    expect(call.description).toMatch(/^Retuned Style:/)
    expect(call.save).toMatchObject({
      mode: 'immediate',
      meta: { styleDNA: { dimensions: { energy: 90 } } },
    })
  })

  it('retuning is ignored when read-only', () => {
    const { result } = setup({ ...plainPlan, styleDNA: validDna }, { isReadOnly: true })
    act(() => result.current.retune(validDna.dimensions))
    expect(applyChange).not.toHaveBeenCalled()
  })

  it('reset drops waiting edits first, then restores v1 without its style', async () => {
    const first: Plan = {
      ...plainPlan,
      styleDNA: validDna,
      brief: { ...plainPlan.brief, vibeStatement: 'old' },
    }
    const { result } = setup({ ...plainPlan, styleDNA: validDna }, { first })

    const order: string[] = []
    discardPending.mockImplementation(() => order.push('discard'))
    replacePlan.mockImplementation(() => order.push('replace'))
    commitNow.mockImplementation(async () => void order.push('commit'))

    await act(async () => {
      await result.current.resetToBaseline()
    })

    expect(order).toEqual(['discard', 'replace', 'commit'])
    const restored = replacePlan.mock.calls[0][0] as Plan
    expect(restored.styleDNA).toBeUndefined()
    expect(restored.brief.vibeStatement).toBeUndefined()
    expect(commitNow.mock.calls[0][1]).toMatch(/baseline archetype \(v1\)/)
  })

  it('reset rebuilds from the brief when v1 is not available', async () => {
    const { result } = setup({ ...stylePlan, styleDNA: validDna })
    await act(async () => {
      await result.current.resetToBaseline()
    })
    const restored = replacePlan.mock.calls[0][0] as Plan
    expect(restored.brief.vibeSwatches).toBeUndefined()
    expect(restored.lines.reduce((s, l) => s + l.currentPaise, 0)).toBe(restored.totalBudgetPaise)
  })

  it('reset is ignored when read-only', async () => {
    const { result } = setup(plainPlan, { isReadOnly: true })
    await act(async () => {
      await result.current.resetToBaseline()
    })
    expect(replacePlan).not.toHaveBeenCalled()
    expect(commitNow).not.toHaveBeenCalled()
  })
})
