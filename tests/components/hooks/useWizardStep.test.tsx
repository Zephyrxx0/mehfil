import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useWizardStep } from '@/components/intake/hooks/useWizardStep'

describe('useWizardStep', () => {
  it('keeps the step locally when uncontrolled', () => {
    const { result } = renderHook(() => useWizardStep())
    expect(result.current[0]).toBe(1)

    act(() => result.current[1](3))
    expect(result.current[0]).toBe(3)

    act(() => result.current[1]((s) => (s + 1) as 4))
    expect(result.current[0]).toBe(4)
  })

  it('reports changes instead of storing them when controlled', () => {
    const onStepChange = vi.fn()
    const { result } = renderHook(() => useWizardStep(2, onStepChange))

    act(() => result.current[1]((s) => (s + 1) as 3))

    expect(onStepChange).toHaveBeenCalledWith(3)
    expect(result.current[0]).toBe(2) // the parent owns the value
  })
})
