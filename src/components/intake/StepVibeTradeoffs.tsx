'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ProtectedMomentField } from './ProtectedMomentField'
import { TradeoffOptionCard } from './TradeoffOptionCard'
import { TRADEOFF_GROUPS, type VibeTradeoffs } from './tradeoffGroups'

export type { VibeTradeoffs }

interface StepVibeTradeoffsProps {
  protectedMoment: string
  onProtectedMomentChange: (moment: string) => void
  tradeoffs: VibeTradeoffs
  onTradeoffsChange: (tradeoffs: VibeTradeoffs) => void
  onInfuse?: () => void
  showCta?: boolean
  isLoading?: boolean
}

export function StepVibeTradeoffs({
  protectedMoment,
  onProtectedMomentChange,
  tradeoffs,
  onTradeoffsChange,
  onInfuse,
  showCta = false,
  isLoading = false,
}: StepVibeTradeoffsProps) {
  return (
    <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-10">
      {/* Step Header */}
      <div className="lg:col-span-2">
        <h3 className="font-serif text-lg font-bold text-royal-plum">
          Protected Moment & Festive Trade-offs
        </h3>
        <p className="text-xs text-royal-plum/70">
          Anchor your celebration&apos;s untouchable centerpiece and balance key aesthetic
          priorities.
        </p>
      </div>

      <ProtectedMomentField value={protectedMoment} onChange={onProtectedMomentChange} />

      {/* Three Forced-Choice Trade-Off Card Pairs (D-04) */}
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-semibold text-royal-plum uppercase tracking-wider">
          Aesthetic Priorities (Forced-Choice)
        </h4>

        {TRADEOFF_GROUPS.map((group) => (
          <div key={group.key} className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-royal-plum/70">{group.label}</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.options.map((option) => (
                <TradeoffOptionCard
                  key={option.value}
                  selected={tradeoffs[group.key] === option.value}
                  onSelect={() => onTradeoffsChange({ ...tradeoffs, [group.key]: option.value })}
                  icon={option.icon}
                  title={option.title}
                  description={option.description}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Optional Standalone Primary CTA */}
      {showCta && (
        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            disabled={isLoading}
            onClick={onInfuse}
            className="h-10 px-5 text-xs font-semibold bg-marigold text-royal-plum hover:bg-marigold/90 shadow-xs"
          >
            Infuse Style DNA
          </Button>
        </div>
      )}
    </div>
  )
}
