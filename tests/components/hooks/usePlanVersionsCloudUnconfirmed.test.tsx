import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePlanVersions } from '@/components/workspace/hooks/usePlanVersions'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { rebalanceGuestCount } from '@/lib/engine/budget'
import { persistence } from '@/lib/storage/persistence'
import type { EventBrief } from '@/lib/engine/types'

vi.mock('@/lib/storage/persistence', () => ({
  persistence: { savePlan: vi.fn(), getVersionHistory: vi.fn() },
}))

const BRIEF: EventBrief = {
  title: 'Unconfirmed hook test',
  eventType: 'wedding',
  eventDate: '2027-09-09',
  city: 'Delhi',
  guestCount: 200,
  totalBudgetPaise: 200_000_000,
  protectedCategory: 'catering',
}
const base = instantiatePlanFromBrief(BRIEF)
const bigger = rebalanceGuestCount(base, 220)

function setup(cloudUnconfirmed?: boolean) {
  return renderHook(() =>
    usePlanVersions({
      initialPlan: base,
      editKey: 'k'.repeat(64),
      isReadOnly: false,
      cloudUnconfirmed,
    })
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(persistence.getVersionHistory).mockResolvedValue([])
})

describe('initial sync status', () => {
  it('starts at "sync_paused" when the cloud did not confirm the plan', () => {
    expect(setup(true).result.current.syncStatus).toBe('sync_paused')
  })

  it('moves to "cloud_saved" after the next successful save', async () => {
    vi.mocked(persistence.savePlan).mockResolvedValueOnce({
      status: 'saved_cloud',
      versionId: 'cloud-v2',
      versionNumber: 2,
    })
    const { result } = setup(true)
    await act(async () => {
      await result.current.commit(bigger, 'Scaled to 220')
    })
    expect(result.current.syncStatus).toBe('cloud_saved')
  })

  it('is unchanged when the flag is absent or false', () => {
    expect(setup().result.current.syncStatus).toBe('cloud_saved')
    expect(setup(false).result.current.syncStatus).toBe('cloud_saved')
  })
})
