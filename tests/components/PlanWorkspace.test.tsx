import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { PlanWorkspace } from '@/components/workspace/PlanWorkspace'
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

    expect(screen.getAllByText('Ananya & Rohan Sangeet').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('₹25,00,000').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Venue & Stage').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Catering & Meals').length).toBeGreaterThanOrEqual(1)
  })

  it('highlights Protected Moment in Gulabi Rose and displays badge (D-07, MOMENT-01)', () => {
    render(<PlanWorkspace initialPlan={initialPlan} />)

    const protectedBadges = screen.getAllByText('Protected Moment')
    expect(protectedBadges.length).toBeGreaterThanOrEqual(1)

    // The catering card should contain the protected indicator
    const cateringCards = document.querySelectorAll('#category-catering')
    expect(cateringCards.length).toBeGreaterThanOrEqual(1)
    expect(cateringCards[0]?.className).toContain('border-gulabi-rose')
  })

  it('dynamically scales guest count when clicking stepper buttons (D-09)', () => {
    render(<PlanWorkspace initialPlan={initialPlan} />)

    const plusButton = screen.getAllByText('+10')[0]
    fireEvent.click(plusButton)

    // Guest count should now be 310
    expect(screen.getAllByText('310').length).toBeGreaterThanOrEqual(1)
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
    const plus500 = screen.getAllByText('+500')[0]
    fireEvent.click(plus500)

    // Should trigger shortfall banner
    expect(screen.getByText(/Budget Balancing Shortfall:/)).toBeInTheDocument()
    expect(screen.getByText(/Undo to 300 Guests/)).toBeInTheDocument()

    // Clicking Undo restores the previous count
    const undoBtn = screen.getByText(/Undo to 300 Guests/)
    fireEvent.click(undoBtn)
    expect(screen.getAllByText('300').length).toBeGreaterThanOrEqual(1)
  })

  it('switches to Timeline tab and renders milestone roadmap (D-13, D-15, TIME-04)', () => {
    render(<PlanWorkspace initialPlan={initialPlan} />)

    const timelineTab = screen.getByRole('tab', { name: /Timeline/i })
    fireEvent.click(timelineTab)

    expect(screen.getAllByText('Backwards Milestone Roadmap').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Export to Calendar (.ics)').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Venue & Date Lock (T-6M)').length).toBeGreaterThanOrEqual(1)
  })

  it('clicking Export to Calendar triggers download without errors', () => {
    render(<PlanWorkspace initialPlan={initialPlan} />)

    const timelineTab = screen.getByRole('tab', { name: /Timeline/i })
    fireEvent.click(timelineTab)

    const exportBtn = screen.getAllByText('Export to Calendar (.ics)')[0]
    fireEvent.click(exportBtn)

    expect(screen.getAllByText('Calendar Saved!').length).toBeGreaterThanOrEqual(1)
  })

  it('renders Immediate Action triage when celebration date is short-notice (ADR-0005, D-14)', () => {
    const shortNoticeBrief: EventBrief = {
      ...futureBrief,
      eventDate: '2026-11-15', // only ~20 days away
    }
    const shortNoticePlan = instantiatePlanFromBrief(shortNoticeBrief)

    render(<PlanWorkspace initialPlan={shortNoticePlan} />)

    const timelineTab = screen.getByRole('tab', { name: /Timeline/i })
    fireEvent.click(timelineTab)

    expect(screen.getAllByText(/Short-Notice Celebration Triage/).length).toBeGreaterThanOrEqual(1)
    const triageHeadings = screen.getAllByText('Immediate Action (This Week)')
    expect(triageHeadings.length).toBeGreaterThanOrEqual(1)
  })
})
