'use client'

import React, { useState } from 'react'
import type { Plan, PlanVersionRecord } from '@/lib/engine/types'
import type { StyleDNA, StyleDimensions } from '@/lib/ai/schemas'
import {
  Palette,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  RefreshCw,
  Lock,
  Quote,
  Info,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
import { cn } from '@/lib/utils'

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

  const protectedQuote =
    styleDNA?.protectedMomentQuote ||
    plan.brief.protectedMomentQuote

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
      <Card className="rounded-2xl border border-royal-plum/10 bg-warm-ivory shadow-xs overflow-hidden">
        {/* Card Header */}
        <CardHeader className="p-4 pb-3 border-b border-royal-plum/8 bg-white/50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-marigold/30 text-royal-plum">
              <Palette className="w-4 h-4 text-royal-plum" />
            </div>
            <div>
              <CardTitle className="font-serif text-sm font-bold text-royal-plum flex items-center gap-1.5">
                <span>Style DNA</span>
                <span className="text-2xs font-sans font-normal text-royal-plum/50">&bull; Aesthetic Identity</span>
              </CardTitle>
            </div>
          </div>

          {!isReadOnly && onRetuneStyle && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRetuneOpen(true)}
              className="h-7 gap-1 px-2.5 text-2xs font-semibold text-royal-plum border-royal-plum/20 hover:bg-royal-plum/5"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Edit Style DNA</span>
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-4 flex flex-col gap-3.5">
          {/* Loading Beat 1 Pulse State */}
          {isExtracting ? (
            <div className="flex flex-col items-center justify-center py-6 text-center animate-pulse">
              <Sparkles className="w-6 h-6 text-marigold animate-spin mb-2" />
              <p className="text-xs font-semibold text-royal-plum">
                Analyzing visual vibes & balancing allocations...
              </p>
              <p className="text-3xs text-royal-plum/60 mt-0.5">
                Calibrating 8 aesthetic dimensions and protected floor
              </p>
            </div>
          ) : (
            <>
              {/* 1-Sentence Vibe Statement in Fraunces Display Styling */}
              <div className="relative pl-3 border-l-2 border-marigold">
                <p className="font-serif italic text-xs text-royal-plum leading-relaxed">
                  &ldquo;{vibeStatement}&rdquo;
                </p>
              </div>

              {/* Named Palette Swatches */}
              <div className="flex flex-col gap-1.5">
                <span className="text-3xs uppercase tracking-wider font-semibold text-royal-plum/50">
                  Named Festive Palette
                </span>
                <TooltipProvider>
                  <div className="flex items-center gap-2">
                    {palette.map((color, idx) => (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          <div
                            className="h-6 w-6 rounded-full border border-royal-plum/20 shadow-2xs cursor-help transition-transform hover:scale-110"
                            style={{ backgroundColor: color.hex }}
                            aria-label={`${color.name} (${color.hex})`}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-2xs">
                          <span className="font-semibold">{color.name}</span>
                          <span className="text-royal-plum/60 ml-1 font-mono">{color.hex}</span>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              </div>

              {/* Top Dimension Trait Badges */}
              <div className="flex flex-col gap-1.5">
                <span className="text-3xs uppercase tracking-wider font-semibold text-royal-plum/50">
                  Dominant Dimensions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {topDimensions.map(([key, value]) => (
                    <Badge
                      key={key}
                      variant="outline"
                      className="text-2xs font-medium border-royal-plum/15 bg-white/70 text-royal-plum flex items-center gap-1"
                    >
                      <span>{DIMENSION_LABELS[key] || key}:</span>
                      <span className="font-mono font-bold tabular-nums">{value}%</span>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Protected Moment Quote Cardlet */}
              {protectedQuote && (
                <div className="rounded-xl border border-gulabi-rose/30 bg-gulabi-rose/15 p-2.5 flex items-start gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gulabi-rose text-royal-plum mt-0.5">
                    <Lock className="w-2.5 h-2.5 fill-royal-plum" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-3xs uppercase font-bold tracking-wider text-royal-plum/80">
                      Protected Moment Quote
                    </span>
                    <p className="font-serif italic text-2xs text-royal-plum leading-snug line-clamp-2">
                      &ldquo;{protectedQuote}&rdquo;
                    </p>
                  </div>
                </div>
              )}

              {/* Calm Degradation Note (D-14, 04-UI-SPEC.md §Copywriting) */}
              {isFallbackTier && (
                <div className="rounded-xl border border-royal-plum/10 bg-white/80 p-3 flex flex-col gap-2">
                  <div className="flex items-start gap-2 text-xs text-royal-plum/75">
                    <Info className="w-4 h-4 text-marigold shrink-0 mt-0.5" />
                    <p className="text-2xs leading-relaxed">
                      Showing standard style profile for now; your custom vibe will be infused when you retry.
                    </p>
                  </div>

                  {onRetryExtraction && !isReadOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isRetrying}
                      onClick={handleRetry}
                      className="self-end h-6 px-2.5 text-3xs font-semibold text-royal-plum border-royal-plum/20 hover:bg-royal-plum/5"
                    >
                      <RefreshCw className={cn('w-2.5 h-2.5 mr-1', isRetrying && 'animate-spin')} />
                      <span>{isRetrying ? 'Retrying...' : 'Retry Extraction'}</span>
                    </Button>
                  )}
                </div>
              )}

              {/* Footer: Reset to Baseline (v1) destructive action (D-11) */}
              {!isReadOnly && onResetToBaseline && (
                <div className="border-t border-royal-plum/8 pt-2.5 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsResetDialogOpen(true)}
                    className="h-6 px-2 text-3xs font-medium text-royal-plum/60 hover:text-terracotta hover:bg-terracotta/10 transition-colors"
                  >
                    <RotateCcw className="w-2.5 h-2.5 mr-1" />
                    <span>Reset to Baseline (v1)</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
              Reset celebration plan to baseline archetype? All custom vibe multipliers will be reverted to default weights. Your current plan remains safely saved in version history.
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
