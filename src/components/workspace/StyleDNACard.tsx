'use client'

import React, { useState } from 'react'
import type { Plan, PlanVersionRecord } from '@/lib/engine/types'
import type { StyleDNA, StyleDimensions } from '@/lib/ai/schemas'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { StyleDNARetuneSheet } from './StyleDNARetuneSheet'

export interface StyleDNACardProps {
  plan: Plan
  currentVersion?: PlanVersionRecord
  isReadOnly?: boolean
  isExtracting?: boolean
  onRetuneStyle?: (newDimensions: StyleDimensions) => void
  onResetToBaseline?: () => void
  onRetryExtraction?: () => void
}

const DIMENSION_LABELS: Record<keyof StyleDimensions, string> = {
  formality: 'Formality',
  energy: 'High Energy',
  scale: 'Grand Scale',
  heritageVsModern: 'Heritage',
  feastVsSpectacle: 'Spectacle',
  music: 'Music & Beats',
  decorDensity: 'Decor Density',
  indoorVsOutdoor: 'Open Air',
}

export function StyleDNACard({
  plan,
  currentVersion,
  isReadOnly = false,
  isExtracting = false,
  onRetuneStyle,
  onResetToBaseline,
  onRetryExtraction,
}: StyleDNACardProps) {
  const [isRetuneOpen, setIsRetuneOpen] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  const styleDNA: StyleDNA | undefined = plan.styleDNA || currentVersion?.meta?.styleDNA
  const runRecord = currentVersion?.meta?.run_record || (plan as any).meta?.run_record
  const isFallbackTier = runRecord?.activeTier === 3

  // Fallback default style profile if none yet attached
  const defaultDimensions: StyleDimensions = {
    formality: 65,
    energy: 70,
    scale: 60,
    heritageVsModern: 40,
    feastVsSpectacle: 55,
    music: 75,
    decorDensity: 70,
    indoorVsOutdoor: 60,
  }

  const dimensions = styleDNA?.dimensions || defaultDimensions

  // Extract top 3 highest dimension traits
  const topDimensions = (Object.entries(dimensions) as [keyof StyleDimensions, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  const palette = styleDNA?.namedPalette || [
    { name: 'Marigold Amber', hex: '#F7C873' },
    { name: 'Gulabi Rose', hex: '#F2A7B8' },
    { name: 'Royal Plum', hex: '#3A2442' },
    { name: 'Warm Ivory', hex: '#FFF8EE' },
  ]

  const vibeStatement =
    styleDNA?.vibeStatement ||
    plan.brief.vibeStatement ||
    'A vibrant Indian celebration balanced with rich cultural traditions and modern elegance.'

  const protectedQuote = styleDNA?.protectedMomentQuote || plan.brief.protectedMomentQuote

  const handleRetry = async () => {
    if (!onRetryExtraction) return
    setIsRetrying(true)
    try {
      await onRetryExtraction()
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <>
      <section aria-labelledby="style-dna-heading" className="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3
              id="style-dna-heading"
              className="flex items-center gap-2.5 font-serif text-xl font-bold text-royal-plum"
            >
              <span
                aria-hidden="true"
                className="h-4 w-1 shrink-0 origin-bottom rounded-full bg-gradient-to-b from-marigold to-gulabi-rose motion-safe:animate-[mehfil-flourish_0.5s_cubic-bezier(0.22,1,0.36,1)_both]"
              />
              <span>Style DNA</span>
            </h3>
            <p className="mt-0.5 text-sm text-royal-plum/60">Aesthetic Identity</p>
          </div>

          {!isReadOnly && onRetuneStyle && (
            <Button type="button" variant="outline" size="sm" onClick={() => setIsRetuneOpen(true)}>
              Edit Style DNA
            </Button>
          )}
        </div>

        {isExtracting ? (
          <div role="status" className="border-y border-royal-plum/10 py-10 text-center">
            <p className="text-base font-medium text-royal-plum">
              Analyzing visual vibes &amp; balancing allocations...
            </p>
            <p className="mt-1 text-sm text-royal-plum/60">
              Calibrating 8 aesthetic dimensions and protected floor
            </p>
          </div>
        ) : (
          <>
            <blockquote className="border-l-2 border-marigold pl-4">
              <p className="font-serif text-xl italic leading-relaxed text-royal-plum">
                &ldquo;{vibeStatement}&rdquo;
              </p>
            </blockquote>

            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold text-royal-plum">Named Festive Palette</h4>
                <TooltipProvider>
                  <ul className="mt-3 flex flex-col gap-2">
                    {palette.map((color, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className="h-6 w-6 shrink-0 rounded-full border border-royal-plum/20"
                              style={{ backgroundColor: color.hex }}
                              aria-label={`${color.name} (${color.hex})`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <span className="font-semibold">{color.name}</span>
                            <span className="ml-1 font-mono text-royal-plum/60">{color.hex}</span>
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-royal-plum">{color.name}</span>
                        <span className="font-mono text-xs text-royal-plum/50">{color.hex}</span>
                      </li>
                    ))}
                  </ul>
                </TooltipProvider>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-royal-plum">Dominant Dimensions</h4>
                <ul className="mt-3 flex flex-col gap-3">
                  {topDimensions.map(([key, value]) => (
                    <li key={key}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-royal-plum">{DIMENSION_LABELS[key] || key}</span>
                        <span className="font-semibold tabular-nums text-royal-plum">{value}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-royal-plum/10">
                        <div
                          className="h-full rounded-full bg-marigold"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {protectedQuote && (
              <div className="border-l-2 border-gulabi-rose bg-gulabi-rose/10 px-4 py-3">
                <h4 className="text-sm font-semibold text-royal-plum">Protected Moment Quote</h4>
                <p className="mt-1 font-serif text-base italic text-royal-plum">
                  &ldquo;{protectedQuote}&rdquo;
                </p>
              </div>
            )}

            {/* Calm Degradation Note (D-14, 04-UI-SPEC.md §Copywriting) */}
            {isFallbackTier && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-y border-royal-plum/10 py-3">
                <p className="text-sm text-royal-plum/75">
                  Showing standard style profile for now; your custom vibe will be infused when you
                  retry.
                </p>
                {onRetryExtraction && !isReadOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isRetrying}
                    onClick={handleRetry}
                  >
                    {isRetrying ? 'Retrying...' : 'Retry Extraction'}
                  </Button>
                )}
              </div>
            )}

            {/* Reset to Baseline (v1) destructive action (D-11) */}
            {!isReadOnly && onResetToBaseline && (
              <div className="border-t border-royal-plum/10 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsResetDialogOpen(true)}
                  className="-ml-3 text-royal-plum/70 hover:bg-terracotta/10 hover:text-terracotta"
                >
                  Reset to Baseline (v1)
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Retune Sliders Sheet */}
      {onRetuneStyle && (
        <StyleDNARetuneSheet
          open={isRetuneOpen}
          onOpenChange={setIsRetuneOpen}
          initialDimensions={dimensions}
          onSave={onRetuneStyle}
        />
      )}

      {/* Two-Stage Confirmation Dialog for Reset to Baseline (v1) (D-11, T-04-08) */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-lg font-bold text-royal-plum">
              Reset to Baseline (v1)?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-royal-plum/70 leading-relaxed">
              Reset celebration plan to baseline archetype? All custom vibe multipliers will be
              reverted to default weights. Your current plan remains safely saved in version
              history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs font-semibold text-royal-plum">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onResetToBaseline?.()
                setIsResetDialogOpen(false)
              }}
              className="bg-terracotta text-white hover:bg-terracotta/90 text-xs font-semibold"
            >
              Reset to Baseline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
