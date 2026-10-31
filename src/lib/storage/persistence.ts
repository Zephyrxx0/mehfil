import type { Plan, PlanVersionRecord } from '@/lib/engine/types'
import { createLogger } from '@/lib/logger'
import { getRpcClient } from '@/lib/supabase/client'
import { capabilityStore } from './capability-store'
import { CREATION_BREAKER_CODE, CloudError, CloudPlans, isCloudPlanId, isUuid } from './cloud-plans'
import { localPlans } from './local-plans'

const logger = createLogger('persistence')

export interface SavePlanResult {
  status: 'saved_cloud' | 'saved_local' | 'conflict' | 'error'
  /** For a save: the new version. For a conflict: the newest version that won. */
  versionNumber?: number
  versionId?: string
  conflictPlan?: Plan
  error?: string
}

/** What `getPlan` answers with. */
export interface LoadedPlan {
  plan: Plan
  isReadOnly: boolean
  /**
   * Present (true) only when a cloud key was held but the cloud did not return the plan, so the
   * copy shown comes from this device and may be ahead of the cloud. Absent otherwise.
   */
  cloudUnconfirmed?: true
}

export interface PersistenceAdapter {
  savePlan(
    plan: Plan,
    parentVersionId?: string,
    diffSummary?: string,
    editKey?: string
  ): Promise<SavePlanResult>
  getPlan(planId: string, editKey?: string): Promise<LoadedPlan | null>
  getVersionHistory(planId: string): Promise<PlanVersionRecord[]>
  restoreVersion(planId: string, targetVersion: number, editKey?: string): Promise<SavePlanResult>
  regenerateShareKey(planId: string, editKey?: string): Promise<{ shareToken: string } | null>
}

/** Supplies the cloud client on demand. Returns null in local-only mode. */
export type CloudProvider = () => CloudPlans | null

function defaultCloudProvider(): CloudPlans | null {
  const client = getRpcClient()
  return client ? new CloudPlans(client) : null
}

/**
 * Saves to Postgres when the browser holds a verified edit key, and to this browser otherwise.
 * A failed network call never loses work: it falls back to local storage.
 */
export class HybridPersistenceAdapter implements PersistenceAdapter {
  constructor(private readonly cloudProvider: CloudProvider = defaultCloudProvider) {}

  /** Creates a plan, in the cloud when possible. Returns the plan under its final id. */
  async createPlan(plan: Plan, reason = 'Initial plan created from archetype'): Promise<Plan> {
    const cloud = this.cloudProvider()
    if (cloud) {
      try {
        const created = await cloud.createEvent(plan, reason)
        const stored: Plan = { ...plan, id: created.eventId }
        capabilityStore.setEditKey(created.eventId, created.editKey)
        capabilityStore.setShareToken(created.eventId, created.shareKey)
        localPlans.writePlan(stored)
        localPlans.markOwner(created.eventId)
        return stored
      } catch (err) {
        if (err instanceof CloudError && err.code === CREATION_BREAKER_CODE) {
          // Not a fault: the database is protecting itself from a burst of new plans.
          logger.info('plan creation is throttled, keeping the plan on this device for now')
        } else {
          logger.warn('cloud create failed, keeping the plan on this device', { err })
        }
      }
    }

    await this.savePlan(plan, undefined, reason)
    localPlans.markOwner(plan.id)
    return plan
  }

  async savePlan(
    plan: Plan,
    parentVersionId?: string,
    diffSummary = 'Adjusted plan allocations',
    editKey?: string
  ): Promise<SavePlanResult> {
    const cloud = this.cloudProvider()
    const key = editKey ?? capabilityStore.getEditKey(plan.id)

    if (cloud && key && isCloudPlanId(plan.id)) {
      try {
        const outcome = await cloud.savePlanVersion({
          eventId: plan.id,
          editKey: key,
          // A local version id (from an offline stretch) is not a cloud version.
          parentVersionId: parentVersionId && isUuid(parentVersionId) ? parentVersionId : null,
          plan,
          reason: diffSummary,
          isFloorProtected: Boolean(plan.brief.protectedCategory),
        })

        if (outcome.status === 'saved') {
          localPlans.writePlan(plan) // offline copy of the latest state
          return {
            status: 'saved_cloud',
            versionNumber: outcome.versionNumber,
            versionId: outcome.versionId,
          }
        }
        if (outcome.status === 'conflict') {
          return {
            status: 'conflict',
            versionNumber: outcome.versionNumber,
            versionId: outcome.versionId,
            conflictPlan: outcome.conflictPlan,
          }
        }
        // The database refused the key. That is also what a plan under the failed-key limit
        // answers to a correct key, so keep the work on this device instead of dropping it.
        // No version is recorded: the cloud history must not diverge from the local one.
        try {
          localPlans.writePlan(plan)
        } catch (err) {
          logger.warn('could not keep the rejected edit on this device', { err })
        }
        return { status: 'error', error: 'edit_key_rejected' }
      } catch (err) {
        logger.warn('cloud save failed, saving on this device instead', { err })
      }
    }

    return this.saveLocally(plan, parentVersionId, diffSummary)
  }

