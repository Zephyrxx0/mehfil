'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Wordmark } from '@/components/brand/Wordmark'
import type {
  Plan,
  BudgetCategory,
  ShortfallRemedy,
  PlanVersionRecord,
  CuratedIdea,
  VendorQuote,
  GenerativeUILayout,
} from '@/lib/engine/types'
import type { StyleDimensions } from '@/lib/ai/schemas'
import {
  calculateBackwardsTimeline,
  completePrimaryBookingTask,
  reopenPrimaryBookingTask,
} from '@/lib/engine/timeline'
import { commitQuote, unlockQuote } from '@/lib/engine/budget'
import { generateDeterministicLayout } from '@/lib/ai/orchestrator'
import { BudgetSection } from './BudgetSection'
import { TimelineSection } from './TimelineSection'
import { ChangeExplainer, type PlanChangeRecord } from './ChangeExplainer'
import { StyleDNACard } from './StyleDNACard'
import { ShortfallBanner } from './ShortfallBanner'
import { CuratedIdeasSection } from './CuratedIdeasSection'
import { SyncStatusBadge, type SyncState } from './SyncStatusBadge'
import { ShareSaveModal } from './ShareSaveModal'
import { PLAN_TABS, type PlanTabId } from './tabs'
import { QuoteIntakeSheet } from '@/components/quotes/QuoteIntakeSheet'
import { SmartInspectorSheet } from '@/components/quotes/SmartInspectorSheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createLogger } from '@/lib/logger'
const logger = createLogger('workspace-shell')

export interface WorkspaceShellProps {
  plan: Plan
  changes?: PlanChangeRecord[]
  history?: PlanChangeRecord[]
  versions?: PlanVersionRecord[]
  currentVersionNumber?: number
  currentVersion?: PlanVersionRecord
  previousGuestCount?: number
  syncStatus?: SyncState
  isReadOnly?: boolean
  editKey?: string
  initialShareToken?: string
  isExtracting?: boolean
  v2Banner?: React.ReactNode
  /** Extra notices shown above the tab content (e.g. a sync conflict). */
  notices?: React.ReactNode
  /** Active tab. When given together with `basePath`, tabs are real links. */
  activeTab?: PlanTabId
  /** e.g. `/plan/abc123`: tabs link to `${basePath}/${tab}`. */
  basePath?: string
  onGuestCountChange: (count: number) => void
  onSetProtected: (category: BudgetCategory) => void
  onApplyRemedy: (remedy: ShortfallRemedy) => void
  onUndo?: (item?: PlanChangeRecord, index?: number) => void
  onRestoreVersion?: (targetVersion: number) => void
  onUnlockEdit?: () => void
  onRetuneStyle?: (dimensions: StyleDimensions) => void
  onResetToBaseline?: () => void
  onRetryExtraction?: () => void
  onAdoptIdea?: (idea: CuratedIdea) => void
  onRetractIdea?: (ideaId: string) => void
  onCommitQuote?: (committedPlan: Plan) => void
  onUnlockQuote?: (unlockedPlan: Plan) => void
  onCheckQuote?: (category: BudgetCategory) => void
  onOpenSmartInspector?: (category?: BudgetCategory) => void
}

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

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: 'Wedding',
  birthday: 'Milestone birthday',
  community: 'Cultural soirée',
}

