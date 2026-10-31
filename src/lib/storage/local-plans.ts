import type { Plan, PlanVersionRecord } from '@/lib/engine/types'
import { createId } from '@/lib/id'

const PLAN_PREFIX = 'mehfil_plan_'
const VERSIONS_PREFIX = 'mehfil_versions_'
const OWNER_PREFIX = 'mehfil_owner_'

export type LocalSaveOutcome =
  | { status: 'saved'; versionId: string; versionNumber: number }
  | { status: 'conflict'; versionNumber: number; conflictPlan: Plan }

function storage(): Storage | null {
  return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null
}

function readJson<T>(key: string): T | null {
  const raw = storage()?.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/** Plans and version history kept in this browser. Works with no network and no account. */
export const localPlans = {
  isAvailable(): boolean {
    return storage() !== null
  },

  readPlan(planId: string): Plan | null {
    return readJson<Plan>(PLAN_PREFIX + planId)
  },

  writePlan(plan: Plan): void {
    storage()?.setItem(PLAN_PREFIX + plan.id, JSON.stringify(plan))
  },

  readHistory(planId: string): PlanVersionRecord[] {
    return readJson<PlanVersionRecord[]>(VERSIONS_PREFIX + planId) ?? []
  },

  /** Marks a plan this browser created, so it opens editable without an edit key. */
  markOwner(planId: string): void {
    storage()?.setItem(OWNER_PREFIX + planId, '1')
  },

  isOwner(planId: string): boolean {
    return Boolean(storage()?.getItem(OWNER_PREFIX + planId))
  },

  /** Appends a version, or reports a conflict when `parentVersionId` is not the latest. */
  saveVersion(plan: Plan, parentVersionId: string | undefined, reason: string): LocalSaveOutcome {
    const history = localPlans.readHistory(plan.id)
    const latest = history[0]

    if (latest && parentVersionId && latest.id !== parentVersionId) {
      return {
        status: 'conflict',
        versionNumber: latest.versionNumber,
        conflictPlan: latest.snapshot,
      }
    }

    const record: PlanVersionRecord = {
      id: createId('local-v'),
      eventId: plan.id,
      versionNumber: (latest?.versionNumber ?? 0) + 1,
      parentVersionId: parentVersionId ?? null,
      reason,
      createdAt: new Date().toISOString(),
      snapshot: plan,
    }
    localPlans.writePlan(plan)
    storage()?.setItem(VERSIONS_PREFIX + plan.id, JSON.stringify([record, ...history]))
    return { status: 'saved', versionId: record.id, versionNumber: record.versionNumber }
  },
}
