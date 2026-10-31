export function samplePlan(overrides: Record<string, unknown> = {}) {
  return {
    id: 'client-side-id',
    brief: {
      title: 'Meera & Rohan Sangeet',
      eventType: 'wedding',
      eventDate: '2027-02-14',
      city: 'Jaipur',
      guestCount: 200,
      totalBudgetPaise: 100_000_000,
      protectedCategory: 'catering',
    },
    lines: [
      {
        id: 'l1',
        name: 'Venue',
        category: 'venue',
        baselinePaise: 40_000_000,
        currentPaise: 40_000_000,
      },
      {
        id: 'l2',
        name: 'Catering',
        category: 'catering',
        baselinePaise: 60_000_000,
        currentPaise: 60_000_000,
      },
    ],
    totalBudgetPaise: 100_000_000,
    baselineGuestCount: 200,
    ...overrides,
  }
}

export function createEventArgs(plan = samplePlan()) {
  return {
    p_title: plan.brief.title,
    p_event_type: plan.brief.eventType,
    p_event_date: plan.brief.eventDate,
    p_city: plan.brief.city,
    p_guest_count: plan.brief.guestCount,
    p_total_budget_paise: plan.totalBudgetPaise,
    p_protected_category: plan.brief.protectedCategory,
    p_snapshot: plan,
    p_reason: 'Initial plan',
  }
}

export interface CreatedEvent {
  event_id: string
  edit_key: string
  share_key: string
  version_id: string
  version_number: number
}
