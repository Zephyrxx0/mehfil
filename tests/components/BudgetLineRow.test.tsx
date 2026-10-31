import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { BudgetLineRow, type DisplacedDonorRecord } from '@/components/workspace/BudgetLineRow'
import type { BudgetLine } from '@/lib/engine/types'

describe('BudgetLineRow Component (MOMENT-03, BUDGET-04, D-05, D-08)', () => {
  const flexibleLine: BudgetLine = {
    id: 'decor-1',
    category: 'decor',
    name: 'Decor & Production',
    baselinePaise: 500_000_00, // ₹5,00,000
    currentPaise: 450_000_00, // ₹4,50,000
    lineType: 'flexible',
    isProtected: false,
    elasticityRank: 3,
  }

  const protectedLine: BudgetLine = {
    id: 'photo-1',
    category: 'photo_film',
    name: 'Photography & Cinema',
    baselinePaise: 300_000_00, // ₹3,00,000
    currentPaise: 375_000_00, // ₹3,75,000
    lineType: 'fixed',
    isProtected: true,
    protectedQuote: 'Candid golden hour portraits with Dadi and Nani',
  }

  let originalVibrate: any

  beforeEach(() => {
    originalVibrate = navigator.vibrate
    navigator.vibrate = vi.fn().mockReturnValue(true)
  })

  afterEach(() => {
    if (originalVibrate) {
      navigator.vibrate = originalVibrate
    } else {
      // @ts-expect-error cleanup mock
      delete navigator.vibrate
    }
  })

  it('renders Protected Moment card with Gulabi Rose styling, lock icon, and immunity indicator', () => {
    const onSetProtected = vi.fn()
    render(
      <BudgetLineRow
        line={protectedLine}
        totalBudgetPaise={2_000_000_00}
        onSetProtected={onSetProtected}
      />
    )

    // Name & Amount
    expect(screen.getByText('Photography & Cinema')).toBeInTheDocument()
    expect(screen.getByText('₹3,75,000')).toBeInTheDocument()

    // Protected Moment badge & card container with Gulabi Rose styling
    const badge = screen.getByTestId('protected-moment-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Protected Moment')

    const card = document.getElementById('category-photo_film')
    expect(card).toHaveAttribute('data-protected', 'true')
    expect(card?.className).toContain('bg-gulabi-rose/10')
    expect(card?.className).not.toContain('animate-shimmer-rose')

    // Protected quote displayed
    expect(screen.getByText(/Candid golden hour portraits with Dadi and Nani/)).toBeInTheDocument()

    // Immunity statement
    expect(screen.getByText(/immune to displacement/i)).toBeInTheDocument()
  })

  it('triggers onSetProtected and micro-haptic vibrate(50) on button click', () => {
    const onSetProtected = vi.fn()
    render(
      <BudgetLineRow
        line={flexibleLine}
        totalBudgetPaise={2_000_000_00}
        onSetProtected={onSetProtected}
      />
    )

    const button = screen.getByRole('button', { name: /Set as Protected/i })
    fireEvent.click(button)

    expect(onSetProtected).toHaveBeenCalledWith('decor')
    expect(navigator.vibrate).toHaveBeenCalledWith(50)
  })

  it('renders inline donor tags when displacedRecords are provided (D-05, BUDGET-04)', () => {
    const onSetProtected = vi.fn()
    const displacedRecords: DisplacedDonorRecord[] = [
      {
        ideaTitle: 'Kulhad Chai Bar',
        displacedPaise: 15_000_00, // ₹15,000
      },
    ]

    render(
      <BudgetLineRow
        line={flexibleLine}
        totalBudgetPaise={2_000_000_00}
        onSetProtected={onSetProtected}
        displacedRecords={displacedRecords}
      />
    )

    // Donor deduction tag
    expect(screen.getByText('-₹15,000 for Kulhad Chai Bar')).toBeInTheDocument()
  })

  it('displays 40% floor indicator for non-protected flexible lines', () => {
    const onSetProtected = vi.fn()
    render(
      <BudgetLineRow
        line={flexibleLine}
        totalBudgetPaise={2_000_000_00}
        onSetProtected={onSetProtected}
      />
    )

    // 40% of ₹5,00,000 is ₹2,00,000
    const indicator = screen.getByTestId('floor-indicator')
    expect(indicator).toHaveTextContent('40% floor: ₹2,00,000 protected')
  })
})
