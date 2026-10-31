import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useVibeSwatchSelection } from '@/components/intake/hooks/useVibeSwatchSelection'
import { SWATCHES } from '@/data/swatches'
import { VIBE_MAX } from '@/lib/vibe-limits'

const ids = SWATCHES.map((s) => s.id)

describe('useVibeSwatchSelection', () => {
  afterEach(() => vi.useRealTimers())

  it('adds and removes picks through onChange', () => {
    const onChange = vi.fn()
    const { result, rerender } = renderHook(
      ({ selected }) => useVibeSwatchSelection(selected, onChange),
      { initialProps: { selected: [] as string[] } }
    )

    act(() => result.current.toggle(ids[0]))
    expect(onChange).toHaveBeenLastCalledWith([ids[0]])

    rerender({ selected: [ids[0]] })
    act(() => result.current.toggle(ids[0]))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('refuses a pick past the maximum, warns, and shakes briefly', () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    const full = ids.slice(0, VIBE_MAX)
    const { result } = renderHook(() => useVibeSwatchSelection(full, onChange))

    act(() => result.current.toggle(ids[VIBE_MAX]))
    expect(onChange).not.toHaveBeenCalled()
    expect(result.current.warningMessage).toMatch(new RegExp(`Maximum ${VIBE_MAX}`))
    expect(result.current.shake).toBe(true)

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current.shake).toBe(false)
  })

  it('focuses the first match when the focused swatch is filtered away', () => {
    const { result } = renderHook(() => useVibeSwatchSelection([], vi.fn()))
    expect(result.current.focused).toBe(SWATCHES[0])

    act(() => result.current.setFocusedId(ids[2]))
    expect(result.current.focused.id).toBe(ids[2])
  })

  it('applies a suggestion (ignoring unknown ids, capped) and can undo it', () => {
    const onChange = vi.fn()
    const previous = [ids[5]]
    const { result } = renderHook(() => useVibeSwatchSelection(previous, onChange))

    act(() =>
      result.current.applySuggestion({
        swatchIds: ['not-a-swatch', ...ids.slice(0, VIBE_MAX + 2)],
        reasoning: 'warm and festive',
        source: 'ai',
      } as never)
    )
    expect(onChange).toHaveBeenLastCalledWith(ids.slice(0, VIBE_MAX))
    expect(result.current.assistantNote?.text).toBe('Picked for you: warm and festive')
    expect(result.current.focused.id).toBe(ids[0])

    act(() => result.current.undoSuggestion())
    expect(onChange).toHaveBeenLastCalledWith(previous)
    expect(result.current.assistantNote).toBeNull()
  })

  it('does nothing when a suggestion matches no known swatch', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useVibeSwatchSelection([], onChange))

    act(() =>
      result.current.applySuggestion({
        swatchIds: ['nope'],
        reasoning: 'x',
        source: 'rules',
      } as never)
    )

    expect(onChange).not.toHaveBeenCalled()
    expect(result.current.assistantNote).toBeNull()
  })
})
