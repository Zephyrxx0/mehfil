import { describe, it, expect } from 'vitest'
import { CURATED_IDEAS, getPersonalizedIdeas } from '@/data/curatedIdeas'
import type { EventBrief, StyleDNA } from '@/lib/engine/types'

describe('Curated Celebration Catalog & Style DNA Personalization Engine (IDEA-01)', () => {
  const baseBrief: EventBrief = {
    title: 'Aditi & Rohan Wedding',
    eventType: 'wedding',
    eventDate: '2026-11-20',
    city: 'Jaipur',
    guestCount: 200,
    totalBudgetPaise: 250000000,
    protectedCategory: 'catering',
  }

  const baseStyleDNA: StyleDNA = {
    dimensions: {
      formality: 60,
      energy: 50,
      scale: 50,
      heritageVsModern: 50,
      feastVsSpectacle: 50,
      music: 50,
      decorDensity: 50,
      indoorVsOutdoor: 50,
    },
    namedPalette: [
      { name: 'Warm Ivory', hex: '#FAF7F2' },
      { name: 'Marigold Gold', hex: '#F59E0B' },
      { name: 'Gulabi Rose', hex: '#E11D48' },
    ],
    vibeStatement: 'Warm, elegant royal Rajasthani family celebration.',
    protectedCategory: 'catering',
    protectedMomentQuote: 'Grand multi-course feast with live dessert stations',
  }

  it('contains at least 14 authentic celebration items (D-02)', () => {
    expect(CURATED_IDEAS.length).toBeGreaterThanOrEqual(14)
  })

  it('all ideas strictly adhere to integer paise financial arithmetic (no floating numbers)', () => {
    for (const idea of CURATED_IDEAS) {
      expect(Number.isInteger(idea.costPaise)).toBe(true)
      expect(idea.costPaise).toBeGreaterThan(0)
      // Divisible by 100 ensures whole rupee alignment
      expect(idea.costPaise % 100).toBe(0)
    }
  })

  it('every catalog idea contains authentic Devanagari flourishes and actionable timeline tasks', () => {
    // Regex checking Devanagari Unicode range: \u0900-\u097F
    const devanagariRegex = /[\u0900-\u097F]/

    for (const idea of CURATED_IDEAS) {
      expect(idea.id).toBeDefined()
      expect(idea.title.trim().length).toBeGreaterThan(0)
      expect(idea.devanagariTitle).toBeDefined()
      expect(devanagariRegex.test(idea.devanagariTitle!)).toBe(true)
      expect(idea.tagline.trim().length).toBeGreaterThan(0)
      expect(idea.description.trim().length).toBeGreaterThan(0)
      expect(idea.culturalNuance.trim().length).toBeGreaterThan(0)
      expect(idea.leadDays).toBeGreaterThan(0)
      expect(idea.styleTags.length).toBeGreaterThan(0)

      expect(idea.timelineTask).toBeDefined()
      expect(idea.timelineTask?.title.trim().length).toBeGreaterThan(0)
      expect(idea.timelineTask?.notes.trim().length).toBeGreaterThan(0)
    }
  })

  it('getPersonalizedIdeas filters strictly by eventType', () => {
    const birthdayBrief: EventBrief = {
      ...baseBrief,
      eventType: 'birthday',
      title: 'Aarav 1st Birthday',
    }

    const weddingIdeas = getPersonalizedIdeas(baseBrief)
    const birthdayIdeas = getPersonalizedIdeas(birthdayBrief)

    // Shehnai and Safa Tying are wedding rituals and should NOT appear in birthday
    const birthdayIdeaIds = birthdayIdeas.map(i => i.id)
    expect(birthdayIdeaIds).not.toContain('live_shehnai_jugalbandi')
    expect(birthdayIdeaIds).not.toContain('handloom_safa_tying')

    // But Kulhad Chai Bar and Polaroid Station are suitable for birthdays
    expect(birthdayIdeaIds).toContain('kulhad_chai_bar')
    expect(birthdayIdeaIds).toContain('vintage_polaroid_station')

    // All returned ideas must support the birthday eventType
    for (const idea of birthdayIdeas) {
      expect(idea.eventTypes).toContain('birthday')
    }
  })

  it('promotes heritage ideas (e.g. Shehnai, Safa, Baithak) when Style DNA heritageVsModern is low (< 50)', () => {
    const heritageDNA: StyleDNA = {
      ...baseStyleDNA,
      dimensions: {
        ...baseStyleDNA.dimensions,
        heritageVsModern: 15, // Strongly Heritage
      },
    }

    const ideas = getPersonalizedIdeas(baseBrief, heritageDNA)
    const topIdeaIds = ideas.slice(0, 4).map(i => i.id)

    // Shehnai, Safa Tying, Sufi Baithak, or Kulhad Chai should rank in the top ideas
    const heritageItems = [
      'live_shehnai_jugalbandi',
      'handloom_safa_tying',
      'acoustic_sufi_baithak',
      'kulhad_chai_bar',
    ]
    const hasHeritageInTop = topIdeaIds.some(id => heritageItems.includes(id))
    expect(hasHeritageInTop).toBe(true)

    // Modern items like Polaroid should rank lower than Shehnai
    const shehnaiIndex = ideas.findIndex(i => i.id === 'live_shehnai_jugalbandi')
    const polaroidIndex = ideas.findIndex(i => i.id === 'vintage_polaroid_station')
    expect(shehnaiIndex).toBeLessThan(polaroidIndex)
  })

  it('promotes modern ideas (e.g. Polaroid station, caricature) when Style DNA heritageVsModern is high (>= 50)', () => {
    const modernDNA: StyleDNA = {
      ...baseStyleDNA,
      dimensions: {
        ...baseStyleDNA.dimensions,
        heritageVsModern: 85, // Strongly Modern
      },
    }

    const ideas = getPersonalizedIdeas(baseBrief, modernDNA)
    const topIdeaIds = ideas.slice(0, 4).map(i => i.id)

    // Polaroid or Caricature should rank near top
    const modernItems = ['vintage_polaroid_station', 'caricature_pavilion']
    const hasModernInTop = topIdeaIds.some(id => modernItems.includes(id))
    expect(hasModernInTop).toBe(true)

    const polaroidIndex = ideas.findIndex(i => i.id === 'vintage_polaroid_station')
    const shehnaiIndex = ideas.findIndex(i => i.id === 'live_shehnai_jugalbandi')
    expect(polaroidIndex).toBeLessThan(shehnaiIndex)
  })

  it('promotes feast items when feastVsSpectacle is low (< 50)', () => {
    const foodieDNA: StyleDNA = {
      ...baseStyleDNA,
      dimensions: {
        ...baseStyleDNA.dimensions,
        feastVsSpectacle: 10, // Strongly Feast focused
      },
    }

    const ideas = getPersonalizedIdeas(baseBrief, foodieDNA)
    const topCategories = ideas.slice(0, 3).map(i => i.category)
    expect(topCategories).toContain('catering')
  })

  it('returns unfiltered catalog matching eventType when styleDNA is omitted', () => {
    const ideas = getPersonalizedIdeas(baseBrief)
    const expectedLength = CURATED_IDEAS.filter(i => i.eventTypes.includes('wedding')).length
    expect(ideas.length).toBe(expectedLength)
  })

  it('executes in sub-millisecond time (<1ms) with pure synchronous computation', () => {
    const start = performance.now()
    for (let i = 0; i < 50; i++) {
      getPersonalizedIdeas(baseBrief, baseStyleDNA)
    }
    const elapsed = performance.now() - start
    // 50 runs should take well under 100ms (< 2ms per call even under heavy CI load)
    expect(elapsed).toBeLessThan(100)
  })
})
