import React from 'react'
import type { Plan, PlanChangeRecord, PlanVersionRecord } from '@/lib/engine/types'
import { cn } from '@/lib/utils'
import { ChangeExplainerChanges } from './ChangeExplainerChanges'
import { ChangeExplainerFooter } from './ChangeExplainerFooter'
import { ChangeExplainerVersions } from './ChangeExplainerVersions'

export interface ChangeExplainerProps {
  plan?: Plan
  changes?: PlanChangeRecord[]
  history?: PlanChangeRecord[]
  versions?: PlanVersionRecord[]
  currentVersionNumber?: number
  onUndo?: (item: PlanChangeRecord, index: number) => void
  onRestoreVersion?: (targetVersion: number) => void
  isReadOnly?: boolean
  className?: string
}

export function ChangeExplainer({
  plan,
  changes,
  history,
  versions,
  currentVersionNumber,
  onUndo,
  onRestoreVersion,
  isReadOnly = false,
  className,
}: ChangeExplainerProps) {
  return (
    <section aria-labelledby="history-heading" className={cn('flex flex-col gap-4', className)}>
      {versions && versions.length > 0 ? (
        // Version history is provided (Phase 3 persistence model)
        <ChangeExplainerVersions
          versions={versions}
          activeVersionNum={currentVersionNumber ?? (versions[0]?.versionNumber || 1)}
          isReadOnly={isReadOnly}
          onRestoreVersion={onRestoreVersion}
          onUndo={onUndo}
        />
      ) : (
        // Legacy ChangeList fallback (unpersisted drafting)
        <ChangeExplainerChanges
          changeList={changes ?? history ?? []}
          isReadOnly={isReadOnly}
          onUndo={onUndo}
        />
      )}
      <ChangeExplainerFooter plan={plan} />
    </section>
  )
}
