// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { HybridPersistenceAdapter } from '@/lib/storage/persistence'
import { CloudPlans } from '@/lib/storage/cloud-plans'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { rebalanceGuestCount } from '@/lib/engine/budget'
import type { EventBrief, Plan } from '@/lib/engine/types'
import { createMigratedDatabase, createPgliteRpcClient } from '../helpers/pglite'

// A tiny in-memory localStorage, so one test can play two devices.
class MemoryStorage {
  private data = new Map<string, string>()
  getItem = (k: string) => this.data.get(k) ?? null
  setItem = (k: string, v: string) => void this.data.set(k, v)
  removeItem = (k: string) => void this.data.delete(k)
  clear = () => this.data.clear()
  snapshot = () => new Map(this.data)
  restore = (m: Map<string, string>) => (this.data = new Map(m))
}
const device = new MemoryStorage()

const BRIEF: EventBrief = {
  title: 'Meera & Kabir Wedding',
  eventType: 'wedding',
  eventDate: '2027-12-05',
  city: 'Jaipur',
  guestCount: 200,
  totalBudgetPaise: 200_000_000,
  protectedCategory: 'catering',
}

let db: PGlite
let adapter: HybridPersistenceAdapter
beforeAll(async () => {
  db = await createMigratedDatabase()
  // Stubbed only after the database exists: PGlite changes behaviour when it sees a `window`.
  vi.stubGlobal('window', { localStorage: device })
}, 60_000)
afterAll(async () => {
  vi.unstubAllGlobals()
  await db.close()
})
beforeEach(() => {
  device.clear()
  adapter = new HybridPersistenceAdapter(() => new CloudPlans(createPgliteRpcClient(db)))
})

async function createdPlan(): Promise<Plan> {
  return adapter.createPlan(instantiatePlanFromBrief(BRIEF))
}

describe('creating a plan (S1)', () => {
  it('gives the plan the database id and keeps both tokens on this device', async () => {
    const plan = await createdPlan()
    expect(plan.id).toMatch(/^[0-9a-f-]{36}$/)

    const keys = [...device.snapshot().keys()]
    expect(keys).toContain(`mehfil_editkey_${plan.id}`)
    expect(keys).toContain(`mehfil_sharekey_${plan.id}`)
    expect(keys).toContain(`mehfil_owner_${plan.id}`)
  })

  it('reopens editable from the cloud on the same device', async () => {
    const plan = await createdPlan()
    const opened = await adapter.getPlan(plan.id)
    expect(opened?.isReadOnly).toBe(false)
    expect(opened?.plan.brief.title).toBe(BRIEF.title)
    expect(opened?.plan.lines).toHaveLength(plan.lines.length)
  })
})

describe('a second device opening the edit link', () => {
  it('loads the full plan from the cloud using only the edit key', async () => {
    const plan = await createdPlan()
    const editKey = device.getItem(`mehfil_editkey_${plan.id}`)!

    device.clear() // a different phone: nothing stored locally
    const opened = await adapter.getPlan(plan.id, editKey)

    expect(opened?.isReadOnly).toBe(false)
    expect(opened?.plan.id).toBe(plan.id)
    expect(opened?.plan.totalBudgetPaise).toBe(BRIEF.totalBudgetPaise)
    // The key was confirmed by the database, so the device keeps it for later saves.
    expect(device.getItem(`mehfil_editkey_${plan.id}`)).toBe(editKey)
  })

  it('is refused with a wrong key, and the bad key is not remembered', async () => {
    const plan = await createdPlan()
    device.clear()
    const opened = await adapter.getPlan(plan.id, 'f'.repeat(64))

    expect(opened).toBeNull()
    expect(device.getItem(`mehfil_editkey_${plan.id}`)).toBeNull()
  })

  it('cannot edit a cloud plan by faking ownership or by supplying an unverified key', async () => {
    const plan = await createdPlan()
    // Keep the cached copy but give this device a wrong key.
    device.setItem(`mehfil_editkey_${plan.id}`, 'f'.repeat(64))
    device.removeItem(`mehfil_owner_${plan.id}`)

    const opened = await adapter.getPlan(plan.id, 'e'.repeat(64))
    expect(opened?.isReadOnly).toBe(true)
  })
})

