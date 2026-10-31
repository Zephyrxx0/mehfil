import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { COMMIT_DEBOUNCE_MS, usePlanVersions } from '@/components/workspace/hooks/usePlanVersions'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { rebalanceGuestCount } from '@/lib/engine/budget'
import { computePlanDiff } from '@/lib/engine/diff'
import { persistence, type SavePlanResult } from '@/lib/storage/persistence'
import type { EventBrief } from '@/lib/engine/types'

vi.mock('@/lib/storage/persistence', () => ({
  persistence: { savePlan: vi.fn(), getVersionHistory: vi.fn() },
}))

const BRIEF: EventBrief = {
  title: 'Hook test',
  eventType: 'wedding',
  eventDate: '2027-09-09',
  city: 'Delhi',
  guestCount: 200,
  totalBudgetPaise: 200_000_000,
  protectedCategory: 'catering',
}
const base = instantiatePlanFromBrief(BRIEF)
const bigger = rebalanceGuestCount(base, 220)
const biggest = rebalanceGuestCount(base, 240)

const savePlan = vi.mocked(persistence.savePlan)
const saved = (n: number): SavePlanResult => ({
  status: 'saved_cloud',
  versionId: `cloud-v${n}`,
  versionNumber: n,
})

function setup(options: { isReadOnly?: boolean; editKey?: string } = {}) {
  return renderHook(() =>
    usePlanVersions({
      initialPlan: base,
      editKey: options.editKey ?? 'k'.repeat(64),
      isReadOnly: options.isReadOnly ?? false,
    })
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(persistence.getVersionHistory).mockResolvedValue([])
})
afterEach(() => {
  vi.useRealTimers()
})

describe('usePlanVersions: saving', () => {
  it('records the version storage answered with, not one invented in the browser', async () => {
    savePlan.mockResolvedValueOnce(saved(2))
    const { result } = setup()

    await act(async () => {
      await result.current.commit(bigger, 'Scaled to 220')
    })

    expect(result.current.currentVersionNumber).toBe(2)
    expect(result.current.versions[0]).toMatchObject({ id: 'cloud-v2', reason: 'Scaled to 220' })
    expect(result.current.syncStatus).toBe('cloud_saved')
  })

  it('runs saves one at a time and chains each parent to the previous answer', async () => {
    let releaseFirst!: (r: SavePlanResult) => void
    savePlan
      .mockImplementationOnce(() => new Promise((resolve) => (releaseFirst = resolve)))
      .mockResolvedValueOnce(saved(3))
    const { result } = setup()

    let second!: Promise<void>
    await act(async () => {
      void result.current.commit(bigger, 'first')
      second = result.current.commit(biggest, 'second')
    })
    // The second save has not started: it waits for the first to report its version.
    expect(savePlan).toHaveBeenCalledTimes(1)

    await act(async () => {
      releaseFirst(saved(2))
      await second
    })

    expect(savePlan).toHaveBeenCalledTimes(2)
    expect(savePlan.mock.calls[1][1]).toBe('cloud-v2') // parent = what the first save returned
    expect(result.current.currentVersionNumber).toBe(3)
  })

  it('does nothing when the plan is read-only', async () => {
    const { result } = setup({ isReadOnly: true })
    await act(async () => {
      await result.current.commit(bigger, 'ignored')
      result.current.scheduleCommit(bigger, base)
    })
    expect(savePlan).not.toHaveBeenCalled()
  })

  it('shows "Saved Locally" when storage fell back to this device', async () => {
    savePlan.mockResolvedValueOnce({
      status: 'saved_local',
      versionId: 'local-v2',
      versionNumber: 2,
    })
    const { result } = setup()
    await act(async () => {
      await result.current.commit(bigger, 'offline')
    })
    expect(result.current.syncStatus).toBe('local_saved')
  })

  it('leaves the badge honest when storage throws', async () => {
    savePlan.mockRejectedValueOnce(new Error('boom'))
    const { result } = setup()
    await act(async () => {
      await result.current.commit(bigger, 'fails')
    })
    expect(result.current.syncStatus).toBe('local_saved')
    expect(result.current.currentVersionNumber).toBe(1) // nothing was recorded
  })
})

