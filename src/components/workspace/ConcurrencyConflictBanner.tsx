'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Upload } from 'lucide-react'
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
      className={`rounded-2xl border border-[#D95D39]/30 bg-[#FFF8EE] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md ${className || ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D95D39]/10 text-[#D95D39]">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-royal-plum">
            Plan updated from another device — your local draft is out of sync.
          </p>
          <p className="text-xs text-royal-plum/70">
            Choose whether to pull the latest changes or save your draft as a new forward revision.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="h-8 border-royal-plum/20 bg-transparent text-xs font-semibold text-royal-plum hover:bg-royal-plum/5"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Refresh to Latest Plan
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onCommitNewSnapshot}
          className="h-8 bg-marigold text-xs font-semibold text-royal-plum hover:bg-marigold/90 shadow-2xs"
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Commit as New Snapshot
        </Button>
      </div>
    </div>
  )
}
