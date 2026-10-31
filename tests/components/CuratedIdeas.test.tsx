import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { CuratedIdeaCard } from '@/components/workspace/CuratedIdeaCard'
import { CuratedIdeasSection } from '@/components/workspace/CuratedIdeasSection'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import type { CuratedIdea, EventBrief, Plan } from '@/lib/engine/types'

describe('Curated Ideas Tab & Idea Card Components (IDEA-01, IDEA-02, IDEA-03)', () => {
  const sampleBrief: EventBrief = {
    title: 'Ananya & Rohan Sangeet',
    eventType: 'wedding',
    eventDate: '2027-08-10',
    city: 'Udaipur',
    guestCount: 300,
    totalBudgetPaise: 250_000_000,
    protectedCategory: 'catering',
  }

  const basePlan: Plan = instantiatePlanFromBrief(sampleBrief)

  const sampleIdea: CuratedIdea = {
    id: 'kulhad_chai_bar',
    title: 'Kulhad Chai & Filter Coffee Bar',
    devanagariTitle: 'कुल्हड़ चाय एवं फ़िल्टर कॉफ़ी बार',
    tagline: 'Steaming ginger masala chai and South Indian filter coffee in clay pots',
    description: 'Artisanal beverage counter with terracotta cups',
    category: 'catering',
    eventTypes: ['wedding'],
    costPaise: 15_000_00, // ₹15,000
    leadDays: 21,
    styleTags: ['heritage', 'intimate', 'comfort'],
    culturalNuance: 'Terracotta kulhads infuse a warm earthy aroma.',
  }

  it('renders idea card with title, Devanagari script, cost pill in INR, lead time and nuance quote', () => {
    const onToggle = vi.fn()
    render(
      <CuratedIdeaCard idea={sampleIdea} plan={basePlan} isAdopted={false} onToggle={onToggle} />
    )

    // Title and Devanagari flourish
    expect(screen.getByText('Kulhad Chai & Filter Coffee Bar')).toBeInTheDocument()
    expect(screen.getByText('कुल्हड़ चाय एवं फ़िल्टर कॉफ़ी बार')).toBeInTheDocument()

    // Formatted INR cost pill
    expect(screen.getByText('₹15,000')).toBeInTheDocument()

    // Lead time badge
    expect(screen.getByText('21d lead')).toBeInTheDocument()

    // Cultural nuance quote
    expect(screen.getByText(/Terracotta kulhads infuse a warm earthy aroma/)).toBeInTheDocument()
  })

  it('filters ideas by category when clicking category pills', () => {
    const onAdoptIdea = vi.fn()
    const onRetractIdea = vi.fn()

    render(
      <CuratedIdeasSection
        plan={basePlan}
        onAdoptIdea={onAdoptIdea}
        onRetractIdea={onRetractIdea}
      />
    )

    // Section title
    expect(screen.getByText('Curated Celebration Enhancements')).toBeInTheDocument()

    // Click "Entertainment" category pill
    const entertainmentPill = screen.getByRole('button', { name: /^Entertainment$/i })
    fireEvent.click(entertainmentPill)

    // Should display Entertainment ideas (e.g. Shehnai Jugalbandi)
    expect(screen.getByText('Live Shehnai & Nagada Jugalbandi')).toBeInTheDocument()

    // Catering idea should not be visible in Entertainment filter
    expect(screen.queryByText('Kulhad Chai & Filter Coffee Bar')).not.toBeInTheDocument()
  })

  it('toggles switch: invokes onAdoptIdea when turned on and onRetractIdea when turned off', () => {
    const onAdoptIdea = vi.fn()
    const onRetractIdea = vi.fn()

    const { rerender } = render(
      <CuratedIdeasSection
        plan={basePlan}
        onAdoptIdea={onAdoptIdea}
        onRetractIdea={onRetractIdea}
      />
    )

    // Find the toggle for Kulhad Chai
    const toggle = screen.getByRole('switch', {
      name: /Toggle Kulhad Chai & Filter Coffee Bar/i,
    })
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    // Click to adopt
    fireEvent.click(toggle)
    expect(onAdoptIdea).toHaveBeenCalledWith(expect.objectContaining({ id: 'kulhad_chai_bar' }))

    // Rerender as adopted
    const adoptedPlan: Plan = {
      ...basePlan,
      adoptedIdeas: [
        {
          ideaId: 'kulhad_chai_bar',
          title: 'Kulhad Chai & Filter Coffee Bar',
          targetCategory: 'catering',
          costPaise: 15_000_00,
          displacedDonors: [],
          adoptedAt: new Date().toISOString(),
        },
      ],
    }

    rerender(
      <CuratedIdeasSection
        plan={adoptedPlan}
        onAdoptIdea={onAdoptIdea}
        onRetractIdea={onRetractIdea}
      />
    )

    // Verify Adopted badge and checked state
    expect(screen.getAllByText('Adopted').length).toBeGreaterThan(0)
    const adoptedToggle = screen.getByRole('switch', {
      name: /Toggle Kulhad Chai & Filter Coffee Bar/i,
    })
    expect(adoptedToggle).toHaveAttribute('aria-checked', 'true')

    // Click to retract
    fireEvent.click(adoptedToggle)
    expect(onRetractIdea).toHaveBeenCalledWith('kulhad_chai_bar')
  })

  it('displays pre-adoption shortfall warning badge when flexible donor capacity is exhausted', () => {
    // Create a plan where flexible lines are already clamped to their 40% floor
    const constrainedLines = basePlan.lines.map((line) => {
      if (line.lineType === 'flexible') {
        const floor = Math.round((line.baselinePaise * 0.4) / 100) * 100
        return { ...line, currentPaise: floor }
      }
      return line
    })

    const constrainedPlan: Plan = {
      ...basePlan,
      lines: constrainedLines,
    }

    const expensiveIdea: CuratedIdea = {
      ...sampleIdea,
      id: 'luxury_fireworks',
      title: 'Grand Royal Drone & Fireworks Show',
      category: 'entertainment',
      costPaise: 500_000_00, // ₹5,00,000
    }

    render(
      <CuratedIdeaCard
        idea={expensiveIdea}
        plan={constrainedPlan}
        isAdopted={false}
        onToggle={vi.fn()}
      />
    )

    const warning = screen.getByTestId('shortfall-warning')
    expect(warning).toBeInTheDocument()
    expect(warning).toHaveTextContent(
      'Adopting will exceed flexible capacity & activate Shortfall Banner remedies'
    )
  })
})
