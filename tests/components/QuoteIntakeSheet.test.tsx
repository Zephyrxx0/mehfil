import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { QuoteIntakeSheet } from '@/components/quotes/QuoteIntakeSheet'

describe('QuoteIntakeSheet Component (QUOTE-01, QUOTE-02, D-01, D-02)', () => {
  const mockQuoteResponse = {
    success: true,
    data: {
      vendorQuote: {
        id: 'quote_test_123',
        vendorName: 'Royal Caterers & Banquet Services',
        category: 'catering',
        rawText: 'Rs 950/- per plate. Minimum 250 guests.',
        tiers: [
          {
            tierId: 'tier_1',
            name: 'Grand Buffet',
            lineItems: [
              {
                id: 'item_1',
                description: 'Per Plate Charge',
                amountStated: 950,
                pricingType: 'per_guest',
                sourceAnchor: 'Rs 950/- per plate',
                itemPaise: 19000000,
                isVerified: true,
              },
            ],
            baseTierPaise: 19000000,
            totalWithAddersPaise: 19000000,
            isStatedTotalConsistent: true,
          },
        ],
        omissionAdders: [
          {
            id: 'adder_gst',
            name: '5% GST & Food Service Tax',
            category: 'catering',
            rateType: 'percentage',
            percentageValue: 5,
            amountPaise: 950000,
            rationale: 'Mandatory GST',
            isEnabled: false,
          },
        ],
        droppedItems: [],
        statedInclusions: ['Cutlery', 'Crockery'],
        statedExclusions: ['Taxes'],
        paymentTerms: '25% advance, 75% final',
        createdAt: new Date().toISOString(),
      },
      runRecord: {
        activeTier: 1,
        durationMs: 450,
        modelId: 'gemma-4-31b-it',
        timestamp: new Date().toISOString(),
      },
    },
  }

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockQuoteResponse,
      })
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders sheet when open with category selector and sample quote chips', () => {
    const onOpenChange = vi.fn()
    render(<QuoteIntakeSheet open={true} onOpenChange={onOpenChange} category="catering" />)

    // Security notice & Header
    expect(screen.getByText(/महफ़िल Quote Sandbox/i)).toBeInTheDocument()
    expect(screen.getByText(/Check Vendor Quote: Catering/i)).toBeInTheDocument()
    expect(screen.getByText(/Untrusted vendor quotes are safely quarantined/i)).toBeInTheDocument()

    // Sample quote chips
    expect(screen.getByText(/Try a realistic Indian celebration quote:/i)).toBeInTheDocument()
    expect(screen.getByText(/Royal Caterers/i)).toBeInTheDocument()
    expect(screen.getByText(/Shadi Mandap/i)).toBeInTheDocument()

    // Primary CTA disabled initially
    const extractBtn = screen.getByRole('button', { name: /Extract Quote Breakdown/i })
    expect(extractBtn).toBeDisabled()
  })

  it('clicking a sample quote chip populates the raw text area and category', () => {
    const onOpenChange = vi.fn()
    render(<QuoteIntakeSheet open={true} onOpenChange={onOpenChange} category="catering" />)

    const mandapSample = screen.getByText(/Shadi Mandap/i)
    fireEvent.click(mandapSample)

    const textarea = screen.getByPlaceholderText(/Paste a WhatsApp message/i) as HTMLTextAreaElement
    expect(textarea.value).toContain('SHADI MANDAP & FLORAL DESIGN STUDIO')

    // CTA should now be enabled
    const extractBtn = screen.getByRole('button', { name: /Extract Quote Breakdown/i })
    expect(extractBtn).not.toBeDisabled()
  })

  it('submitting calls /api/ai/quote-analyst, shows loading, and transitions to quote card', async () => {
    const onOpenChange = vi.fn()
    const onQuoteExtracted = vi.fn()

    render(
      <QuoteIntakeSheet
        open={true}
        onOpenChange={onOpenChange}
        category="catering"
        guestCount={200}
        onQuoteExtracted={onQuoteExtracted}
      />
    )

    const textarea = screen.getByPlaceholderText(/Paste a WhatsApp message/i)
    fireEvent.change(textarea, {
      target: { value: 'Buffet rate Rs 950/- per plate with live tandoor' },
    })

    const extractBtn = screen.getByRole('button', { name: /Extract Quote Breakdown/i })
    fireEvent.click(extractBtn)

    expect(fetch).toHaveBeenCalledWith(
      '/api/ai/quote-analyst',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Buffet rate Rs 950/- per plate'),
      })
    )

    await waitFor(() => {
      expect(onQuoteExtracted).toHaveBeenCalledWith(mockQuoteResponse.data.vendorQuote)
      expect(
        screen.getAllByText(/Royal Caterers & Banquet Services/i).length
      ).toBeGreaterThanOrEqual(1)
    })
  })
})
