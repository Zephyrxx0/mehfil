import { describe, it, expect } from 'vitest'
import { sanitizePlanForSharing } from '@/lib/engine/sanitization'
import type { Plan, TimelineSchedule } from '@/lib/engine/types'

describe('Server-Side Privacy Sanitization Engine (D-06, COLLAB-03)', () => {
  const mockPlan: Plan = {
    id: 'plan-xyz-789',
    brief: {
      title: 'Pooja & Arjun Wedding',
      eventType: 'wedding',
      eventDate: '2026-12-18',
      city: 'Udaipur',
      guestCount: 300,
      totalBudgetPaise: 250000000, // ₹25 Lakhs in paise
      protectedCategory: 'decor',
      nuances: ['Royal Rajasthani Mandap'],
      customNotes: 'Private vendor contract signed at ₹4.5L with ABC Decorators',
    },
    lines: [
      {
        id: 'line-venue',
        name: 'Palace Courtyard',
        category: 'venue',
        lineType: 'fixed',
        baselinePaise: 75000000,
        currentPaise: 75000000,
      },
      {
        id: 'line-catering',
        name: 'Royal Rajputana Banquet',
        category: 'catering',
        lineType: 'per_guest',
        baselinePaise: 80000000,
        currentPaise: 80000000,
      },
      {
        id: 'line-decor',
        name: 'Heritage Floral Mandap',
        category: 'decor',
        lineType: 'flexible',
        baselinePaise: 50000000,
        currentPaise: 50000000,
        isProtected: true,
      },
      {
        id: 'line-buffer',
        name: 'Secret Buffer & Contingency',
        category: 'contingency',
        lineType: 'buffer',
        baselinePaise: 45000000,
        currentPaise: 45000000,
      },
    ],
    totalBudgetPaise: 250000000,
    baselineGuestCount: 300,
  }

  const mockSchedule: TimelineSchedule = {
    eventDate: '2026-12-18',
    isCompressedMode: false,
    milestoneBands: [
      {
        id: 'milestone_t6m',
        name: 'T-6 Months',
        targetDate: '2026-06-18',
        tasks: [
          {
            id: 'task-1',
            title: 'Book Palace Venue & Pay 20% Deposit',
            budgetCategory: 'venue',
            leadDays: 180,
            targetDate: '2026-06-18',
            isCompleted: true,
            isCriticalPath: true,
          },
          {
            id: 'task-2',
            title: 'Negotiate Catering Contract and Tasting Quote',
            budgetCategory: 'catering',
            leadDays: 180,
            targetDate: '2026-06-18',
            isCompleted: false,
            isCriticalPath: false,
          },
        ],
      },
      {
        id: 'milestone_day0',
        name: 'Wedding Day & Ceremonies',
        targetDate: '2026-12-18',
        tasks: [
          {
            id: 'task-3',
            title: 'Haldi & Phoolon Ki Holi Ceremony',
            budgetCategory: 'decor',
            leadDays: 1,
            targetDate: '2026-12-17',
            isCompleted: false,
            isCriticalPath: true,
          },
          {
            id: 'task-4',
            title: 'Sacred Mandap Pheras Ceremony',
            budgetCategory: 'venue',
            leadDays: 0,
            targetDate: '2026-12-18',
            isCompleted: false,
            isCriticalPath: true,
          },
          {
            id: 'task-5',
            title: 'Final Payment to Mandap Florist',
            budgetCategory: 'decor',
            leadDays: 0,
            targetDate: '2026-12-18',
            isCompleted: false,
            isCriticalPath: false,
          },
        ],
      },
    ],
  }

  it('strictly excludes contingency line from public category breakdown', () => {
    const sanitized = sanitizePlanForSharing(mockPlan, mockSchedule)

    expect(sanitized.categoryTotals.contingency).toBeUndefined()
    expect(sanitized.categoryPercentages.contingency).toBeUndefined()

    // Public categories sum without contingency: 75L + 80L + 50L = 205L paise (205000000)
    const publicSum = Object.values(sanitized.categoryTotals).reduce((a, b) => a + b, 0)
    expect(publicSum).toBe(205000000)

    // Percentage check: 75/205 ~ 37%, 80/205 ~ 39%, 50/205 ~ 24%
    expect(sanitized.categoryPercentages.venue).toBe(37)
    expect(sanitized.categoryPercentages.catering).toBe(39)
    expect(sanitized.categoryPercentages.decor).toBe(24)
  })

  it('filters public milestones and strictly blocks private vendor tasks (book, deposit, contract, payment, quote)', () => {
    const sanitized = sanitizePlanForSharing(mockPlan, mockSchedule)

    expect(sanitized.publicMilestones.length).toBe(2)

    const titles = sanitized.publicMilestones.map((m) => m.title)
    expect(titles).toContain('Haldi & Phoolon Ki Holi Ceremony')
    expect(titles).toContain('Sacred Mandap Pheras Ceremony')

    // Confirms exclusion of internal/financial vendor tasks
    expect(titles).not.toContain('Book Palace Venue & Pay 20% Deposit')
    expect(titles).not.toContain('Negotiate Catering Contract and Tasting Quote')
    expect(titles).not.toContain('Final Payment to Mandap Florist')
  })

  it('preserves Protected Moment showcase metadata accurately', () => {
    const sanitized = sanitizePlanForSharing(mockPlan, mockSchedule)

    expect(sanitized.protectedMoment).toEqual({
      category: 'decor',
      name: 'Heritage Floral Mandap',
      isProtected: true,
    })
  })

  it('does not expose internal capability hashes or owner ids in the shared payload', () => {
    const sanitized = sanitizePlanForSharing(mockPlan, mockSchedule) as any

    expect(sanitized.edit_key_hash).toBeUndefined()
    expect(sanitized.share_key_hash).toBeUndefined()
    expect(sanitized.owner_id).toBeUndefined()
    expect(sanitized.customNotes).toBeUndefined()
  })
})
