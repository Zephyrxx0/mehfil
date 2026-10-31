import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ShareClientView } from '@/app/share/[token]/ShareClientView'
import type { SanitizedSharedPlan } from '@/lib/engine/types'
import * as icsEngine from '@/lib/engine/ics'

describe('Celebratory Family Share View & Filtered .ics Export (D-05, D-06, D-07, D-08, COLLAB-03)', () => {
  const mockSanitizedPlan: SanitizedSharedPlan = {
    id: 'shared-plan-101',
    title: 'Ananya & Vikram Wedding Celebration',
    eventType: 'wedding',
    eventDate: '2026-12-25',
    city: 'Jaipur',
    guestCount: 250,
    totalBudgetPaise: 200000000, // ₹20 Lakhs in paise
    categoryTotals: {
      venue: 70000000,
      catering: 70000000,
      decor: 40000000,
      photo_film: 20000000,
      entertainment: 0,
      favors: 0,
      misc: 0,
      contingency: 0,
    },
    categoryPercentages: {
      venue: 35,
      catering: 35,
      decor: 20,
      photo_film: 10,
      entertainment: 0,
      favors: 0,
      misc: 0,
      contingency: 0,
    },
    protectedMoment: {
      category: 'decor',
      name: 'Royal Heritage Mandap',
      isProtected: true,
    },
    publicMilestones: [
      {
        id: 'ceremony-sangeet',
        title: 'Sangeet & Musical Evening',
        budgetCategory: 'entertainment',
        targetDate: '2026-12-24',
        leadDays: 1,
        isCeremony: true,
      },
      {
        id: 'ceremony-wedding',
        title: 'Vedic Pheras & Wedding Ceremony',
        budgetCategory: 'venue',
        targetDate: '2026-12-25',
        leadDays: 0,
        isCeremony: true,
      },
    ],
  }

  it('renders celebratory editorial header, countdown banner, and guest count pill', () => {
    render(<ShareClientView sanitizedPlan={mockSanitizedPlan} />)

    expect(screen.getByText('Ananya & Vikram Wedding Celebration')).toBeInTheDocument()
    expect(screen.getByText('Jaipur')).toBeInTheDocument()
    expect(screen.getByText('250 Celebrated Guests')).toBeInTheDocument()
    expect(screen.getByText(/days until celebration/i)).toBeInTheDocument()
  })

  it('renders the Cherished Priority showcase card with Gulabi Rose styling', () => {
    render(<ShareClientView sanitizedPlan={mockSanitizedPlan} />)

    expect(screen.getByText('Cherished Priority')).toBeInTheDocument()
    expect(screen.getByText('Royal Heritage Mandap')).toBeInTheDocument()
    expect(
      screen.getByText(
        /The family has designated this ceremony as an uncompromising celebration priority/i
      )
    ).toBeInTheDocument()
  })

  it('renders high-level category breakdown without internal vendor margins or quotes', () => {
    render(<ShareClientView sanitizedPlan={mockSanitizedPlan} />)

    expect(screen.getByText('Celebration Overview')).toBeInTheDocument()
    expect(screen.getByText('Venue')).toBeInTheDocument()
    expect(screen.getByText('Catering')).toBeInTheDocument()
    expect(screen.getByText('Decor')).toBeInTheDocument()

    // Rupee totals formatted
    expect(screen.getAllByText('₹7,00,000').length).toBeGreaterThan(0)
  })

  it('renders public ceremony timeline and exports filtered calendar .ics on click', () => {
    const downloadSpy = vi.spyOn(icsEngine, 'downloadICS').mockImplementation(() => {})

    render(<ShareClientView sanitizedPlan={mockSanitizedPlan} />)

    expect(screen.getByText('Sangeet & Musical Evening')).toBeInTheDocument()
    expect(screen.getByText('Vedic Pheras & Wedding Ceremony')).toBeInTheDocument()

    const exportBtn = screen.getByRole('button', { name: /Add Ceremonies to Calendar \(\.ics\)/i })
    fireEvent.click(exportBtn)

    expect(downloadSpy).toHaveBeenCalled()
  })

  it('renders expired celebration screen when share token is null or expired', () => {
    render(<ShareClientView sanitizedPlan={null} />)

    expect(screen.getByText('Celebration Link Expired')).toBeInTheDocument()
    expect(
      screen.getByText(
        /The celebration organizer has refreshed this link or concluded the planning phase/i
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Return to Mehfil Home/i })).toBeInTheDocument()
  })
})
