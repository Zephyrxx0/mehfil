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
 * A plan that has seen 20 wrong edit keys refuses every key for 10 minutes, the right one
 * included (migration 20261031140000). Anyone who knows the plan id can cause that, so the
 * organizer's browser must not lose work or its key while it lasts.
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
  title: 'Lockout test wedding',
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

async function createdPlan(): Promise<Plan> {
  return adapter.createPlan(instantiatePlanFromBrief(BRIEF))
}

/** What a stranger does: 20 wrong keys against a known plan id. */
async function lockOut(planId: string) {
  for (let i = 0; i < 20; i++) expect(await cloud.verifyEditKey(planId, WRONG_KEY)).toBe(false)
}

describe('while the plan is locked out', () => {
  it('refuses the organizer’s correct key, but keeps the latest edit on this device', async () => {
    const plan = await createdPlan()
    const head = (await adapter.getVersionHistory(plan.id))[0]
    await lockOut(plan.id)

    const bigger = rebalanceGuestCount(plan, 260)
    const result = await adapter.savePlan(bigger, head.id, 'Scaled to 260')

    expect(result).toMatchObject({ status: 'error', error: 'edit_key_rejected' })
    const stored = JSON.parse(device.getItem(`mehfil_plan_${plan.id}`)!) as Plan
    expect(stored.brief.guestCount).toBe(260)
  })

  it('does not invent a version for the refused edit', async () => {
    const plan = await createdPlan()
    const head = (await adapter.getVersionHistory(plan.id))[0]
    await lockOut(plan.id)

    await adapter.savePlan(rebalanceGuestCount(plan, 260), head.id, 'Refused')

    // History needs the key too, so read it once the lockout has lapsed.
    await db.query(
      `UPDATE public.edit_key_failures SET failed_at = failed_at - interval '11 minutes'`
    )
    expect(await adapter.getVersionHistory(plan.id)).toHaveLength(1)
  })

  it('keeps the edit key on the browser that created the plan, and reopens it editable', async () => {
    const plan = await createdPlan()
    await lockOut(plan.id)

    const opened = await adapter.getPlan(plan.id)

    expect(device.getItem(`mehfil_editkey_${plan.id}`)).not.toBeNull()
    expect(opened?.isReadOnly).toBe(false)
    expect(opened?.plan.id).toBe(plan.id)
  })

  it('still forgets a key on a device that did not create the plan', async () => {
    const plan = await createdPlan()
    const editKey = device.getItem(`mehfil_editkey_${plan.id}`)!
    await lockOut(plan.id)
    device.clear() // a second phone that only has the pasted edit link

    const opened = await adapter.getPlan(plan.id, editKey)

    expect(opened).toBeNull()
    expect(device.getItem(`mehfil_editkey_${plan.id}`)).toBeNull()
  })
})

describe('after the lockout lapses', () => {
  it('saves to the cloud again with the key that was kept', async () => {
    const plan = await createdPlan()
    const head = (await adapter.getVersionHistory(plan.id))[0]
    await lockOut(plan.id)
    expect(await adapter.savePlan(plan, head.id, 'Refused')).toMatchObject({ status: 'error' })

    await db.query(
      `UPDATE public.edit_key_failures SET failed_at = failed_at - interval '11 minutes'`
    )

    const retry = await adapter.savePlan(rebalanceGuestCount(plan, 240), head.id, 'Scaled to 240')
    expect(retry).toMatchObject({ status: 'saved_cloud', versionNumber: 2 })
  })
})
