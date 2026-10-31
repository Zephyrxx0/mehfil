'use client'

import React from 'react'
import Link from 'next/link'
import { Wordmark } from '@/components/brand/Wordmark'
import { Button } from '@/components/ui/button'
import type { Plan } from '@/lib/engine/types'
import { SyncStatusBadge, type SyncState } from './SyncStatusBadge'

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: 'Wedding',
  birthday: 'Milestone birthday',
  community: 'Cultural soirée',
}

const LINK_CLASSES =
  'text-royal-plum/70 underline decoration-royal-plum/25 underline-offset-4 hover:text-royal-plum hover:decoration-royal-plum'

// On a phone the top bar must never be wider than the screen. The wordmark and the buttons
// keep their size; the save status gives way instead (its label is cut with an ellipsis),
// the gaps and side padding are tighter below the `sm` breakpoint, and the read-only
// "Unlock editing" button drops its second word there.
const HEADER_ROW_CLASSES =
  'mx-auto flex h-14 w-full max-w-4xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6'
const HEADER_ACTIONS_CLASSES = 'flex min-w-0 items-center gap-2 sm:gap-3'
const SYNC_BADGE_CLASSES = 'min-w-0 [&>span:last-child]:truncate'

function formatEventDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export interface WorkspaceHeaderProps {
  plan: Plan
  syncStatus?: SyncState
  isReadOnly: boolean
  onUnlockEdit?: () => void
  onShare: () => void
}

/** Top bar (wordmark and the actions that apply everywhere) plus the plan's identity. */
export function WorkspaceHeader({
  plan,
  syncStatus,
  isReadOnly,
  onUnlockEdit,
  onShare,
}: WorkspaceHeaderProps) {
  const { brief } = plan

  return (
    <>
      <div className={HEADER_ROW_CLASSES}>
        <Link
          href="/"
          className="shrink-0 transition-opacity hover:opacity-80"
          aria-label="Mehfil home"
        >
          <Wordmark size="sm" hideTag />
        </Link>

        <div className={HEADER_ACTIONS_CLASSES}>
          {syncStatus && <SyncStatusBadge status={syncStatus} className={SYNC_BADGE_CLASSES} />}
          {isReadOnly && (
            <span className="hidden text-sm text-royal-plum/70 sm:inline">Read-Only View</span>
          )}
          {isReadOnly && onUnlockEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={onUnlockEdit}
              aria-label="Unlock Organizer Editing"
            >
              Unlock<span className="max-sm:hidden"> editing</span>
            </Button>
          )}
          <Button type="button" size="sm" className="shrink-0" onClick={onShare}>
            Share &amp; Save
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 pb-5 pt-4 sm:px-6 sm:pt-8">
        <p className="text-sm text-royal-plum/70">
          {EVENT_TYPE_LABELS[brief.eventType] ?? brief.eventType}
          <span aria-hidden="true"> · </span>
          {brief.city}
          <span aria-hidden="true"> · </span>
          {formatEventDate(brief.eventDate)}
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h1 className="font-serif text-3xl font-bold leading-tight text-royal-plum sm:text-4xl">
            {brief.title || 'Celebration Workspace'}
          </h1>
          <div className="flex items-center gap-4 pb-1 text-sm">
            <Link href={`/new?from=${encodeURIComponent(plan.id)}`} className={LINK_CLASSES}>
              Edit brief
            </Link>
            <Link href="/new" className={LINK_CLASSES}>
              New plan
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
