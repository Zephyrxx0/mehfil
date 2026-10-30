'use client'

import React from 'react'
import type { MilestoneBand as MilestoneBandType } from '@/lib/engine/types'
import { cn } from '@/lib/utils'

interface MilestoneBandProps {
  band: MilestoneBandType
}

const CATEGORY_NAMES: Record<string, string> = {
  venue: 'Venue & Stage',
  catering: 'Catering & Meals',
  decor: 'Decor & Flowers',
  photo_film: 'Photography & Film',
  entertainment: 'Entertainment',
  favors: 'Favors & Invites',
  misc: 'Miscellaneous',
  contingency: 'Contingency Cash',
}

export function MilestoneBand({ band }: MilestoneBandProps) {
  const handleScrollToCategory = (category: string) => {
    const el = document.getElementById(`category-${category}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <li>
      <section
        aria-labelledby={`band-${band.id}`}
        className={cn(
          band.isImmediateAction &&
            'rounded-2xl border border-marigold/40 bg-marigold/10 p-4 shadow-xs sm:p-5'
        )}
      >
        <header
          className={cn(
            'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b pb-2',
            band.isImmediateAction ? 'border-marigold/30' : 'border-royal-plum/10'
          )}
        >
          <h4 id={`band-${band.id}`} className="flex items-center gap-2 font-serif text-lg font-bold text-royal-plum">
            {band.isImmediateAction && (
              <span
                aria-hidden="true"
                className="h-4 w-1 shrink-0 rounded-full bg-gradient-to-b from-marigold to-gulabi-rose"
              />
            )}
            {band.name}
            {band.isImmediateAction && (
              <span className="font-sans text-sm font-medium text-royal-plum/55">Sprint Triage</span>
            )}
          </h4>
          <p className="text-sm text-royal-plum/60">
            Target Date: <span className="font-medium tabular-nums text-royal-plum">{band.targetDate}</span>
          </p>
        </header>

        <ul className="divide-y divide-royal-plum/8">
          {band.tasks.map((task) => (
            <li
              key={task.id}
              className="group flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
            >
              <div className="min-w-0">
                <p className="text-base font-medium text-royal-plum">{task.title}</p>
                {task.notes && <p className="mt-0.5 text-sm text-royal-plum/60">{task.notes}</p>}
                {(task.isCriticalPath ||
                  (task.appliedBufferDays !== undefined && task.appliedBufferDays > 0) ||
                  task.environmentalRiskId) && (
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    {task.isCriticalPath && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-terracotta/10 px-2 py-0.5 font-semibold text-terracotta">
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-terracotta" />
                        Critical Path
                      </span>
                    )}
                    {task.appliedBufferDays !== undefined && task.appliedBufferDays > 0 && (
                      <span className="rounded-full bg-marigold/15 px-2 py-0.5 font-medium text-royal-plum/75">
                        +{task.appliedBufferDays}d peak buffer
                      </span>
                    )}
                    {task.environmentalRiskId && (
                      <span className="rounded-full bg-royal-plum/5 px-2 py-0.5 text-royal-plum/70">
                        {task.environmentalRiskId}
                      </span>
                    )}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleScrollToCategory(task.budgetCategory)}
                aria-label={`Jump to ${CATEGORY_NAMES[task.budgetCategory] || task.budgetCategory} in the budget`}
                title={`Jump to ${CATEGORY_NAMES[task.budgetCategory] || task.budgetCategory} in the budget`}
                className="w-fit shrink-0 rounded-full border border-royal-plum/10 bg-warm-ivory px-3 py-1 text-sm text-royal-plum/70 transition hover:border-royal-plum/25 hover:bg-white hover:text-royal-plum motion-safe:group-hover:border-royal-plum/20"
              >
                {CATEGORY_NAMES[task.budgetCategory] || task.budgetCategory}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </li>
  )
}
