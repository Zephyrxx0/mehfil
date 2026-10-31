const MS_PER_DAY = 24 * 60 * 60 * 1000

/** A `YYYY-MM-DD` string as local midnight of that calendar day (never UTC midnight). */
function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Whole calendar days from today until the celebration; negative once it has passed.
 * Both dates are local-midnight calendar days, so the result does not shift for viewers east or
 * west of UTC. Rounding absorbs the 23h/25h days around daylight-saving changes.
 */
export function computeDaysRemaining(eventDate: string, now: Date = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const event = parseLocalDate(eventDate)
  return Math.round((event.getTime() - today.getTime()) / MS_PER_DAY)
}

/** "December 25, 2026" from a `YYYY-MM-DD` string; the input is returned unchanged if unparseable. */
export function formatEventDate(eventDate: string): string {
  try {
    const parts = eventDate.split('-').map(Number)
    const date = new Date(parts[0], parts[1] - 1, parts[2])
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return eventDate
  }
}

/** "Oct 31, 2026" from a `YYYY-MM-DD` string; the input is returned unchanged if unparseable. */
export function formatMilestoneDate(isoDate: string): string {
  const date = parseLocalDate(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function countdownLabel(daysRemaining: number): string {
  if (daysRemaining > 0) return `${daysRemaining} days until celebration`
  if (daysRemaining === 0) return 'Celebration is today!'
  return 'Celebration completed'
}

/** "photo_film" becomes "Photo film". */
export function formatCategoryLabel(category: string): string {
  return category.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
