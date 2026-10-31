import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HybridPersistenceAdapter } from '@/lib/storage/persistence'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { rebalanceGuestCount } from '@/lib/engine/budget'
import type { EventBrief } from '@/lib/engine/types'

describe('Plan Versioning & Optimistic Concurrency Engine (COLLAB-04, D-10, D-15)', () => {
  const brief: EventBrief = {
    title: 'Meera & Kabir Wedding',
    eventType: 'wedding',
    eventDate: '2027-12-05',
    city: 'Jaipur',
    guestCount: 200,
    totalBudgetPaise: 200_000_000, // ₹20,00,000
    protectedCategory: 'catering',
  }

  const basePlan = instantiatePlanFromBrief(brief)

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('guarantees append-only immutable version numbering (v1, v2, v3)', async () => {
    const adapter = new HybridPersistenceAdapter()

    // Save initial version v1
    const res1 = await adapter.savePlan(basePlan, undefined, 'Initial plan creation')
    expect(res1.status).toBe('saved_local')
    expect(res1.versionNumber).toBe(1)
    expect(res1.versionId).toBeDefined()

    // Scale guests and save v2 with parent pointer to v1
    const planV2 = rebalanceGuestCount(basePlan, 250)
    const res2 = await adapter.savePlan(
      planV2,
      res1.versionId,
      'Scaled guest count to 250 (+50 guests)'
    )
    expect(res2.status).toBe('saved_local')
    expect(res2.versionNumber).toBe(2)

    // Scale guests again and save v3 with parent pointer to v2
    const planV3 = rebalanceGuestCount(planV2, 300)
    const res3 = await adapter.savePlan(
      planV3,
      res2.versionId,
      'Scaled guest count to 300 (+50 guests)'
    )
    expect(res3.status).toBe('saved_local')
    expect(res3.versionNumber).toBe(3)

    // Verify version history contains all 3 versions reverse-chronologically
    const history = await adapter.getVersionHistory(basePlan.id)
    expect(history.length).toBe(3)
    expect(history[0].versionNumber).toBe(3)
    expect(history[1].versionNumber).toBe(2)
    expect(history[2].versionNumber).toBe(1)

    // Verify parent pointer lineage
    expect(history[0].parentVersionId).toBe(res2.versionId)
    expect(history[1].parentVersionId).toBe(res1.versionId)
    expect(history[2].parentVersionId).toBeNull()
  })

  it('detects optimistic concurrency conflicts when parentVersionId is stale (D-15)', async () => {
    const adapter = new HybridPersistenceAdapter()

    // Client A creates v1
    const res1 = await adapter.savePlan(basePlan, undefined, 'Initial plan creation')
    expect(res1.versionNumber).toBe(1)

    // Client B scales to 220 and saves v2
    const planB = rebalanceGuestCount(basePlan, 220)
    const resB = await adapter.savePlan(planB, res1.versionId, 'Client B updated to 220')
    expect(resB.versionNumber).toBe(2)

    // Client A (still holding stale v1 as parentVersionId) tries to save draft with 280 guests
    const planA = rebalanceGuestCount(basePlan, 280)
    const resA = await adapter.savePlan(planA, res1.versionId, 'Client A stale update')

    // Must return conflict status
    expect(resA.status).toBe('conflict')
    expect(resA.versionNumber).toBe(2)
    expect(resA.conflictPlan).toBeDefined()
  })

  it('performs forward restore by creating v(N+1) without deleting history (COLLAB-04, D-10)', async () => {
    const adapter = new HybridPersistenceAdapter()

    // Create v1
    const res1 = await adapter.savePlan(basePlan, undefined, 'Initial plan')
    // Create v2
    const planV2 = rebalanceGuestCount(basePlan, 250)
    const res2 = await adapter.savePlan(planV2, res1.versionId, 'Scaled to 250')
    // Create v3
    const planV3 = rebalanceGuestCount(planV2, 350)
    await adapter.savePlan(planV3, res2.versionId, 'Scaled to 350')

    // Forward restore to v1: creates v4 with allocations matching v1
    const restoreResult = await adapter.restoreVersion(basePlan.id, 1)
    expect(restoreResult.status).toBe('saved_local')
    expect(restoreResult.versionNumber).toBe(4)

    // Verify full version stack has 4 items
    const history = await adapter.getVersionHistory(basePlan.id)
    expect(history.length).toBe(4)
    expect(history[0].versionNumber).toBe(4)
    expect(history[0].reason).toContain('Reverted to v1')

    // Verify restored allocations in v4 match v1 lines exactly
    const v1Lines = history[3].snapshot.lines
    const v4Lines = history[0].snapshot.lines
    for (let i = 0; i < v1Lines.length; i++) {
      expect(v4Lines[i].currentPaise).toBe(v1Lines[i].currentPaise)
    }

    // Verify intermediate versions v2 and v3 were not deleted
    expect(history.some((v) => v.versionNumber === 2)).toBe(true)
    expect(history.some((v) => v.versionNumber === 3)).toBe(true)
  })
})
