import React from 'react'
import type { PlanChangeRecord, PlanVersionRecord } from '@/lib/engine/types'
import { restoreVersion } from './change-explainer-format'
import { ChangeExplainerVersionItem } from './ChangeExplainerVersionItem'

export interface ChangeExplainerVersionsProps {
  versions: PlanVersionRecord[]
  activeVersionNum: number
  isReadOnly: boolean
  onRestoreVersion?: (targetVersion: number) => void
  onUndo?: (item: PlanChangeRecord, index: number) => void
}

/** Persisted revision history (Phase 3): header plus one card per immutable version. */
export function ChangeExplainerVersions({
  versions,
  activeVersionNum,
  isReadOnly,
  onRestoreVersion,
  onUndo,
}: ChangeExplainerVersionsProps) {
  const canRestore = !isReadOnly && Boolean(onRestoreVersion || onUndo)

  return (
    <>
      <div>
        <h2 id="history-heading" className="font-serif text-xl font-bold text-royal-plum">
          Revision History
          <span className="ml-2 font-sans text-sm font-medium tabular-nums text-royal-plum/70">
            v{activeVersionNum}
          </span>
        </h2>
        <p className="mt-0.5 text-sm text-royal-plum/70">
          Immutable version snapshots • 1-click forward restore undo
        </p>
      </div>

      <ol className="divide-y divide-royal-plum/10 border-y border-royal-plum/10">
        {versions.map((ver) => {
          const isCurrent = ver.versionNumber === activeVersionNum
          return (
            <ChangeExplainerVersionItem
              key={ver.id || ver.versionNumber}
              version={ver}
              isCurrent={isCurrent}
              onRestore={
                canRestore && !isCurrent
                  ? () => restoreVersion(ver, onRestoreVersion, onUndo)
                  : undefined
              }
            />
          )
        })}
      </ol>
    </>
  )
}
