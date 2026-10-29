import type { Plan, PlanVersionRecord } from '@/lib/engine/types'
import { getClientSupabase } from '@/lib/supabase/client'
import { generateCapabilityToken, hashCapabilityToken } from '@/lib/engine/crypto'

export interface SavePlanResult {
  status: 'saved_cloud' | 'saved_local' | 'conflict' | 'error'
  versionNumber?: number
  versionId?: string
  conflictPlan?: Plan
  error?: string
}

export interface PersistenceAdapter {
  savePlan(
    plan: Plan,
    parentVersionId?: string,
    diffSummary?: string,
    editKey?: string
  ): Promise<SavePlanResult>
  getPlan(planId: string, editKey?: string): Promise<{ plan: Plan; isReadOnly: boolean } | null>
  getVersionHistory(planId: string): Promise<PlanVersionRecord[]>
  restoreVersion(planId: string, targetVersion: number, editKey?: string): Promise<SavePlanResult>
  regenerateShareKey(planId: string, editKey?: string): Promise<{ shareToken: string } | null>
}

const LOCAL_STORAGE_PREFIX = 'mehfil_plan_'
const LOCAL_VERSIONS_PREFIX = 'mehfil_versions_'
/** Marks a plan this browser created, so it opens editable without an edit key. */
export const LOCAL_OWNER_PREFIX = 'mehfil_owner_'

