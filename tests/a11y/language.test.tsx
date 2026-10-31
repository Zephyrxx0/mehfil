import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { findUnlabelledDevanagari } from './helpers'
import { Wordmark } from '@/components/brand/Wordmark'
import { TitleDraw } from '@/components/hero/TitleDraw'
import { CuratedIdeaCard } from '@/components/workspace/CuratedIdeaCard'
import { IdeaGrid } from '@/components/quotes/registry/IdeaGrid'
import { PlanProvider } from '@/components/quotes/registry/PlanContext'
import { QuoteIntakeSheet } from '@/components/quotes/QuoteIntakeSheet'
import { SmartInspectorSheet } from '@/components/quotes/SmartInspectorSheet'
import { CURATED_IDEAS } from '@/data/curatedIdeas'
import { generateDeterministicLayout } from '@/lib/ai/layout-heuristic'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'

const plan = instantiatePlanFromBrief({
  title: 'Language check',
  eventType: 'wedding',
  eventDate: '2027-08-10',
  city: 'Udaipur',
  guestCount: 300,
  totalBudgetPaise: 250_000_000,
  protectedCategory: 'catering',
})

describe('Devanagari text declares its language (A3)', () => {
  it('the helper catches unmarked Hindi', () => {
    const { container } = render(<p>Welcome महफ़िल</p>)
    expect(findUnlabelledDevanagari(container)).toEqual(['Welcome महफ़िल'])
  })

  it('the helper accepts Hindi inside lang="hi"', () => {
    const { container } = render(
      <p>
        Welcome <span lang="hi">महफ़िल</span>
      </p>
    )
    expect(findUnlabelledDevanagari(container)).toEqual([])
  })

  it('wordmark, hero title and quote sandbox label their Hindi', () => {
    const { container } = render(
      <>
        <Wordmark />
        <TitleDraw />
        <QuoteIntakeSheet
          open
          onOpenChange={vi.fn()}
          category="catering"
          guestCount={100}
          plan={plan}
        />
      </>
    )
    expect(findUnlabelledDevanagari(document.body)).toEqual([])
    expect(container.querySelectorAll('[lang="hi"]').length).toBeGreaterThanOrEqual(2)
  })

  it('every curated idea title in Devanagari is labelled, in both places it is shown', () => {
    const idea = CURATED_IDEAS.find((i) => i.devanagariTitle)!
    const card = render(
      <CuratedIdeaCard idea={idea} plan={plan} isAdopted={false} onToggle={vi.fn()} />
    )
    expect(card.container.textContent).toContain(idea.devanagariTitle)
    expect(findUnlabelledDevanagari(card.container)).toEqual([])
    card.unmount()

    const grid = render(
      <PlanProvider plan={plan}>
        <IdeaGrid ideaIds={CURATED_IDEAS.filter((i) => i.devanagariTitle).map((i) => i.id)} />
      </PlanProvider>
    )
    expect(findUnlabelledDevanagari(grid.container)).toEqual([])
  })

  it('smart inspector title labels its Hindi', () => {
    render(
      <SmartInspectorSheet
        open
        onOpenChange={vi.fn()}
        layout={generateDeterministicLayout(plan, 'catering')}
        activeTier={3}
        plan={plan}
      />
    )
    expect(findUnlabelledDevanagari(document.body)).toEqual([])
  })
})
