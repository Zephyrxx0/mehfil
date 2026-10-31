import type { Plan, PlanVersionRecord } from '@/lib/engine/types'
import { computePlanDiff, type PlanDiffInput } from '@/lib/engine/diff'
import type { SavePlanResult } from '@/lib/storage/persistence'

/** Pure helpers for the version history: the head, saved records, conflicts, edit bursts. */

/** How long rapid edits (sliders, steppers) wait before one version is saved. */
export const COMMIT_DEBOUNCE_MS = 800

export type ActionType = PlanDiffInput['actionType']

export interface VersionHead {
  id: string | undefined
  number: number
}

/** A save the server turned down because another device saved first. */
export interface PlanConflict {
  /** The newest plan, as saved by the other device. */
  plan: Plan
  head: VersionHead | null
}

export interface CommitOptions {
  /** Extra details kept with the version, such as the style DNA that produced it. */
  meta?: PlanVersionRecord['meta']
  /** Save on top of the newest version instead of the one this tab last saw. */
  ignoreConflicts?: boolean
}

/** Edits that are waiting for their pause before being saved as one version. */
export interface PendingCommit {
  timer: ReturnType<typeof setTimeout>
  next: Plan
  /** The plan as it was before the first edit of the burst. */
  burstStart: Plan
  actionType: ActionType
}

export function initialVersionList(
  initialPlan: Plan,
  given?: PlanVersionRecord[]
): PlanVersionRecord[] {
  if (given && given.length > 0) return given
  return [
    {
      id: `ver-${initialPlan.id}-1`,
      eventId: initialPlan.id,
      versionNumber: 1,
      reason: 'Initial plan created from archetype',
      isFloorProtected: Boolean(initialPlan.brief.protectedCategory),
      snapshot: initialPlan,
      createdAt: new Date().toISOString(),
    },
  ]
}

export function headOf(versions: PlanVersionRecord[]): VersionHead {
  const newest = versions.reduce((a, b) => (b.versionNumber > a.versionNumber ? b : a))
  return { id: newest.id, number: newest.versionNumber }
}

/** The conflict to show for a save storage turned down. */
export function conflictFrom(result: SavePlanResult, attempted: Plan): PlanConflict {
  return {
    plan: result.conflictPlan ?? attempted,
    head:
      result.versionId && result.versionNumber
        ? { id: result.versionId, number: result.versionNumber }
        : null,
  }
}

/**
 * The head a successful save produced. It comes from what storage answered with; only when
 * storage gave nothing back is the next number and id worked out here.
 */
export function savedHead(
  result: SavePlanResult,
  saved: Plan,
  current: VersionHead
): { id: string; number: number } {
  const number = result.versionNumber ?? current.number + 1
  return { id: result.versionId ?? `ver-${saved.id}-${number}`, number }
}

export function versionRecordFor(input: {
  plan: Plan
  reason: string
  head: { id: string; number: number }
  parentId: string | undefined
  meta?: PlanVersionRecord['meta']
  createdAt?: string
}): PlanVersionRecord {
  const { plan, head } = input
  return {
    id: head.id,
    eventId: plan.id,
    versionNumber: head.number,
    parentVersionId: input.parentId,
    reason: input.reason,
    isFloorProtected: Boolean(plan.brief.protectedCategory),
    snapshot: plan,
    meta: input.meta,
    createdAt: input.createdAt ?? new Date().toISOString(),
  }
}

/** Puts a new record first and drops any older record with the same number. */
export function withNewVersion(
  versions: PlanVersionRecord[],
  record: PlanVersionRecord
): PlanVersionRecord[] {
  return [record, ...versions.filter((v) => v.versionNumber !== record.versionNumber)]
}

/** Where the diff for a burst of edits starts: the plan before the burst's first edit. */
export function burstStartOf(pending: PendingCommit | null, prevPlan: Plan): Plan {
  return pending?.burstStart ?? prevPlan
}

/** The one-line summary of everything in a burst of edits. */
export function summarizeBurst(pending: PendingCommit): string {
  return computePlanDiff({
    prevPlan: pending.burstStart,
    nextPlan: pending.next,
    actionType: pending.actionType,
  }).summary
}
