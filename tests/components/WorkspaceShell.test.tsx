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

  it('renders a 3-pane desktop layout with Budget, Timeline, and Explainer columns', () => {
    render(<WorkspaceShell {...defaultProps} />)

    const desktopLayout = screen.getByTestId('desktop-workspace-layout')
    expect(desktopLayout).toBeInTheDocument()
    expect(desktopLayout.className).toContain('lg:grid-cols-12')

    const budgetPane = screen.getByTestId('desktop-budget-pane')
    const timelinePane = screen.getByTestId('desktop-timeline-pane')
    const explainerPane = screen.getByTestId('desktop-explainer-pane')

    expect(budgetPane).toBeInTheDocument()
    expect(budgetPane.className).toContain('lg:col-span-4')

    expect(timelinePane).toBeInTheDocument()
    expect(timelinePane.className).toContain('lg:col-span-5')

    expect(explainerPane).toBeInTheDocument()
    expect(explainerPane.className).toContain('lg:col-span-3')
  })

  it('configures desktop columns with independent overflow vertical scrolling', () => {
    render(<WorkspaceShell {...defaultProps} />)

    const budgetPane = screen.getByTestId('desktop-budget-pane')
    const timelinePane = screen.getByTestId('desktop-timeline-pane')
    const explainerPane = screen.getByTestId('desktop-explainer-pane')

    expect(budgetPane.className).toContain('h-[calc(100vh-5rem)]')
    expect(budgetPane.className).toContain('overflow-y-auto')

    expect(timelinePane.className).toContain('h-[calc(100vh-5rem)]')
    expect(timelinePane.className).toContain('overflow-y-auto')

    expect(explainerPane.className).toContain('h-[calc(100vh-5rem)]')
    expect(explainerPane.className).toContain('overflow-y-auto')
  })

  it('renders a 5-tab mobile navigation bar with [Budget, Timeline, Ideas, Style, Summary]', () => {
    render(<WorkspaceShell {...defaultProps} />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(5)

    const tabLabels = tabs.map((tab) => tab.textContent)
    expect(tabLabels).toContain('Budget')
    expect(tabLabels).toContain('Timeline')
    expect(tabLabels).toContain('Ideas')
    expect(tabLabels).toContain('Style')
    expect(tabLabels).toContain('Summary')
  })

  it('smoothly switches mobile active pane content when clicking tabs', () => {
    render(<WorkspaceShell {...defaultProps} />)

    // Initially on budget tab
    expect(screen.getByTestId('mobile-pane-budget')).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-pane-timeline')).not.toBeInTheDocument()

    // Click Timeline tab
    const timelineTab = screen.getByRole('tab', { name: /Timeline/i })
    fireEvent.click(timelineTab)
    expect(screen.getByTestId('mobile-pane-timeline')).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-pane-budget')).not.toBeInTheDocument()

    // Click Ideas tab
    const ideasTab = screen.getByRole('tab', { name: /Ideas/i })
    fireEvent.click(ideasTab)
    expect(screen.getByTestId('mobile-pane-ideas')).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-pane-timeline')).not.toBeInTheDocument()

    // Click Style tab
    const styleTab = screen.getByRole('tab', { name: /Style/i })
    fireEvent.click(styleTab)
    expect(screen.getByTestId('mobile-pane-style')).toBeInTheDocument()
    expect(screen.getAllByText('Style DNA').length).toBeGreaterThanOrEqual(1)

    // Click Summary tab
    const summaryTab = screen.getByRole('tab', { name: /Summary/i })
    fireEvent.click(summaryTab)
    expect(screen.getByTestId('mobile-pane-summary')).toBeInTheDocument()

    // Click Budget tab back
    const budgetTab = screen.getByRole('tab', { name: /Budget/i })
    fireEvent.click(budgetTab)
    expect(screen.getByTestId('mobile-pane-budget')).toBeInTheDocument()
  })

  it('renders persistent mobile bottom drawer handle and opens Sheet with ChangeExplainer', () => {
    const handleUndo = vi.fn()
    const mockChanges: PlanChangeRecord[] = [
      {
        id: 'change-1',
        timestamp: new Date(),
        description: 'Scaled guest count from 300 to 320 (+20 guests)',
        deltas: [{ category: 'Catering', deltaPaise: 2_000_000 }],
        isFloorProtected: true,
      },
      {
        id: 'change-2',
        timestamp: new Date(),
        description: 'Increased budget allocation',
        deltas: [{ category: 'Decor', deltaPaise: -500_000 }],
      },
    ]

    render(
      <WorkspaceShell
        {...defaultProps}
        changes={mockChanges}
        onUndo={handleUndo}
      />
    )

    // Trigger handle should show "⚡ 2 changes"
    const drawerTrigger = screen.getByRole('button', {
      name: /Open change history drawer/i,
    })
    expect(drawerTrigger).toBeInTheDocument()
    expect(drawerTrigger.textContent).toContain('⚡ 2 changes')

    // Click to open drawer sheet
    fireEvent.click(drawerTrigger)

    // Sheet header should appear
    expect(screen.getByText('Plan Changes & Rebalancing')).toBeInTheDocument()
  })
})
