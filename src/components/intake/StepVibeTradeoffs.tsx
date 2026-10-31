'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Check, ShieldCheck, Utensils, Sparkles, Users, Crown, Landmark, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface VibeTradeoffs {
  feastVsSpectacle: 'feast' | 'spectacle'
  intimateVsGrand: 'intimate' | 'grand'
  heritageVsModern: 'heritage' | 'modern'
}

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
  const charCount = protectedMoment.length

  const handleUpdate = <K extends keyof VibeTradeoffs>(key: K, value: VibeTradeoffs[K]) => {
    onTradeoffsChange({
      ...tradeoffs,
      [key]: value,
    })
  }

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

      {/* Section 1: Single-Sentence Protected Moment Input (D-04, MOMENT-01) */}
      <div className="flex flex-col gap-2 self-start rounded-2xl border border-royal-plum/10 bg-white/70 p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <label
            htmlFor="protected-moment-input"
            className="flex items-center gap-1.5 text-xs font-semibold text-royal-plum"
          >
            <ShieldCheck className="w-4 h-4 text-gulabi-rose" />
            <span>Single-Sentence Protected Moment (Immune from Trimming)</span>
          </label>
          <span
            className={cn(
              'text-xs font-mono tabular-nums',
              charCount >= 190 ? 'text-amber-800 font-bold' : 'text-royal-plum/50'
            )}
          >
            ({charCount}/200)
          </span>
        </div>

        <textarea
          id="protected-moment-input"
          value={protectedMoment}
          onChange={(e) => onProtectedMomentChange(e.target.value.slice(0, 200))}
          maxLength={200}
          rows={5}
          placeholder="e.g. Live soulful qawwali night under fairy lights"
          className="w-full resize-none rounded-xl border border-royal-plum/15 bg-warm-ivory/60 p-3 text-sm text-royal-plum placeholder:text-royal-plum/40 focus:border-royal-plum/50 focus:outline-hidden focus:ring-1 focus:ring-royal-plum/20"
        />

        <p className="text-xs text-royal-plum/55">
          This vision statement locks a 1.25x floor multiplier on its matching budget line so it
          will never be trimmed.
        </p>
      </div>

      {/* Section 2: Three Forced-Choice Trade-Off Card Pairs (D-04) */}
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-semibold text-royal-plum uppercase tracking-wider">
          Aesthetic Priorities (Forced-Choice)
        </h4>

        {/* Trade-off 1: Feast vs Spectacle */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-royal-plum/70">
            1. Dining vs Visual Drama
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Option A: Feast */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => handleUpdate('feastVsSpectacle', 'feast')}
              role="radio"
              aria-checked={tradeoffs.feastVsSpectacle === 'feast'}
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === ' ' || e.key === 'Enter') && handleUpdate('feastVsSpectacle', 'feast')
              }
              className={cn(
                'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                tradeoffs.feastVsSpectacle === 'feast'
                  ? 'border-marigold bg-marigold/15 shadow-xs ring-1 ring-marigold'
                  : 'border-royal-plum/10 bg-white/70 hover:border-royal-plum/25'
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-royal-plum/5 text-royal-plum">
                  <Utensils className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-royal-plum leading-snug">
                    Sumptuous Multi-Course Dining
                  </span>
                  <span className="text-xs text-royal-plum/60 leading-snug">
                    Focus on culinary craft, live stations & feasts
                  </span>
                </div>
              </div>
              {tradeoffs.feastVsSpectacle === 'feast' && (
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-marigold text-royal-plum">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
              )}
            </motion.div>

            {/* Option B: Spectacle */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => handleUpdate('feastVsSpectacle', 'spectacle')}
              role="radio"
              aria-checked={tradeoffs.feastVsSpectacle === 'spectacle'}
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === ' ' || e.key === 'Enter') &&
                handleUpdate('feastVsSpectacle', 'spectacle')
              }
              className={cn(
                'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                tradeoffs.feastVsSpectacle === 'spectacle'
                  ? 'border-marigold bg-marigold/15 shadow-xs ring-1 ring-marigold'
                  : 'border-royal-plum/10 bg-white/70 hover:border-royal-plum/25'
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-royal-plum/5 text-royal-plum">
                  <Sparkles className="w-3.5 h-3.5 text-marigold" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-royal-plum leading-snug">
                    Dazzling Stage & Visual Production
                  </span>
                  <span className="text-xs text-royal-plum/60 leading-snug">
                    High impact lighting, grand sets & stagecraft
                  </span>
                </div>
              </div>
              {tradeoffs.feastVsSpectacle === 'spectacle' && (
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-marigold text-royal-plum">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Trade-off 2: Intimate vs Grand */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-royal-plum/70">2. Gathering Energy</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Option A: Intimate */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => handleUpdate('intimateVsGrand', 'intimate')}
              role="radio"
              aria-checked={tradeoffs.intimateVsGrand === 'intimate'}
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === ' ' || e.key === 'Enter') && handleUpdate('intimateVsGrand', 'intimate')
              }
              className={cn(
                'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                tradeoffs.intimateVsGrand === 'intimate'
                  ? 'border-marigold bg-marigold/15 shadow-xs ring-1 ring-marigold'
                  : 'border-royal-plum/10 bg-white/70 hover:border-royal-plum/25'
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-royal-plum/5 text-royal-plum">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-royal-plum leading-snug">
                    Warm & Cozy Close Circle
                  </span>
                  <span className="text-xs text-royal-plum/60 leading-snug">
                    Personal conversations, subtle music & intimacy
                  </span>
                </div>
              </div>
              {tradeoffs.intimateVsGrand === 'intimate' && (
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-marigold text-royal-plum">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
              )}
            </motion.div>

            {/* Option B: Grand */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => handleUpdate('intimateVsGrand', 'grand')}
              role="radio"
              aria-checked={tradeoffs.intimateVsGrand === 'grand'}
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === ' ' || e.key === 'Enter') && handleUpdate('intimateVsGrand', 'grand')
              }
              className={cn(
                'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                tradeoffs.intimateVsGrand === 'grand'
                  ? 'border-marigold bg-marigold/15 shadow-xs ring-1 ring-marigold'
                  : 'border-royal-plum/10 bg-white/70 hover:border-royal-plum/25'
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-royal-plum/5 text-royal-plum">
                  <Crown className="w-3.5 h-3.5 text-royal-plum" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-royal-plum leading-snug">
                    Grand High-Energy Extravaganza
                  </span>
                  <span className="text-xs text-royal-plum/60 leading-snug">
                    Expansive scale, electric beats & large crowd
                  </span>
                </div>
              </div>
              {tradeoffs.intimateVsGrand === 'grand' && (
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-marigold text-royal-plum">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Trade-off 3: Heritage vs Modern */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-royal-plum/70">3. Cultural Styling</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Option A: Heritage */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => handleUpdate('heritageVsModern', 'heritage')}
              role="radio"
              aria-checked={tradeoffs.heritageVsModern === 'heritage'}
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === ' ' || e.key === 'Enter') && handleUpdate('heritageVsModern', 'heritage')
              }
              className={cn(
                'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                tradeoffs.heritageVsModern === 'heritage'
                  ? 'border-marigold bg-marigold/15 shadow-xs ring-1 ring-marigold'
                  : 'border-royal-plum/10 bg-white/70 hover:border-royal-plum/25'
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-royal-plum/5 text-royal-plum">
                  <Landmark className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-royal-plum leading-snug">
                    Timeless Rituals & Cultural Craft
                  </span>
                  <span className="text-xs text-royal-plum/60 leading-snug">
                    Traditional fabrics, classic motifs & heirloom touches
                  </span>
                </div>
              </div>
              {tradeoffs.heritageVsModern === 'heritage' && (
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-marigold text-royal-plum">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
              )}
            </motion.div>

            {/* Option B: Modern */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => handleUpdate('heritageVsModern', 'modern')}
              role="radio"
              aria-checked={tradeoffs.heritageVsModern === 'modern'}
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === ' ' || e.key === 'Enter') && handleUpdate('heritageVsModern', 'modern')
              }
              className={cn(
                'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                tradeoffs.heritageVsModern === 'modern'
                  ? 'border-marigold bg-marigold/15 shadow-xs ring-1 ring-marigold'
                  : 'border-royal-plum/10 bg-white/70 hover:border-royal-plum/25'
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-royal-plum/5 text-royal-plum">
                  <Zap className="w-3.5 h-3.5 text-royal-plum" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-royal-plum leading-snug">
                    Contemporary Chic & Minimalist Elegance
                  </span>
                  <span className="text-xs text-royal-plum/60 leading-snug">
                    Clean lines, architectural floral styling & modern palettes
                  </span>
                </div>
              </div>
              {tradeoffs.heritageVsModern === 'modern' && (
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-marigold text-royal-plum">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
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