export class HybridPersistenceAdapter implements PersistenceAdapter {
  async savePlan(
    plan: Plan,
    parentVersionId?: string,
    diffSummary = 'Adjusted plan allocations',
    editKey?: string
  ): Promise<SavePlanResult> {
    const supabase = getClientSupabase()

    // 1. Try Supabase cloud save if available
    if (supabase && editKey) {
      try {
        const editKeyHash = await hashCapabilityToken(editKey)

        // Check event exists and capability matches
        const { data: event, error: eventErr } = await supabase
          .from('events')
          .select('id, edit_key_hash')
          .eq('id', plan.id)
          .single()

        if (!eventErr && event && event.edit_key_hash === editKeyHash) {
          // Check concurrency: query latest version
          const { data: latestVer } = await supabase
            .from('plan_versions')
            .select('id, version_number, lines')
            .eq('event_id', plan.id)
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle()

          const nextVersionNumber = latestVer ? latestVer.version_number + 1 : 1

          // Optimistic Concurrency Conflict Check (D-15)
          if (latestVer && parentVersionId && latestVer.id !== parentVersionId) {
            return {
              status: 'conflict',
              versionNumber: latestVer.version_number,
              conflictPlan: { ...plan, lines: latestVer.lines as any },
            }
          }

          // Insert immutable version record (Append-only)
          const { data: newVer, error: verErr } = await supabase
            .from('plan_versions')
            .insert({
              event_id: plan.id,
              version_number: nextVersionNumber,
              parent_version_id: parentVersionId || null,
              reason: diffSummary,
              lines: plan.lines as any,
              totals: { totalBudgetPaise: plan.totalBudgetPaise } as any,
            })
            .select('id, version_number')
            .single()

          if (!verErr && newVer) {
            // Insert audit change record
            await supabase.from('change_records').insert({
              plan_version_id: newVer.id,
              explanation: diffSummary,
              is_floor_protected: Boolean(plan.brief.protectedCategory),
            })

            return {
              status: 'saved_cloud',
              versionNumber: newVer.version_number,
              versionId: newVer.id,
            }
          }
        }
      } catch (e) {
        console.warn('[HybridPersistence] Cloud save failed, falling back to local storage:', e)
      }
    }

    // 2. Offline / LocalStorage Fallback (D-13)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LOCAL_STORAGE_PREFIX + plan.id, JSON.stringify(plan))

        const rawHistory = window.localStorage.getItem(LOCAL_VERSIONS_PREFIX + plan.id)
        const history: PlanVersionRecord[] = rawHistory ? JSON.parse(rawHistory) : []

        // Local concurrency conflict check if parentVersionId is passed
        if (history.length > 0 && parentVersionId && history[0].id !== parentVersionId) {
          return {
            status: 'conflict',
            versionNumber: history[0].versionNumber,
            conflictPlan: history[0].snapshot,
          }
        }

        const nextVersionNumber = history.length > 0 ? history[0].versionNumber + 1 : 1

        const newVersion: PlanVersionRecord = {
          id: `local-v-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          eventId: plan.id,
          versionNumber: nextVersionNumber,
          parentVersionId: parentVersionId || null,
          reason: diffSummary,
          createdAt: new Date().toISOString(),
          snapshot: plan,
        }

        history.unshift(newVersion)
        window.localStorage.setItem(LOCAL_VERSIONS_PREFIX + plan.id, JSON.stringify(history))

        return {
          status: 'saved_local',
          versionNumber: nextVersionNumber,
          versionId: newVersion.id,
        }
      }
    } catch (localErr) {
      return { status: 'error', error: String(localErr) }
    }

    return { status: 'saved_local' }
  }

  async getPlan(planId: string, editKey?: string): Promise<{ plan: Plan; isReadOnly: boolean } | null> {
    const supabase = getClientSupabase()

    if (supabase) {
      try {
        const { data: event } = await supabase.from('events').select('*').eq('id', planId).single()
        if (event) {
          const { data: latestVer } = await supabase
            .from('plan_versions')
            .select('*')
            .eq('event_id', planId)
            .order('version_number', { ascending: false })
            .limit(1)
            .single()

          let isAuthorized = false
          if (editKey) {
            const hash = await hashCapabilityToken(editKey)
            isAuthorized = event.edit_key_hash === hash
          }

          const reconstructedPlan: Plan = {
            id: event.id,
            brief: {
              title: event.title,
              eventType: event.event_type as any,
              eventDate: event.event_date,
              city: event.city,
              guestCount: event.guest_count,
              totalBudgetPaise: event.total_budget_paise,
              protectedCategory: event.protected_category as any,
            },
            lines: (latestVer?.lines as any) || [],
            totalBudgetPaise: event.total_budget_paise,
            baselineGuestCount: event.guest_count,
          }

          return { plan: reconstructedPlan, isReadOnly: !isAuthorized }
        }
      } catch {
        // Fall back to local
      }
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      const local = window.localStorage.getItem(LOCAL_STORAGE_PREFIX + planId)
      if (local) {
        let isAuthorized = false
        if (editKey) {
          isAuthorized = true
        } else if (window.localStorage.getItem(LOCAL_OWNER_PREFIX + planId)) {
          isAuthorized = true
        } else if (typeof document !== 'undefined' && document.cookie.includes(`mehfil_edit_${planId}`)) {
          isAuthorized = true
        }
        return { plan: JSON.parse(local), isReadOnly: !isAuthorized }
      }
    }

    return null
  }

  async getVersionHistory(planId: string): Promise<PlanVersionRecord[]> {
    const supabase = getClientSupabase()

    if (supabase) {
      try {
        const { data } = await supabase
          .from('plan_versions')
          .select('id, event_id, version_number, parent_version_id, reason, created_at, lines')
          .eq('event_id', planId)
          .order('version_number', { ascending: false })

        if (data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            eventId: row.event_id,
            versionNumber: row.version_number,
            parentVersionId: row.parent_version_id,
            reason: row.reason,
            createdAt: row.created_at,
            snapshot: { lines: row.lines } as any,
          }))
        }
      } catch {
        // Fall back to local
      }
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(LOCAL_VERSIONS_PREFIX + planId)
      if (raw) return JSON.parse(raw)
    }

    return []
  }

  async restoreVersion(planId: string, targetVersion: number, editKey?: string): Promise<SavePlanResult> {
    const history = await this.getVersionHistory(planId)
    const target = history.find((v) => v.versionNumber === targetVersion)
    if (!target || !target.snapshot) {
      return { status: 'error', error: `Version ${targetVersion} not found` }
    }

    // Forward restore creates v(N+1) matching snapshot of v(k) (D-10)
    return this.savePlan(
      target.snapshot,
      history[0]?.id,
      `Reverted to v${targetVersion} (${target.reason})`,
      editKey
    )
  }

  async regenerateShareKey(planId: string, editKey?: string): Promise<{ shareToken: string } | null> {
    const newShareToken = generateCapabilityToken()
    const supabase = getClientSupabase()

    if (supabase && editKey) {
      try {
        const editKeyHash = await hashCapabilityToken(editKey)
        const shareKeyHash = await hashCapabilityToken(newShareToken)

        const { error } = await supabase
          .from('events')
          .update({ share_key_hash: shareKeyHash, updated_at: new Date().toISOString() })
          .eq('id', planId)
          .eq('edit_key_hash', editKeyHash)

        if (!error) {
          return { shareToken: newShareToken }
        }
      } catch {
        // Fall back to local
      }
    }

    return { shareToken: newShareToken }
  }
}

export const persistence = new HybridPersistenceAdapter()

/** Saves a freshly generated plan in this browser and marks it as owned by it. */
export async function saveNewPlan(plan: Plan): Promise<void> {
  await persistence.savePlan(plan, undefined, 'Initial plan created from archetype')
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(LOCAL_OWNER_PREFIX + plan.id, '1')
  }
}
