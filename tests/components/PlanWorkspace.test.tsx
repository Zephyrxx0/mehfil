import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { PlanWorkspace } from '@/lib/../components/workspace/PlanWorkspace'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import type { EventBrief } from '@/lib/engine/types'

describe('PlanWorkspace Component', () => {
  const futureBrief: EventBrief = {
    title: 'Ananya & Rohan Sangeet',
    eventType: 'wedding',
    eventDate: '2027-08-10', // ~9 months in future
    city: 'Udaipur',
    guestCount: 300,
    totalBudgetPaise: 250_000_000, // ₹25,00,000
    protectedCategory: 'catering',
  }

  const initialPlan = instantiatePlanFromBrief(futureBrief)

  it('renders celebration title and budget lines with whole rupees (D-10)', () => {
    render(<PlanWorkspace initialPlan={initialPlan} />)

    expect(screen.getByText('Ananya & Rohan Sangeet')).toBeInTheDocument()
    expect(screen.getByText('₹25,00,000')).toBeInTheDocument()
    expect(screen.getByText('Venue & Stage')).toBeInTheDocument()
    expect(screen.getByText('Catering & Meals')).toBeInTheDocument()
  })

  it('highlights Protected Moment in Gulabi Rose and displays badge (D-07, MOMENT-01)', () => {
    render(<PlanWorkspace initialPlan={initialPlan} />)

    const protectedBadges = screen.getAllByText('Protected Moment')
    expect(protectedBadges.length).toBeGreaterThanOrEqual(1)

    // The catering card should contain the protected indicator
    const cateringCard = document.getElementById('category-catering')
    expect(cateringCard).toBeInTheDocument()
    expect(cateringCard?.className).toContain('border-gulabi-rose')
  })

  it('dynamically scales guest count when clicking stepper buttons (D-09)', () => {
    render(<PlanWorkspace initialPlan={initialPlan} />)

    const plusButton = screen.getByText('+10')
    fireEvent.click(plusButton)

    // Guest count should now be 310
    expect(screen.getByText('310')).toBeInTheDocument()
  })

  it('shows ShortfallBanner with remedies when scaling exceeds capacity (D-11, ADR-0002)', () => {
    // When photo_film is protected, catering (35%) scales per-guest and triggers shortfall quickly
    const scalingBrief: EventBrief = {
      ...futureBrief,
      protectedCategory: 'photo_film',
    }
    const scalingPlan = instantiatePlanFromBrief(scalingBrief)
    render(<PlanWorkspace initialPlan={scalingPlan} />)

    // Scale up guests by +500: catering (35%) and favors (2%) scale from 300 to 800 guests
    const plus500 = screen.getByText('+500')
    fireEvent.click(plus500)

    // Should trigger shortfall banner
    expect(screen.getByText(/Budget Balancing Shortfall:/)).toBeInTheDocument()
    expect(screen.getByText(/Undo to 300 Guests/)).toBeInTheDocument()

    // Clicking Undo restores the previous count
    const undoBtn = screen.getByText(/Undo to 300 Guests/)
    fireEvent.click(undoBtn)
    expect(screen.getByText('300')).toBeInTheDocument()
  })

  it('switches to Timeline tab and renders milestone roadmap (D-13, D-15, TIME-04)', () => {
    render(<PlanWorkspace initialPlan={initialPlan} />)

    const timelineTab = screen.getByRole('button', { name: /Milestone Roadmap/i })
    fireEvent.click(timelineTab)

    expect(screen.getByText('Backwards Milestone Roadmap')).toBeInTheDocument()
    expect(screen.getByText('Export to Calendar (.ics)')).toBeInTheDocument()
    expect(screen.getByText('Venue & Date Lock (T-6M)')).toBeInTheDocument()
  })

  it('clicking Export to Calendar triggers download without errors', () => {
    render(<PlanWorkspace initialPlan={initialPlan} />)

    const timelineTab = screen.getByRole('button', { name: /Milestone Roadmap/i })
    fireEvent.click(timelineTab)

    const exportBtn = screen.getByText('Export to Calendar (.ics)')
    fireEvent.click(exportBtn)

    expect(screen.getByText('Calendar Saved!')).toBeInTheDocument()
  })

  it('renders Immediate Action triage when celebration date is short-notice (ADR-0005, D-14)', () => {
    const shortNoticeBrief: EventBrief = {
      ...futureBrief,
      eventDate: '2026-11-15', // only ~20 days away
    }
    const shortNoticePlan = instantiatePlanFromBrief(shortNoticeBrief)

    render(<PlanWorkspace initialPlan={shortNoticePlan} />)

    const timelineTab = screen.getByRole('button', { name: /Milestone Roadmap/i })
    fireEvent.click(timelineTab)

    expect(screen.getByText(/Short-Notice Celebration Triage/)).toBeInTheDocument()
    const triageHeadings = screen.getAllByText('Immediate Action (This Week)')
    expect(triageHeadings.length).toBeGreaterThanOrEqual(1)
  })
})
