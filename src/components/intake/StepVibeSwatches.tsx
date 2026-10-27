'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import { Check, AlertCircle, Sparkles } from 'lucide-react'
import {
  SWATCHES,
  SWATCH_PRESET_TAGS,
  type SwatchPresetTag,
  type StyleSwatch,
} from '@/data/swatches'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StepVibeSwatchesProps {
  selectedSwatchIds: string[]
  onChange: (ids: string[]) => void
  onConfirm?: () => void
  showCta?: boolean
}

type FilterTag = 'All' | SwatchPresetTag

const ALL_FILTERS: readonly FilterTag[] = ['All', ...SWATCH_PRESET_TAGS]

export function StepVibeSwatches({
  selectedSwatchIds,
  onChange,
  onConfirm,
  showCta = false,
}: StepVibeSwatchesProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTag>('All')
  const [shake, setShake] = useState(false)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({})

  const filteredSwatches =
    activeFilter === 'All'
      ? SWATCHES
      : SWATCHES.filter((s) => s.tags.includes(activeFilter as SwatchPresetTag))

  const count = selectedSwatchIds.length
  const isReady = count >= 6 && count <= 8

  const handleToggleSwatch = (id: string) => {
    if (selectedSwatchIds.includes(id)) {
      onChange(selectedSwatchIds.filter((item) => item !== id))
      setWarningMessage(null)
    } else {
      if (selectedSwatchIds.length >= 8) {
        setShake(true)
        setWarningMessage('Maximum 8 swatches reached. Tap a selected swatch to deselect.')
        setTimeout(() => setShake(false), 200)
        return
      }
      setWarningMessage(null)
      onChange([...selectedSwatchIds, id])
    }
  }

  const handleImageError = (id: string) => {
    setBrokenImages((prev) => ({ ...prev, [id]: true }))
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header Info & Counter Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h3 className="font-serif text-lg font-bold text-royal-plum">
            Visual Vibe Gallery
          </h3>
          <p className="text-xs text-royal-plum/70">
            Select 6 to 8 visual references to calibrate your celebration&apos;s aesthetic Style DNA.
          </p>
        </div>

        {/* Counter Pill with Spring Bounce & Shake Physics (D-03, 04-UI-SPEC.md) */}
        <motion.div
          animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="self-start sm:self-auto"
        >
          {isReady ? (
            <motion.div
              key="ready-pill"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-marigold px-3.5 py-1 text-xs font-semibold text-royal-plum shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-royal-plum" />
              <span>Ready! {count}/8 vibes selected</span>
            </motion.div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-royal-plum/15 bg-royal-plum/5 px-3.5 py-1 text-xs font-medium text-royal-plum/75">
              <span>Pick 6 to 8 vibes ({count}/8 selected)</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Warning Alert for 9th Swatch Overflow */}
      <AnimatePresence>
        {warningMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-900"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
            <span>{warningMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preset Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {ALL_FILTERS.map((tag) => {
          const isActive = activeFilter === tag
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveFilter(tag)}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all',
                isActive
                  ? 'bg-royal-plum text-warm-ivory shadow-xs'
                  : 'bg-warm-ivory/80 border border-royal-plum/15 text-royal-plum/70 hover:bg-royal-plum/5 hover:text-royal-plum'
              )}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {/* Swatch Selection Grid */}
      {filteredSwatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-royal-plum/20 rounded-2xl bg-royal-plum/5">
          <h4 className="font-serif font-semibold text-royal-plum text-sm">
            No style swatches selected yet
          </h4>
          <p className="text-xs text-royal-plum/60 mt-1 max-w-sm">
            Tap 6 to 8 visual references above to extract your celebration&apos;s unique Style DNA.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredSwatches.map((swatch) => {
            const isSelected = selectedSwatchIds.includes(swatch.id)
            const hasError = brokenImages[swatch.id]
            const imgSrc = hasError ? swatch.svgFallback : swatch.image

            return (
              <motion.div
                key={swatch.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleToggleSwatch(swatch.id)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    handleToggleSwatch(swatch.id)
                  }
                }}
                className={cn(
                  'group relative flex flex-col overflow-hidden rounded-xl border bg-white text-left transition-all cursor-pointer focus:outline-hidden',
                  isSelected
                    ? 'border-marigold ring-2 ring-marigold shadow-md'
                    : 'border-royal-plum/10 hover:border-royal-plum/30 hover:shadow-xs'
                )}
              >
                {/* Visual Thumbnail */}
                <div className="relative h-24 sm:h-28 w-full bg-royal-plum/5 overflow-hidden">
                  <Image
                    src={imgSrc}
                    alt={swatch.title}
                    width={260}
                    height={160}
                    unoptimized
                    onError={() => handleImageError(swatch.id)}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Active Gulabi Rose Checkmark Badge */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gulabi-rose text-royal-plum shadow-xs">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Palette Preview Dots */}
                  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-xs px-1.5 py-0.5">
                    {swatch.palette.slice(0, 4).map((hex, i) => (
                      <span
                        key={i}
                        className="h-2 w-2 rounded-full border border-white/40"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Text Details */}
                <div className="p-2 sm:p-2.5 flex flex-col justify-between flex-1 gap-1">
                  <div>
                    <h4 className="text-xs font-semibold text-royal-plum leading-snug line-clamp-1">
                      {swatch.title}
                    </h4>
                    <p className="text-2xs text-royal-plum/65 line-clamp-2 leading-tight mt-0.5">
                      {swatch.description}
                    </p>
                  </div>
                  <div className="text-3xs uppercase font-medium text-royal-plum/45 tracking-wider">
                    {swatch.tags[0]}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Optional Standalone Primary CTA */}
      {showCta && (
        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            disabled={!isReady}
            aria-disabled={!isReady}
            onClick={onConfirm}
            className={cn(
              'h-10 px-5 text-xs font-semibold transition-all',
              isReady
                ? 'bg-marigold text-royal-plum hover:bg-marigold/90 shadow-xs'
                : 'bg-royal-plum/20 text-royal-plum/50 cursor-not-allowed'
            )}
          >
            Confirm 6 to 8 Vibes
          </Button>
        </div>
      )}
    </div>
  )
}
