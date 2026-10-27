import { describe, it, expect } from 'vitest'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { adoptIdea, retractIdea, setProtectedMoment } from '@/lib/engine/budget'
import type { CuratedIdea, EventBrief, Plan } from '@/lib/engine/types'

describe('Pure TypeScript Zero-Sum Idea Displacement & Protected Immunity (MOMENT-02, BUDGET-04, IDEA-02, IDEA-03)', () => {
  const weddingBrief: EventBrief = {
    title: 'Ananya & Kabir Wedding',
    eventType: 'wedding',
    eventDate: '2026-11-20',
    city: 'Jaipur',
    guestCount: 300,
    totalBudgetPaise: 250_000_000, // ₹25,00,000 (250,000,000 paise)
    protectedCategory: 'catering',
  }

  const sampleChaiCartIdea: CuratedIdea = {
    id: 'chai_kulhad_bar',
    title: 'Artisanal Kulhad Chai & Mithai Bar',
    devanagariTitle: 'कुल्हड़ चाय एवं मिष्ठान',
    tagline: 'Live brass samovar brewing fragrant masala chai in clay kulhads',
    description: 'Fresh kulhad chai served alongside regional sweets at evening arrival',
    category: 'catering',
    eventTypes: ['wedding'],
    costPaise: 5_000_000, // ₹50,000
    leadDays: 30,
    styleTags: ['regal', 'warm'],
    culturalNuance: 'Clay kulhads sourced from local potters',
  }

  const samplePhotoBoothIdea: CuratedIdea = {
    id: 'jali_photo_backdrop',
    title: 'Handcrafted Jali Photo Pavilion',
    tagline: 'Intricate floral jali lattice for portraits',
    description: 'Custom photo booth carved with traditional floral motifs',
    category: 'photo_film',
    eventTypes: ['wedding'],
    costPaise: 8_000_000, // ₹80,000
    leadDays: 45,
    styleTags: ['heritage'],
    culturalNuance: 'Jaipur floral lattice',
  }

  it('drains flexible lines in strict elasticity order: Misc (1) -> Entertainment (2) -> Decor (3)', () => {
    const plan = instantiatePlanFromBrief(weddingBrief)

    // Baseline allocations for flexible lines:
    // Decor: 12% = 30,000,000 paise, floor (40%) = 12,000,000 paise, headroom = 18,000,000
    // Entertainment: 6% = 15,000,000 paise, floor (40%) = 6,000,000 paise, headroom = 9,000,000
    // Misc: 0% = 0 paise, floor = 0, headroom = 0
    const initialEntertainment = plan.lines.find(l => l.category === 'entertainment')!.currentPaise
    const initialDecor = plan.lines.find(l => l.category === 'decor')!.currentPaise
    const initialCatering = plan.lines.find(l => l.category === 'catering')!.currentPaise

    // Chai cart costs 50,000 rupees (5,000,000 paise)
    // Misc has 0 available, so Entertainment (Rank 2) is drained first: 5,000,000 <= 9,000,000 headroom
    // Decor (Rank 3) should be completely untouched!
    const updatedPlan = adoptIdea(plan, sampleChaiCartIdea)

    const entertainmentLine = updatedPlan.lines.find(l => l.category === 'entertainment')!
    const decorLine = updatedPlan.lines.find(l => l.category === 'decor')!
    const cateringLine = updatedPlan.lines.find(l => l.category === 'catering')!

    expect(entertainmentLine.currentPaise).toBe(initialEntertainment - 5_000_000)
    expect(decorLine.currentPaise).toBe(initialDecor) // Untouched because Entertainment had capacity!
    expect(cateringLine.currentPaise).toBe(initialCatering + 5_000_000)

    // Total budget invariant holds
    const totalCurrentPaise = updatedPlan.lines.reduce((s, l) => s + l.currentPaise, 0)
    expect(totalCurrentPaise).toBe(plan.totalBudgetPaise)
    expect(updatedPlan.isInfeasible).toBeFalsy()
  })

  it('drains lower elasticity rank completely before touching higher rank', () => {
    const plan = instantiatePlanFromBrief(weddingBrief)
    // Entertainment headroom is 9,000,000 paise (15,000,000 - 6,000,000).
    // An idea costing 12,000,000 paise will exhaust Entertainment (drain full 9,000,000)
    // and take the remaining 3,000,000 from Decor!
    const largeIdea: CuratedIdea = {
      id: 'grand_stage_decor',
      title: 'Grand Floral Stage',
      tagline: 'Royal stage setup',
      description: 'Handcrafted floral stage',
      category: 'venue',
      eventTypes: ['wedding'],
      costPaise: 12_000_000, // ₹1,20,000
      leadDays: 60,
      styleTags: ['regal'],
      culturalNuance: 'Marigold cascades',
    }

    const updatedPlan = adoptIdea(plan, largeIdea)

    const entertainmentLine = updatedPlan.lines.find(l => l.category === 'entertainment')!
    const decorLine = updatedPlan.lines.find(l => l.category === 'decor')!
    const entFloor = Math.round(entertainmentLine.baselinePaise * 0.40 / 100) * 100

    expect(entertainmentLine.currentPaise).toBe(entFloor) // Clamped to 40% floor
    expect(decorLine.currentPaise).toBe(decorLine.baselinePaise - 3_000_000) // Absorbed remaining 30,000 rupees

    const totalCurrentPaise = updatedPlan.lines.reduce((s, l) => s + l.currentPaise, 0)
    expect(totalCurrentPaise).toBe(plan.totalBudgetPaise)
  })

  it('guarantees Protected Moment is mathematically immune to displacement even if flexible (MOMENT-02)', () => {
    // Set Decor (flexible category) as the Protected Moment
    const basePlan = instantiatePlanFromBrief(weddingBrief)
    const protectedDecorPlan = setProtectedMoment(basePlan, 'decor')

    expect(protectedDecorPlan.lines.find(l => l.category === 'decor')!.isProtected).toBe(true)
    const initialDecor = protectedDecorPlan.lines.find(l => l.category === 'decor')!.currentPaise

    // Adopt an idea targeting photo_film requiring 8,000,000 paise
    const updatedPlan = adoptIdea(protectedDecorPlan, samplePhotoBoothIdea)

    const decorLine = updatedPlan.lines.find(l => l.category === 'decor')!
    // Decor must NOT have donated a single paise!
    expect(decorLine.currentPaise).toBe(initialDecor)
    expect(decorLine.isProtected).toBe(true)

    // Entertainment is not protected and absorbs it
    const entLine = updatedPlan.lines.find(l => l.category === 'entertainment')!
    expect(entLine.currentPaise).toBe(entLine.baselinePaise - 8_000_000)
  })

  it('never drains flexible lines below their 40% baseline floor', () => {
    const plan = instantiatePlanFromBrief(weddingBrief)
    // Total flexible capacity:
    // Entertainment: 15,000,000 baseline, floor 6,000,000 => capacity 9,000,000
    // Decor: 30,000,000 baseline, floor 12,000,000 => capacity 18,000,000
    // Total flexible headroom = 27,000,000 paise (₹2,70,000)
    const hugeIdea: CuratedIdea = {
      id: 'massive_drone_show',
      title: 'Drone Symphony Show',
      tagline: '500-drone aerial light show',
      description: 'Synchronized night sky constellation',
      category: 'venue',
      eventTypes: ['wedding'],
      costPaise: 50_000_000, // ₹5,00,000 - exceeds total flexible capacity of ₹2.7L
      leadDays: 90,
      styleTags: ['spectacle'],
      culturalNuance: 'Vedic motifs in sky',
    }

    const infeasiblePlan = adoptIdea(plan, hugeIdea)

    expect(infeasiblePlan.isInfeasible).toBe(true)
    expect(infeasiblePlan.shortfallPaise).toBe(23_000_000) // 50L - 27L = 23L paise
    expect(infeasiblePlan.remedies).toBeDefined()
    expect(infeasiblePlan.remedies?.length).toBe(3)

    const entertainmentLine = infeasiblePlan.lines.find(l => l.category === 'entertainment')!
    const decorLine = infeasiblePlan.lines.find(l => l.category === 'decor')!

    const entFloor = Math.round(entertainmentLine.baselinePaise * 0.40 / 100) * 100
    const decorFloor = Math.round(decorLine.baselinePaise * 0.40 / 100) * 100

    expect(entertainmentLine.currentPaise).toBe(entFloor)
    expect(decorLine.currentPaise).toBe(decorFloor)
  })

  it('restores exact paise to exact donor lines in reverse order upon retractIdea (IDEA-03, D-07)', () => {
    const plan = instantiatePlanFromBrief(weddingBrief)
    const initialEntertainment = plan.lines.find(l => l.category === 'entertainment')!.currentPaise
    const initialDecor = plan.lines.find(l => l.category === 'decor')!.currentPaise
    const initialCatering = plan.lines.find(l => l.category === 'catering')!.currentPaise

    // Adopt Chai Cart
    const planWithIdea = adoptIdea(plan, sampleChaiCartIdea)
    expect(planWithIdea.adoptedIdeas).toHaveLength(1)
    expect(planWithIdea.lines.find(l => l.category === 'catering')!.currentPaise).toBe(initialCatering + 5_000_000)

    // Retract Chai Cart
    const revertedPlan = retractIdea(planWithIdea, sampleChaiCartIdea.id)

    expect(revertedPlan.adoptedIdeas).toBeUndefined()
    expect(revertedPlan.lines.find(l => l.category === 'catering')!.currentPaise).toBe(initialCatering)
    expect(revertedPlan.lines.find(l => l.category === 'entertainment')!.currentPaise).toBe(initialEntertainment)
    expect(revertedPlan.lines.find(l => l.category === 'decor')!.currentPaise).toBe(initialDecor)

    const sum = revertedPlan.lines.reduce((s, l) => s + l.currentPaise, 0)
    expect(sum).toBe(plan.totalBudgetPaise)
  })

  it('clears shortfall and infeasible status when an idea causing shortfall is retracted', () => {
    const plan = instantiatePlanFromBrief(weddingBrief)
    const hugeIdea: CuratedIdea = {
      id: 'massive_drone_show',
      title: 'Drone Symphony Show',
      tagline: '500-drone aerial light show',
      description: 'Synchronized night sky constellation',
      category: 'venue',
      eventTypes: ['wedding'],
      costPaise: 40_000_000,
      leadDays: 90,
      styleTags: ['spectacle'],
      culturalNuance: 'Vedic motifs in sky',
    }

    const infeasiblePlan = adoptIdea(plan, hugeIdea)
    expect(infeasiblePlan.isInfeasible).toBe(true)
    expect(infeasiblePlan.shortfallPaise).toBeGreaterThan(0)

    const revertedPlan = retractIdea(infeasiblePlan, hugeIdea.id)
    expect(revertedPlan.isInfeasible).toBe(false)
    expect(revertedPlan.shortfallPaise).toBeUndefined()
    expect(revertedPlan.remedies).toBeUndefined()
    const sum = revertedPlan.lines.reduce((s, l) => s + l.currentPaise, 0)
    expect(sum).toBe(plan.totalBudgetPaise)
  })

  it('property test: 1,000 consecutive random adopt and retract cycles verify exact integer paise sum invariant', () => {
    let currentPlan = instantiatePlanFromBrief(weddingBrief)
    const mockIdeas: CuratedIdea[] = [
      {
        id: 'idea-1',
        title: 'Folk Dancers',
        tagline: 'Kalbelia troupe',
        description: 'Rajasthani folk performers',
        category: 'entertainment',
        eventTypes: ['wedding'],
        costPaise: 3_000_000,
        leadDays: 20,
        styleTags: ['heritage'],
        culturalNuance: 'Traditional welcome',
      },
      {
        id: 'idea-2',
        title: 'Floral Archway',
        tagline: 'Mogra arch',
        description: 'Fresh jasmine scented entrance',
        category: 'decor',
        eventTypes: ['wedding'],
        costPaise: 4_500_000,
        leadDays: 15,
        styleTags: ['regal'],
        culturalNuance: 'Fresh flowers',
      },
      {
        id: 'idea-3',
        title: 'Live Chaat Counter',
        tagline: 'Chandni chowk street food',
        description: 'Artisanal chaat live station',
        category: 'catering',
        eventTypes: ['wedding'],
        costPaise: 6_000_000,
        leadDays: 10,
        styleTags: ['warm'],
        culturalNuance: 'Street flavors',
      },
      {
        id: 'idea-4',
        title: 'Polaroid Guestbook',
        tagline: 'Vintage memories',
        description: 'Instant film snapshots and notes',
        category: 'photo_film',
        eventTypes: ['wedding'],
        costPaise: 2_500_000,
        leadDays: 5,
        styleTags: ['intimate'],
        culturalNuance: 'Guest blessings',
      },
    ]

    const adoptedIdStack: string[] = []

    for (let i = 0; i < 1000; i++) {
      const shouldAdopt = adoptedIdStack.length === 0 || Math.random() > 0.4
      if (shouldAdopt && adoptedIdStack.length < mockIdeas.length) {
        // pick an idea not yet adopted
        const availableIdeas = mockIdeas.filter(m => !adoptedIdStack.includes(m.id))
        const picked = availableIdeas[Math.floor(Math.random() * availableIdeas.length)]
        currentPlan = adoptIdea(currentPlan, picked)
        adoptedIdStack.push(picked.id)
      } else {
        // retract last adopted idea
        const lastId = adoptedIdStack.pop()!
        currentPlan = retractIdea(currentPlan, lastId)
      }

      // If feasible, sum MUST equal totalBudgetPaise exactly
      if (!currentPlan.isInfeasible) {
        const sum = currentPlan.lines.reduce((s, l) => s + l.currentPaise, 0)
        expect(sum).toBe(weddingBrief.totalBudgetPaise)
      }

      // Check all line paise values are integer numbers
      for (const line of currentPlan.lines) {
        expect(Number.isInteger(line.currentPaise)).toBe(true)
      }
    }

    // Now retract all remaining adopted ideas to return to pure baseline
    while (adoptedIdStack.length > 0) {
      const id = adoptedIdStack.pop()!
      currentPlan = retractIdea(currentPlan, id)
    }

    const finalSum = currentPlan.lines.reduce((s, l) => s + l.currentPaise, 0)
    expect(finalSum).toBe(weddingBrief.totalBudgetPaise)
    expect(currentPlan.isInfeasible).toBeFalsy()
  })
})
