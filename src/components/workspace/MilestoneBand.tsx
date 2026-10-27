'use client'

import React from 'react'
import type { MilestoneBand as MilestoneBandType } from '@/lib/engine/types'
import { AlertCircle, Calendar, ArrowUpRight, CheckCircle2 } from 'lucide-react'

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
      el.classList.add('ring-2', 'ring-marigold')
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-marigold')
      }, 1500)
    }
  }

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all ${
        band.isImmediateAction
          ? 'border-amber-300 bg-amber-50/70 shadow-xs'
          : 'border-royal-plum/10 bg-white/70'
      }`}
    >
      {/* Band Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-royal-plum/8 pb-3">
        <div className="flex items-center gap-2">
          {band.isImmediateAction ? (
            <div className="rounded-full bg-amber-200 p-1 text-amber-900">
              <AlertCircle className="w-4 h-4" />
            </div>
          ) : (
            <div className="rounded-full bg-royal-plum/5 p-1 text-royal-plum/70">
              <Calendar className="w-4 h-4" />
            </div>
          )}

          <h4 className="font-serif font-bold text-base text-royal-plum">
            {band.name}
          </h4>

          {band.isImmediateAction && (
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-amber-900">
              Sprint Triage
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-royal-plum/70">
          <span>Target Date:</span>
          <span className="rounded-md bg-royal-plum/5 px-2 py-0.5 font-mono text-royal-plum">
            {band.targetDate}
          </span>
        </div>
      </div>

      {/* Task Checklist */}
      <div className="mt-3 flex flex-col gap-2.5">
        {band.tasks.map((task) => (
          <div
            key={task.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-royal-plum/5 bg-white/60 p-3 hover:bg-white transition"
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 text-royal-plum/30">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-royal-plum">
                    {task.title}
                  </span>
                  {task.isCriticalPath && (
                    <span className="rounded-full bg-red-100 px-1.5 py-0.2 text-3xs font-bold uppercase text-red-800">
                      Critical Path
                    </span>
                  )}
                </div>
                {task.notes && (
                  <p className="mt-0.5 text-xs text-royal-plum/60">{task.notes}</p>
                )}
              </div>
            </div>

            {/* Clickable Budget Category Pill (D-16) */}
            <button
              type="button"
              onClick={() => handleScrollToCategory(task.budgetCategory)}
              title={`Jump to ${CATEGORY_NAMES[task.budgetCategory] || task.budgetCategory} budget card`}
              className="inline-flex items-center gap-1 self-start sm:self-center rounded-full border border-royal-plum/15 bg-warm-ivory px-2.5 py-1 text-2xs font-semibold text-royal-plum/80 hover:border-marigold hover:bg-marigold/15 transition active:scale-95"
            >
              <span>{CATEGORY_NAMES[task.budgetCategory] || task.budgetCategory}</span>
              <ArrowUpRight className="w-3 h-3 text-royal-plum/40" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

