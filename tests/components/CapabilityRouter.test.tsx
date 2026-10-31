import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UnlockEditDialog } from '@/components/workspace/UnlockEditDialog'
import { PlanClientPage } from '@/app/plan/[id]/PlanClientPage'

// Mock next/navigation
const mockReplace = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => `/plan/test-collab-event-456/budget`,
  useSelectedLayoutSegment: () => 'budget',
}))

describe('Capability Router & Read-Only Downgrade (D-02, D-03, D-04, COLLAB-02)', () => {
  const planId = 'test-collab-event-456'

  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    mockSearchParams = new URLSearchParams()

    // Seed mock plan in local storage
    window.localStorage.setItem(
      `mehfil_plan_${planId}`,
      JSON.stringify({
        id: planId,
        brief: {
          title: 'Aarav 1st Birthday',
          eventType: 'birthday',
          eventDate: '2026-11-25',
          city: 'Hyderabad',
          guestCount: 80,
          totalBudgetPaise: 40000000,
          protectedCategory: 'catering',
        },
        lines: [
          {
            id: 'line-cat',
            name: 'Live Dosa Station & High Tea',
            category: 'catering',
            lineType: 'per_guest',
            baselinePaise: 20000000,
            currentPaise: 20000000,
            isProtected: true,
          },
        ],
        totalBudgetPaise: 40000000,
        baselineGuestCount: 80,
      })
    )
  })

  it('automatically claims key from query param, sets session, and strips key from URL bar', async () => {
    const testSecretKey = 'abcdef1234567890abcdef1234567890'
    mockSearchParams = new URLSearchParams(`key=${testSecretKey}`)

    // Mock claim fetch
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ authorized: true }),
    } as any)

    render(<PlanClientPage planId={planId} />)

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(`/api/plan/${planId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: testSecretKey }),
      })
    })

    // Must call router.replace immediately to strip secret key from browser URL bar (D-02)
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(`/plan/${planId}/budget`)
    })
  })

  it('downgrades to Read-Only mode and renders "Unlock Organizer Editing" when visited without a key', async () => {
    mockSearchParams = new URLSearchParams() // No key

    render(<PlanClientPage planId={planId} />)

    await waitFor(() => {
      expect(screen.getByText(/Read-Only View/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Unlock Organizer Editing/i })).toBeInTheDocument()
    })
  })

  it('UnlockEditDialog opens and normalizes pasted capability URL to extract key', async () => {
    const onUnlocked = vi.fn()
    const onOpenChange = vi.fn()

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ authorized: true }),
    } as any)

    render(
      <UnlockEditDialog
        open={true}
        onOpenChange={onOpenChange}
        planId={planId}
        onUnlocked={onUnlocked}
      />
    )

    expect(screen.getByText('Enter Organizer Edit Key')).toBeInTheDocument()

    const input = screen.getByPlaceholderText(
      /e\.g\. 7f9a2b\.\.\. or full mehfil\.app\/plan\/\.\.\. URL/i
    )
    // User pastes full URL
    fireEvent.change(input, {
      target: {
        value: 'https://mehfil.app/plan/test-collab-event-456?key=9876543210abcdef9876543210abcdef',
      },
    })

    const submitBtn = screen.getByRole('button', { name: /Verify & Unlock Editing/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      // Must extract only the normalized secret token
      expect(globalThis.fetch).toHaveBeenCalledWith(`/api/plan/${planId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: '9876543210abcdef9876543210abcdef' }),
      })
      expect(onUnlocked).toHaveBeenCalled()
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('displays inline error message when an invalid key is submitted', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ authorized: false, error: 'Invalid capability token' }),
    } as any)

    render(
      <UnlockEditDialog open={true} onOpenChange={vi.fn()} planId={planId} onUnlocked={vi.fn()} />
    )

    const input = screen.getByPlaceholderText(
      /e\.g\. 7f9a2b\.\.\. or full mehfil\.app\/plan\/\.\.\. URL/i
    )
    fireEvent.change(input, { target: { value: 'wrongtoken123' } })

    const submitBtn = screen.getByRole('button', { name: /Verify & Unlock Editing/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(
        screen.getByText(
          /This edit key does not match this celebration\. Please verify the URL or ask the host for an updated key\./i
        )
      ).toBeInTheDocument()
    })
  })
})
