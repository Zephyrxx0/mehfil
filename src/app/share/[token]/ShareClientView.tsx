'use client'

import * as React from 'react'
import type { SanitizedSharedPlan } from '@/lib/engine/types'
import { ShareCategoryBreakdown } from './ShareCategoryBreakdown'
import { ShareCeremonyTimeline } from './ShareCeremonyTimeline'
import { ShareExpiredView } from './ShareExpiredView'
import { ShareHeader } from './ShareHeader'
import { ShareProtectedMoment } from './ShareProtectedMoment'
import { useSharedPlanView } from './useSharedPlanView'

export interface ShareClientViewProps {
  sanitizedPlan: SanitizedSharedPlan | null
}

export function ShareClientView({ sanitizedPlan }: ShareClientViewProps) {
  // If plan not found or token has been invalidated/expired (D-08, 03-UI-SPEC.md §4)
  if (!sanitizedPlan || sanitizedPlan.isExpired) {
    return <ShareExpiredView />
  }

  return <SharedPlanContent sanitizedPlan={sanitizedPlan} />
}

interface SharedPlanContentProps {
  sanitizedPlan: SanitizedSharedPlan
}

function SharedPlanContent({ sanitizedPlan }: SharedPlanContentProps) {
  const { daysRemaining, formattedEventDate, handleExportICS } = useSharedPlanView(sanitizedPlan)

  return (
    <main className="min-h-screen bg-warm-ivory text-royal-plum py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-10">
        <ShareHeader
          title={sanitizedPlan.title}
          formattedEventDate={formattedEventDate}
          city={sanitizedPlan.city}
          guestCount={sanitizedPlan.guestCount}
          daysRemaining={daysRemaining}
        />

        {sanitizedPlan.protectedMoment && (
          <ShareProtectedMoment name={sanitizedPlan.protectedMoment.name} />
        )}

        <ShareCategoryBreakdown
          totalBudgetPaise={sanitizedPlan.totalBudgetPaise}
          categoryTotals={sanitizedPlan.categoryTotals}
          categoryPercentages={sanitizedPlan.categoryPercentages}
        />

        <ShareCeremonyTimeline
          milestones={sanitizedPlan.publicMilestones}
          onExportICS={handleExportICS}
        />
      </div>
    </main>
  )
}
