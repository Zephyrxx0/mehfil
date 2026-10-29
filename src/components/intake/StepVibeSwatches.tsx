'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import { AlertCircle, Check, Sparkles, Undo2 } from 'lucide-react'
import {
  SWATCHES,
  SWATCH_PRESET_TAGS,
  type StyleSwatch,
  type SwatchPresetTag,
} from '@/data/swatches'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { cn } from '@/lib/utils'
import { VIBE_MAX, VIBE_MIN } from '@/lib/vibe-limits'
import { DescribeVibeDialog, type VibeSuggestionResult } from './DescribeVibeDialog'

interface StepVibeSwatchesProps {
  selectedSwatchIds: string[]
  onChange: (ids: string[]) => void
  onConfirm?: () => void
  showCta?: boolean
}

const FEEL: { key: keyof StyleSwatch['dimensions']; label: string }[] = [
  { key: 'formality', label: 'Formality' },
  { key: 'energy', label: 'Energy' },
  { key: 'scale', label: 'Scale' },
  { key: 'decorDensity', label: 'Decor density' },
]

const TAG_COUNTS = Object.fromEntries(
  SWATCH_PRESET_TAGS.map((tag) => [tag, SWATCHES.filter((s) => s.tags.includes(tag)).length])
)

/**
 * Master-detail gallery. The left column filters by category (multi-select) and
 * lists the matching references; the right column shows the one in focus in full,
 * so no title or description is ever cut short.
 */
