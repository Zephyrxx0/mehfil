import type { PlanChangeRecord, PlanVersionRecord } from '@/lib/engine/types'

/** The change list to show: `changes` if given, else the older `history` prop, else none. */
export function resolveChangeList(
  changes?: PlanChangeRecord[],
  history?: PlanChangeRecord[]
): PlanChangeRecord[] {
  return changes ?? history ?? []
}

/** The version the plan is on: the one passed in, else the one numbered, else the newest. */
export function resolveCurrentVersion(
  versions?: PlanVersionRecord[],
  currentVersion?: PlanVersionRecord,
  currentVersionNumber?: number
): PlanVersionRecord | undefined {
  return (
    currentVersion ||
    versions?.find((v) => v.versionNumber === currentVersionNumber) ||
    versions?.[0]
  )
}
