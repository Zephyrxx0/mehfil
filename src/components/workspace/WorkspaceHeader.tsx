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
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="transition-opacity hover:opacity-80" aria-label="Mehfil home">
          <Wordmark size="sm" hideTag />
        </Link>

        <div className="flex items-center gap-3">
          {syncStatus && <SyncStatusBadge status={syncStatus} />}
          {isReadOnly && (
            <span className="hidden text-sm text-royal-plum/70 sm:inline">Read-Only View</span>
          )}
          {isReadOnly && onUnlockEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onUnlockEdit}
              aria-label="Unlock Organizer Editing"
            >
              Unlock editing
            </Button>
          )}
          <Button type="button" size="sm" onClick={onShare}>
            Share &amp; Save
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 pb-5 pt-4 sm:px-6 sm:pt-8">
        <p className="text-sm text-royal-plum/60">
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
