'use client'

import { useMemo } from 'react'
import type { SanitizedSharedPlan } from '@/lib/engine/types'
import { generatePublicCeremoniesICS, downloadICS } from '@/lib/engine/ics'
import { computeDaysRemaining, formatEventDate } from './share-view-format'

/** Derived display values and the calendar export action for a shared plan. */
export function useSharedPlanView(sanitizedPlan: SanitizedSharedPlan) {
  const daysRemaining = useMemo(
    () => computeDaysRemaining(sanitizedPlan.eventDate),
    [sanitizedPlan.eventDate]
  )

  const formattedEventDate = useMemo(
    () => formatEventDate(sanitizedPlan.eventDate),
    [sanitizedPlan.eventDate]
  )

  const handleExportICS = () => {
    const icsContent = generatePublicCeremoniesICS(sanitizedPlan)
    const filename = `${sanitizedPlan.title.toLowerCase().replace(/\s+/g, '-')}-ceremonies.ics`
    downloadICS(icsContent, filename)
  }

  return { daysRemaining, formattedEventDate, handleExportICS }
}