describe('usePlanVersions: debounced edits', () => {
  it('turns a burst of edits into one save whose summary covers the whole burst', async () => {
    vi.useFakeTimers()
    savePlan.mockResolvedValue(saved(2))
    const { result } = setup()

    act(() => {
      result.current.scheduleCommit(bigger, base, 'guest_scale')
      vi.advanceTimersByTime(300)
      result.current.scheduleCommit(biggest, bigger, 'guest_scale')
    })
    expect(result.current.syncStatus).toBe('syncing')
    expect(savePlan).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(COMMIT_DEBOUNCE_MS)
    })

    expect(savePlan).toHaveBeenCalledTimes(1)
    expect(savePlan.mock.calls[0][0]).toBe(biggest)

    // The diff runs from the plan before the FIRST edit (200 guests), not only the last step.
    const wholeBurst = computePlanDiff({
      prevPlan: base,
      nextPlan: biggest,
      actionType: 'guest_scale',
    })
    const lastStepOnly = computePlanDiff({
      prevPlan: bigger,
      nextPlan: biggest,
      actionType: 'guest_scale',
    })
    expect(wholeBurst.summary).not.toBe(lastStepOnly.summary)
    expect(savePlan.mock.calls[0][2]).toBe(wholeBurst.summary)
  })

  it('saves a waiting edit when the workspace closes instead of dropping it', async () => {
    vi.useFakeTimers()
    savePlan.mockResolvedValue(saved(2))
    const { result, unmount } = setup()

    act(() => result.current.scheduleCommit(bigger, base, 'guest_scale'))
    expect(savePlan).not.toHaveBeenCalled()

    unmount()
    await vi.advanceTimersByTimeAsync(0) // the save starts on the next microtask
    expect(savePlan).toHaveBeenCalledTimes(1)
    expect(savePlan.mock.calls[0][0]).toBe(bigger)
  })

  it('saves a waiting edit when the page is hidden', async () => {
    vi.useFakeTimers()
    savePlan.mockResolvedValue(saved(2))
    const { result } = setup()

    act(() => result.current.scheduleCommit(bigger, base, 'guest_scale'))
    await act(async () => {
      window.dispatchEvent(new Event('pagehide'))
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(savePlan).toHaveBeenCalledTimes(1)
  })

  it('discardPending stops a waiting edit from landing after a restore', async () => {
    vi.useFakeTimers()
    const { result } = setup()
    act(() => result.current.scheduleCommit(bigger, base, 'guest_scale'))
    act(() => result.current.discardPending())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(COMMIT_DEBOUNCE_MS * 2)
    })
    expect(savePlan).not.toHaveBeenCalled()
  })
})

describe('usePlanVersions: another device saved first', () => {
  it('reports the conflict, keeps the draft unsaved, and lets the user take the newer plan', async () => {
    savePlan.mockResolvedValueOnce({
      status: 'conflict',
      versionId: 'cloud-v5',
      versionNumber: 5,
      conflictPlan: biggest,
    })
    const { result } = setup()

    await act(async () => {
      await result.current.commit(bigger, 'my draft')
    })
    expect(result.current.conflict?.plan).toBe(biggest)
    expect(result.current.syncStatus).toBe('local_saved')
    expect(result.current.currentVersionNumber).toBe(1)

    let accepted: unknown
    act(() => {
      accepted = result.current.acceptConflict()
    })
    expect(accepted).toBe(biggest)
    expect(result.current.conflict).toBeNull()
    expect(result.current.currentVersionNumber).toBe(5)

    // The next save builds on the other device's version, so it does not conflict again.
    savePlan.mockResolvedValueOnce(saved(6))
    await act(async () => {
      await result.current.commit(bigger, 'after refresh')
    })
    expect(savePlan.mock.calls[1][1]).toBe('cloud-v5')
  })

  it('"keep my draft" saves on top without a parent check', async () => {
    savePlan.mockResolvedValueOnce(saved(6))
    const { result } = setup()
    await act(async () => {
      await result.current.commit(bigger, 'force', { ignoreConflicts: true })
    })
    expect(savePlan.mock.calls[0][1]).toBeUndefined()
  })
})

describe('usePlanVersions: history', () => {
  it('replaces the placeholder with the stored history and starts from its newest version', async () => {
    vi.mocked(persistence.getVersionHistory).mockResolvedValue([
      {
        id: 'cloud-v4',
        eventId: base.id,
        versionNumber: 4,
        reason: 'newest',
        createdAt: '',
        snapshot: base,
      },
      {
        id: 'cloud-v3',
        eventId: base.id,
        versionNumber: 3,
        reason: 'older',
        createdAt: '',
        snapshot: base,
      },
    ])
    const { result } = setup()

    await waitFor(() => expect(result.current.currentVersionNumber).toBe(4))
    expect(result.current.versions).toHaveLength(2)

    savePlan.mockResolvedValueOnce(saved(5))
    await act(async () => {
      await result.current.commit(bigger, 'next')
    })
    expect(savePlan.mock.calls[0][1]).toBe('cloud-v4')
  })

  it('finds the snapshot of a version by number', async () => {
    const { result } = setup()
    expect(result.current.snapshotOf(1)).toBe(base)
    expect(result.current.snapshotOf(9)).toBeUndefined()
  })
})