describe('saving and history in the cloud', () => {
  it('saves new versions to Postgres and lists them newest first', async () => {
    const plan = await createdPlan()
    const first = (await adapter.getVersionHistory(plan.id))[0]

    const scaled = rebalanceGuestCount(plan, 250)
    const saved = await adapter.savePlan(scaled, first.id, 'Scaled to 250')
    expect(saved).toMatchObject({ status: 'saved_cloud', versionNumber: 2 })

    const history = await adapter.getVersionHistory(plan.id)
    expect(history.map((v) => v.versionNumber)).toEqual([2, 1])
    expect(history[0].reason).toBe('Scaled to 250')
    expect(history[0].snapshot.brief.guestCount).toBe(250)
  })

  it('keeps the full plan, including fields beyond the budget lines', async () => {
    const plan = await createdPlan()
    const editKey = device.getItem(`mehfil_editkey_${plan.id}`)!
    const first = (await adapter.getVersionHistory(plan.id))[0]
    const withExtras: Plan = {
      ...plan,
      adoptedIdeas: [],
      customNote: 'kept as-is',
    } as Plan & { customNote: string }
    await adapter.savePlan(withExtras, first.id, 'Added extras')

    device.clear() // a second device
    const reopened = await adapter.getPlan(plan.id, editKey)
    expect((reopened?.plan as Plan & { customNote?: string }).customNote).toBe('kept as-is')
  })

  it('detects two devices editing from the same version and keeps the first save', async () => {
    const plan = await createdPlan()
    const editKey = device.getItem(`mehfil_editkey_${plan.id}`)!
    const v1 = (await adapter.getVersionHistory(plan.id))[0]

    const deviceA = await adapter.savePlan(rebalanceGuestCount(plan, 220), v1.id, 'A: 220 guests')
    expect(deviceA.status).toBe('saved_cloud')

    // Device B still believes v1 is the latest.
    const deviceB = await adapter.savePlan(
      rebalanceGuestCount(plan, 999),
      v1.id,
      'B: 999 guests',
      editKey
    )
    expect(deviceB.status).toBe('conflict')
    expect(deviceB.versionNumber).toBe(2)
    expect(deviceB.conflictPlan?.brief.guestCount).toBe(220)
    expect(await adapter.getVersionHistory(plan.id)).toHaveLength(2)
  })

  it('restores an older version forward, never rewriting history', async () => {
    const plan = await createdPlan()
    const v1 = (await adapter.getVersionHistory(plan.id))[0]
    await adapter.savePlan(rebalanceGuestCount(plan, 300), v1.id, 'Bigger')

    const restored = await adapter.restoreVersion(plan.id, 1)
    expect(restored).toMatchObject({ status: 'saved_cloud', versionNumber: 3 })
    const history = await adapter.getVersionHistory(plan.id)
    expect(history[0].reason).toContain('Reverted to v1')
    expect(history[0].snapshot.brief.guestCount).toBe(BRIEF.guestCount)
  })

  it('reports an error, not a silent local save, when the server rejects the key', async () => {
    const plan = await createdPlan()
    const v1 = (await adapter.getVersionHistory(plan.id))[0]
    const result = await adapter.savePlan(plan, v1.id, 'Imposter', 'f'.repeat(64))
    expect(result).toMatchObject({ status: 'error', error: 'edit_key_rejected' })
  })
})

describe('family link management (S2)', () => {
  it('replaces the link, stores the new token, and the old one stops opening the plan', async () => {
    const plan = await createdPlan()
    const oldToken = device.getItem(`mehfil_sharekey_${plan.id}`)!

    const regenerated = await adapter.regenerateShareKey(plan.id)
    expect(regenerated?.shareToken).toMatch(/^[0-9a-f]{64}$/)
    expect(regenerated?.shareToken).not.toBe(oldToken)
    expect(device.getItem(`mehfil_sharekey_${plan.id}`)).toBe(regenerated!.shareToken)

    const cloud = new CloudPlans(createPgliteRpcClient(db))
    expect(await cloud.getSharedPlan(oldToken)).toBeNull()
    expect(await cloud.getSharedPlan(regenerated!.shareToken)).not.toBeNull()
  })

  it('returns null instead of a fake token when the key is wrong', async () => {
    const plan = await createdPlan()
    expect(await adapter.regenerateShareKey(plan.id, 'f'.repeat(64))).toBeNull()
  })

  it('returns null in local-only mode: a token that was never stored opens nothing', async () => {
    const localOnly = new HybridPersistenceAdapter(() => null)
    expect(await localOnly.regenerateShareKey('wedding-local-1', 'k'.repeat(64))).toBeNull()
  })
})

describe('offline resilience', () => {
  it('keeps the user’s work on this device when the cloud call fails', async () => {
    const plan = await createdPlan()
    const v1 = (await adapter.getVersionHistory(plan.id))[0]

    const broken = new HybridPersistenceAdapter(() => {
      const failing = {
        rpc: async () => ({ data: null, error: { message: 'network down' } }),
      } as never
      return new CloudPlans(failing)
    })
    const result = await broken.savePlan(rebalanceGuestCount(plan, 260), v1.id, 'Offline edit')
    expect(result.status).toBe('saved_local')

    const reopened = await broken.getPlan(plan.id)
    expect(reopened?.plan.brief.guestCount).toBe(260)
    expect(reopened?.isReadOnly).toBe(false)
  })

  it('creates a local-only plan when the cloud is unreachable', async () => {
    const broken = new HybridPersistenceAdapter(
      () =>
        new CloudPlans({
          rpc: async () => ({ data: null, error: { message: 'offline' } }),
        } as never)
    )
    const plan = await broken.createPlan(instantiatePlanFromBrief(BRIEF))
    expect(plan.id).not.toMatch(/^[0-9a-f-]{36}$/) // not a cloud id
    expect((await broken.getPlan(plan.id))?.isReadOnly).toBe(false)
  })
})
