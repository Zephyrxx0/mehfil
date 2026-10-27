'use client'

import * as React from 'react'
import { Check, Loader2, Zap } from 'lucide-react'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type SyncState = 'cloud_saved' | 'syncing' | 'local_saved'

export interface SyncStatusBadgeProps {
  status: SyncState
  lastSavedAt?: Date | null
  className?: string
}

export function SyncStatusBadge({
  status,
  lastSavedAt,
  className,
}: SyncStatusBadgeProps) {
  const formattedTime = React.useMemo(() => {
    if (!lastSavedAt) return null
    return lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }, [lastSavedAt])

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            data-testid="sync-status-badge"
            className={cn(
              'inline-flex items-center gap-2 rounded-full border border-royal-plum/10 bg-warm-ivory px-3 py-1 text-xs sm:text-sm font-medium text-royal-plum shadow-2xs select-none transition-colors cursor-default',
              className
            )}
          >
            {status === 'cloud_saved' && (
              <>
                <span className="flex h-2 w-2 rounded-full bg-[#4A7C59] animate-in fade-in" />
                <span className="flex items-center gap-1">
                  <span>Saved to Cloud</span>
                  <Check className="h-3.5 w-3.5 text-[#4A7C59] stroke-[2.5]" />
                </span>
              </>
            )}

            {status === 'syncing' && (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F7C873] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F7C873]" />
                </span>
                <span className="flex items-center gap-1.5">
                  <span>Syncing...</span>
                  <Loader2 className="h-3.5 w-3.5 text-royal-plum/60 animate-spin" />
                </span>
              </>
            )}

            {status === 'local_saved' && (
              <>
                <Zap className="h-3.5 w-3.5 text-[#D95D39] fill-[#D95D39]" />
                <span>Saved Locally</span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-center font-sans">
          {status === 'cloud_saved' && (
            <p>
              Your plan is securely synced to the cloud.
              {formattedTime && <span className="block text-royal-plum/60 mt-0.5">Last saved at {formattedTime}</span>}
            </p>
          )}
          {status === 'syncing' && (
            <p>Recording mathematical changes and committing version snapshot...</p>
          )}
          {status === 'local_saved' && (
            <p>
              Saved in your browser storage. Connect Supabase credentials to enable multi-device sync.
              {formattedTime && <span className="block text-royal-plum/60 mt-0.5">Last saved at {formattedTime}</span>}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
