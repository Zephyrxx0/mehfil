import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { VendorChecklist } from '@/components/quotes/registry/VendorChecklist'
import { IdeaGrid } from '@/components/quotes/registry/IdeaGrid'
import { QuoteReport } from '@/components/quotes/registry/QuoteReport'
import { ScenarioComparison } from '@/components/quotes/registry/ScenarioComparison'
import { PlanProvider } from '@/components/quotes/registry/PlanContext'
import type { Plan, BudgetLine, VendorQuote } from '@/lib/engine/types'

function createTestPlan(): { plan: Plan; quoteA: VendorQuote; quoteB: VendorQuote } {
  const quoteA: VendorQuote = {
    id: 'quote_caterer_royal',
    vendorName: 'Royal Caterers & Feast',
    category: 'catering',
    rawText: 'Rs 950/- per plate. GST 5% extra.',
    statedInclusions: ['Buffet setup', 'Cutlery'],
    statedExclusions: ['Taxes extra'],
    paymentTerms: '50% advance',
    createdAt: '2026-10-28T10:00:00.000Z',
    omissionAdders: [
      {
        id: 'adder_catering_gst',
        name: '5% Catering GST',
        category: 'catering',
        rateType: 'percentage',
        percentageValue: 5,
        amountPaise: 950000, // ₹9,500
        rationale: 'Statutory GST',
        isEnabled: true,
      },
    ],
    droppedItems: [],
    tiers: [
      {
        tierId: 'tier_royal_thali',
        name: 'Royal Vegetarian Thali',
        baseTierPaise: 19000000, // ₹1,90,000 (950 * 200 guests)
        totalWithAddersPaise: 19950000, // ₹1,99,500
        isStatedTotalConsistent: true,
        lineItems: [
          {
            id: 'item_plate',
            description: 'Per Plate Buffet Charge',
            amountStated: 950,
            pricingType: 'per_guest',
            sourceAnchor: 'Rs 950/- per plate',
            itemPaise: 19000000,
            isVerified: true,
          },
        ],
      },
    ],
  }

  const quoteB: VendorQuote = {
    id: 'quote_caterer_darbar',
    vendorName: 'Darbar Gourmet Feasts',
    category: 'catering',
    rawText: 'Rs 1200/- per plate. Inclusive of all taxes.',
    statedInclusions: ['Live counters', 'Dessert spread'],
    statedExclusions: [],
    paymentTerms: '25% advance',
    createdAt: '2026-10-28T10:00:00.000Z',
    omissionAdders: [],
    droppedItems: [],
    tiers: [
      {
        tierId: 'tier_darbar_luxury',
        name: 'Darbar Heritage Feast',
        baseTierPaise: 24000000, // ₹2,40,000 (1200 * 200 guests)
        totalWithAddersPaise: 24000000,
        isStatedTotalConsistent: true,
        lineItems: [
          {
            id: 'item_darbar_plate',
            description: 'Grand Royal Plate',
            amountStated: 1200,
            pricingType: 'per_guest',
            sourceAnchor: 'Rs 1200/- per plate',
            itemPaise: 24000000,
            isVerified: true,
          },
        ],
      },
    ],
  }

  const lines: BudgetLine[] = [
    {
      id: 'line_venue',
      name: 'Venue & Spaces',
      category: 'venue',
      lineType: 'fixed',
      baselinePaise: 25000000, // ₹2,50,000
      currentPaise: 22500000, // ₹2,25,000
      isCommitted: true,
      committedVendor: 'Royal Heritage Lawn',
      committedPaise: 22500000,
      variancePaise: -2500000, // Saved ₹25,000
    },
    {
      id: 'line_catering',
      name: 'Catering & Feast',
      category: 'catering',
      lineType: 'per_guest',
      baselinePaise: 25000000, // ₹2,50,000
      currentPaise: 25000000,
      isProtected: true,
    },
    {
      id: 'line_decor',
      name: 'Decor & Floral',
      category: 'decor',
      lineType: 'flexible',
      baselinePaise: 15000000, // ₹1,50,000
      currentPaise: 15000000,
      elasticityRank: 3,
    },
  ]

  const plan: Plan = {
    id: 'test_plan_genui',
    brief: {
      title: 'Aarav & Meera Wedding',
      eventType: 'wedding',
      eventDate: '2026-11-20',
      city: 'Udaipur',
      guestCount: 200,
      totalBudgetPaise: 65000000,
      protectedCategory: 'catering',
    },
    lines,
    totalBudgetPaise: 65000000,
    baselineGuestCount: 200,
    quotes: [quoteA, quoteB],
    adoptedIdeas: [
      {
        ideaId: 'kulhad_chai_bar',
        title: 'Kulhad Chai & Filter Coffee Bar',
        targetCategory: 'catering',
        costPaise: 1500000,
        displacedDonors: [],
        adoptedAt: '2026-10-28T10:00:00.000Z',
      },
    ],
  }

  return { plan, quoteA, quoteB }
}

