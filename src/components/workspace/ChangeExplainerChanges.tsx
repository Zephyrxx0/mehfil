import React from 'react'
import type { PlanChangeRecord } from '@/lib/engine/types'
import { ChangeExplainerChangeItem } from './ChangeExplainerChangeItem'

export interface ChangeExplainerChangesProps {
  changeList: PlanChangeRecord[]
  isReadOnly: boolean
  onUndo?: (item: PlanChangeRecord, index: number) => void
}

/** Legacy change list for unpersisted drafting: header plus an empty state or one card per edit. */
export function ChangeExplainerChanges({
  changeList,
  isReadOnly,
  onUndo,
}: ChangeExplainerChangesProps) {
  return (
    <>
      <div>
        <h2 id="history-heading" className="font-serif text-xl font-bold text-royal-plum">
          Live Change Explainer
          <span className="ml-2 font-sans text-sm font-medium tabular-nums text-royal-plum/70">
            {changeList.length}
          </span>
        </h2>
        <p className="mt-0.5 text-sm text-royal-plum/70">
          Deterministic Hare-Niemeyer math balances budget in integer paise.
        </p>
      </div>

      {changeList.length === 0 ? (
        <div className="border-y border-royal-plum/10 py-10 text-center">
          <h3 className="font-serif text-base font-bold text-royal-plum">No recent changes</h3>
          <p className="mt-1 text-sm text-royal-plum/70">
            All allocations balanced. Adjust sliders to see live rebalancing.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-royal-plum/10 border-y border-royal-plum/10">
          {changeList.map((item, index) => (
            <ChangeExplainerChangeItem
              key={item.id || index}
              item={item}
              onUndo={onUndo && !isReadOnly ? () => onUndo(item, index) : undefined}
            />
          ))}
        </ul>
      )}
    </>
  )
}
