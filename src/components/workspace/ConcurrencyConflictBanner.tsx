'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

export interface ConcurrencyConflictBannerProps {
  onRefresh: () => void
  onCommitNewSnapshot: () => void
  className?: string
}

export function ConcurrencyConflictBanner({
  onRefresh,
  onCommitNewSnapshot,
  className,
}: ConcurrencyConflictBannerProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex flex-col gap-3 border-l-2 border-terracotta bg-terracotta/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className || ''}`}
    >
      <div>
        <p className="text-base font-semibold text-royal-plum">
          Plan updated from another device — your local draft is out of sync.
        </p>
        <p className="mt-0.5 text-sm text-royal-plum/70">
          Choose whether to pull the latest changes or save your draft as a new forward revision.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
          Refresh to Latest Plan
        </Button>
        <Button type="button" size="sm" onClick={onCommitNewSnapshot}>
          Commit as New Snapshot
        </Button>
      </div>
    </div>
  )
}
