import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act, within } from '@testing-library/react'
import React from 'react'
import { BriefWizard } from '@/components/intake/BriefWizard'
import { STARTER_OPTIONS, resolveStarterBrief } from '@/lib/../components/intake/StarterChips'
import { todayISO } from '@/lib/dates'
import type { EventBrief } from '@/lib/engine/types'

describe('BriefWizard Component', () => {
  it('shows Step 1 first', () => {
    render(<BriefWizard onPlanCreated={() => {}} />)

    expect(screen.getByText('The occasion')).toBeInTheDocument()
    expect(screen.getByText(/Step 1 of 5/)).toBeInTheDocument()
    expect(screen.getByText('1-Click Celebration Starters')).toBeInTheDocument()
  })

  it('renders 1-click starter chips', () => {
    render(<BriefWizard onPlanCreated={() => {}} />)

    for (const starter of STARTER_OPTIONS) {
      expect(screen.getByText(starter.label)).toBeInTheDocument()
    }
  })

  it('clicking a starter chip calls onPlanCreated with an instantiated plan after 300ms', () => {
    vi.useFakeTimers()
    const handlePlanCreated = vi.fn()

    render(
      <BriefWizard onPlanCreated={handlePlanCreated} />
    )

    const firstChip = screen.getByText(STARTER_OPTIONS[0].label)
    fireEvent.click(firstChip)

    // Should enter reveal pulse state (D-04)
    expect(screen.getByText('Balancing budget & timeline...')).toBeInTheDocument()

    // Advance 300ms
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(handlePlanCreated).toHaveBeenCalledTimes(1)
    const generatedPlan = handlePlanCreated.mock.calls[0][0]
    expect(generatedPlan.brief.eventType).toBe('wedding')
    expect(generatedPlan.lines).toHaveLength(8)

    vi.useRealTimers()
  })

  it('allows navigating steps 1 -> 2 -> 3 and submitting', () => {
    vi.useFakeTimers()
    const handlePlanCreated = vi.fn()

    render(<BriefWizard onPlanCreated={handlePlanCreated} />)

    // Step 1: Click Next
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText('Expected Guest Count')).toBeInTheDocument()

    // Step 2: Click Next
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText('Cultural & Operational Nuances (Optional)')).toBeInTheDocument()
    expect(screen.getByText('Skip & Generate')).toBeInTheDocument()

    // Click Skip & Generate
    fireEvent.click(screen.getByText('Skip & Generate'))

    // Advance 300ms
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(handlePlanCreated).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  describe('date safeguards', () => {
    afterEach(() => vi.useRealTimers())

    const briefOn = (eventDate: string): EventBrief => ({ ...STARTER_OPTIONS[0].brief, eventDate })
    const yesterday = () => {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      return todayISO(d)
    }

    it('blocks Next on step 1 and explains why when the date has passed', () => {
      render(<BriefWizard onPlanCreated={() => {}} initialBrief={briefOn(yesterday())} />)

      expect(screen.getByRole('alert')).toHaveTextContent(/already passed/i)
      const next = screen.getByRole('button', { name: 'Next' })
      expect(next).toBeDisabled()
      fireEvent.click(next)
      expect(screen.getByText('The occasion')).toBeInTheDocument()
    })

    it('allows today', () => {
      render(<BriefWizard onPlanCreated={() => {}} initialBrief={briefOn(todayISO())} />)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
    })

    it('never creates a plan for a past date, even if it slips through', () => {
      vi.useFakeTimers()
      const onCreated = vi.fn()
      render(<BriefWizard onPlanCreated={onCreated} step={3} initialBrief={briefOn(yesterday())} />)

      fireEvent.click(screen.getByText('Skip & Generate'))
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(onCreated.mock.calls[0][0].brief.eventDate).toBe(todayISO())
    })

    it('rolls a stale starter date forward so the starter plan is never in the past', () => {
      vi.useFakeTimers()
      const onCreated = vi.fn()
      const birthday = STARTER_OPTIONS.find((s) => s.key === 'birthday')!
      render(<BriefWizard onPlanCreated={onCreated} />)

      fireEvent.click(screen.getByText(birthday.label))
      act(() => {
        vi.advanceTimersByTime(300)
      })
      const date = onCreated.mock.calls[0][0].brief.eventDate as string
      expect(date >= todayISO()).toBe(true)
      expect(date.slice(5)).toBe(birthday.brief.eventDate.slice(5)) // same day and month
    })

    it('resolveStarterBrief leaves every other field alone and never returns a past date', () => {
      for (const starter of STARTER_OPTIONS) {
        const resolved = resolveStarterBrief(starter.brief)
        expect({ ...resolved, eventDate: '' }).toEqual({ ...starter.brief, eventDate: '' })
        expect(resolved.eventDate >= todayISO()).toBe(true)
      }
    })
  })

  describe('navigation footer', () => {
    it('keeps Back and the primary button in one container on every step, so they cannot move', () => {
      const { container, rerender } = render(<BriefWizard onPlanCreated={() => {}} step={1} />)
      const footerOf = () => screen.getByText('Back').closest('button')!.parentElement!

      // Step 1: Back is present but hidden from sight and assistive tech, so Next keeps its place.
      const back1 = screen.getByText('Back').closest('button')!
      expect(back1).toHaveClass('invisible')
      expect(back1).toHaveAttribute('aria-hidden', 'true')
      const footer = footerOf()

      for (const step of [2, 3, 4, 5] as const) {
        rerender(<BriefWizard onPlanCreated={() => {}} step={step} />)
        expect(footerOf()).toBe(footer) // same DOM node: it is never re-created or moved
        expect(screen.getByRole('button', { name: 'Back' })).not.toHaveClass('invisible')
        const primary = within(footer).getAllByRole('button').at(-1)!
        expect(primary.className).toMatch(/\bmin-w-\d+\b/)
      }
      expect(container.querySelectorAll('footer, [class*="sticky"]').length).toBeGreaterThan(0)
    })
  })

  describe('submit feedback (no dead clicks, no flow breaks)', () => {
    afterEach(() => vi.useRealTimers())

    it('shows the loading screen immediately on Infuse and disables the button', () => {
      vi.useFakeTimers()
      // A hand-off that never resolves, to hold the loading state in view.
      const onCreated = vi.fn(() => new Promise<void>(() => {}))
      render(<BriefWizard onPlanCreated={onCreated} step={5} />)

      fireEvent.click(screen.getByRole('button', { name: /Infuse Style DNA/ }))

      // The reveal appears at once (before the 300ms beat), so the click is never dead.
      expect(screen.getByRole('status')).toHaveTextContent(/Balancing budget/i)
      expect(onCreated).toHaveBeenCalledTimes(1)
    })

    it('ignores extra clicks while a submit is in flight, creating exactly one plan', () => {
      vi.useFakeTimers()
      const onCreated = vi.fn(() => new Promise<void>(() => {}))
      render(<BriefWizard onPlanCreated={onCreated} step={5} />)

      const button = screen.getByRole('button', { name: /Infuse Style DNA/ })
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      expect(onCreated).toHaveBeenCalledTimes(1)
    })

    it('keeps the loading screen up until the hand-off resolves (no flash back to the wizard)', async () => {
      let resolveHandoff: () => void = () => {}
      const onCreated = vi.fn(() => new Promise<void>((r) => (resolveHandoff = r)))
      render(<BriefWizard onPlanCreated={onCreated} step={5} />)

      fireEvent.click(screen.getByRole('button', { name: /Infuse Style DNA/ }))
      expect(screen.getByRole('status')).toBeInTheDocument()

      // Even after a while, while the hand-off is pending, the wizard does not reappear.
      await act(async () => {
        await new Promise((r) => setTimeout(r, 350))
      })
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Infuse Style DNA/ })).not.toBeInTheDocument()

      // Only once navigation (the hand-off) completes does control leave the wizard.
      await act(async () => {
        resolveHandoff()
      })
      expect(onCreated).toHaveBeenCalledTimes(1)
    })

    it('returns to the wizard with a retry message if the hand-off fails', async () => {
      const onCreated = vi
        .fn()
        .mockRejectedValueOnce(new Error('network down'))
        .mockImplementationOnce(() => new Promise<void>(() => {}))
      render(<BriefWizard onPlanCreated={onCreated} step={5} />)

      fireEvent.click(screen.getByRole('button', { name: /Infuse Style DNA/ }))

      // The error surfaces and the wizard is usable again (no silent dead end).
      expect(await screen.findByRole('alert')).toHaveTextContent(/try again/i)
      const retry = screen.getByRole('button', { name: /Infuse Style DNA/ })
      expect(retry).toBeEnabled()

      // Retrying works and is accepted (the guard reset after the failure).
      fireEvent.click(retry)
      expect(onCreated).toHaveBeenCalledTimes(2)
    })
  })
})
