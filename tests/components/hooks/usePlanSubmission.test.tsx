import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePlanSubmission } from '@/components/intake/hooks/usePlanSubmission'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { STARTER_OPTIONS } from '@/components/intake/StarterChips'

const buildPlan = () => instantiatePlanFromBrief(STARTER_OPTIONS[0].brief)

describe('usePlanSubmission', () => {
  afterEach(() => vi.useRealTimers())

  it('shows the reveal at once and hands the plan off once', async () => {
    vi.useFakeTimers()
    const onPlanCreated = vi.fn()
    const { result } = renderHook(() => usePlanSubmission(onPlanCreated))

    act(() => result.current.submitPlan(buildPlan))
    expect(result.current.isRevealing).toBe(true)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(onPlanCreated).toHaveBeenCalledTimes(1)
    expect(result.current.isRevealing).toBe(true) // stays up; navigation unmounts the wizard
  })

  it('ignores a second submit while one is in flight', () => {
    const onPlanCreated = vi.fn(() => new Promise<void>(() => {}))
    const { result } = renderHook(() => usePlanSubmission(onPlanCreated))

    act(() => {
      result.current.submitPlan(buildPlan)
      result.current.submitPlan(buildPlan)
    })

    expect(onPlanCreated).toHaveBeenCalledTimes(1)
  })

  it('drops the reveal, reports an error and allows a retry when the hand-off fails', async () => {
    const onPlanCreated = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockImplementationOnce(() => new Promise<void>(() => {}))
    const { result } = renderHook(() => usePlanSubmission(onPlanCreated))

    await act(async () => result.current.submitPlan(buildPlan))
    expect(result.current.isRevealing).toBe(false)
    expect(result.current.submitError).toMatch(/try again/i)

    act(() => result.current.submitPlan(buildPlan))
    expect(onPlanCreated).toHaveBeenCalledTimes(2)
    expect(result.current.submitError).toBeNull()
  })
})
