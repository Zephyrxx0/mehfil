'use client'

import React from 'react'
import type { BudgetCategory, BudgetLine } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { Star, Shield, Lock } from 'lucide-react'

interface BudgetLineCardProps {
  line: BudgetLine
  totalBudgetPaise: number
  onSetProtected: (category: BudgetCategory) => void
}

const LINE_TYPE_LABELS: Record<string, string> = {
  fixed: 'Fixed',
  per_guest: 'Per Guest',
  flexible: 'Flexible (Donor)',
  buffer: 'Buffer',
}

export function BudgetLineCard({
  line,
  totalBudgetPaise,
  onSetProtected,
}: BudgetLineCardProps) {
  const percentage = totalBudgetPaise > 0
    ? ((line.currentPaise / totalBudgetPaise) * 100).toFixed(1)
    : '0'

  const delta = line.currentPaise - line.baselinePaise

  return (
    <div
      id={`category-${line.category}`}
      className={`relative rounded-2xl border p-4 transition-all duration-200 ${
        line.isProtected
          ? 'border-gulabi-rose bg-gulabi-rose/15 shadow-sm ring-1 ring-gulabi-rose/50'
          : 'border-royal-plum/10 bg-white/70 hover:border-royal-plum/25 hover:shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm text-royal-plum">{line.name}</h4>

            {line.isProtected ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gulabi-rose/30 px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-royal-plum">
                <Star className="w-3 h-3 fill-royal-plum text-royal-plum" />
                <span>Protected Moment</span>
              </span>
            ) : (
              <span className="rounded-md bg-royal-plum/5 px-1.5 py-0.5 text-2xs font-medium text-royal-plum/60">
                {LINE_TYPE_LABELS[line.lineType] || line.lineType}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-royal-plum/60">
            <span>{percentage}% of total budget</span>
            {line.lineType === 'flexible' && (
              <span className="text-2xs text-royal-plum/40">• 40% floor protected</span>
            )}
          </div>
        </div>

        {/* Amount & Change Pill */}
        <div className="flex flex-col items-end gap-1">
          <span className="font-serif font-bold text-base text-royal-plum">
            {formatINR(line.currentPaise)}
          </span>

          {delta !== 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-2xs font-bold ${
                delta > 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {delta > 0 ? `+${formatINR(delta)}` : `-${formatINR(Math.abs(delta))}`}
            </span>
          )}
        </div>
      </div>

      {/* Action Footer: Star toggle */}
      <div className="mt-3 flex items-center justify-between border-t border-royal-plum/8 pt-2.5">
        <span className="text-2xs uppercase tracking-wider text-royal-plum/40 font-mono">
          {line.category}
        </span>

        <button
          type="button"
          onClick={() => onSetProtected(line.category)}
          title={
            line.isProtected
              ? 'Currently Protected Moment (ADR-0004)'
              : 'Make this category your Protected Moment'
          }
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-semibold transition active:scale-95 ${
            line.isProtected
              ? 'bg-gulabi-rose/40 text-royal-plum'
              : 'bg-royal-plum/5 text-royal-plum/60 hover:bg-royal-plum/10 hover:text-royal-plum'
          }`}
        >
          {line.isProtected ? (
            <>
              <Lock className="w-2.5 h-2.5" />
              <span>Protected</span>
            </>
          ) : (
            <>
              <Star className="w-2.5 h-2.5" />
              <span>Set as Protected</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

