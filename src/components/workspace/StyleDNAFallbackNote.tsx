import React from 'react'
import { Button } from '@/components/ui/button'

export interface StyleDNAFallbackNoteProps {
  /** When omitted, the note is shown without a retry button. */
  onRetry?: () => void
  isRetrying: boolean
}

/** Calm Degradation Note (D-14, 04-UI-SPEC.md §Copywriting) */
export function StyleDNAFallbackNote({ onRetry, isRetrying }: StyleDNAFallbackNoteProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-royal-plum/10 py-3">
      <p className="text-sm text-royal-plum/75">
        Showing standard style profile for now; your custom vibe will be infused when you retry.
      </p>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" disabled={isRetrying} onClick={onRetry}>
          {isRetrying ? 'Retrying...' : 'Retry Extraction'}
        </Button>
      )}
    </div>
  )
}
