import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useRetryExtraction } from '@/components/workspace/useRetryExtraction'

describe('useRetryExtraction', () => {
  it('does nothing when no callback is supplied', async () => {
    const { result } = renderHook(() => useRetryExtraction(undefined))

    await act(async () => {
      await result.current.handleRetry()
    })

    expect(result.current.isRetrying).toBe(false)
  })

  it('reports retrying while the callback is pending, then clears', async () => {
    let finish: () => void = () => {}
    const pending = new Promise<void>((resolve) => {
      finish = resolve
    })
    const onRetry = vi.fn().mockReturnValue(pending)
    const { result } = renderHook(() => useRetryExtraction(onRetry))

    let run: Promise<void> = Promise.resolve()
    act(() => {
      run = result.current.handleRetry()
    })
    expect(result.current.isRetrying).toBe(true)
    expect(onRetry).toHaveBeenCalledTimes(1)

    await act(async () => {
      finish()
      await run
    })
    expect(result.current.isRetrying).toBe(false)
  })

  it('clears the retrying flag when the callback rejects', async () => {
    const onRetry = vi.fn().mockRejectedValue(new Error('extraction failed'))
    const { result } = renderHook(() => useRetryExtraction(onRetry))

    await act(async () => {
      await result.current.handleRetry().catch(() => {})
    })

    expect(result.current.isRetrying).toBe(false)
  })
})
