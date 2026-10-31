import type { PlanChangeDelta, PlanChangeRecord, PlanVersionRecord } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'

export function formatRelativeTime(dateString: string | Date): string {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffSec < 10) return 'Just now'
    if (diffSec < 60) return `${diffSec}s ago`
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}h ago`
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  } catch {
    return 'Recently'
  }
}

export interface DeltaDescription {
  text: string
  isPositive: boolean
  isNegative: boolean
}

/** Plain-language line for one category change, e.g. "+₹20,000 to Catering". */
export function describeDelta(delta: PlanChangeDelta): DeltaDescription {
  const isPositive = delta.deltaPaise > 0
  const isNegative = delta.deltaPaise < 0
  const formatted = formatINR(Math.abs(delta.deltaPaise))
  let text = `${formatted} ${delta.category}`
  if (isPositive) text = `+${formatted} to ${delta.category}`
  else if (isNegative) text = `-${formatted} from ${delta.category}`
  return { text, isPositive, isNegative }
}

/**
 * Restores a past version. Prefers the forward-restore callback and falls back to the legacy
 * undo callback, which receives a change record rebuilt from the version.
 */
export function restoreVersion(
  ver: PlanVersionRecord,
  onRestoreVersion?: (targetVersion: number) => void,
  onUndo?: (item: PlanChangeRecord, index: number) => void
): void {
  if (onRestoreVersion) {
    onRestoreVersion(ver.versionNumber)
  } else if (onUndo) {
    // Legacy compatibility
    onUndo(
      {
        id: ver.id,
        timestamp: new Date(ver.createdAt),
        description: ver.reason,
        deltas: [],
        previousSnapshot: ver.snapshot,
      },
      ver.versionNumber
    )
  }
}
