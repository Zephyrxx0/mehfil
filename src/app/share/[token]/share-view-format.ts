/** Whole days from today (local midnight) until the celebration; negative once it has passed. */
export function computeDaysRemaining(eventDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const event = new Date(eventDate)
  const diffTime = event.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
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

export function countdownLabel(daysRemaining: number): string {
  if (daysRemaining > 0) return `${daysRemaining} days until celebration`
  if (daysRemaining === 0) return 'Celebration is today!'
  return 'Celebration completed'
}

/** "photo_film" becomes "Photo film". */
export function formatCategoryLabel(category: string): string {
  return category.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