  private saveLocally(plan: Plan, parentVersionId: string | undefined, reason: string) {
    if (!localPlans.isAvailable()) return { status: 'saved_local' as const }
    try {
      const outcome = localPlans.saveVersion(plan, parentVersionId, reason)
      if (outcome.status === 'conflict') {
        return {
          status: 'conflict' as const,
          versionNumber: outcome.versionNumber,
          versionId: outcome.versionId,
          conflictPlan: outcome.conflictPlan,
        }
      }
      return {
        status: 'saved_local' as const,
        versionNumber: outcome.versionNumber,
        versionId: outcome.versionId,
      }
    } catch (err) {
      return { status: 'error' as const, error: String(err) }
    }
  }

  async getPlan(planId: string, editKey?: string): Promise<LoadedPlan | null> {
    const cloud = this.cloudProvider()
    const key = editKey ?? capabilityStore.getEditKey(planId)
    let cloudUnconfirmed = false

    if (cloud && key && isCloudPlanId(planId)) {
      try {
        const found = await cloud.getEditablePlan(planId, key)
        if (found) {
          localPlans.writePlan(found.plan)
          capabilityStore.setEditKey(planId, key)
          return { plan: found.plan, isReadOnly: false }
        }
        // The server rejected the key: forget it so the UI offers the unlock dialog. Not on the
        // browser that created the plan: it holds the real key, and a refusal there means the plan
        // is under the failed-key limit (anyone who knows the plan id can trigger it). Keeping the
        // key lets editing resume as soon as the limit lapses.
        if (!localPlans.isOwner(planId)) capabilityStore.clearEditKey(planId)
        cloudUnconfirmed = true
      } catch (err) {
        logger.warn('cloud read failed, using the copy on this device', { err })
        cloudUnconfirmed = true
      }
    }

    const local = localPlans.readPlan(planId)
    if (!local) return null
    // A cloud plan is editable only if the server accepted the key (above) or this browser
    // created it. A local-only plan has no server to ask, so a supplied key is accepted.
    const canEdit = localPlans.isOwner(planId) || (Boolean(editKey) && !isCloudPlanId(planId))
    return cloudUnconfirmed
      ? { plan: local, isReadOnly: !canEdit, cloudUnconfirmed: true }
      : { plan: local, isReadOnly: !canEdit }
  }

  async getVersionHistory(planId: string): Promise<PlanVersionRecord[]> {
    const cloud = this.cloudProvider()
    const key = capabilityStore.getEditKey(planId)

    if (cloud && key && isCloudPlanId(planId)) {
      try {
        const history = await cloud.listVersions(planId, key)
        if (history.length > 0) return history
      } catch (err) {
        logger.warn('cloud history failed, using the copy on this device', { err })
      }
    }
    return localPlans.readHistory(planId)
  }

  async restoreVersion(
    planId: string,
    targetVersion: number,
    editKey?: string
  ): Promise<SavePlanResult> {
    const history = await this.getVersionHistory(planId)
    const target = history.find((v) => v.versionNumber === targetVersion)
    if (!target?.snapshot) {
      return { status: 'error', error: `Version ${targetVersion} not found` }
    }

    // Forward restore creates v(N+1) matching the snapshot of v(k) (D-10).
    return this.savePlan(
      target.snapshot,
      history[0]?.id,
      `Reverted to v${targetVersion} (${target.reason})`,
      editKey
    )
  }

  /**
   * Replaces the family link. Returns null unless the database accepted it: a token that was
   * never stored would produce a link that opens nothing (S2).
   */
  async regenerateShareKey(
    planId: string,
    editKey?: string
  ): Promise<{ shareToken: string } | null> {
    const cloud = this.cloudProvider()
    const key = editKey ?? capabilityStore.getEditKey(planId)
    if (!cloud || !key || !isCloudPlanId(planId)) return null

    try {
      const shareToken = await cloud.regenerateShareKey(planId, key)
      if (!shareToken) return null
      capabilityStore.setShareToken(planId, shareToken)
      return { shareToken }
    } catch (err) {
      logger.warn('could not replace the family link', { err })
      return null
    }
  }
}

export const persistence = new HybridPersistenceAdapter()

/** Creates a fresh plan, in the cloud when configured, and returns it under its final id. */
export function saveNewPlan(plan: Plan): Promise<Plan> {
  return persistence.createPlan(plan)
}
