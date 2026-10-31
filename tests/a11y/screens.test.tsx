import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as axeMatchers from 'vitest-axe/matchers'
import { axe } from './helpers'
import HomePage from '@/app/page'
import { BriefWizard } from '@/components/intake/BriefWizard'
import { PlanWorkspace } from '@/components/workspace/PlanWorkspace'
import { ShareSaveModal } from '@/components/workspace/ShareSaveModal'
import { UnlockEditDialog } from '@/components/workspace/UnlockEditDialog'
import { ShareClientView } from '@/app/share/[token]/ShareClientView'
import { QuoteIntakeSheet } from '@/components/quotes/QuoteIntakeSheet'
import { SmartInspectorSheet } from '@/components/quotes/SmartInspectorSheet'
import { generateDeterministicLayout } from '@/lib/ai/layout-heuristic'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { sanitizePlanForSharing } from '@/lib/engine/sanitization'
import { calculateBackwardsTimeline } from '@/lib/engine/timeline'
import type { EventBrief } from '@/lib/engine/types'

expect.extend(axeMatchers)

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

const BRIEF: EventBrief = {
  title: 'Accessibility check',
  eventType: 'wedding',
  eventDate: '2027-08-10',
  city: 'Udaipur',
  guestCount: 300,
  totalBudgetPaise: 250_000_000,
  protectedCategory: 'catering',
}
const plan = instantiatePlanFromBrief(BRIEF)

async function expectNoViolations(container: HTMLElement) {
  const results = await axe(container)
  expect(results).toHaveNoViolations()
}

describe('automated accessibility checks (A4)', () => {
  it('landing page', async () => {
    const { container } = render(<HomePage />)
    await expectNoViolations(container)
  })

  it('brief wizard, first step', async () => {
    const { container } = render(<BriefWizard onPlanCreated={vi.fn()} />)
    await expectNoViolations(container)
  })

  it.each(['Budget', 'Timeline', 'Ideas', 'Style', 'History'])(
    'plan workspace, %s tab',
    async (tab) => {
      const user = userEvent.setup()
      const { container } = render(<PlanWorkspace initialPlan={plan} />)
      await user.click(screen.getByRole('tab', { name: new RegExp(tab, 'i') }))
      await expectNoViolations(container)
    }
  )

  it('read-only plan workspace', async () => {
    const { container } = render(
      <PlanWorkspace initialPlan={plan} isReadOnly onUnlockEdit={vi.fn()} />
    )
    await expectNoViolations(container)
  })

  it('share and save dialog, both tabs', async () => {
    const user = userEvent.setup()
    render(
      <ShareSaveModal
        open
        onOpenChange={vi.fn()}
        planId="plan-1"
        planTitle="Plan"
        editKey={'e'.repeat(64)}
        initialShareToken={'s'.repeat(64)}
        isCloudConfigured
      />
    )
    await expectNoViolations(screen.getByRole('dialog'))
    await user.click(screen.getByRole('tab', { name: /Family Share Link/i }))
    await expectNoViolations(screen.getByRole('dialog'))
  })

  it('unlock edit dialog', async () => {
    render(<UnlockEditDialog open onOpenChange={vi.fn()} planId="p" onUnlocked={vi.fn()} />)
    await expectNoViolations(screen.getByRole('dialog'))
  })

  it('quote intake sheet', async () => {
    render(
      <QuoteIntakeSheet
        open
        onOpenChange={vi.fn()}
        category="catering"
        guestCount={200}
        plan={plan}
      />
    )
    await expectNoViolations(screen.getByRole('dialog'))
  })

  it('smart inspector sheet', async () => {
    render(
      <SmartInspectorSheet
        open
        onOpenChange={vi.fn()}
        layout={generateDeterministicLayout(plan, 'catering')}
        activeTier={3}
        plan={plan}
      />
    )
    await expectNoViolations(screen.getByRole('dialog'))
  })

  it('family share page', async () => {
    const schedule = calculateBackwardsTimeline(plan.brief.eventDate, plan.brief.guestCount)
    const { container } = render(
      <ShareClientView sanitizedPlan={sanitizePlanForSharing(plan, schedule)} />
    )
    await expectNoViolations(container)
  })

  it('expired share link', async () => {
    const { container } = render(<ShareClientView sanitizedPlan={null} />)
    await expectNoViolations(container)
  })
})
