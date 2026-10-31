import React from 'react'
import type { PlanVersionRecord } from '@/lib/engine/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from './change-explainer-format'

export interface ChangeExplainerVersionItemProps {
  version: PlanVersionRecord
  isCurrent: boolean
  /** When omitted, the restore button is not shown. */
  onRestore?: () => void
}

export function ChangeExplainerVersionItem({
  version,
  isCurrent,
  onRestore,
}: ChangeExplainerVersionItemProps) {
  const isFloorProtected = Boolean(version.snapshot?.brief?.protectedCategory)

  return (
    <li
      className={cn(
        'flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:px-5',
        isCurrent
          ? 'relative bg-marigold/10 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-marigold'
          : ''
      )}
    >
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-royal-plum/70">
          <span className="font-semibold tabular-nums text-royal-plum">
            v{version.versionNumber}
          </span>
          <span>{formatRelativeTime(version.createdAt)}</span>
          {isCurrent && <span className="font-medium text-royal-plum">Current</span>}
        </p>
        <p className="mt-1 break-words text-base leading-snug text-royal-plum">{version.reason}</p>
        {isFloorProtected && (
          <p className="mt-1 text-sm text-royal-plum/70">Protected Moment held firm</p>
        )}
      </div>

      {onRestore && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 self-start"
          onClick={onRestore}
        >
          Restore Version {version.versionNumber}
        </Button>
      )}
    </li>
  )
}
