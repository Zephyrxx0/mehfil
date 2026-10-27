import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { ShortfallBanner } from '@/components/workspace/ShortfallBanner'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import type { EventBrief, Plan, ShortfallRemedy } from '@/lib/engine/types'

describe('ShortfallBanner Component (BUDGET-03, ADR-0002, D-13)', () => {
  const sampleBrief: EventBrief = {
    title: 'Ananya & Rohan Sangeet',
    eventType: 'wedding',
    eventDate: '2027-08-10',
    city: 'Udaipur',
    guestCount: 300,
    totalBudgetPaise: 250_000_000,
    protectedCategory: 'catering',
  }

  const basePlan = instantiatePlanFromBrief(sampleBrief)

  const sampleRemedies: ShortfallRemedy[] = [
    {
      type: 'increase_budget',
      title: 'Increase Total Budget',
      description: 'Add ₹45,000 to total budget',
      deltaValue: 45_000_00,
    },
    {
      type: 'reduce_guests',
      title: 'Reduce Guest Count',
      description: 'Reduce guest count from 300 to 260',
      deltaValue: 260,
    },
    {
      type: 'trim_elastic',
      title: 'Trim Flexible Lines',
      description: 'Trim flexible lines to their 40% floors',
      deltaValue: 30_000_00,
    },
  ]

  const infeasiblePlan: Plan = {
    ...basePlan,
    isInfeasible: true,
    shortfallPaise: 45_000_00, // ₹45,000
    remedies: sampleRemedies,
  }

  it('renders nothing when plan is feasible', () => {
    const { container } = render(
      <ShortfallBanner
        plan={basePlan}
        onApplyRemedy={vi.fn()}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders shortfall amount and permissive non-blocking explanation', () => {
    render(
      <ShortfallBanner
        plan={infeasiblePlan}
        previousGuestCount={250}
        onApplyRemedy={vi.fn()}
        onUndo={vi.fn()}
      />
    )

    // Shortfall amount
    expect(screen.getByText(/Budget Balancing Shortfall: ₹45,000/)).toBeInTheDocument()

    // Permissive posture badge & explanation
    expect(screen.getByText('ADR-0002 Permissive Mode')).toBeInTheDocument()
    expect(
      screen.getByText(/Your celebration plan remains fully editable and savable in Infeasible State/i)
    ).toBeInTheDocument()

    // Undo button
    expect(screen.getByRole('button', { name: /Undo to 250 Guests/i })).toBeInTheDocument()
  })

  it('provides 1-click execution for all 3 deterministic calculation remedies (D-13)', () => {
    const onApplyRemedy = vi.fn()
    render(
      <ShortfallBanner
        plan={infeasiblePlan}
        onApplyRemedy={onApplyRemedy}
      />
    )

    // Remedy 1: Increase Budget
    const increaseBtn = screen.getByRole('button', { name: /Add ₹45,000 to Budget/i })
    expect(increaseBtn).toBeInTheDocument()
    fireEvent.click(increaseBtn)
    expect(onApplyRemedy).toHaveBeenCalledWith(sampleRemedies[0])

    // Remedy 2: Reduce Guests
    const reduceBtn = screen.getByRole('button', { name: /Set Guests to 260/i })
    expect(reduceBtn).toBeInTheDocument()
    fireEvent.click(reduceBtn)
    expect(onApplyRemedy).toHaveBeenCalledWith(sampleRemedies[1])

    // Remedy 3: Trim Flexible Lines
    const trimBtn = screen.getByRole('button', { name: /Trim Flexible Lines/i })
    expect(trimBtn).toBeInTheDocument()
    fireEvent.click(trimBtn)
    expect(onApplyRemedy).toHaveBeenCalledWith(sampleRemedies[2])
  })
})
