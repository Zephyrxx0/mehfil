import { z } from 'zod'
import { BudgetCategorySchema } from '@/lib/ai/schemas'
import type { Plan, PlanVersionRecord } from '@/lib/engine/types'

/**
 * The one place that turns database JSON into a `Plan` (CQ4). Everything that comes back from
 * Postgres is checked here, so the rest of the app never sees a malformed plan.
 *
 * Schemas are "loose": the fields the engine depends on are validated, and extra fields
 * (style DNA, quotes, adopted ideas) pass through untouched.
 */

const EventTypeSchema = z.enum(['wedding', 'birthday', 'community'])

const BudgetLineSchema = z.looseObject({
  id: z.string().min(1),
  name: z.string(),
  category: BudgetCategorySchema,
  lineType: z.enum(['per_guest', 'fixed', 'flexible', 'buffer']),
  baselinePaise: z.number().int(),
  currentPaise: z.number().int(),
})

const EventBriefSchema = z.looseObject({
  title: z.string().min(1),
  eventType: EventTypeSchema,
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  city: z.string().min(1),
  guestCount: z.number().int().positive(),
  totalBudgetPaise: z.number().int().nonnegative(),
  protectedCategory: BudgetCategorySchema,
})

const PlanSnapshotSchema = z.looseObject({
  brief: EventBriefSchema,
  lines: z.array(BudgetLineSchema),
  totalBudgetPaise: z.number().int().nonnegative(),
  baselineGuestCount: z.number().int().positive(),
})

const EventRowSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  event_type: EventTypeSchema,
  event_date: z.string(),
  city: z.string(),
  guest_count: z.number().int(),
  total_budget_paise: z.coerce.number().int(),
  protected_category: BudgetCategorySchema,
})

const VersionRowSchema = z.object({
  id: z.string(),
  version_number: z.number().int(),
  lines: z.unknown().optional(),
  snapshot: z.unknown().optional(),
})

export const EditablePlanResponseSchema = z.object({
  event: EventRowSchema,
  version: VersionRowSchema.nullable(),
})

export const VersionListResponseSchema = z.array(
  VersionRowSchema.extend({
    parent_version_id: z.string().nullable(),
    reason: z.string(),
    created_at: z.string(),
  })
)

export class PlanDecodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PlanDecodeError'
  }
}

/** Validates a stored snapshot and stamps it with the event id the database knows it by. */
export function decodeSnapshot(snapshot: unknown, eventId: string): Plan {
  const parsed = PlanSnapshotSchema.safeParse(snapshot)
  if (!parsed.success) throw new PlanDecodeError('Stored plan snapshot is invalid')
  // The loose schema validated every field the engine reads, so this is the only cast.
  return { ...(parsed.data as unknown as Plan), id: eventId }
}

export interface EventRow {
  id: string
  title: string
  event_type: 'wedding' | 'birthday' | 'community'
  event_date: string
  city: string
  guest_count: number
  total_budget_paise: number
  protected_category: string
}

/** Rebuilds a plan for versions saved before snapshots existed: event summary plus lines. */
function planFromLegacyRows(event: EventRow, lines: unknown): Plan {
  return decodeSnapshot(
    {
      brief: {
        title: event.title,
        eventType: event.event_type,
        eventDate: event.event_date,
        city: event.city,
        guestCount: event.guest_count,
        totalBudgetPaise: event.total_budget_paise,
        protectedCategory: event.protected_category,
      },
      lines,
      totalBudgetPaise: event.total_budget_paise,
      baselineGuestCount: event.guest_count,
    },
    event.id
  )
}

const SharedPlanRowSchema = EventRowSchema.extend({
  status: z.string(),
  lines: z.unknown(),
})

/** Decodes one row of `get_shared_plan` (the family view carries only the event and its lines). */
export function decodeSharedPlan(raw: unknown): Plan {
  const parsed = SharedPlanRowSchema.safeParse(raw)
  if (!parsed.success) throw new PlanDecodeError('Unexpected shared plan response')
  return planFromLegacyRows(parsed.data, parsed.data.lines ?? [])
}

export interface DecodedEditablePlan {
  plan: Plan
  versionId: string | null
  versionNumber: number | null
}

/** Decodes the response of `get_editable_plan`. */
export function decodeEditablePlan(raw: unknown): DecodedEditablePlan {
  const parsed = EditablePlanResponseSchema.safeParse(raw)
  if (!parsed.success) throw new PlanDecodeError('Unexpected plan response')
  const { event, version } = parsed.data

  const plan = version?.snapshot
    ? decodeSnapshot(version.snapshot, event.id)
    : planFromLegacyRows(event, version?.lines ?? [])
  return { plan, versionId: version?.id ?? null, versionNumber: version?.version_number ?? null }
}

/**
 * Decodes the response of `list_plan_versions` into history records, newest first.
 * Rows saved before snapshots existed carry no restorable plan and are left out.
 */
export function decodeVersionHistory(raw: unknown, eventId: string): PlanVersionRecord[] {
  const parsed = VersionListResponseSchema.safeParse(raw)
  if (!parsed.success) throw new PlanDecodeError('Unexpected version history response')

  return parsed.data.flatMap((row) =>
    row.snapshot
      ? [
          {
            id: row.id,
            eventId,
            versionNumber: row.version_number,
            parentVersionId: row.parent_version_id,
            reason: row.reason,
            createdAt: row.created_at,
            snapshot: decodeSnapshot(row.snapshot, eventId),
          },
        ]
      : []
  )
}
