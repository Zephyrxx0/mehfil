import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import { BriefModal } from '@/lib/../components/intake/BriefModal'
import { STARTER_OPTIONS } from '@/lib/../components/intake/StarterChips'

describe('BriefModal Component', () => {
  it('renders modal when isOpen is true and shows Step 1', () => {
    render(<BriefModal isOpen={true} onClose={() => {}} onPlanCreated={() => {}} />)

    expect(screen.getByText('Plan Your Celebration')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 3 — Instant mathematical plan generation')).toBeInTheDocument()
    expect(screen.getByText('1-Click Celebration Starters')).toBeInTheDocument()
  })

  it('renders 1-click starter chips', () => {
    render(<BriefModal isOpen={true} onClose={() => {}} onPlanCreated={() => {}} />)

    for (const starter of STARTER_OPTIONS) {
      expect(screen.getByText(starter.label)).toBeInTheDocument()
    }
  })

  it('clicking a starter chip calls onPlanCreated with an instantiated plan after 300ms', () => {
    vi.useFakeTimers()
    const handlePlanCreated = vi.fn()
    const handleClose = vi.fn()

    render(
      <BriefModal
        isOpen={true}
        onClose={handleClose}
        onPlanCreated={handlePlanCreated}
      />
    )

    const firstChip = screen.getByText(STARTER_OPTIONS[0].label)
    fireEvent.click(firstChip)

    // Should enter reveal pulse state (D-04)
    expect(screen.getByText('Balancing budget & timeline...')).toBeInTheDocument()

    // Advance 300ms
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(handlePlanCreated).toHaveBeenCalledTimes(1)
    const generatedPlan = handlePlanCreated.mock.calls[0][0]
    expect(generatedPlan.brief.eventType).toBe('wedding')
    expect(generatedPlan.lines).toHaveLength(8)
    expect(handleClose).toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('allows navigating steps 1 -> 2 -> 3 and submitting', () => {
    vi.useFakeTimers()
    const handlePlanCreated = vi.fn()

    render(<BriefModal isOpen={true} onClose={() => {}} onPlanCreated={handlePlanCreated} />)

    // Step 1: Click Next
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText('Expected Guest Count')).toBeInTheDocument()

    // Step 2: Click Next
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText('Cultural & Operational Nuances (Optional)')).toBeInTheDocument()
    expect(screen.getByText('Skip & Generate')).toBeInTheDocument()

    // Click Skip & Generate
    fireEvent.click(screen.getByText('Skip & Generate'))

    // Advance 300ms
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(handlePlanCreated).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})

