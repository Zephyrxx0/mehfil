import { describe, it, expect } from 'vitest'
import { GenerativeUISectionSchema, GenerativeUILayoutSchema } from '@/lib/ai/schemas'
import {
  generateDeterministicLayout,
  generateLayoutWithFallbackLadder,
} from '@/lib/ai/orchestrator'
import type { Plan, BudgetLine } from '@/lib/engine/types'

function createSamplePlan(): Plan {
  const lines: BudgetLine[] = [
    {
      id: 'line_venue',
      name: 'Venue & Banquet',
      category: 'venue',
      lineType: 'fixed',
      baselinePaise: 25000000,
      currentPaise: 25000000,
    },
    {
      id: 'line_catering',
      name: 'Festive Catering',
      category: 'catering',
      lineType: 'per_guest',
      baselinePaise: 25000000,
      currentPaise: 25000000,
      isProtected: true,
    },
    {
      id: 'line_decor',
      name: 'Stage & Mandap Decor',
      category: 'decor',
      lineType: 'flexible',
      baselinePaise: 20000000,
      currentPaise: 20000000,
      elasticityRank: 3,
    },
  ]

  return {
    id: 'test_plan_01',
    brief: {
      title: 'Kapoor Wedding Mehfil',
      eventType: 'wedding',
      eventDate: '2026-11-20',
      city: 'Jaipur',
      guestCount: 200,
      totalBudgetPaise: 70000000,
      protectedCategory: 'catering',
    },
    lines,
    totalBudgetPaise: 70000000,
    baselineGuestCount: 200,
  }
}

describe('Closed Registry Generative UI Schema & Entity ID Binding (GENUI-01, GENUI-02, D-13, ADR-0008)', () => {
  it('accepts valid entity ID descriptors for allowlisted components', () => {
    const validSection = {
      id: 'section-catering-comp',
      component: 'ScenarioComparison',
      variant: 'side_by_side',
      title: 'Catering Vendor Comparison',
      rationale: 'Reviewing 2 catering options with package inclusions and per-guest pricing.',
      lineIds: ['line-catering-1'],
      quoteIds: ['quote-caterer-a', 'quote-caterer-b'],
      ideaIds: ['idea-live-jalebi'],
      highlightEntityId: 'quote-caterer-a',
    }

    const parsed = GenerativeUISectionSchema.parse(validSection)
    expect(parsed.component).toBe('ScenarioComparison')
    expect(parsed.quoteIds).toHaveLength(2)
    expect(parsed.lineIds).toEqual(['line-catering-1'])
  })

  it('strictly REJECTS numeric amount props (ADR-0008)', () => {
    const badSectionWithAmount = {
      id: 'section-catering',
      component: 'QuoteReport',
      variant: 'detailed',
      title: 'Catering Quote',
      rationale: 'Model attempting to write arithmetic.',
      quoteIds: ['quote-1'],
      amount: 50000, // FORBIDDEN: numeric amount
    }

    expect(() => GenerativeUISectionSchema.parse(badSectionWithAmount)).toThrow()
  })

  it('strictly REJECTS price, cost, paise, and date props via .strict()', () => {
    const badCost = {
      id: 'sec-1',
      component: 'VendorChecklist',
      variant: 'compact',
      title: 'Vendor Checklist',
      rationale: 'Checking vendors with model costs.',
      cost: 150000,
    }
    expect(() => GenerativeUISectionSchema.parse(badCost)).toThrow()

    const badPaise = {
      id: 'sec-2',
      component: 'IdeaGrid',
      variant: 'compact',
      title: 'Idea Grid',
      rationale: 'Checking ideas with model paise.',
      paise: 2000000,
    }
    expect(() => GenerativeUISectionSchema.parse(badPaise)).toThrow()

    const badDate = {
      id: 'sec-3',
      component: 'QuoteReport',
      variant: 'detailed',
      title: 'Quote Report',
      rationale: 'Model setting event date.',
      date: '2026-12-01',
    }
    expect(() => GenerativeUISectionSchema.parse(badDate)).toThrow()
  })

  it('rejects unallowlisted arbitrary components', () => {
    const maliciousComponent = {
      id: 'sec-xss',
      component: 'CustomArbitraryChatWidget', // NOT allowlisted
      variant: 'compact',
      title: 'Arbitrary Widget',
      rationale: 'Testing closed registry defense.',
    }

    expect(() => GenerativeUISectionSchema.parse(maliciousComponent)).toThrow()
  })

  it('validates a complete GenerativeUILayoutSchema structure', () => {
    const validLayout = {
      layoutTitle: 'Wedding Feast & Decor Planning Layout',
      layoutSummary:
        'Unified layout combining catering scenario analysis with timeline vendor checklist.',
      sections: [
        {
          id: 'sec-1',
          component: 'ScenarioComparison',
          variant: 'side_by_side',
          title: 'Catering Comparison',
          rationale: 'Side-by-side package analysis for 250 guests.',
          quoteIds: ['quote-1', 'quote-2'],
        },
        {
          id: 'sec-2',
          component: 'VendorChecklist',
          variant: 'compact',
          title: 'Open Vendor Contracts',
          rationale: 'Overview of committed and pending milestone deliverables.',
          lineIds: ['line-venue', 'line-catering'],
        },
      ],
    }

    const parsed = GenerativeUILayoutSchema.parse(validLayout)
    expect(parsed.sections).toHaveLength(2)
    expect(parsed.layoutTitle).toContain('Wedding Feast')
  })
})

