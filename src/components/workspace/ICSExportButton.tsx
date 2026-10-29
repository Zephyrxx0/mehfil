'use client'

import React, { useState } from 'react'
import type { Plan, TimelineSchedule } from '@/lib/engine/types'
import { generateICS, downloadICS } from '@/lib/engine/ics'
import { Button } from '@/components/ui/button'

interface ICSExportButtonProps {
  plan: Plan
  schedule: TimelineSchedule
}

export function ICSExportButton({ plan, schedule }: ICSExportButtonProps) {
  const [downloaded, setDownloaded] = useState(false)

  const handleExport = () => {
    const icsContent = generateICS(schedule, plan)
    const sanitizedTitle = (plan.brief.title || 'celebration').toLowerCase().replace(/[^a-z0-9]/g, '-')
    downloadICS(icsContent, `${sanitizedTitle}-timeline.ics`)

    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 3000)
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleExport}>
      {downloaded ? 'Calendar Saved!' : 'Export to Calendar (.ics)'}
    </Button>
  )
}
