import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'

const plan = instantiatePlanFromBrief({
  title: 'Ananya & Rohan Sangeet',
  eventType: 'wedding',
  eventDate: '2027-08-10',
  city: 'Udaipur',
  guestCount: 300,
  totalBudgetPaise: 250_000_000,
  protectedCategory: 'catering',
})

/**
 * happy-dom does no layout, so these pin the classes that keep the top bar inside a 360-390px
 * screen. The real widths were measured in a browser: with these classes the bar's right edge
 * sits at the viewport minus its side padding for 360, 375 and 390.
 */
describe('WorkspaceHeader on a phone', () => {
  it('keeps the top bar compact below the sm breakpoint', () => {
    render(
      <WorkspaceHeader plan={plan} syncStatus="cloud_saved" isReadOnly={false} onShare={vi.fn()} />
    )
    const row = screen.getByRole('link', { name: 'Mehfil home' }).parentElement!

    expect(row).toHaveClass('px-3', 'gap-2', 'sm:px-6', 'sm:gap-3')
    expect(row).not.toHaveClass('px-4')
  })

  it('lets the save status shrink while the wordmark and buttons keep their size', () => {
    render(
      <WorkspaceHeader plan={plan} syncStatus="cloud_saved" isReadOnly={false} onShare={vi.fn()} />
    )

    expect(screen.getByRole('link', { name: 'Mehfil home' })).toHaveClass('shrink-0')
    expect(screen.getByRole('button', { name: /Share & Save/ })).toHaveClass('shrink-0')

    const badge = screen.getByTestId('sync-status-badge')
    expect(badge.parentElement).toHaveClass('min-w-0')
    expect(badge).toHaveClass('min-w-0')
    expect(badge.className).toContain('[&>span:last-child]:truncate')
  })

  it('shortens the read-only unlock button on a phone but keeps its accessible name', () => {
    render(
      <WorkspaceHeader
        plan={plan}
        syncStatus="local_saved"
        isReadOnly
        onUnlockEdit={vi.fn()}
        onShare={vi.fn()}
      />
    )
    const unlock = screen.getByRole('button', { name: 'Unlock Organizer Editing' })

    expect(unlock).toHaveClass('shrink-0')
    expect(unlock.textContent).toBe('Unlock editing')
    expect(unlock.querySelector('span')).toHaveClass('max-sm:hidden')
  })
})