export function WorkspaceShell({
  plan,
  changes,
  history,
  versions,
  currentVersionNumber,
  currentVersion,
  previousGuestCount,
  syncStatus,
  isReadOnly = false,
  editKey,
  initialShareToken,
  isExtracting = false,
  v2Banner,
  notices,
  activeTab: activeTabProp,
  basePath,
  onGuestCountChange,
  onSetProtected,
  onApplyRemedy,
  onUndo,
  onRestoreVersion,
  onUnlockEdit,
  onRetuneStyle,
  onResetToBaseline,
  onRetryExtraction,
  onAdoptIdea,
  onRetractIdea,
  onCommitQuote: onCommitQuoteProp,
  onUnlockQuote: onUnlockQuoteProp,
  onCheckQuote: onCheckQuoteProp,
  onOpenSmartInspector: onOpenSmartInspectorProp,
}: WorkspaceShellProps) {
  const [localTab, setLocalTab] = useState<PlanTabId>('budget')
  const activeTab = activeTabProp ?? localTab
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const tabsRef = useRef<HTMLElement>(null)

  // Quote Intake and Generative UI State (GENUI-01, GENUI-02, D-01, D-14)
  const [currentPlan, setCurrentPlan] = useState<Plan>(plan)
  useEffect(() => {
    setCurrentPlan(plan)
  }, [plan])

  const [isQuoteIntakeOpen, setIsQuoteIntakeOpen] = useState(false)
  const [activeQuoteCategory, setActiveQuoteCategory] = useState<BudgetCategory | undefined>(
    undefined
  )
  const [isSmartInspectorOpen, setIsSmartInspectorOpen] = useState(false)
  const [smartInspectorLayout, setSmartInspectorLayout] = useState<GenerativeUILayout | undefined>(
    undefined
  )
  const [smartInspectorTier, setSmartInspectorTier] = useState<1 | 2 | 3 | undefined>(undefined)
  const [activeQuotes, setActiveQuotes] = useState<VendorQuote[]>(() => plan.quotes || [])

  const [timelineSchedule, setTimelineSchedule] = useState(() =>
    calculateBackwardsTimeline(plan.brief.eventDate, plan.brief.guestCount)
  )

  useEffect(() => {
    setTimelineSchedule(
      calculateBackwardsTimeline(currentPlan.brief.eventDate, currentPlan.brief.guestCount)
    )
  }, [currentPlan.brief.eventDate, currentPlan.brief.guestCount])

  // When the tab changes while the tab bar is stuck, bring the new content to the top.
  useEffect(() => {
    const el = tabsRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    if (window.scrollY > top) window.scrollTo({ top })
  }, [activeTab])

  const handleCheckQuote = (category: BudgetCategory) => {
    setActiveQuoteCategory(category)
    setIsQuoteIntakeOpen(true)
    onCheckQuoteProp?.(category)
  }

  const handleOpenSmartInspector = (category?: BudgetCategory) => {
    const targetCat =
      category || activeQuoteCategory || currentPlan.brief.protectedCategory || 'catering'
    const layout = generateDeterministicLayout(currentPlan, targetCat)
    setSmartInspectorLayout(layout)
    setSmartInspectorTier(3)
    setIsSmartInspectorOpen(true)
    onOpenSmartInspectorProp?.(category)
  }

  const handleCommitQuote = (quote: VendorQuote, tierId: string, activeAdderIds: string[]) => {
    try {
      const nextPlan = commitQuote(currentPlan, quote, tierId, activeAdderIds)
      const updatedSchedule = completePrimaryBookingTask(timelineSchedule, quote.category, quote.id)
      setTimelineSchedule(updatedSchedule)

      const updatedQuotes = [...activeQuotes.filter((q) => q.id !== quote.id), quote]
      setActiveQuotes(updatedQuotes)

      const finalPlan: Plan = { ...nextPlan, quotes: updatedQuotes }
      setCurrentPlan(finalPlan)
      onCommitQuoteProp?.(finalPlan)
      setIsQuoteIntakeOpen(false)
    } catch (err: any) {
      logger.error('[WorkspaceShell] Quote commit error:', err)
    }
  }

  const handleUnlockQuote = (category: BudgetCategory) => {
    try {
      const nextPlan = unlockQuote(currentPlan, category)
      const updatedSchedule = reopenPrimaryBookingTask(timelineSchedule, category)
      setTimelineSchedule(updatedSchedule)

      setCurrentPlan(nextPlan)
      onUnlockQuoteProp?.(nextPlan)
    } catch (err: any) {
      logger.error('[WorkspaceShell] Quote unlock error:', err)
    }
  }

  const changeList = changes ?? history ?? []
  const effectiveCurrentVersion =
    currentVersion ||
    versions?.find((v) => v.versionNumber === currentVersionNumber) ||
    versions?.[0]

  const adoptedCount = currentPlan.adoptedIdeas?.length ?? 0
  const brief = currentPlan.brief

  const shortfall = (
    <ShortfallBanner
      plan={plan}
      isReadOnly={isReadOnly}
      previousGuestCount={previousGuestCount}
      onApplyRemedy={onApplyRemedy}
      onUndo={() => onUndo?.()}
    />
  )

  return (
    <div className="min-h-dvh">
      {/* Top bar: wordmark and the two actions that apply everywhere */}
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
          <Button type="button" size="sm" onClick={() => setIsShareModalOpen(true)}>
            Share &amp; Save
          </Button>
        </div>
      </div>

      {/* Plan identity */}
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
            <Link
              href={`/new?from=${encodeURIComponent(currentPlan.id)}`}
              className="text-royal-plum/70 underline decoration-royal-plum/25 underline-offset-4 hover:text-royal-plum hover:decoration-royal-plum"
            >
              Edit brief
            </Link>
            <Link
              href="/new"
              className="text-royal-plum/70 underline decoration-royal-plum/25 underline-offset-4 hover:text-royal-plum hover:decoration-royal-plum"
            >
              New plan
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs: real links when routed, buttons otherwise */}
      <nav
        ref={tabsRef}
        aria-label="Workspace sections"
        className="sticky top-0 z-30 border-y border-royal-plum/10 bg-warm-ivory/95 backdrop-blur-sm"
      >
        <ul
          role="tablist"
          className="mx-auto flex w-full max-w-4xl gap-0.5 overflow-x-auto px-2 [scrollbar-width:none] sm:gap-4 sm:px-6 [&::-webkit-scrollbar]:hidden"
        >
          {PLAN_TABS.map(({ id, label }) => {
            const isActive = activeTab === id
            const classes = cn(
              'relative flex h-12 items-center px-2.5 text-sm font-medium transition-colors sm:px-1',
              isActive ? 'text-royal-plum' : 'text-royal-plum/60 hover:text-royal-plum'
            )
            const text = (
              <>
                {label}
                {id === 'ideas' && adoptedCount > 0 && (
                  <span className="ml-1.5 tabular-nums text-royal-plum/60">{adoptedCount}</span>
                )}
                {/* The underline is one shared element that slides between tabs. */}
                {isActive && (
                  <motion.span
                    layoutId="workspace-tab-underline"
                    className="absolute inset-x-2.5 bottom-0 h-0.5 rounded-full bg-royal-plum sm:inset-x-0"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
              </>
            )
            return (
              <li key={id} role="presentation" className="shrink-0">
                {basePath ? (
                  <Link
                    href={`${basePath}/${id}`}
                    role="tab"
                    aria-selected={isActive}
                    aria-current={isActive ? 'page' : undefined}
                    scroll={false}
                    className={classes}
                  >
                    {text}
                  </Link>
                ) : (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setLocalTab(id)}
                    className={classes}
                  >
                    {text}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8">
        <div className="flex flex-col gap-6">
          {notices}

          <div key={activeTab} className="flex flex-col gap-6 motion-safe:animate-rise">
            {activeTab === 'budget' && (
              <div data-testid="pane-budget" className="flex flex-col gap-6">
                {v2Banner}
                {shortfall}
                <BudgetSection
                  plan={currentPlan}
                  onGuestCountChange={onGuestCountChange}
                  onSetProtected={onSetProtected}
                  onCheckQuote={handleCheckQuote}
                  onUnlockQuote={handleUnlockQuote}
                  onOpenInspector={() => handleOpenSmartInspector()}
                  isReadOnly={isReadOnly}
                />
              </div>
            )}

            {activeTab === 'timeline' && (
              <div data-testid="pane-timeline">
                <TimelineSection plan={currentPlan} schedule={timelineSchedule} />
              </div>
            )}

            {activeTab === 'ideas' && (
              <div data-testid="pane-ideas" className="flex flex-col gap-6">
                {shortfall}
                <CuratedIdeasSection
                  plan={currentPlan}
                  isReadOnly={isReadOnly}
                  onAdoptIdea={onAdoptIdea ?? (() => {})}
                  onRetractIdea={onRetractIdea ?? (() => {})}
                />
              </div>
            )}

            {activeTab === 'style' && (
              <div data-testid="pane-style" className="flex flex-col gap-6">
                {v2Banner}
                <StyleDNACard
                  plan={currentPlan}
                  currentVersion={effectiveCurrentVersion}
                  isReadOnly={isReadOnly}
                  isExtracting={isExtracting}
                  onRetuneStyle={onRetuneStyle}
                  onResetToBaseline={onResetToBaseline}
                  onRetryExtraction={onRetryExtraction}
                />
              </div>
            )}

            {activeTab === 'history' && (
              <div data-testid="pane-history">
                <ChangeExplainer
                  plan={currentPlan}
                  changes={changeList}
                  versions={versions}
                  currentVersionNumber={currentVersionNumber}
                  onRestoreVersion={onRestoreVersion}
                  isReadOnly={isReadOnly}
                  onUndo={onUndo}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <ShareSaveModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        planId={currentPlan.id}
        planTitle={currentPlan.brief.title}
        editKey={editKey}
        initialShareToken={initialShareToken}
      />

      {/* Quarantined Quote Intake Sandbox Sheet (QUOTE-01, QUOTE-02, D-01) */}
      <QuoteIntakeSheet
        open={isQuoteIntakeOpen}
        onOpenChange={setIsQuoteIntakeOpen}
        category={activeQuoteCategory || 'catering'}
        guestCount={currentPlan.brief.guestCount}
        plan={currentPlan}
        onCommitQuote={handleCommitQuote}
      />

      {/* Contextual Smart Inspector Slide-Over (GENUI-01, GENUI-02, GENUI-03, D-14) */}
      <SmartInspectorSheet
        open={isSmartInspectorOpen}
        onOpenChange={setIsSmartInspectorOpen}
        layout={smartInspectorLayout}
        activeTier={smartInspectorTier}
        plan={currentPlan}
        onCheckQuote={handleCheckQuote}
        onCommitQuote={(quoteId, tierId, adders) => {
          const q =
            activeQuotes.find((x) => x.id === quoteId) ||
            currentPlan.quotes?.find((x) => x.id === quoteId)
          if (q) {
            handleCommitQuote(q, tierId, adders)
          }
        }}
        onUnlockQuote={(quoteId) => {
          const q =
            activeQuotes.find((x) => x.id === quoteId) ||
            currentPlan.quotes?.find((x) => x.id === quoteId)
          if (q) {
            handleUnlockQuote(q.category)
          }
        }}
        onAdoptIdea={onAdoptIdea}
        onRetractIdea={onRetractIdea}
      />
    </div>
  )
}
