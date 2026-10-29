import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { QuoteCheckCard } from '@/components/quotes/QuoteCheckCard'
import { BudgetLineRow } from '@/components/workspace/BudgetLineRow'
import type { VendorQuote, Plan, BudgetLine } from '@/lib/engine/types'

function createSamplePlan(): Plan {
  const lines: BudgetLine[] = [
    {
      id: 'line_venue',
      name: 'Venue & Banquet',
      category: 'venue',
      lineType: 'fixed',
      baselinePaise: 25000000, // ₹2,50,000
      currentPaise: 25000000,
    },
    {
      id: 'line_catering',
      name: 'Festive Catering',
      category: 'catering',
      lineType: 'per_guest',
      baselinePaise: 25000000,
      currentPaise: 25000000,
      isProtected: true, // Protected Moment!
    },
    {
      id: 'line_decor',
      name: 'Stage & Mandap Decor',
      category: 'decor',
      lineType: 'flexible',
      baselinePaise: 20000000, // ₹2,00,000
      currentPaise: 20000000,
      elasticityRank: 3,
    },
    {
      id: 'line_misc',
      name: 'Miscellaneous & Sundries',
      category: 'misc',
      lineType: 'flexible',
      baselinePaise: 5000000, // ₹50,000
      currentPaise: 5000000,
      elasticityRank: 1,
    },
    {
      id: 'line_contingency',
      name: 'Contingency Buffer',
      category: 'contingency',
      lineType: 'buffer',
      baselinePaise: 5000000,
      currentPaise: 5000000,
    },
  ]

  const totalBudgetPaise = lines.reduce((s, l) => s + l.currentPaise, 0)

  return {
    id: 'test_plan_01',
    brief: {
      title: 'Aarav & Diya Wedding',
      eventType: 'wedding',
      eventDate: '2026-11-20',
      city: 'Delhi NCR',
      guestCount: 200,
      totalBudgetPaise,
      protectedCategory: 'catering',
    },
    lines,
    totalBudgetPaise,
    baselineGuestCount: 200,
  }
}

const mockQuote: VendorQuote = {
  id: 'quote_venue_01',
  vendorName: 'Royal Heritage Lawn & Haveli',
  category: 'venue',
  rawText: `Main Lawn & Courtyard Rental: Rs 2,00,000.
Green Rooms: Rs 50,000.
Overtime buffer after 10 PM: Rs 10,000.
Generator Backup: Rs 15,000.`,
  statedInclusions: ['Basic perimeter security', 'Housekeeping'],
  statedExclusions: ['GST', 'Overtime past midnight'],
  paymentTerms: '50% advance, 50% 15 days prior',
  createdAt: '2026-10-28T10:00:00.000Z',
  tiers: [
    {
      tierId: 'tier_classic',
      name: 'Classic Lawn',
      lineItems: [
        {
          id: 'item_1',
          description: 'Main Lawn & Courtyard Rental',
          amountStated: 200000,
          pricingType: 'flat',
          sourceAnchor: 'Rs 2,00,000',
          itemPaise: 20000000, // ₹2,00,000
          isVerified: true,
        },
      ],
      baseTierPaise: 20000000,
      totalWithAddersPaise: 20000000,
      isStatedTotalConsistent: true,
    },
    {
      tierId: 'tier_grand',
      name: 'Grand Estate',
      lineItems: [
        {
          id: 'item_2',
          description: 'Main Lawn + Luxury Green Rooms',
          amountStated: 275000,
          pricingType: 'flat',
          sourceAnchor: 'Rs 2,75,000',
          itemPaise: 27500000, // ₹2,75,000
          isVerified: true,
        },
      ],
      baseTierPaise: 27500000,
      totalWithAddersPaise: 27500000,
      isStatedTotalConsistent: true,
    },
  ],
  omissionAdders: [
    {
      id: 'adder_overtime',
      name: 'Overtime buffer after 10 PM',
      category: 'venue',
      rateType: 'fixed',
      fixedPaise: 1000000, // ₹10,000
      amountPaise: 1000000,
      rationale: 'Late night noise curfew',
      isEnabled: false,
    },
  ],
  droppedItems: [
    {
      description: 'Unanchored Security Surcharge',
      amountStated: 45000,
      sourceAnchor: 'Rs 45,000 deposit',
      reason: 'no_substring_match',
    },
  ],
}

