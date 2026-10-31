'use client'

import React, { useState, useEffect } from 'react'
import type { StyleDimensions } from '@/lib/ai/schemas'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

export interface StyleDNARetuneSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDimensions?: StyleDimensions
  onSave: (retunedDimensions: StyleDimensions) => void
}

interface DimensionConfig {
  key: keyof StyleDimensions
  label: string
  lowLabel: string
  highLabel: string
}

const DIMENSION_CONFIGS: DimensionConfig[] = [
  {
    key: 'formality',
    label: 'Formality',
    lowLabel: 'Casual & Relaxed',
    highLabel: 'Strict Black-Tie / Royal',
  },
  {
    key: 'energy',
    label: 'Energy Level',
    lowLabel: 'Mellow Ambiance',
    highLabel: 'Electric Dance / Dhol',
  },
  {
    key: 'scale',
    label: 'Celebration Scale',
    lowLabel: 'Intimate Gathering',
    highLabel: 'Massive Extravaganza',
  },
  {
    key: 'heritageVsModern',
    label: 'Heritage vs Modern',
    lowLabel: 'Classic Heirloom',
    highLabel: 'Contemporary Chic',
  },
  {
    key: 'feastVsSpectacle',
    label: 'Feast vs Spectacle',
    lowLabel: 'Culinary Feast Priority',
    highLabel: 'Stage & Visual Production',
  },
  {
    key: 'music',
    label: 'Musical Vibe',
    lowLabel: 'Soulful Instrumental / Qawwali',
    highLabel: 'DJ / High-Energy Beats',
  },
  {
    key: 'decorDensity',
    label: 'Decor Density',
    lowLabel: 'Minimalist Accents',
    highLabel: 'Immersive Floral Canopies',
  },
  {
    key: 'indoorVsOutdoor',
    label: 'Setting & Venue',
    lowLabel: 'Cozy Indoor Ballroom',
    highLabel: 'Open-Air Lawn & Courtyard',
  },
]

const DEFAULT_DIMENSIONS: StyleDimensions = {
  formality: 65,
  energy: 70,
  scale: 60,
  heritageVsModern: 40,
  feastVsSpectacle: 55,
  music: 75,
  decorDensity: 70,
  indoorVsOutdoor: 60,
}

export function StyleDNARetuneSheet({
  open,
  onOpenChange,
  initialDimensions,
  onSave,
}: StyleDNARetuneSheetProps) {
  const [dimensions, setDimensions] = useState<StyleDimensions>(
    initialDimensions || DEFAULT_DIMENSIONS
  )

  useEffect(() => {
    if (initialDimensions) {
      setDimensions(initialDimensions)
    }
  }, [initialDimensions, open])

  const handleSliderChange = (key: keyof StyleDimensions, value: number) => {
    setDimensions((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSave = () => {
    onSave(dimensions)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto flex flex-col justify-between"
      >
        <div className="flex flex-col gap-5">
          <SheetHeader className="border-b border-royal-plum/10 pb-4">
            <SheetTitle className="font-serif text-xl font-bold text-royal-plum flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-marigold" aria-hidden="true" />
              <span>Retune Style DNA</span>
            </SheetTitle>
            <SheetDescription className="text-xs text-royal-plum/70">
              Fine-tune the 8 aesthetic dimension sliders to dynamically adjust budget multipliers
              while keeping integer paise invariants locked.
            </SheetDescription>
          </SheetHeader>

          {/* 8 Dimension Sliders */}
          <div className="flex flex-col gap-5 py-2">
            {DIMENSION_CONFIGS.map(({ key, label, lowLabel, highLabel }) => {
              const val = dimensions[key]
              return (
                <div key={key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-royal-plum">{label}</span>
                    <span className="font-mono text-2xs font-bold text-royal-plum tabular-nums">
                      {val}%
                    </span>
                  </div>

                  <Slider
                    value={[val]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([newVal]) => handleSliderChange(key, newVal ?? val)}
                    className="py-1"
                    aria-label={`Adjust ${label}`}
                  />

                  <div className="flex items-center justify-between text-3xs text-royal-plum/70">
                    <span>{lowLabel}</span>
                    <span>{highLabel}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <SheetFooter className="border-t border-royal-plum/10 pt-4 mt-6">
          <div className="flex w-full items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold text-royal-plum"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="bg-marigold text-royal-plum hover:bg-marigold/90 text-xs font-semibold shadow-xs"
            >
              Save Retuned Style
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