describe('Deterministic Layout & 3-Tier Fallback Ladder (GENUI-03, D-15, ADR-0007)', () => {
  const plan: Plan = createSamplePlan()

  it('generates a valid deterministic layout populated with plan entity IDs', () => {
    const layout = generateDeterministicLayout(plan, 'catering')
    expect(layout.layoutTitle).toContain('Catering')
    expect(layout.sections.length).toBeGreaterThanOrEqual(1)

    // Validate layout passes the strict schema
    const validated = GenerativeUILayoutSchema.parse(layout)
    expect(validated.sections[0].component).toBeDefined()
    expect(validated.sections.some((s) => s.component === 'VendorChecklist')).toBe(true)
  })

  it('falls back to Tier 3 deterministic template when forced or when no API key is provided', async () => {
    const result = await generateLayoutWithFallbackLadder(
      plan,
      'Suggest a scenario comparison for venue options',
      'venue',
      { forceTier: 3 }
    )

    expect(result.runRecord.activeTier).toBe(3)
    expect(result.runRecord.modelId).toBe('deterministic-heuristic-v1')
    expect(result.layout.sections.length).toBeGreaterThanOrEqual(1)
    expect(result.layout.layoutTitle).toContain('Venue')
  })

  it('escalates to Tier 3 when model fails schema validation (e.g. outputs forbidden numeric props)', async () => {
    // Mock a model that emits an invalid layout with amounts
    const mockBadModel = {
      specificationVersion: 'v1',
      modelId: 'mock-malicious-model',
      doGenerate: async () => ({
        text: JSON.stringify({
          layoutTitle: 'Hacked Layout',
          layoutSummary: 'Contains illegal money numbers.',
          sections: [
            {
              id: 'sec-bad',
              component: 'QuoteReport',
              variant: 'compact',
              title: 'Catering',
              rationale: 'Illegal props.',
              amount: 50000, // Illegal!
            },
          ],
        }),
      }),
    }

    const result = await generateLayoutWithFallbackLadder(plan, 'Curate layout', 'catering', {
      modelResolver: () => mockBadModel,
    })

    // Must fallback to Tier 3 with valid schema and zero crash
    expect(result.runRecord.activeTier).toBe(3)
    expect(result.layout.sections.length).toBeGreaterThanOrEqual(1)
    expect(GenerativeUILayoutSchema.safeParse(result.layout).success).toBe(true)
  })
})
