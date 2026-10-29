import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell'
import type { PlanChangeRecord } from '@/components/workspace/ChangeExplainer'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import type { EventBrief } from '@/lib/engine/types'

describe('WorkspaceShell Component', () => {
  const sampleBrief: EventBrief = {
    title: 'Ananya & Rohan Sangeet',
    eventType: 'wedding',
    eventDate: '2027-08-10',
    city: 'Udaipur',
    guestCount: 300,
    totalBudgetPaise: 250_000_000,
    protectedCategory: 'catering',
  }

  const samplePlan = instantiatePlanFromBrief(sampleBrief)

  const defaultProps = {
    plan: samplePlan,
    changes: [] as PlanChangeRecord[],
    onGuestCountChange: vi.fn(),
    onSetProtected: vi.fn(),
    onApplyRemedy: vi.fn(),
    onUndo: vi.fn(),
  }

  it('shows the five workspace tabs with Budget selected by default', () => {
    render(<WorkspaceShell {...defaultProps} />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((t) => t.textContent)).toEqual(['Budget', 'Timeline', 'Ideas', 'Style', 'History'])
    expect(screen.getByRole('tab', { name: 'Budget' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('pane-budget')).toBeInTheDocument()
  })

  it('renders tabs as links to their own routes when a basePath is given', () => {
    render(<WorkspaceShell {...defaultProps} basePath="/plan/abc" activeTab="timeline" />)

    expect(screen.getByRole('tab', { name: 'Timeline' })).toHaveAttribute('href', '/plan/abc/timeline')
    expect(screen.getByRole('tab', { name: 'Budget' })).toHaveAttribute('href', '/plan/abc/budget')
    expect(screen.getByRole('tab', { name: 'Timeline' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('pane-timeline')).toBeInTheDocument()
    expect(screen.queryByTestId('pane-budget')).not.toBeInTheDocument()
  })

  it('shows one pane at a time when switching tabs', () => {
    render(<WorkspaceShell {...defaultProps} />)

    for (const [label, pane] of [
      ['Timeline', 'pane-timeline'],
      ['Ideas', 'pane-ideas'],
      ['Style', 'pane-style'],
      ['History', 'pane-history'],
      ['Budget', 'pane-budget'],
    ] as const) {
      fireEvent.click(screen.getByRole('tab', { name: label }))
      expect(screen.getByTestId(pane)).toBeInTheDocument()
      expect(screen.getAllByTestId(/^pane-/)).toHaveLength(1)
    }
  })

  it('has no footer', () => {
    const { container } = render(<WorkspaceShell {...defaultProps} />)
    expect(container.querySelector('footer')).toBeNull()
  })

  it('lists plan changes on the History tab', () => {
    const mockChanges: PlanChangeRecord[] = [
      {
        id: 'change-1',
        timestamp: new Date(),
        description: 'Scaled guest count from 300 to 320 (+20 guests)',
        deltas: [{ category: 'Catering', deltaPaise: 2_000_000 }],
        isFloorProtected: true,
      },
    ]
    render(<WorkspaceShell {...defaultProps} changes={mockChanges} />)

    fireEvent.click(screen.getByRole('tab', { name: 'History' }))
    expect(screen.getByText('Scaled guest count from 300 to 320 (+20 guests)')).toBeInTheDocument()
  })

  it('opens Smart Inspector sheet when clicking Smart Inspector button in top bar', async () => {
    render(<WorkspaceShell {...defaultProps} />)

    const inspectorBtn = screen.getByRole('button', { name: /Smart Inspector/i })
    expect(inspectorBtn).toBeInTheDocument()

    fireEvent.click(inspectorBtn)
    expect(await screen.findByTestId('smart-inspector-sheet')).toBeInTheDocument()
    expect(screen.getAllByText(/Smart Inspector/i).length).toBeGreaterThanOrEqual(2)
  })

  it('opens Quote Intake sandbox sheet when clicking Check Quote on a budget line card', async () => {
    render(<WorkspaceShell {...defaultProps} />)

    const checkQuoteButtons = screen.getAllByRole('button', { name: /Check Quote/i })
    expect(checkQuoteButtons.length).toBeGreaterThan(0)

    fireEvent.click(checkQuoteButtons[0])
    expect(await screen.findByTestId('quote-intake-sheet')).toBeInTheDocument()
  })
})
