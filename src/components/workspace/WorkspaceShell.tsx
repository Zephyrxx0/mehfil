'use client'

import React, { useState } from 'react'
import type { Plan, BudgetCategory, ShortfallRemedy } from '@/lib/engine/types'
import { calculateBackwardsTimeline } from '@/lib/engine/timeline'
import { formatINR } from '@/lib/engine/currency'
import { BudgetSection } from './BudgetSection'
import { TimelineSection } from './TimelineSection'
import { ChangeExplainer, type PlanChangeRecord } from './ChangeExplainer'
import { ShortfallBanner } from './ShortfallBanner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Coins, Calendar, Palette, FileText, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WorkspaceShellProps {
  plan: Plan
  changes?: PlanChangeRecord[]
  history?: PlanChangeRecord[]
  previousGuestCount?: number
  onGuestCountChange: (count: number) => void
  onSetProtected: (category: BudgetCategory) => void
  onApplyRemedy: (remedy: ShortfallRemedy) => void
  onUndo?: (item?: PlanChangeRecord, index?: number) => void
}

export type MobileTab = 'budget' | 'timeline' | 'style' | 'summary'

export function WorkspaceShell({
  plan,
  changes,
  history,
  previousGuestCount,
  onGuestCountChange,
  onSetProtected,
  onApplyRemedy,
  onUndo,
}: WorkspaceShellProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>('budget')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const changeList = changes ?? history ?? []
  const changeCount = changeList.length

  const schedule = calculateBackwardsTimeline(
    plan.brief.eventDate,
    plan.brief.guestCount
  )

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Shortfall Banner (ADR-0002 Permissive Balancing) */}
      <ShortfallBanner
        plan={plan}
        previousGuestCount={previousGuestCount}
        onApplyRemedy={onApplyRemedy}
        onUndo={() => onUndo?.()}
      />

      {/* Desktop 3-Pane Layout (35% Budget, 40% Timeline, 25% Change Explainer / Summary) */}
      <div
        data-testid="desktop-workspace-layout"
        className="hidden lg:grid lg:grid-cols-12 lg:gap-6 lg:h-[calc(100vh-5rem)] items-start"
      >
        {/* Left Column: 35% Budget (col-span-4) */}
        <div
          data-testid="desktop-budget-pane"
          className="lg:col-span-4 h-[calc(100vh-5rem)] overflow-y-auto flex flex-col gap-6 pr-2"
        >
          <BudgetSection
            plan={plan}
            onGuestCountChange={onGuestCountChange}
            onSetProtected={onSetProtected}
          />
        </div>

        {/* Center Column: 40% Timeline (col-span-5) */}
        <div
          data-testid="desktop-timeline-pane"
          className="lg:col-span-5 h-[calc(100vh-5rem)] overflow-y-auto flex flex-col gap-6 pr-2"
        >
          <TimelineSection plan={plan} schedule={schedule} />
        </div>

        {/* Right Column: 25% Change Explainer & Summary (col-span-3) */}
        <div
          data-testid="desktop-explainer-pane"
          className="lg:col-span-3 h-[calc(100vh-5rem)] overflow-y-auto flex flex-col gap-6"
        >
          <ChangeExplainer
            plan={plan}
            changes={changeList}
            previousGuestCount={previousGuestCount}
            onUndo={onUndo}
          />

          {/* Plan Metadata Summary Card */}
          <Card className="rounded-2xl border border-royal-plum/10 bg-warm-ivory p-5 shadow-xs">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-base font-serif">Celebration Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-xs text-royal-plum/70 flex flex-col gap-2">
              <div className="flex justify-between items-center py-1 border-b border-royal-plum/5">
                <span>Event</span>
                <span className="font-semibold text-royal-plum">{plan.brief.title}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-royal-plum/5">
                <span>City & Date</span>
                <span className="font-semibold text-royal-plum">
                  {plan.brief.city} • {plan.brief.eventDate}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-royal-plum/5">
                <span>Total Budget</span>
                <span className="font-semibold text-royal-plum tabular-nums">
                  {formatINR(plan.totalBudgetPaise)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Protected Category</span>
                <span className="font-semibold text-royal-plum capitalize">
                  {plan.brief.protectedCategory}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile / Small Screen View (< 1024px) */}
      <div
        data-testid="mobile-workspace-layout"
        className="block lg:hidden flex flex-col pb-36"
      >
        {mobileTab === 'budget' && (
          <div data-testid="mobile-pane-budget">
            <BudgetSection
              plan={plan}
              onGuestCountChange={onGuestCountChange}
              onSetProtected={onSetProtected}
            />
          </div>
        )}

        {mobileTab === 'timeline' && (
          <div data-testid="mobile-pane-timeline">
            <TimelineSection plan={plan} schedule={schedule} />
          </div>
        )}

        {mobileTab === 'style' && (
          <div
            data-testid="mobile-pane-style"
            className="rounded-2xl border border-royal-plum/10 bg-warm-ivory p-6 text-center shadow-xs"
          >
            <h3 className="font-serif font-bold text-lg text-royal-plum">Style DNA</h3>
            <p className="text-xs text-royal-plum/60 mt-1">
              Aesthetic identity & Protected Moment highlights ({plan.brief.protectedCategory}).
            </p>
          </div>
        )}

        {mobileTab === 'summary' && (
          <div
            data-testid="mobile-pane-summary"
            className="rounded-2xl border border-royal-plum/10 bg-warm-ivory p-6 text-center shadow-xs flex flex-col gap-3"
          >
            <h3 className="font-serif font-bold text-lg text-royal-plum">Plan Summary</h3>
            <p className="text-xs text-royal-plum/60">
              {plan.brief.title} • {plan.brief.city} • {plan.brief.eventDate}
            </p>
            <div className="text-lg font-bold text-royal-plum tabular-nums">
              {formatINR(plan.totalBudgetPaise)}
            </div>
            <div className="text-xs text-royal-plum/70">
              Protected Floor Locked: <span className="font-semibold capitalize">{plan.brief.protectedCategory}</span>
            </div>
          </div>
        )}

        {/* Persistent bottom drawer sheet trigger handle floating above bottom tab bar */}
        <div className="fixed bottom-20 inset-x-0 z-30 px-4">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open change history drawer"
            className="w-full flex items-center justify-between rounded-full bg-royal-plum text-warm-ivory px-4 py-2.5 text-xs font-semibold shadow-lg backdrop-blur-md active:scale-98 transition"
          >
            <span>
              Guests: <span className="tabular-nums font-semibold">{plan.brief.guestCount}</span> • Floor: <span className="capitalize">{plan.brief.protectedCategory}</span>
            </span>
            <div className="flex items-center gap-1.5 text-marigold">
              <span className="tabular-nums font-bold">
                ⚡ {changeCount} {changeCount === 1 ? 'change' : 'changes'}
              </span>
              <ChevronUp className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Bottom Sheet Drawer containing ChangeExplainer */}
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader className="mb-2">
              <SheetTitle>Plan Changes & Rebalancing</SheetTitle>
            </SheetHeader>
            <ChangeExplainer
              plan={plan}
              changes={changeList}
              previousGuestCount={previousGuestCount}
              onUndo={onUndo}
            />
          </SheetContent>
        </Sheet>

        {/* 4-Tab Bottom Navigation Bar */}
        <nav
          role="tablist"
          aria-label="Workspace navigation"
          className="fixed bottom-0 inset-x-0 z-40 bg-warm-ivory/95 border-t border-royal-plum/10 backdrop-blur-md h-16 flex items-center justify-around px-2"
        >
          {[
            { id: 'budget', label: 'Budget', icon: Coins },
            { id: 'timeline', label: 'Timeline', icon: Calendar },
            { id: 'style', label: 'Style', icon: Palette },
            { id: 'summary', label: 'Summary', icon: FileText },
          ].map(({ id, label, icon: Icon }) => {
            const isActive = mobileTab === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setMobileTab(id as MobileTab)}
                className={cn(
                  'flex flex-col items-center gap-1 py-1 px-4 rounded-full text-xs font-semibold transition',
                  isActive
                    ? 'bg-marigold text-royal-plum font-bold shadow-xs'
                    : 'text-royal-plum/60 hover:text-royal-plum'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-royal-plum' : 'text-royal-plum/60')} />
                <span>{label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
