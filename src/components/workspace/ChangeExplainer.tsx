import React from 'react'
import type { Plan, PlanVersionRecord } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { RotateCcw, ShieldCheck, Info, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  // If version history is provided (Phase 3 persistence model)
  if (versions && versions.length > 0) {
    const activeVersionNum = currentVersionNumber ?? (versions[0]?.versionNumber || 1)

    return (
      <Card
        className={cn(
          'rounded-2xl border border-royal-plum/10 bg-warm-ivory text-royal-plum flex flex-col justify-between shadow-xs',
          className
        )}
      >
        <div>
          <CardHeader className="pb-3 border-b border-royal-plum/8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-marigold" />
                <CardTitle className="text-lg font-serif">Revision History</CardTitle>
                <Badge variant="outline" className="tabular-nums font-semibold px-2 py-0.5 text-xs">
                  v{activeVersionNum}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-royal-plum/60 mt-1">
              Immutable version snapshots • 1-click forward restore undo
            </p>
          </CardHeader>

          <CardContent className="pt-4 flex flex-col gap-3">
            <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1">
              {versions.map((ver) => {
                const isCurrent = ver.versionNumber === activeVersionNum
                const isFloorProtected = Boolean(ver.snapshot?.brief?.protectedCategory)

                return (
                  <div
                    key={ver.id || ver.versionNumber}
                    className={cn(
                      'rounded-xl border p-3.5 flex flex-col gap-2.5 shadow-2xs transition-colors',
                      isCurrent
                        ? 'border-marigold/50 bg-white/90 ring-1 ring-marigold/30'
                        : 'border-royal-plum/10 bg-white/60'
                    )}
                  >
                    {/* Version Card Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-royal-plum px-2 py-0.5 rounded-md bg-royal-plum/5">
                          v{ver.versionNumber}
                        </span>
                        <span className="text-2xs text-royal-plum/50">
                          {formatRelativeTime(ver.createdAt)}
                        </span>
                        {isCurrent && (
                          <Badge variant="default" className="text-2xs font-semibold py-0 px-2">
                            Current
                          </Badge>
                        )}
                      </div>

                      {/* Forward Restore Button for past versions */}
                      {!isCurrent && !isReadOnly && (onRestoreVersion || onUndo) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (onRestoreVersion) {
                              onRestoreVersion(ver.versionNumber)
                            } else if (onUndo) {
                              // Legacy compatibility
                              onUndo({
                                id: ver.id,
                                timestamp: new Date(ver.createdAt),
                                description: ver.reason,
                                deltas: [],
                                previousSnapshot: ver.snapshot,
                              }, ver.versionNumber)
                            }
                          }}
                          className="h-7 shrink-0 gap-1 px-2.5 text-xs font-semibold hover:bg-marigold/20"
                        >
                          <RotateCcw className="w-3 h-3 text-royal-plum" />
                          <span>Restore Version {ver.versionNumber}</span>
                        </Button>
                      )}
                    </div>

                    {/* Deterministic Diff Explanation */}
                    <p className="text-xs font-medium text-royal-plum/90 leading-snug break-words">
                      {ver.reason}
                    </p>

                    {/* Protected Moment Indicator */}
                    {isFloorProtected && (
                      <div className="flex items-center gap-1.5 rounded-lg bg-gulabi-rose/20 px-2.5 py-1 text-2xs font-semibold text-royal-plum border border-gulabi-rose/40 self-start">
                        <ShieldCheck className="w-3.5 h-3.5 text-royal-plum shrink-0" />
                        <span>Protected Moment held firm</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </div>

        {plan && (
          <div className="p-4 border-t border-royal-plum/8 bg-royal-plum/2 rounded-b-2xl flex items-center gap-2 text-2xs text-royal-plum/60">
            <Info className="w-3.5 h-3.5 text-royal-plum/40 shrink-0" />
            <span>
              Sum of allocations exactly equals{' '}
              <span className="tabular-nums font-semibold">{formatINR(plan.totalBudgetPaise)}</span>. Zero paise leakage.
            </span>
          </div>
        )}
      </Card>
    )
  }

  // Legacy ChangeList fallback (Phase 1/2 tests and unpersisted drafting)
  const changeList: PlanChangeRecord[] = changes ?? history ?? []
  const hasChanges = changeList.length > 0

  return (
    <Card
      className={cn(
        'rounded-2xl border border-royal-plum/10 bg-warm-ivory text-royal-plum flex flex-col justify-between shadow-xs',
        className
      )}
    >
      <div>
        <CardHeader className="pb-3 border-b border-royal-plum/8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-serif">Live Change Explainer</CardTitle>
              <Badge variant="outline" className="tabular-nums font-semibold px-2 py-0.5 text-xs">
                {changeList.length}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-royal-plum/60 mt-1">
            Deterministic Hare-Niemeyer math balances budget in integer paise.
          </p>
        </CardHeader>

        <CardContent className="pt-4 flex flex-col gap-3">
          {!hasChanges ? (
            <div className="rounded-xl border border-royal-plum/10 bg-white/40 p-6 text-center">
              <h4 className="font-serif font-bold text-sm text-royal-plum mb-1">
                No recent changes
              </h4>
              <p className="text-xs text-royal-plum/60 leading-relaxed">
                All allocations balanced. Adjust sliders to see live rebalancing.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
              {changeList.map((item, index) => (
                <div
                  key={item.id || index}
                  className="rounded-xl border border-royal-plum/10 bg-white/60 p-3.5 flex flex-col gap-2.5 shadow-2xs"
                >
                  {/* Item Header & Undo */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-royal-plum leading-snug">
                      {item.description}
                    </p>
                    {onUndo && !isReadOnly && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onUndo(item, index)}
                        className="h-7 shrink-0 gap-1 px-2.5 text-xs font-semibold"
                      >
                        <RotateCcw className="w-3 h-3 text-royal-plum" />
                        <span>Undo</span>
                      </Button>
                    )}
                  </div>

                  {/* Protected Moment Indicator */}
                  {item.isFloorProtected && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-gulabi-rose/20 px-2.5 py-1.5 text-xs font-semibold text-royal-plum border border-gulabi-rose/40">
                      <ShieldCheck className="w-4 h-4 text-royal-plum shrink-0" />
                      <span>Protected Moment — Non-negotiable floor locked</span>
                    </div>
                  )}

                  {/* Deltas List */}
                  {item.deltas && item.deltas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
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
                          <span
                            key={dIdx}
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border tabular-nums',
                              isPositive && 'bg-marigold/20 text-[#2E5A44] border-marigold/40',
                              isNegative && 'bg-[#D95D39]/10 text-[#D95D39] border-[#D95D39]/25',
                              !isPositive && !isNegative && 'bg-royal-plum/5 text-royal-plum/70 border-royal-plum/10'
                            )}
                          >
                            {text}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </div>

      {plan && (
        <div className="p-4 border-t border-royal-plum/8 bg-royal-plum/2 rounded-b-2xl flex items-center gap-2 text-2xs text-royal-plum/60">
          <Info className="w-3.5 h-3.5 text-royal-plum/40 shrink-0" />
          <span>
            Sum of allocations exactly equals{' '}
            <span className="tabular-nums font-semibold">{formatINR(plan.totalBudgetPaise)}</span>. Zero paise leakage.
          </span>
        </div>
      )}
    </Card>
  )
}
