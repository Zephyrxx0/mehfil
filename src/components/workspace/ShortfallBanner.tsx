'use client'

import React from 'react'
import type { Plan, ShortfallRemedy } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { AlertTriangle, RotateCcw, ArrowRight } from 'lucide-react'

interface ShortfallBannerProps {
  plan: Plan
  previousGuestCount?: number
  onApplyRemedy: (remedy: ShortfallRemedy) => void
  onUndo?: () => void
}

export function ShortfallBanner({
  plan,
  previousGuestCount,
  onApplyRemedy,
  onUndo,
}: ShortfallBannerProps) {
  if (!plan.isInfeasible || !plan.shortfallPaise) return null

  return (
    <div className="rounded-2xl border border-red-300 bg-red-50/90 p-4 sm:p-5 text-red-950 shadow-sm transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="rounded-full bg-red-100 p-2 text-red-700 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-serif font-bold text-base text-red-950">
                Budget Balancing Shortfall: {formatINR(plan.shortfallPaise)}
              </h4>
              <span className="rounded-full bg-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-900">
                ADR-0002 Permissive Mode
              </span>
            </div>
            <p className="mt-1 text-xs text-red-900/80 max-w-xl">
              Guest count scale exceeded available donor capacity without breaching the 40% floor on flexible lines.
              The celebration plan is displayed with minimum floors clamped. Choose a deterministic remedy below:
            </p>
          </div>
        </div>

        {onUndo && previousGuestCount !== undefined && (
          <button
            type="button"
            onClick={onUndo}
            className="inline-flex items-center gap-1.5 self-start rounded-full border border-red-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-900 shadow-sm hover:bg-red-50 transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo to {previousGuestCount} Guests</span>
          </button>
        )}
      </div>

      {/* Deterministic Remedies */}
      {plan.remedies && plan.remedies.length > 0 && (
        <div className="mt-4 pt-3 border-t border-red-200/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-900/70 mb-2">
            Recommended Balancing Actions:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {plan.remedies.map((remedy, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-xl border border-red-200 bg-white/80 p-3 shadow-xs"
              >
                <div>
                  <span className="text-xs font-bold text-red-950">{remedy.title}</span>
                  <p className="mt-0.5 text-xs text-red-900/70">{remedy.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onApplyRemedy(remedy)}
                  className="mt-2.5 inline-flex items-center justify-between rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-900 hover:bg-red-200 transition"
                >
                  <span>Apply</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

