'use client'

import React, { useState } from 'react'
import type { Plan, TimelineSchedule } from '@/lib/engine/types'
import { generateICS, downloadICS } from '@/lib/engine/ics'
import { Calendar, Download, Check } from 'lucide-react'

interface ICSExportButtonProps {
  plan: Plan
  schedule: TimelineSchedule
}

export function ICSExportButton({ plan, schedule }: ICSExportButtonProps) {
  const [downloaded, setDownloaded] = useState(false)

  const handleExport = () => {
    const icsContent = generateICS(schedule, plan)
    const sanitizedTitle = (plan.brief.title || 'celebration')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
    const filename = `${sanitizedTitle}-timeline.ics`

    downloadICS(icsContent, filename)

    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 3000)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-2 rounded-full bg-royal-plum px-4 py-2 text-xs font-semibold text-warm-ivory shadow-sm transition hover:bg-royal-plum/90 active:scale-95"
    >
      {downloaded ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Calendar Saved!</span>
        </>
      ) : (
        <>
          <Calendar className="w-3.5 h-3.5 text-marigold" />
          <span>Export to Calendar (.ics)</span>
          <Download className="w-3 h-3 text-warm-ivory/70 ml-0.5" />
        </>
      )}
    </button>
  )
}
