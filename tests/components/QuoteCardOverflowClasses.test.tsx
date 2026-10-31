import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { QuoteCheckCard } from '@/components/quotes/QuoteCheckCard'
import { QuoteOmissionAdders } from '@/components/quotes/QuoteOmissionAdders'
import type { QuoteOmissionAdder, VendorQuote } from '@/lib/engine/types'

// happy-dom has no layout engine, so these tests pin the Tailwind classes that keep flex children
// inside the quote card (min-w-0 / wrapping / nowrap) rather than measuring pixels.

const ANCHOR = 'Main Lawn & Courtyard Rental: Rs 2,00,000 for the full wedding weekend'

const adder: QuoteOmissionAdder = {
  id: 'adder_gst',
  name: 'GST',
  category: 'venue',
  rateType: 'fixed',
  amountPaise: 1500000,
  rationale: 'Mandatory GST',
  isEnabled: false,
}

const quote = {
  id: 'quote_venue_01',
  vendorName: 'Royal Heritage Lawn & Haveli Banquets',
  category: 'venue',
  rawText: ANCHOR,
  tiers: [
    {
      tierId: 'tier_1',
      name: 'Lawn',
      lineItems: [
        {
          id: 'item_1',
          description: 'Main Lawn & Courtyard Rental',
          amountStated: 200000,
          pricingType: 'flat',
          sourceAnchor: ANCHOR,
          itemPaise: 20000000,
          isVerified: true,
        },
      ],
      baseTierPaise: 20000000,
      totalWithAddersPaise: 20000000,
      isStatedTotalConsistent: true,
    },
  ],
  omissionAdders: [adder],
  droppedItems: [],
  statedInclusions: [],
  statedExclusions: [],
  createdAt: new Date().toISOString(),
} as unknown as VendorQuote

const classesOf = (el: Element | null) => (el?.getAttribute('class') ?? '').split(/\s+/)

describe('quote card overflow guards', () => {
  it('lets the card, line item row and evidence chip shrink inside the card', () => {
    render(<QuoteCheckCard quote={quote} />)

    expect(classesOf(screen.getByTestId('quote-check-card'))).toContain('min-w-0')

    const description = screen.getByText('Main Lawn & Courtyard Rental')
    expect(classesOf(description)).toEqual(expect.arrayContaining(['min-w-0', 'break-words']))

    const row = description.closest('div')?.parentElement as HTMLElement
    expect(classesOf(row)).toContain('min-w-0')
    expect(classesOf(description.parentElement)).toEqual(
      expect.arrayContaining(['min-w-0', 'flex-wrap'])
    )

    const chip = screen.getByRole('button', { name: new RegExp(ANCHOR.slice(0, 20)) })
    expect(classesOf(chip)).toEqual(expect.arrayContaining(['min-w-0', 'max-w-[200px]']))
    expect(classesOf(chip)).not.toContain('truncate')
    expect(classesOf(chip.querySelector('span:last-child'))).toEqual(
      expect.arrayContaining(['min-w-0', 'truncate'])
    )
    expect(classesOf(chip.parentElement)).toContain('min-w-0')
  })

  it('wraps the action row and bounds the verbatim excerpt button', () => {
    render(<QuoteCheckCard quote={quote} />)

    const commit = screen.getByRole('button', { name: /Commit Venue Quote/i })
    const actions = commit.parentElement
    expect(classesOf(actions)).toContain('sm:flex-wrap')
    expect(classesOf(commit)).toEqual(expect.arrayContaining(['sm:flex-1', 'sm:w-auto']))

    const verbatim = screen.getByRole('button', { name: /View Verbatim Quote Excerpt/i })
    expect(classesOf(verbatim)).toContain('max-w-full')
  })

  it('keeps each omission adder amount together on one line', () => {
    render(<QuoteOmissionAdders adders={[adder]} activeAdderIds={[]} onToggle={vi.fn()} />)

    const amount = screen.getByText(/\(\+.*15,000\)/)
    expect(classesOf(amount)).toEqual(expect.arrayContaining(['whitespace-nowrap', 'shrink-0']))
  })
})
