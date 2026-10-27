import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import HomePage from '@/app/page'

describe('HomePage Crossfade and Navigation', () => {
  it('starts on HeroSection with Mehfil branding and starter chips', () => {
    render(<HomePage />)

    // Devanagari wordmark in header
    expect(screen.getAllByText('महफ़िल').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Mehfil/i).length).toBeGreaterThanOrEqual(1)

    // Hero content should be present
    expect(screen.getByText('Plan Celebration')).toBeInTheDocument()
    expect(screen.getByText('Start Your Mehfil')).toBeInTheDocument()
  })

  it('smoothly transitions to PlanWorkspace upon selecting a starter chip', () => {
    render(<HomePage />)

    // Click starter chip "Big Fat Delhi Wedding ₹25L"
    const chip = screen.getByText('Big Fat Delhi Wedding ₹25L')
    fireEvent.click(chip)

    // PlanWorkspace should now be rendered with workspace details
    expect(screen.getAllByText('Delhi Grand Wedding').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('₹25,00,000').length).toBeGreaterThanOrEqual(1)

    // Header updates with "Re-plan Event"
    expect(screen.getByRole('button', { name: /Re-plan Event/i })).toBeInTheDocument()
  })

  it('clicking "Re-plan Event" opens BriefModal while preserving memory', () => {
    render(<HomePage />)

    // Select starter chip to transition into workspace
    const chip = screen.getByText('Big Fat Delhi Wedding ₹25L')
    fireEvent.click(chip)

    // Click "Re-plan Event" in header
    const replanBtn = screen.getByRole('button', { name: /Re-plan Event/i })
    fireEvent.click(replanBtn)

    // Brief intake dialog should be opened
    expect(screen.getByText('Plan Your Celebration')).toBeInTheDocument()
  })
})
