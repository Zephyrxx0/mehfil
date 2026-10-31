import React from 'react'
import type { PlanChangeDelta, PlanChangeRecord } from '@/lib/engine/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { describeDelta } from './change-explainer-format'

function DeltaList({ deltas }: { deltas: PlanChangeDelta[] }) {
  return (
    <ul className="flex flex-col gap-0.5 text-sm tabular-nums">
      {deltas.map((delta, dIdx) => {
        const { text, isPositive, isNegative } = describeDelta(delta)
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
  )
}

export interface ChangeExplainerChangeItemProps {
  item: PlanChangeRecord
  /** When omitted, the Undo button is not shown. */
  onUndo?: () => void
}

export function ChangeExplainerChangeItem({ item, onUndo }: ChangeExplainerChangeItemProps) {
  return (
    <li className="flex flex-col gap-2 px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-base leading-snug text-royal-plum">{item.description}</p>
        {onUndo && (
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onUndo}>
            Undo
          </Button>
        )}
      </div>

      {item.isFloorProtected && (
        <p className="text-sm text-royal-plum/70">Protected Moment — Non-negotiable floor locked</p>
      )}

      {item.deltas && item.deltas.length > 0 && <DeltaList deltas={item.deltas} />}
    </li>
  )
}
