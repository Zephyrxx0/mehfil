// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { HybridPersistenceAdapter } from '@/lib/storage/persistence'
import { CloudPlans } from '@/lib/storage/cloud-plans'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { rebalanceGuestCount } from '@/lib/engine/budget'
import type { EventBrief, Plan } from '@/lib/engine/types'
import { createMigratedDatabase, createPgliteRpcClient } from '../helpers/pglite'

/**
 * After a reload during a failed-key lockout, the page shows the device copy. getPlan must say
 * the cloud did not confirm it, so the sync badge does not claim "Saved to Cloud".
 */

class MemoryStorage {
  private data = new Map<string, string>()
  getItem = (k: string) => this.data.get(k) ?? null
  setItem = (k: string, v: string) => void this.data.set(k, v)
  removeItem = (k: string) => void this.data.delete(k)
  clear = () => this.data.clear()
}
const device = new MemoryStorage()

const BRIEF: EventBrief = {
  title: 'Unconfirmed cloud test',
  eventType: 'wedding',
  eventDate: '2027-12-05',
  city: 'Jaipur',
  guestCount: 200,
  totalBudgetPaise: 200_000_000,
  protectedCategory: 'catering',
}
const WRONG_KEY = 'f'.repeat(64)

let db: PGlite
let adapter: HybridPersistenceAdapter
let cloud: CloudPlans
beforeAll(async () => {
  db = await createMigratedDatabase()
  vi.stubGlobal('window', { localStorage: device })
}, 60_000)
afterAll(async () => {
  vi.unstubAllGlobals()
  await db.close()
})
beforeEach(() => {
  device.clear()
  cloud = new CloudPlans(createPgliteRpcClient(db))
  adapter = new HybridPersistenceAdapter(() => cloud)
})

async function lockOut(planId: string) {
  for (let i = 0; i < 20; i++) expect(await cloud.verifyEditKey(planId, WRONG_KEY)).toBe(false)
}

describe('getPlan during a lockout', () => {
  it('returns the device copy, editable for the owner, flagged as cloud-unconfirmed', async () => {
    const plan = await adapter.createPlan(instantiatePlanFromBrief(BRIEF))
    const head = (await adapter.getVersionHistory(plan.id))[0]
    await lockOut(plan.id)
    // The latest edit is refused by the cloud and kept only on this device.
    await adapter.savePlan(rebalanceGuestCount(plan, 260), head.id, 'Scaled to 260')

    const opened = await adapter.getPlan(plan.id)

    expect(opened?.isReadOnly).toBe(false)
    expect(opened?.cloudUnconfirmed).toBe(true)
    expect((opened?.plan as Plan).brief.guestCount).toBe(260)
  })

  it('flags the copy as unconfirmed when the cloud read throws', async () => {
    const plan = await adapter.createPlan(instantiatePlanFromBrief(BRIEF))
    vi.spyOn(cloud, 'getEditablePlan').mockRejectedValueOnce(new Error('offline'))

    const opened = await adapter.getPlan(plan.id)

    expect(opened).toMatchObject({ isReadOnly: false, cloudUnconfirmed: true })
  })
})

describe('getPlan when the cloud confirms the plan', () => {
  it('has no cloudUnconfirmed key at all', async () => {
    const plan = await adapter.createPlan(instantiatePlanFromBrief(BRIEF))

    const opened = await adapter.getPlan(plan.id)

    expect(opened).not.toBeNull()
    expect(opened).not.toHaveProperty('cloudUnconfirmed')
    expect(opened?.isReadOnly).toBe(false)
  })
})

describe('getPlan without a cloud', () => {
  it('has no cloudUnconfirmed key in local-only mode', async () => {
    const local = new HybridPersistenceAdapter(() => null)
    const plan = await local.createPlan(instantiatePlanFromBrief(BRIEF))

    const opened = await local.getPlan(plan.id)

    expect(opened).not.toBeNull()
    expect(opened).not.toHaveProperty('cloudUnconfirmed')
  })
})