describe('Generative UI Primitives with Pure Entity ID Binding (GENUI-01, GENUI-02, D-13, D-16)', () => {
  it('VendorChecklist resolves lines, commitment badges, and savings directly from plan context', () => {
    const { plan } = createTestPlan()
    const handleCheckQuote = vi.fn()

    render(
      <PlanProvider plan={plan} onCheckQuote={handleCheckQuote}>
        <VendorChecklist lineIds={['line_venue', 'line_catering']} />
      </PlanProvider>
    )

    // Asserts Venue is committed with saved amount
    expect(screen.getByText('Venue & Spaces')).toBeInTheDocument()
    expect(screen.getByText(/Committed: Royal Heritage Lawn/)).toBeInTheDocument()
    expect(screen.getByText(/Saved/)).toBeInTheDocument()

    // Asserts Catering is open with Check Quote button
    expect(screen.getByText('Catering & Feast')).toBeInTheDocument()
    const checkBtn = screen.getByText('Check Quote')
    fireEvent.click(checkBtn)
    expect(handleCheckQuote).toHaveBeenCalledWith('catering')
  })

  it('IdeaGrid resolves ideas from catalog, displays adoption status, and dispatches actions', () => {
    const { plan } = createTestPlan()
    const handleAdopt = vi.fn()
    const handleRetract = vi.fn()

    render(
      <PlanProvider plan={plan} onAdoptIdea={handleAdopt} onRetractIdea={handleRetract}>
        <IdeaGrid ideaIds={['kulhad_chai_bar', 'live_shehnai_jugalbandi']} />
      </PlanProvider>
    )

    // kulhad_chai_bar is adopted in test plan
    expect(screen.getByText('Kulhad Chai & Filter Coffee Bar')).toBeInTheDocument()
    expect(screen.getByText(/Adopted • Retract Idea/)).toBeInTheDocument()

    // live_shehnai_jugalbandi is not adopted
    expect(screen.getByText('Live Shehnai & Nagada Jugalbandi')).toBeInTheDocument()
    const adoptBtn = screen.getByText(/Adopt Idea/)
    expect(adoptBtn).toBeInTheDocument()

    // Test retract click
    fireEvent.click(screen.getByText(/Adopted • Retract Idea/))
    expect(handleRetract).toHaveBeenCalledWith('kulhad_chai_bar')

    // Test adopt click
    fireEvent.click(adoptBtn)
    expect(handleAdopt).toHaveBeenCalled()
  })

  it('QuoteReport resolves quote by entity ID and renders verbatim pills and omission chips', () => {
    const { plan } = createTestPlan()
    const handleCommit = vi.fn()

    render(
      <PlanProvider plan={plan}>
        <QuoteReport
          quoteId="quote_caterer_royal"
          onCommitQuote={handleCommit}
        />
      </PlanProvider>
    )

    // Asserts vendor title and line items are resolved
    expect(screen.getByText('Royal Caterers & Feast')).toBeInTheDocument()
    expect(screen.getByText('Per Plate Buffet Charge')).toBeInTheDocument()

    // Asserts verbatim source pill is rendered
    expect(screen.getByText(/Rs 950\/- per plate/)).toBeInTheDocument()

    // Asserts statutory omission chip is rendered
    expect(screen.getByText(/5% Catering GST/)).toBeInTheDocument()

    // Asserts primary commit CTA exists
    const commitBtn = screen.getByRole('button', { name: /Commit Catering Quote/i })
    expect(commitBtn).toBeInTheDocument()
    fireEvent.click(commitBtn)
    expect(handleCommit).toHaveBeenCalled()
  })

  it('ScenarioComparison renders multi-vendor side-by-side columns with client-computed totals', () => {
    const { plan } = createTestPlan()
    const handleSelectScenario = vi.fn()

    render(
      <PlanProvider plan={plan}>
        <ScenarioComparison
          quoteIds={['quote_caterer_royal', 'quote_caterer_darbar']}
          lineId="line_catering"
          onSelectScenario={handleSelectScenario}
        />
      </PlanProvider>
    )

    // Both vendors rendered side by side
    expect(screen.getByText('Royal Caterers & Feast')).toBeInTheDocument()
    expect(screen.getByText('Darbar Gourmet Feasts')).toBeInTheDocument()

    // Baseline banner rendered
    expect(screen.getByText(/Catering & Feast/)).toBeInTheDocument()
    expect(screen.getByText(/Computed for/)).toBeInTheDocument()

    // Action buttons rendered
    const selectButtons = screen.getAllByRole('button', { name: /Select This Scenario/i })
    expect(selectButtons).toHaveLength(2)

    fireEvent.click(selectButtons[0])
    expect(handleSelectScenario).toHaveBeenCalledWith('quote_caterer_royal', 'tier_royal_thali')
  })

  it('guarantees ZERO numbers are required in component props (pure Entity ID Binding)', () => {
    const { plan } = createTestPlan()

    // Renders all 4 components passing ONLY string IDs
    const { container } = render(
      <PlanProvider plan={plan}>
        <VendorChecklist lineIds={['line_venue']} />
        <IdeaGrid ideaIds={['kulhad_chai_bar']} />
        <QuoteReport quoteId="quote_caterer_royal" />
        <ScenarioComparison quoteIds={['quote_caterer_royal']} />
      </PlanProvider>
    )

    // Check that figures exist in the DOM (e.g. ₹ symbols) originating from state
    expect(container.textContent).toContain('₹')
    expect(container.textContent).toContain('Royal Caterers & Feast')
  })
})

