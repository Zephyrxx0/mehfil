import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import { UndoActionBar } from '@/components/workspace/UndoActionBar'

describe('UndoActionBar Component (D-14, Tier 1 Instant Undo)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when message is null', () => {
    const { container } = render(
      <UndoActionBar message={null} onUndo={vi.fn()} onDismiss={vi.fn()} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders message, 1-click Undo button, and close dismiss button', () => {
    const onUndo = vi.fn()
    const onDismiss = vi.fn()

    render(
      <UndoActionBar
        message="Adopted Kulhad Chai Bar (-₹15,000)"
        onUndo={onUndo}
        onDismiss={onDismiss}
      />
    )

    expect(screen.getByText('Adopted Kulhad Chai Bar (-₹15,000)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Undo$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Dismiss undo notification/i })).toBeInTheDocument()
  })

  it('invokes onUndo and onDismiss when clicking Undo button', () => {
    const onUndo = vi.fn()
    const onDismiss = vi.fn()

    render(
      <UndoActionBar
        message="Adopted Kulhad Chai Bar (-₹15,000)"
        onUndo={onUndo}
        onDismiss={onDismiss}
      />
    )

    const undoButton = screen.getByRole('button', { name: /^Undo$/i })
    fireEvent.click(undoButton)

    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('invokes onDismiss when clicking close button', () => {
    const onDismiss = vi.fn()

    render(
      <UndoActionBar
        message="Adopted Kulhad Chai Bar (-₹15,000)"
        onUndo={vi.fn()}
        onDismiss={onDismiss}
      />
    )

    const closeButton = screen.getByRole('button', { name: /Dismiss undo notification/i })
    fireEvent.click(closeButton)

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('automatically calls onDismiss after durationMs expires', () => {
    const onDismiss = vi.fn()

    render(
      <UndoActionBar
        message="Adopted Kulhad Chai Bar"
        onUndo={vi.fn()}
        onDismiss={onDismiss}
        durationMs={8000}
      />
    )

    expect(onDismiss).not.toHaveBeenCalled()

    // Fast-forward 8 seconds
    act(() => {
      vi.advanceTimersByTime(8000)
    })

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('updates countdown progress bar as time passes', () => {
    render(
      <UndoActionBar
        message="Adopted Kulhad Chai Bar"
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
        durationMs={8000}
      />
    )

    const progressBar = screen.getByTestId('undo-progress-bar')
    expect(progressBar).toBeInTheDocument()

    // Initial state: 100%
    expect(progressBar.style.width).toBe('100%')

    // Advance 4 seconds (50%)
    act(() => {
      vi.advanceTimersByTime(4000)
    })

    const widthNum = parseFloat(progressBar.style.width)
    expect(widthNum).toBeLessThan(100)
    expect(widthNum).toBeGreaterThan(0)
  })
})
