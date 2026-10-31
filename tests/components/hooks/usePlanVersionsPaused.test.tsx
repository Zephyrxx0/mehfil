import * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, renderHook, screen } from '@testing-library/react'
import { usePlanVersions } from '@/components/workspace/hooks/usePlanVersions'
import { SyncStatusBadge } from '@/components/workspace/SyncStatusBadge'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { rebalanceGuestCount } from '@/lib/engine/budget'
import { persistence } from '@/lib/storage/persistence'
import type { EventBrief } from '@/lib/engine/types'

vi.mock('@/lib/storage/persistence', () => ({
  persistence: { savePlan: vi.fn(), getVersionHistory: vi.fn() },
}))

const BRIEF: EventBrief = {
  title: 'Paused test',
  eventType: 'wedding',
  eventDate: '2027-09-09',
  city: 'Delhi',
  guestCount: 200,
  totalBudgetPaise: 200_000_000,
  protectedCategory: 'catering',
}
const base = instantiatePlanFromBrief(BRIEF)
const bigger = rebalanceGuestCount(base, 220)
const savePlan = vi.mocked(persistence.savePlan)

function setup() {
  return renderHook(() =>
    usePlanVersions({ initialPlan: base, editKey: 'k'.repeat(64), isReadOnly: false })
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(persistence.getVersionHistory).mockResolvedValue([])
})

describe('sync status after a refused save', () => {
  it('shows "paused" when the database refused the edit key', async () => {
    savePlan.mockResolvedValueOnce({ status: 'error', error: 'edit_key_rejected' })
    const { result } = setup()
    await act(async () => {
      await result.current.commit(bigger, 'Scaled to 220')
    })
    expect(result.current.syncStatus).toBe('sync_paused')
    expect(result.current.currentVersionNumber).toBe(1) // nothing was recorded
  })

  it('keeps "Saved Locally" for other storage errors', async () => {
    savePlan.mockResolvedValueOnce({ status: 'error', error: 'QuotaExceededError' })
    const { result } = setup()
    await act(async () => {
      await result.current.commit(bigger, 'Scaled to 220')
    })
    expect(result.current.syncStatus).toBe('local_saved')
  })

  it('recovers on the next change once the database accepts the key again', async () => {
    savePlan
      .mockResolvedValueOnce({ status: 'error', error: 'edit_key_rejected' })
      .mockResolvedValueOnce({ status: 'saved_cloud', versionId: 'cloud-v2', versionNumber: 2 })
    const { result } = setup()
    await act(async () => {
      await result.current.commit(bigger, 'First try')
    })
    expect(result.current.syncStatus).toBe('sync_paused')

    await act(async () => {
      await result.current.commit(bigger, 'Second try')
    })
    expect(result.current.syncStatus).toBe('cloud_saved')
    expect(result.current.currentVersionNumber).toBe(2)
  })
})

describe('SyncStatusBadge: paused', () => {
  it('names the state in words, not only by colour', () => {
    render(React.createElement(SyncStatusBadge, { status: 'sync_paused' }))
    expect(screen.getByText('Sync paused')).toBeInTheDocument()
    expect(screen.queryByText('Saved Locally')).not.toBeInTheDocument()
  })
})
