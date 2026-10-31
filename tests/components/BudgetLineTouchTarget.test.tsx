import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BudgetLineActions } from '@/components/workspace/BudgetLineActions'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import type { EventBrief } from '@/lib/engine/types'

/**
 * The 44px hit area is a ::before box inside the button. An absolutely positioned box with only a
 * top and bottom inset has ZERO width, so it needs `inset-x-0` too. happy-dom cannot lay out
 * pseudo-elements, so this pins the classes; the measured size was checked in a real browser.
 */

const BRIEF: EventBrief = {
  title: 'Touch target',
  eventType: 'wedding',
  eventDate: '2027-09-09',
  city: 'Delhi',
  guestCount: 200,
  totalBudgetPaise: 200_000_000,
  protectedCategory: 'catering',
}

describe('budget row buttons: touch target', () => {
  it('stretches the hit-area box across the button as well as above and below it', () => {
    const plan = instantiatePlanFromBrief(BRIEF)
    const flexible = plan.lines.find((l) => !l.isProtected && !l.isCommitted)!

    render(
      React.createElement(BudgetLineActions, {
        line: flexible,
        onSetProtected: () => {},
        onCheckQuote: () => {},
        onUnlockQuote: () => {},
      })
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
    for (const button of buttons) {
      expect(button).toHaveClass('before:absolute')
      expect(button).toHaveClass('before:-inset-y-1.5') // 32px + 2 x 6px = 44px tall
      expect(button).toHaveClass('before:inset-x-0') // full width, not zero
    }
  })
})
