import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ConcurrencyConflictBanner } from '@/components/workspace/ConcurrencyConflictBanner'
import { V2ChangeBanner } from '@/components/workspace/V2ChangeBanner'

describe('ConcurrencyConflictBanner', () => {
  it('announces the conflict as an alert and offers both ways out', () => {
    const onRefresh = vi.fn()
    const onCommitNewSnapshot = vi.fn()
    render(
      <ConcurrencyConflictBanner onRefresh={onRefresh} onCommitNewSnapshot={onCommitNewSnapshot} />
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/updated from another device/i)

    fireEvent.click(screen.getByRole('button', { name: /Refresh to Latest Plan/i }))
    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(onCommitNewSnapshot).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Commit as New Snapshot/i }))
    expect(onCommitNewSnapshot).toHaveBeenCalledTimes(1)
  })
})

describe('V2ChangeBanner', () => {
  it('shows the reason for the style change, with the vibe statement when there is one', () => {
    render(
      <V2ChangeBanner
        rationale="Elevated decor by ₹40,000."
        vibeStatement="Candlelit courtyard"
        onDismiss={vi.fn()}
      />
    )
    expect(screen.getByRole('heading', { name: /Style DNA Infused/i })).toBeInTheDocument()
    expect(screen.getByText(/Candlelit courtyard/)).toBeInTheDocument()
    expect(screen.getByText(/Elevated decor by ₹40,000\./)).toBeInTheDocument()
  })

  it('dismisses, and only offers "View Style DNA" when it can act on it', () => {
    const onDismiss = vi.fn()
    const { rerender } = render(<V2ChangeBanner rationale="Reason" onDismiss={onDismiss} />)
    expect(screen.queryByRole('button', { name: /View Style DNA/i })).not.toBeInTheDocument()

    const onView = vi.fn()
    rerender(<V2ChangeBanner rationale="Reason" onDismiss={onDismiss} onViewStyleDNA={onView} />)
    fireEvent.click(screen.getByRole('button', { name: /View Style DNA/i }))
    expect(onView).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /dismiss|close/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
