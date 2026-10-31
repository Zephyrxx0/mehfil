'use client'

import React, { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { SWATCHES, SWATCH_PRESET_TAGS, type SwatchPresetTag } from '@/data/swatches'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { cn } from '@/lib/utils'
import { VIBE_MAX, VIBE_MIN } from '@/lib/vibe-limits'
import { DescribeVibeDialog } from './DescribeVibeDialog'
import { useBrokenSwatchImages } from './hooks/useBrokenSwatchImages'
import { useVibeSwatchSelection } from './hooks/useVibeSwatchSelection'
import { VibeSelectionStatus } from './VibeSelectionStatus'
import { VibeSwatchBanners } from './VibeSwatchBanners'
import { VibeSwatchDetail } from './VibeSwatchDetail'
import { VibeSwatchList } from './VibeSwatchList'

interface StepVibeSwatchesProps {
  selectedSwatchIds: string[]
  onChange: (ids: string[]) => void
  onConfirm?: () => void
  showCta?: boolean
}

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
  const [assistantOpen, setAssistantOpen] = useState(false)
  const selection = useVibeSwatchSelection(selectedSwatchIds, onChange)
  const { srcFor, markBroken } = useBrokenSwatchImages()
  const { focused } = selection

  const count = selectedSwatchIds.length
  const isReady = count >= VIBE_MIN && count <= VIBE_MAX

  return (
    <div className="flex w-full flex-col gap-4 lg:h-full lg:min-h-0">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-serif text-lg font-bold text-royal-plum">Visual Vibe Gallery</h3>
          <p className="text-sm text-royal-plum/70">
            Select {VIBE_MIN} to {VIBE_MAX} visual references to calibrate your celebration&apos;s
            aesthetic Style DNA.
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

      <VibeSwatchBanners
        warningMessage={selection.warningMessage}
        assistantNote={selection.assistantNote}
        onUndo={selection.undoSuggestion}
      />

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
              value={selection.categories}
              onChange={(next) => selection.setCategories(next as SwatchPresetTag[])}
              allLabel="All categories"
              counts={TAG_COUNTS}
            />
          </div>

          <VibeSelectionStatus count={count} isReady={isReady} shake={selection.shake} />

          <VibeSwatchList
            swatches={selection.filtered}
            selectedIds={selectedSwatchIds}
            focusedId={focused?.id}
            imageSrc={srcFor}
            onImageError={markBroken}
            onFocus={selection.setFocusedId}
            onToggle={selection.toggle}
          />
        </div>

        {/* Right: the reference in focus, in full */}
        {focused && (
          <VibeSwatchDetail
            swatch={focused}
            isSelected={selectedSwatchIds.includes(focused.id)}
            imageSrc={srcFor(focused)}
            onImageError={() => markBroken(focused.id)}
            onToggle={() => selection.toggle(focused.id)}
          />
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
        onSuggested={selection.applySuggestion}
      />
    </div>
  )
}
