import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { QuoteIntakeSheet } from '@/components/quotes/QuoteIntakeSheet'
import type { BudgetCategory } from '@/lib/engine/types'

const venueQuote = {
  id: 'quote_venue_1',
  vendorName: 'Royal Heritage Lawn',
  category: 'venue',
  rawText: 'Main lawn rental Rs 2,00,000',
  tiers: [
    {
      tierId: 'tier_1',
      name: 'Lawn',
      lineItems: [
        {
          id: 'item_1',
          description: 'Main Lawn Rental',
          amountStated: 200000,
          pricingType: 'flat',
          sourceAnchor: 'Main lawn rental Rs 2,00,000',
          itemPaise: 20000000,
          isVerified: true,
        },
      ],
      baseTierPaise: 20000000,
      totalWithAddersPaise: 20000000,
      isStatedTotalConsistent: true,
    },
  ],
  omissionAdders: [],
  droppedItems: [],
  statedInclusions: [],
  statedExclusions: [],
  createdAt: new Date().toISOString(),
}

function renderSheet(open: boolean, category: BudgetCategory) {
  return (
    <QuoteIntakeSheet open={open} onOpenChange={vi.fn()} category={category} guestCount={200} />
  )
}

describe('QuoteIntakeSheet reopen (stale extraction)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { vendorQuote: venueQuote } }),
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function extractVenueQuote() {
    fireEvent.change(screen.getByPlaceholderText(/Paste a WhatsApp message/i), {
      target: { value: 'Main lawn rental Rs 2,00,000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Extract Quote Breakdown/i }))
    await screen.findByRole('button', { name: /Commit Venue Quote/i })
  }

  it('shows a fresh Catering intake after a Venue quote was extracted and the sheet closed', async () => {
    const { rerender } = render(renderSheet(true, 'venue'))
    await extractVenueQuote()

    rerender(renderSheet(false, 'venue'))
    rerender(renderSheet(true, 'catering'))

    await waitFor(() => {
      expect(screen.getByText(/Check Vendor Quote: Catering/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /Commit Venue Quote/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Extract Quote Breakdown/i })).toBeDisabled()
    expect(
      (screen.getByPlaceholderText(/Paste a WhatsApp message/i) as HTMLTextAreaElement).value
    ).toBe('')
  })

  it('"Check Another Quote" still returns to the intake', async () => {
    render(renderSheet(true, 'venue'))
    await extractVenueQuote()

    fireEvent.click(screen.getByRole('button', { name: /Check Another Quote/i }))

    expect(screen.getByText(/Check Vendor Quote: Venue/i)).toBeInTheDocument()
  })
})
