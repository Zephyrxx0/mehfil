import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import SharePage from '@/app/share/[token]/page'
import * as cryptoEngine from '@/lib/engine/crypto'

// Mock supabase/server
const mockRpc = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

let mockSupabaseClient: any = null

vi.mock('@/lib/supabase/server', () => ({
  getServerSupabase: vi.fn(async () => mockSupabaseClient),
}))

// Mock ShareClientView
vi.mock('@/app/share/[token]/ShareClientView', () => ({
  ShareClientView: ({ sanitizedPlan }: { sanitizedPlan: any }) => (
    <div data-testid="share-view">
      {sanitizedPlan ? (
        <div>
          <span data-testid="plan-title">{sanitizedPlan.title}</span>
          <span data-testid="plan-city">{sanitizedPlan.city}</span>
          {/* Ensure edit key is never present */}
          <span data-testid="has-edit-key">{String('edit_key_hash' in sanitizedPlan)}</span>
        </div>
      ) : (
        <span data-testid="expired-view">Link Expired or Not Found</span>
      )}
    </div>
  ),
}))

describe('SharePage Security Hardening & RPC (Task 3.2)', () => {
  const token = 'test-share-token-123'
  let tokenHash: string

  beforeEach(async () => {
    vi.clearAllMocks()
    tokenHash = await cryptoEngine.hashCapabilityToken(token)

    mockSupabaseClient = {
      rpc: mockRpc,
      from: mockFrom,
    }
  })

  it('successfully loads shared plan via SECURITY DEFINER get_shared_plan RPC', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'test-event-id',
          title: 'Aarav & Diya Wedding',
          event_type: 'wedding',
          event_date: '2026-11-20',
          city: 'Jaipur',
          guest_count: 250,
          total_budget_paise: 250000000,
          protected_category: 'catering',
          status: 'active',
          lines: [
            {
              id: 'cat-line-1',
              category: 'catering',
              name: 'Royal Feast',
              estimatedPaise: 100000000,
              paidPaise: 0,
              isFloorProtected: true,
              floorPaise: 80000000,
            },
          ],
        },
      ],
      error: null,
    })

    const pageElement = await SharePage({ params: Promise.resolve({ token }) })
    const { getByTestId } = render(pageElement)

    expect(mockRpc).toHaveBeenCalledWith('get_shared_plan', {
      p_share_key_hash: tokenHash,
    })
    expect(getByTestId('plan-title').textContent).toBe('Aarav & Diya Wedding')
    expect(getByTestId('plan-city').textContent).toBe('Jaipur')
    expect(getByTestId('has-edit-key').textContent).toBe('false')
  })

  it('renders expired notice when share token is not found or inactive', async () => {
    mockRpc.mockResolvedValue({
      data: [],
      error: null,
    })

    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })
    mockEq.mockReturnValue({ single: mockSingle, eq: vi.fn().mockReturnValue({ single: mockSingle }) })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const pageElement = await SharePage({ params: Promise.resolve({ token: 'invalid-token' }) })
    const { getByTestId } = render(pageElement)

    expect(getByTestId('expired-view').textContent).toBe('Link Expired or Not Found')
  })
})