describe('QuoteCheckCard Component (QUOTE-05, QUOTE-06, D-07, D-08, D-09, D-10)', () => {
  it('renders vendor name, category badge, and payment terms', () => {
    render(<QuoteCheckCard quote={mockQuote} />)

    expect(screen.getByText('Royal Heritage Lawn & Haveli')).toBeInTheDocument()
    expect(screen.getByText('Venue')).toBeInTheDocument()
    expect(screen.getByText('50% advance, 50% 15 days prior')).toBeInTheDocument()
  })

  it('package tier tabs switch active tier and recalculate base paise in real time', () => {
    render(<QuoteCheckCard quote={mockQuote} />)

    // Initially Classic Lawn is active: ₹2,00,000
    expect(screen.getByText('Main Lawn & Courtyard Rental')).toBeInTheDocument()
    expect(screen.getAllByText('₹2,00,000').length).toBeGreaterThanOrEqual(1)

    // Click Grand Estate tab
    const grandTab = screen.getByRole('tab', { name: /Grand Estate/i })
    fireEvent.click(grandTab)

    expect(screen.getByText('Main Lawn + Luxury Green Rooms')).toBeInTheDocument()
    expect(screen.getAllByText('₹2,75,000').length).toBeGreaterThanOrEqual(1)
  })

  it('renders verbatim source pill with anchor text', () => {
    render(<QuoteCheckCard quote={mockQuote} />)

    const sourcePill = screen.getByText(/Rs 2,00,000/i)
    expect(sourcePill).toBeInTheDocument()
  })

  it('toggling omission adder chips updates tier total in real time', () => {
    render(<QuoteCheckCard quote={mockQuote} />)

    // Initially tier total is ₹2,00,000
    expect(screen.getAllByText('₹2,00,000').length).toBeGreaterThanOrEqual(1)

    // Toggle overtime adder chip (+₹10,000)
    const adderBtn = screen.getByText(/Overtime buffer after 10 PM/i)
    fireEvent.click(adderBtn)

    // Now total is ₹2,10,000
    expect(screen.getByText('₹2,10,000')).toBeInTheDocument()
  })

  it('renders dropped items calm amber alert pill with manual entry fallback', () => {
    const onAddManualItem = vi.fn()
    render(<QuoteCheckCard quote={mockQuote} onAddManualItem={onAddManualItem} />)

    expect(screen.getByText(/1 figure excluded:/i)).toBeInTheDocument()
    expect(screen.getByText(/no verbatim match in quote text/i)).toBeInTheDocument()

    const manualBtn = screen.getByText(/Add Excluded Amount Manually/i)
    fireEvent.click(manualBtn)

    expect(onAddManualItem).toHaveBeenCalledWith(mockQuote.droppedItems[0])
  })

  it('renders live plan impact preview diff when plan is provided', () => {
    const plan = createSamplePlan()
    render(<QuoteCheckCard quote={mockQuote} plan={plan} />)

    // Baseline venue is ₹2,50,000. Classic tier is ₹2,00,000.
    // Saved ₹50,000 vs allocation
    const preview = screen.getByTestId('live-plan-impact-preview')
    expect(preview).toHaveTextContent(/Saved ₹50,000 vs allocation/i)
    expect(preview).toHaveTextContent(/Surplus added to Contingency buffer/i)
  })

  it('clicking Commit Venue Quote dispatches commit callback with selected tier and adders', () => {
    const onCommit = vi.fn()
    render(<QuoteCheckCard quote={mockQuote} onCommit={onCommit} />)

    // Toggle adder
    const adderBtn = screen.getByText(/Overtime buffer after 10 PM/i)
    fireEvent.click(adderBtn)

    const commitBtn = screen.getByRole('button', { name: /Commit Venue Quote/i })
    fireEvent.click(commitBtn)

    expect(onCommit).toHaveBeenCalledWith('tier_classic', ['adder_overtime'])
  })
})

describe('BudgetLineRow Integration with Quotes (D-01, D-10)', () => {
  const committedLine: BudgetLine = {
    id: 'line_venue',
    name: 'Venue & Banquet',
    category: 'venue',
    lineType: 'fixed',
    baselinePaise: 25000000, // ₹2,50,000
    currentPaise: 22500000,  // ₹2,25,000
    isCommitted: true,
    committedQuoteId: 'quote_venue_01',
    committedVendor: 'Royal Heritage Lawn',
    committedTierName: 'Classic Lawn',
    committedPaise: 22500000,
    variancePaise: 2500000, // Saved ₹25,000
  }

  const uncommittedLine: BudgetLine = {
    id: 'line_venue_open',
    name: 'Venue & Banquet',
    category: 'venue',
    lineType: 'fixed',
    baselinePaise: 25000000,
    currentPaise: 25000000,
    isCommitted: false,
  }

  it('renders Committed badge and Saved variance pill on committed line', () => {
    render(
      <BudgetLineRow
        line={committedLine}
        totalBudgetPaise={105000000}
        onSetProtected={vi.fn()}
      />
    )

    expect(screen.getByTestId('committed-quote-badge')).toHaveTextContent(/Royal Heritage Lawn \(Classic Lawn\)/i)
    expect(screen.getByTestId('committed-variance-badge')).toHaveTextContent(/Saved ₹25,000/i)
    expect(screen.getByRole('button', { name: /Unlock \/ Replace Quote/i })).toBeInTheDocument()
  })

  it('renders Check Quote button on uncommitted line', () => {
    const onCheckQuote = vi.fn()
    render(
      <BudgetLineRow
        line={uncommittedLine}
        totalBudgetPaise={105000000}
        onSetProtected={vi.fn()}
        onCheckQuote={onCheckQuote}
      />
    )

    const checkBtn = screen.getByRole('button', { name: /Check Quote/i })
    fireEvent.click(checkBtn)

    expect(onCheckQuote).toHaveBeenCalledWith('venue')
  })
})
