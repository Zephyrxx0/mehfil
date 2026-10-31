import React from 'react'
import { describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { SyncStatusBadge } from '@/components/workspace/SyncStatusBadge'

describe('SyncStatusBadge keyboard access', () => {
  it('is a focusable button that keeps its test id', async () => {
    render(<SyncStatusBadge status="cloud_saved" />)
    const badge = screen.getByTestId('sync-status-badge')
    expect(badge.tagName).toBe('BUTTON')
    expect(badge).toHaveAttribute('type', 'button')

    // Focusing opens the tooltip, which updates state after the call returns.
    await act(async () => badge.focus())
    expect(badge).toHaveFocus()
  })

  it('shows its explanation when focused from the keyboard, not only on hover', async () => {
    render(<SyncStatusBadge status="sync_paused" />)

    await act(async () => screen.getByTestId('sync-status-badge').focus())

    // Radix renders the text twice (visible content plus a screen-reader copy).
    const explanations = await screen.findAllByText(/could not confirm this device/i)
    expect(explanations.length).toBeGreaterThan(0)
  })

  it('announces a changed status politely', () => {
    render(<SyncStatusBadge status="sync_paused" />)
    expect(screen.getByText('Sync paused')).toHaveAttribute('aria-live', 'polite')
  })
})
