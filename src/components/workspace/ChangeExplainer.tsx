import React from 'react'
import type { Plan, PlanVersionRecord } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PlanChangeDelta {
  category: string
  deltaPaise: number
}

export interface PlanChangeRecord {
  id: string
  timestamp: Date
  description: string
  deltas: PlanChangeDelta[]
  isFloorProtected?: boolean
  previousSnapshot?: Plan
}

export interface ChangeExplainerProps {
  plan?: Plan
  changes?: PlanChangeRecord[]
  history?: PlanChangeRecord[]
  versions?: PlanVersionRecord[]
  currentVersionNumber?: number
  previousGuestCount?: number
  onUndo?: (item: PlanChangeRecord, index: number) => void
  onRestoreVersion?: (targetVersion: number) => void
  isReadOnly?: boolean
  className?: string
}

function formatRelativeTime(dateString: string | Date): string {
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

export function ChangeExplainer({
  plan,
  changes,
  history,
  versions,
  currentVersionNumber,
  previousGuestCount,
  onUndo,
  onRestoreVersion,
  isReadOnly = false,
  className,
}: ChangeExplainerProps) {
  const footer = plan && (
    <p className="border-t border-royal-plum/10 pt-4 text-sm text-royal-plum/60">
      Sum of allocations exactly equals{' '}
      <span className="font-semibold tabular-nums text-royal-plum">{formatINR(plan.totalBudgetPaise)}</span>.
      Zero paise leakage.
    </p>
  )

  // If version history is provided (Phase 3 persistence model)
  if (versions && versions.length > 0) {
    const activeVersionNum = currentVersionNumber ?? (versions[0]?.versionNumber || 1)

    return (
      <section aria-labelledby="history-heading" className={cn('flex flex-col gap-4', className)}>
        <div>
          <h3 id="history-heading" className="font-serif text-xl font-bold text-royal-plum">
            Revision History
            <span className="ml-2 font-sans text-sm font-medium tabular-nums text-royal-plum/60">
              v{activeVersionNum}
            </span>
          </h3>
          <p className="mt-0.5 text-sm text-royal-plum/60">
            Immutable version snapshots • 1-click forward restore undo
          </p>
        </div>

        <ol className="divide-y divide-royal-plum/10 border-y border-royal-plum/10">
          {versions.map((ver) => {
            const isCurrent = ver.versionNumber === activeVersionNum
            const isFloorProtected = Boolean(ver.snapshot?.brief?.protectedCategory)

            return (
              <li
                key={ver.id || ver.versionNumber}
                className={cn(
                  'flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:px-5',
                  isCurrent ? 'relative bg-marigold/10 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-marigold' : ''
                )}
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-royal-plum/60">
                    <span className="font-semibold tabular-nums text-royal-plum">v{ver.versionNumber}</span>
                    <span>{formatRelativeTime(ver.createdAt)}</span>
                    {isCurrent && <span className="font-medium text-royal-plum">Current</span>}
                  </p>
                  <p className="mt-1 break-words text-base leading-snug text-royal-plum">{ver.reason}</p>
                  {isFloorProtected && (
                    <p className="mt-1 text-sm text-royal-plum/70">Protected Moment held firm</p>
                  )}
                </div>

                {!isCurrent && !isReadOnly && (onRestoreVersion || onUndo) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 self-start"
                    onClick={() => {
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
                    }}
                  >
                    Restore Version {ver.versionNumber}
                  </Button>
                )}
              </li>
            )
          })}
        </ol>
        {footer}
      </section>
    )
  }

  // Legacy ChangeList fallback (unpersisted drafting)
  const changeList: PlanChangeRecord[] = changes ?? history ?? []
  const hasChanges = changeList.length > 0

  return (
    <section aria-labelledby="history-heading" className={cn('flex flex-col gap-4', className)}>
      <div>
        <h3 id="history-heading" className="font-serif text-xl font-bold text-royal-plum">
          Live Change Explainer
          <span className="ml-2 font-sans text-sm font-medium tabular-nums text-royal-plum/60">
            {changeList.length}
          </span>
        </h3>
        <p className="mt-0.5 text-sm text-royal-plum/60">
          Deterministic Hare-Niemeyer math balances budget in integer paise.
        </p>
      </div>

      {!hasChanges ? (
        <div className="border-y border-royal-plum/10 py-10 text-center">
          <h4 className="font-serif text-base font-bold text-royal-plum">No recent changes</h4>
          <p className="mt-1 text-sm text-royal-plum/60">
            All allocations balanced. Adjust sliders to see live rebalancing.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-royal-plum/10 border-y border-royal-plum/10">
          {changeList.map((item, index) => (
            <li key={item.id || index} className="flex flex-col gap-2 px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-4">
                <p className="text-base leading-snug text-royal-plum">{item.description}</p>
                {onUndo && !isReadOnly && (
                  <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => onUndo(item, index)}>
                    Undo
                  </Button>
                )}
              </div>

              {item.isFloorProtected && (
                <p className="text-sm text-royal-plum/70">Protected Moment — Non-negotiable floor locked</p>
              )}

              {item.deltas && item.deltas.length > 0 && (
                <ul className="flex flex-col gap-0.5 text-sm tabular-nums">
                  {item.deltas.map((delta, dIdx) => {
                    const isPositive = delta.deltaPaise > 0
                    const isNegative = delta.deltaPaise < 0
                    const formatted = formatINR(Math.abs(delta.deltaPaise))
                    const text = isPositive
                      ? `+${formatted} to ${delta.category}`
                      : isNegative
                      ? `-${formatted} from ${delta.category}`
                      : `${formatted} ${delta.category}`
                    return (
                      <li
                        key={dIdx}
                        className={cn(
                          'tabular-nums',
                          isPositive && 'text-[#2E5A44]',
                          isNegative && 'text-terracotta',
                          !isPositive && !isNegative && 'text-royal-plum/70'
                        )}
                      >
                        {text}
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
      {footer}
    </section>
  )
}