export function StepVibeSwatches({
  selectedSwatchIds,
  onChange,
  onConfirm,
  showCta = false,
}: StepVibeSwatchesProps) {
  const [categories, setCategories] = useState<SwatchPresetTag[]>([])
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({})
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantNote, setAssistantNote] = useState<{
    text: string
    previous: string[]
  } | null>(null)

  const filtered = useMemo(
    () =>
      categories.length === 0
        ? SWATCHES
        : SWATCHES.filter((s) => s.tags.some((tag) => categories.includes(tag))),
    [categories]
  )

  // The focused swatch, or the first in the list if it has been filtered away.
  const focused = filtered.find((s) => s.id === focusedId) ?? filtered[0]

  const count = selectedSwatchIds.length
  const isReady = count >= VIBE_MIN && count <= VIBE_MAX

  const toggle = (id: string) => {
    if (selectedSwatchIds.includes(id)) {
      onChange(selectedSwatchIds.filter((item) => item !== id))
      setWarningMessage(null)
      return
    }
    if (selectedSwatchIds.length >= VIBE_MAX) {
      setShake(true)
      setWarningMessage(`Maximum ${VIBE_MAX} swatches reached. Tap a selected swatch to deselect.`)
      setTimeout(() => setShake(false), 200)
      return
    }
    setWarningMessage(null)
    onChange([...selectedSwatchIds, id])
  }

  const applySuggestion = (result: VibeSuggestionResult) => {
    const ids = result.swatchIds.filter((id) => SWATCHES.some((s) => s.id === id)).slice(0, VIBE_MAX)
    if (ids.length === 0) return
    setAssistantNote({
      text: `${result.source === 'ai' ? 'Picked for you' : 'Matched for you'}: ${result.reasoning}`,
      previous: selectedSwatchIds,
    })
    setCategories([])
    setFocusedId(ids[0])
    setWarningMessage(null)
    onChange(ids)
  }

  const undoSuggestion = () => {
    if (!assistantNote) return
    onChange(assistantNote.previous)
    setAssistantNote(null)
  }

  const imgFor = (swatch: StyleSwatch) => (brokenImages[swatch.id] ? swatch.svgFallback : swatch.image)
  const markBroken = (id: string) => setBrokenImages((prev) => ({ ...prev, [id]: true }))

  return (
    <div className="flex w-full flex-col gap-4 lg:h-full lg:min-h-0">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-serif text-lg font-bold text-royal-plum">Visual Vibe Gallery</h3>
          <p className="text-sm text-royal-plum/70">
            Select {VIBE_MIN} to {VIBE_MAX} visual references to calibrate your celebration&apos;s aesthetic Style DNA.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0 self-start border-royal-plum/20 bg-white/60 sm:self-auto"
          onClick={() => setAssistantOpen(true)}
        >
          <Sparkles className="mr-2 h-4 w-4 text-marigold" aria-hidden="true" />
          Describe your vibe
        </Button>
      </div>

      <AnimatePresence>
        {warningMessage && (
          <motion.div
            key="warning"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-900"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" />
            <span>{warningMessage}</span>
          </motion.div>
        )}
        {assistantNote && (
          <motion.div
            key="assistant"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-start gap-2 rounded-lg border border-marigold/40 bg-marigold/15 px-3 py-2 text-sm text-royal-plum"
          >
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-royal-plum" aria-hidden="true" />
            <span className="flex-1">{assistantNote.text}</span>
            <button
              type="button"
              onClick={undoSuggestion}
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold underline-offset-2 hover:underline"
            >
              <Undo2 className="h-3 w-3" aria-hidden="true" />
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-6">
        {/* Left: category filter, status and list */}
        <div className="flex flex-col gap-3 lg:min-h-0">
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-royal-plum/70">
              Category
            </span>
            <MultiSelect
              aria-label="Category"
              options={SWATCH_PRESET_TAGS}
              value={categories}
              onChange={(next) => setCategories(next as SwatchPresetTag[])}
              allLabel="All categories"
              counts={TAG_COUNTS}
            />
          </div>

          <motion.div
            animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className={cn(
              'flex items-center gap-1.5 text-sm font-medium',
              isReady ? 'text-royal-plum' : 'text-royal-plum/70'
            )}
          >
            {isReady ? (
              <>
                <Sparkles className="h-4 w-4 text-marigold" aria-hidden="true" />
                <span>Ready! {count}/{VIBE_MAX} vibes selected</span>
              </>
            ) : (
              <span>Pick {VIBE_MIN} to {VIBE_MAX} vibes ({count}/{VIBE_MAX} selected)</span>
            )}
          </motion.div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-royal-plum/20 bg-royal-plum/5 p-6 text-center text-sm text-royal-plum/70">
              No references in these categories.
            </div>
          ) : (
            <ul
              aria-label="Vibe references"
              className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1 lg:max-h-none lg:min-h-0 lg:flex-1"
            >
              {filtered.map((swatch) => {
                const isSelected = selectedSwatchIds.includes(swatch.id)
                const isFocused = focused?.id === swatch.id
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
                      onClick={() => setFocusedId(swatch.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 p-2 text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-royal-plum"
                    >
                      <Image
                        src={imgFor(swatch)}
                        alt=""
                        width={56}
                        height={56}
                        unoptimized
                        onError={() => markBroken(swatch.id)}
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
                      onClick={() => toggle(swatch.id)}
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
          )}
        </div>

        {/* Right: the reference in focus, in full */}
        {focused && (
          <article
            aria-label={`${focused.title} details`}
            className="flex flex-col overflow-hidden rounded-2xl border border-royal-plum/10 bg-white shadow-xs lg:min-h-0 lg:overflow-y-auto"
          >
            <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-royal-plum/5 lg:aspect-auto lg:h-36">
              <Image
                src={imgFor(focused)}
                alt={focused.title}
                fill
                sizes="(min-width: 1024px) 600px, 100vw"
                unoptimized
                onError={() => markBroken(focused.id)}
                className="object-cover"
              />
              {selectedSwatchIds.includes(focused.id) && (
                <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-marigold px-3 py-1 text-xs font-semibold text-royal-plum shadow-xs">
                  <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
                  In your vibes
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-3 px-4 pt-4 lg:px-5 lg:pt-5">
              <div>
                <h4 className="font-serif text-xl font-bold leading-snug text-royal-plum">{focused.title}</h4>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {focused.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-royal-plum/15 bg-royal-plum/5 px-2.5 py-0.5 text-xs font-medium text-royal-plum/80"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-sm leading-relaxed text-royal-plum/80">{focused.description}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-royal-plum/60">
                    Palette
                  </span>
                  <ul className="flex flex-wrap gap-2">
                    {focused.palette.map((hex) => (
                      <li key={hex} className="flex items-center gap-1.5 text-xs tabular-nums text-royal-plum/70">
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
                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-royal-plum/60">
                    Feel
                  </span>
                  <dl className="flex flex-col gap-1.5">
                    {FEEL.map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <dt className="w-24 shrink-0 text-royal-plum/70">{label}</dt>
                        <dd className="h-1.5 flex-1 overflow-hidden rounded-full bg-royal-plum/10">
                          <div
                            className="h-full rounded-full bg-marigold"
                            style={{ width: `${focused.dimensions[key]}%` }}
                          />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <div className="sticky bottom-0 -mx-4 mt-auto border-t border-royal-plum/10 bg-white px-4 py-3 lg:-mx-5 lg:px-5">
                <Button
                  type="button"
                  variant={selectedSwatchIds.includes(focused.id) ? 'outline' : 'default'}
                  className="w-full sm:w-auto"
                  onClick={() => toggle(focused.id)}
                >
                  {selectedSwatchIds.includes(focused.id) ? 'Remove from my vibes' : 'Add to my vibes'}
                </Button>
              </div>
            </div>
          </article>
        )}
      </div>

      {/* Optional standalone primary CTA */}
      {showCta && (
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            disabled={!isReady}
            aria-disabled={!isReady}
            onClick={onConfirm}
            className={cn(
              'h-10 px-5 text-xs font-semibold transition-all',
              isReady
                ? 'bg-marigold text-royal-plum shadow-xs hover:bg-marigold/90'
                : 'cursor-not-allowed bg-royal-plum/20 text-royal-plum/50'
            )}
          >
            Confirm {VIBE_MIN} to {VIBE_MAX} Vibes
          </Button>
        </div>
      )}

      <DescribeVibeDialog
        open={assistantOpen}
        onOpenChange={setAssistantOpen}
        onSuggested={applySuggestion}
      />
    </div>
  )
}
