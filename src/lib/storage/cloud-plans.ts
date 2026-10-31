import { z } from 'zod'
import type { Json } from '@/types/database'
import type { Database } from '@/types/database'
import type { Plan, PlanVersionRecord } from '@/lib/engine/types'
import {
  PlanDecodeError,
  decodeEditablePlan,
  decodeSharedPlan,
  decodeSnapshot,
  decodeVersionHistory,
  type DecodedEditablePlan,
} from './plan-codec'

type Functions = Database['public']['Functions']
export type RpcName = keyof Functions

/** The slice of the Supabase client this module needs. Tests pass an in-process Postgres. */
export interface RpcClient {
  rpc<F extends RpcName>(
    fn: F,
    args: Functions[F]['Args']
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>
}

export class CloudError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CloudError'
  }
}

const CreatedEventSchema = z.object({
  event_id: z.string().min(1),
  edit_key: z.string().min(16),
  share_key: z.string().min(16),
  version_id: z.string().min(1),
  version_number: z.number().int(),
})

const SaveResultSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('saved'),
    version_id: z.string(),
    version_number: z.number().int(),
  }),
  z.object({
    status: z.literal('conflict'),
    version_id: z.string(),
    version_number: z.number().int(),
    snapshot: z.unknown().optional(),
  }),
  z.object({ status: z.literal('unauthorized') }),
])

const ShareKeyResultSchema = z.object({ share_key: z.string().min(16) }).nullable()

export interface CreatedEvent {
  eventId: string
  editKey: string
  shareKey: string
  versionId: string
  versionNumber: number
}

export type CloudSaveOutcome =
  | { status: 'saved'; versionId: string; versionNumber: number }
  | { status: 'conflict'; versionNumber: number; conflictPlan?: Plan }
  | { status: 'unauthorized' }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID.test(value)
}

/** Cloud plans are keyed by the UUID the database generated. Local-only plans use other ids. */
export const isCloudPlanId = isUuid

/** Typed access to the token-checked functions from migration 20261031000000. */
export class CloudPlans {
  constructor(private readonly client: RpcClient) {}

  private async call<F extends RpcName>(fn: F, args: Functions[F]['Args']): Promise<unknown> {
    const { data, error } = await this.client.rpc(fn, args)
    if (error) throw new CloudError(`${fn} failed: ${error.message}`)
    return data
  }

  async createEvent(plan: Plan, reason: string): Promise<CreatedEvent> {
    const data = await this.call('create_event', {
      p_title: plan.brief.title,
      p_event_type: plan.brief.eventType,
      p_event_date: plan.brief.eventDate,
      p_city: plan.brief.city,
      p_guest_count: plan.brief.guestCount,
      p_total_budget_paise: plan.totalBudgetPaise,
      p_protected_category: plan.brief.protectedCategory,
      p_snapshot: plan as unknown as Json,
      p_reason: reason,
    })
    const parsed = CreatedEventSchema.safeParse(data)
    if (!parsed.success) throw new PlanDecodeError('Unexpected create_event response')
    return {
      eventId: parsed.data.event_id,
      editKey: parsed.data.edit_key,
      shareKey: parsed.data.share_key,
      versionId: parsed.data.version_id,
      versionNumber: parsed.data.version_number,
    }
  }

  async verifyEditKey(eventId: string, editKey: string): Promise<boolean> {
    const data = await this.call('verify_edit_key', { p_event_id: eventId, p_edit_key: editKey })
    return data === true
  }

  /** Returns null when the key is wrong or the plan does not exist. */
  async getEditablePlan(eventId: string, editKey: string): Promise<DecodedEditablePlan | null> {
    const data = await this.call('get_editable_plan', { p_event_id: eventId, p_edit_key: editKey })
    return data === null ? null : decodeEditablePlan(data)
  }

  async savePlanVersion(args: {
    eventId: string
    editKey: string
    parentVersionId: string | null
    plan: Plan
    reason: string
    isFloorProtected: boolean
  }): Promise<CloudSaveOutcome> {
    const data = await this.call('save_plan_version', {
      p_event_id: args.eventId,
      p_edit_key: args.editKey,
      p_parent_version_id: args.parentVersionId,
      p_snapshot: args.plan as unknown as Json,
      p_reason: args.reason,
      p_is_floor_protected: args.isFloorProtected,
    })
    const parsed = SaveResultSchema.safeParse(data)
    if (!parsed.success) throw new PlanDecodeError('Unexpected save_plan_version response')

    switch (parsed.data.status) {
      case 'saved':
        return {
          status: 'saved',
          versionId: parsed.data.version_id,
          versionNumber: parsed.data.version_number,
        }
      case 'conflict':
        return {
          status: 'conflict',
          versionNumber: parsed.data.version_number,
          conflictPlan: parsed.data.snapshot
            ? decodeSnapshot(parsed.data.snapshot, args.eventId)
            : undefined,
        }
      case 'unauthorized':
        return { status: 'unauthorized' }
    }
  }

  async listVersions(eventId: string, editKey: string): Promise<PlanVersionRecord[]> {
    const data = await this.call('list_plan_versions', { p_event_id: eventId, p_edit_key: editKey })
    return decodeVersionHistory(data, eventId)
  }

  /** The family view. Returns null when the token matches no active plan. */
  async getSharedPlan(shareToken: string): Promise<Plan | null> {
    const data = await this.call('get_shared_plan', { p_share_key: shareToken })
    if (!Array.isArray(data) || data.length === 0) return null
    return decodeSharedPlan(data[0])
  }

  /** Returns the new plain share token, or null when the key is wrong. */
  async regenerateShareKey(eventId: string, editKey: string): Promise<string | null> {
    const data = await this.call('regenerate_share_key', {
      p_event_id: eventId,
      p_edit_key: editKey,
    })
    const parsed = ShareKeyResultSchema.safeParse(data)
    if (!parsed.success) throw new PlanDecodeError('Unexpected regenerate_share_key response')
    return parsed.data?.share_key ?? null
  }
}
