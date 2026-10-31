'use client'

import * as React from 'react'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type SyncState = 'cloud_saved' | 'syncing' | 'local_saved'

export interface SyncStatusBadgeProps {
  status: SyncState
  lastSavedAt?: Date | null
  className?: string
}

const DOT: Record<SyncState, string> = {
  cloud_saved: 'bg-[#4A7C59]',
  syncing: 'bg-marigold animate-pulse',
  local_saved: 'bg-royal-plum/40',
}

const LABEL: Record<SyncState, string> = {
  cloud_saved: 'Saved to Cloud',
  syncing: 'Syncing...',
  local_saved: 'Saved Locally',
}

export function SyncStatusBadge({ status, lastSavedAt, className }: SyncStatusBadgeProps) {
  const formattedTime = React.useMemo(() => {
    if (!lastSavedAt) return null
    return lastSavedAt.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }, [lastSavedAt])

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            data-testid="sync-status-badge"
            className={cn(
              'inline-flex cursor-default select-none items-center gap-2 text-sm text-royal-plum/70',
              className
            )}
          >
            <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', DOT[status])} />
            <span className="whitespace-nowrap">{LABEL[status]}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-center font-sans">
          {status === 'cloud_saved' && (
            <p>
              Your plan is securely synced to the cloud.
              {formattedTime && (
                <span className="mt-0.5 block text-royal-plum/60">
                  Last saved at {formattedTime}
                </span>
              )}
            </p>
          )}
          {status === 'syncing' && (
            <p>Recording mathematical changes and committing version snapshot...</p>
          )}
          {status === 'local_saved' && (
            <p>
              Saved in your browser storage. Connect Supabase credentials to enable multi-device
              sync.
              {formattedTime && (
                <span className="mt-0.5 block text-royal-plum/60">
                  Last saved at {formattedTime}
                </span>
              )}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
