import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import * as axeMatchers from 'vitest-axe/matchers'
import { axe } from '../a11y/helpers'
import { TimelineSection } from '@/components/workspace/TimelineSection'
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { commitQuote } from '@/lib/engine/budget'
import {
  applyCommittedBookings,
  bookedVendorFor,
  calculateBackwardsTimeline,
  countCompletedTasks,
} from '@/lib/engine/timeline'
import type { EventBrief, Plan, VendorQuote } from '@/lib/engine/types'

expect.extend(axeMatchers)

const BRIEF: EventBrief = {
  title: 'Booked',
  eventType: 'wedding',
  eventDate: '2027-11-20',
  city: 'Jaipur',
  guestCount: 200,
  totalBudgetPaise: 300_000_000,
  protectedCategory: 'catering',
}

const venueQuote = {
  id: 'quote-venue-1',
  vendorName: 'Royal Heritage Lawn',
  category: 'venue',
  rawText: 'Lawn rental Rs 2,25,000',
  statedInclusions: [],
  statedExclusions: [],
  createdAt: '2027-01-01T00:00:00.000Z',
  omissionAdders: [],
  droppedItems: [],
  tiers: [
    {
      tierId: 'tier-a',
      name: 'Daytime lawn',
      lineItems: [],
      baseTierPaise: 22_500_000,
      totalWithAddersPaise: 22_500_000,
      isStatedTotalConsistent: true,
    },
  ],
} as unknown as VendorQuote

function bookedPlan(): Plan {
  const plan = instantiatePlanFromBrief(BRIEF)
  return { ...commitQuote(plan, venueQuote, 'tier-a', []), quotes: [venueQuote] }
}

const scheduleFor = (plan: Plan) =>
  applyCommittedBookings(
    calculateBackwardsTimeline(plan.brief.eventDate, plan.brief.guestCount),
    plan
  )

describe('timeline completion helpers', () => {
  it('counts finished tasks out of all tasks', () => {
    const open = scheduleFor(instantiatePlanFromBrief(BRIEF))
    const booked = scheduleFor(bookedPlan())
    expect(countCompletedTasks(open).done).toBe(0)
    expect(countCompletedTasks(booked).done).toBe(1)
    expect(countCompletedTasks(booked).total).toBe(countCompletedTasks(open).total)
  })

  it('names the vendor from the committed line, and falls back to the stored quote', () => {
    const plan = bookedPlan()
    const task = scheduleFor(plan)
      .milestoneBands.flatMap((b) => b.tasks)
      .find((t) => t.isCompleted)!
    expect(bookedVendorFor(task, plan)).toBe('Royal Heritage Lawn')

    const lineWithoutName = {
      ...plan,
      lines: plan.lines.map((l) => ({ ...l, committedVendor: undefined })),
    }
    expect(bookedVendorFor(task, lineWithoutName)).toBe('Royal Heritage Lawn')
  })

  it('has no vendor for a task that is not done', () => {
    const plan = bookedPlan()
    const open = scheduleFor(instantiatePlanFromBrief(BRIEF)).milestoneBands[0].tasks[0]
    expect(bookedVendorFor(open, plan)).toBeUndefined()
  })
})

describe('TimelineSection shows what is booked', () => {
  it('marks a booked task done with words and an icon, not colour alone', () => {
    const plan = bookedPlan()
    render(<TimelineSection plan={plan} schedule={scheduleFor(plan)} />)

    expect(screen.getByText(/Done: booked with Royal Heritage Lawn/)).toBeInTheDocument()
    const row = screen.getByText(/Done: booked with/).closest('li')!
    expect(row).toHaveAttribute('data-completed', 'true')
    expect(row.querySelector('svg')).toHaveAttribute('aria-hidden', 'true') // the words carry the meaning
    expect(screen.getByTestId('timeline-progress')).toHaveTextContent(/^1 of \d+ tasks done$/)
  })

  it('shows no done state and no progress line when nothing is booked', () => {
    const plan = instantiatePlanFromBrief(BRIEF)
    render(<TimelineSection plan={plan} schedule={scheduleFor(plan)} />)
    expect(screen.queryByText(/^Done/)).not.toBeInTheDocument()
    expect(screen.queryByTestId('timeline-progress')).not.toBeInTheDocument()
  })

  it('leaves the other tasks open', () => {
    const plan = bookedPlan()
    render(<TimelineSection plan={plan} schedule={scheduleFor(plan)} />)
    const rows = document.querySelectorAll('li[data-completed]')
    const done = [...rows].filter((r) => r.getAttribute('data-completed') === 'true')
    expect(done).toHaveLength(1)
    expect(rows.length).toBeGreaterThan(5)
  })

  it('passes automated accessibility checks with a booked task', async () => {
    const plan = bookedPlan()
    const { container } = render(<TimelineSection plan={plan} schedule={scheduleFor(plan)} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('the workspace derives bookings from the plan it is given', () => {
  const noop = () => {}

  it('shows the booking on the Timeline tab with no extra wiring', () => {
    render(
      <WorkspaceShell
        plan={bookedPlan()}
        activeTab="timeline"
        onGuestCountChange={noop}
        onSetProtected={noop}
        onApplyRemedy={noop}
      />
    )
    const pane = screen.getByTestId('pane-timeline')
    expect(within(pane).getByText(/booked with Royal Heritage Lawn/)).toBeInTheDocument()
  })

  it('un-books when the plan no longer has the commitment', () => {
    const { rerender } = render(
      <WorkspaceShell
        plan={bookedPlan()}
        activeTab="timeline"
        onGuestCountChange={noop}
        onSetProtected={noop}
        onApplyRemedy={noop}
      />
    )
    expect(screen.getByText(/booked with/)).toBeInTheDocument()

    rerender(
      <WorkspaceShell
        plan={instantiatePlanFromBrief(BRIEF)}
        activeTab="timeline"
        onGuestCountChange={noop}
        onSetProtected={noop}
        onApplyRemedy={noop}
      />
    )
    expect(screen.queryByText(/booked with/)).not.toBeInTheDocument()
  })
})
