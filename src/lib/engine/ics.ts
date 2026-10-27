import type { Plan, TimelineSchedule } from './types'
import { formatINR } from './currency'

/**
 * Format a YYYY-MM-DD date string into RFC 5545 VALUE=DATE format (YYYYMMDD).
 */
function toICSDate(dateStr: string): string {
  return dateStr.replace(/-/g, '')
}

/**
 * Compute the next calendar day in YYYYMMDD format for RFC 5545 DTEND on all-day events.
 */
function nextDayICSDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const next = new Date(date.getTime() + 86_400_000)
  return next.toISOString().slice(0, 10).replace(/-/g, '')
}

/**
 * Escape text for RFC 5545 format (newlines, semicolons, commas).
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Pure RFC 5545 iCalendar (.ics) generator.
 * Emits compliant VCALENDAR string with all-day VEVENT entries and 9:00 AM VALARM reminders.
 *
 * @param schedule - Backwards timeline schedule
 * @param plan - Current celebration plan (for category allocations and titles)
 */
export function generateICS(schedule: TimelineSchedule, plan: Plan): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mehfil//Celebration Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  const nowUTC = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .slice(0, 15) + 'Z'

  for (const band of schedule.milestoneBands) {
    const dtStart = toICSDate(band.targetDate)
    const dtEnd = nextDayICSDate(band.targetDate)
    const uid = `mehfil-${plan.id}-${band.id}@mehfil.app`
    const summary = `${plan.brief.title || 'Mehfil'}: ${band.name}`

    // Build rich description with category budgets and task checklist
    const descParts: string[] = [
      `Milestone: ${band.name}`,
      `Target Due Date: ${band.targetDate}`,
      '',
      'Action Items:',
    ]

    for (const task of band.tasks) {
      // Find matching budget line allocation
      const budgetLine = plan.lines.find(l => l.category === task.budgetCategory)
      const budgetText = budgetLine
        ? ` (${budgetLine.name} • ${formatINR(budgetLine.currentPaise)})`
        : ''
      descParts.push(`• [ ] ${task.title}${budgetText}`)
      if (task.notes) {
        descParts.push(`    Note: ${task.notes}`)
      }
    }

    descParts.push('', 'Planned with Mehfil (महफ़िल) — Mathematical Integrity for Milestone Celebrations')

    const escapedDesc = escapeICSText(descParts.join('\n'))

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowUTC}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${escapeICSText(summary)}`,
      `DESCRIPTION:${escapedDesc}`,
      'STATUS:CONFIRMED',
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICSText(summary)}`,
      'TRIGGER:PT9H', // 9:00 AM on the day of the all-day event (start is 00:00:00)
      'END:VALARM',
      'END:VEVENT'
    )
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}

/**
 * Trigger in-browser file download of .ics content.
 */
export function downloadICS(content: string, filename = 'celebration-timeline.ics'): void {
  if (typeof window === 'undefined') return

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
