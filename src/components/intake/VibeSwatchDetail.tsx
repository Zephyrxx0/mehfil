'use client'

import React from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'
import type { StyleSwatch } from '@/data/swatches'
import { Button } from '@/components/ui/button'

const FEEL: { key: keyof StyleSwatch['dimensions']; label: string }[] = [
  { key: 'formality', label: 'Formality' },
  { key: 'energy', label: 'Energy' },
  { key: 'scale', label: 'Scale' },
  { key: 'decorDensity', label: 'Decor density' },
]

const SECTION_LABEL = 'mb-2 block text-xs font-semibold uppercase tracking-wider text-royal-plum/70'

function SwatchPalette({ palette }: { palette: string[] }) {
  return (
    <div>
      <span className={SECTION_LABEL}>Palette</span>
      <ul className="flex flex-wrap gap-2">
        {palette.map((hex) => (
          <li
            key={hex}
            className="flex items-center gap-1.5 text-xs tabular-nums text-royal-plum/70"
          >
            <span
              className="h-5 w-5 rounded-full border border-royal-plum/15"
              style={{ backgroundColor: hex }}
              aria-hidden="true"
            />
            {hex}
          </li>
        ))}
      </ul>
    </div>
  )
}

function SwatchFeel({ dimensions }: { dimensions: StyleSwatch['dimensions'] }) {
  return (
    <div>
      <span className={SECTION_LABEL}>Feel</span>
      <dl className="flex flex-col gap-1.5">
        {FEEL.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            <dt className="w-24 shrink-0 text-royal-plum/70">{label}</dt>
            <dd className="h-1.5 flex-1 overflow-hidden rounded-full bg-royal-plum/10">
              <div
                className="h-full rounded-full bg-marigold"
                style={{ width: `${dimensions[key]}%` }}
              />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

interface VibeSwatchDetailProps {
  swatch: StyleSwatch
  isSelected: boolean
  imageSrc: string
  onImageError: () => void
  onToggle: () => void
}

/** The reference in focus, shown in full so no title or description is cut short. */
export function VibeSwatchDetail({
  swatch,
  isSelected,
  imageSrc,
  onImageError,
  onToggle,
}: VibeSwatchDetailProps) {
  return (
    <article
      aria-label={`${swatch.title} details`}
      className="flex flex-col overflow-hidden rounded-2xl border border-royal-plum/10 bg-white shadow-xs lg:min-h-0 lg:overflow-y-auto"
    >
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-royal-plum/5 lg:aspect-auto lg:h-36">
        <Image
          src={imageSrc}
          alt={swatch.title}
          fill
          sizes="(min-width: 1024px) 600px, 100vw"
          unoptimized
          onError={onImageError}
          className="object-cover"
        />
        {isSelected && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-marigold px-3 py-1 text-xs font-semibold text-royal-plum shadow-xs">
            <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
            In your vibes
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pt-4 lg:px-5 lg:pt-5">
        <div>
          <h4 className="font-serif text-xl font-bold leading-snug text-royal-plum">
            {swatch.title}
          </h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {swatch.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-royal-plum/15 bg-royal-plum/5 px-2.5 py-0.5 text-xs font-medium text-royal-plum/80"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <p className="text-sm leading-relaxed text-royal-plum/80">{swatch.description}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <SwatchPalette palette={swatch.palette} />
          <SwatchFeel dimensions={swatch.dimensions} />
        </div>

        <div className="sticky bottom-0 -mx-4 mt-auto border-t border-royal-plum/10 bg-white px-4 py-3 lg:-mx-5 lg:px-5">
          <Button
            type="button"
            variant={isSelected ? 'outline' : 'default'}
            className="w-full sm:w-auto"
            onClick={onToggle}
          >
            {isSelected ? 'Remove from my vibes' : 'Add to my vibes'}
          </Button>
        </div>
      </div>
    </article>
  )
}
