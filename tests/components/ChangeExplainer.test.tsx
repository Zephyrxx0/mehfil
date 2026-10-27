import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import {
  ChangeExplainer,
  type PlanChangeRecord,
} from '@/components/workspace/ChangeExplainer'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import type { EventBrief } from '@/lib/engine/types'

describe('ChangeExplainer Component', () => {
  const sampleBrief: EventBrief = {
    title: 'Ananya & Rohan Sangeet',
    eventType: 'wedding',
    eventDate: '2027-08-10',
    city: 'Udaipur',
    guestCount: 300,
    totalBudgetPaise: 250_000_000, // ₹25,00,000
    protectedCategory: 'catering',
  }

  const samplePlan = instantiatePlanFromBrief(sampleBrief)

  it('renders reassuring empty state when there are no plan modifications', () => {
    render(<ChangeExplainer plan={samplePlan} changes={[]} />)

    expect(screen.getByText('Live Change Explainer')).toBeInTheDocument()
    expect(screen.getByText('No recent changes')).toBeInTheDocument()
    expect(
      screen.getByText('All allocations balanced. Adjust sliders to see live rebalancing.')
    ).toBeInTheDocument()
  })

  it('renders versioned cards with exact formatted INR deltas when changes occur', () => {
    const mockChanges: PlanChangeRecord[] = [
      {
        id: 'change-1',
        timestamp: new Date(),
        description: 'Scaled guest count from 300 to 320 (+20 guests)',
        deltas: [
          { category: 'Catering', deltaPaise: 2_000_000 }, // +₹20,000
          { category: 'Decor', deltaPaise: -2_000_000 }, // -₹20,000
        ],
      },
    ]

    render(<ChangeExplainer plan={samplePlan} changes={mockChanges} />)

    expect(
      screen.getByText('Scaled guest count from 300 to 320 (+20 guests)')
    ).toBeInTheDocument()
    expect(screen.getByText('+₹20,000 to Catering')).toBeInTheDocument()
    expect(screen.getByText('-₹20,000 from Decor')).toBeInTheDocument()
  })

  it('renders floor protection badge when protected moments are preserved against displacement', () => {
    const mockChanges: PlanChangeRecord[] = [
      {
        id: 'change-protected',
        timestamp: new Date(),
        description: 'Rebalanced budget with protected category',
        deltas: [{ category: 'Catering', deltaPaise: 1_000_000 }],
        isFloorProtected: true,
      },
    ]

    render(<ChangeExplainer plan={samplePlan} changes={mockChanges} />)

    expect(
      screen.getByText('Protected Moment — Non-negotiable floor locked')
    ).toBeInTheDocument()
  })

  it('provides an Undo button on each change card and invokes onUndo when clicked', () => {
    const handleUndo = vi.fn()
    const mockChanges: PlanChangeRecord[] = [
      {
        id: 'change-undo-test',
        timestamp: new Date(),
        description: 'Increased budget allocation',
        deltas: [{ category: 'Catering', deltaPaise: 500_000 }],
      },
    ]

    render(
      <ChangeExplainer
        plan={samplePlan}
        changes={mockChanges}
        onUndo={handleUndo}
      />
    )

    const undoButton = screen.getByRole('button', { name: /undo/i })
    expect(undoButton).toBeInTheDocument()
    fireEvent.click(undoButton)

    expect(handleUndo).toHaveBeenCalledTimes(1)
    expect(handleUndo).toHaveBeenCalledWith(mockChanges[0], 0)
  })

  it('renders numeric deltas with tabular-nums class formatting', () => {
    const mockChanges: PlanChangeRecord[] = [
      {
        id: 'change-tabular',
        timestamp: new Date(),
        description: 'Numeric delta check',
        deltas: [{ category: 'Favors', deltaPaise: -50_000 }],
      },
    ]

    render(<ChangeExplainer plan={samplePlan} changes={mockChanges} />)

    const deltaChip = screen.getByText('-₹500 from Favors')
    expect(deltaChip).toBeInTheDocument()
    expect(deltaChip.className).toContain('tabular-nums')
  })
})
