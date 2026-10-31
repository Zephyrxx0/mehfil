'use client'

import React from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'
import type { StyleSwatch } from '@/data/swatches'
import { cn } from '@/lib/utils'

interface VibeSwatchListProps {
  swatches: StyleSwatch[]
  selectedIds: string[]
  focusedId: string | undefined
  imageSrc: (swatch: StyleSwatch) => string
  onImageError: (id: string) => void
  onFocus: (id: string) => void
  onToggle: (id: string) => void
}

/** The master list: pick which reference to look at, and tick the ones to keep. */
export function VibeSwatchList({
  swatches,
  selectedIds,
  focusedId,
  imageSrc,
  onImageError,
  onFocus,
  onToggle,
}: VibeSwatchListProps) {
  if (swatches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-royal-plum/20 bg-royal-plum/5 p-6 text-center text-sm text-royal-plum/70">
        No references in these categories.
      </div>
    )
  }

  return (
    <ul
      aria-label="Vibe references"
      className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1 lg:max-h-none lg:min-h-0 lg:flex-1"
    >
      {swatches.map((swatch) => {
        const isSelected = selectedIds.includes(swatch.id)
        const isFocused = focusedId === swatch.id
        return (
          <li
            key={swatch.id}
            className={cn(
              'flex shrink-0 items-stretch overflow-hidden rounded-xl border transition',
              isFocused
                ? 'border-royal-plum bg-white shadow-xs'
                : 'border-royal-plum/10 bg-white/60 hover:border-royal-plum/30'
            )}
          >
            <button
              type="button"
              aria-current={isFocused ? 'true' : undefined}
              onClick={() => onFocus(swatch.id)}
              className="flex min-w-0 flex-1 items-center gap-3 p-2 text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-royal-plum"
            >
              <Image
                src={imageSrc(swatch)}
                alt=""
                width={56}
                height={56}
                unoptimized
                onError={() => onImageError(swatch.id)}
                className="h-12 w-12 shrink-0 rounded-lg bg-royal-plum/5 object-cover"
              />
              <span className="min-w-0 text-sm font-semibold leading-snug text-royal-plum [overflow-wrap:anywhere]">
                {swatch.title}
              </span>
            </button>
            <button
              type="button"
              aria-label={`Select ${swatch.title}`}
              aria-pressed={isSelected}
              onClick={() => onToggle(swatch.id)}
              className="flex w-11 shrink-0 items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-royal-plum"
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-md border transition',
                  isSelected
                    ? 'border-marigold bg-marigold text-royal-plum'
                    : 'border-royal-plum/25 bg-warm-ivory'
                )}
              >
                {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
