import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { StyleDNACard } from '@/components/workspace/StyleDNACard'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import type { EventBrief, Plan, PlanVersionRecord } from '@/lib/engine/types'
import type { StyleDNA } from '@/lib/ai/schemas'

describe('StyleDNACard & Retune Flow (VIBE-04, D-08, D-11, D-14)', () => {
  const sampleBrief: EventBrief = {
    title: 'Ananya & Rohan Sangeet',
    eventType: 'wedding',
    eventDate: '2027-08-10',
    city: 'Udaipur',
    guestCount: 300,
    totalBudgetPaise: 250_000_000,
    protectedCategory: 'entertainment',
    protectedMomentQuote: 'Live soulful qawwali night under fairy lights',
  }

  const sampleDNA: StyleDNA = {
    dimensions: {
      formality: 70,
      energy: 85,
      scale: 90,
      heritageVsModern: 80,
      feastVsSpectacle: 60,
      music: 75,
      decorDensity: 80,
      indoorVsOutdoor: 50,
    },
    namedPalette: [
      { name: 'Marigold Amber', hex: '#F7C873' },
      { name: 'Gulabi Rose', hex: '#F2A7B8' },
      { name: 'Royal Plum', hex: '#3A2442' },
      { name: 'Warm Ivory', hex: '#FFF8EE' },
    ],
    vibeStatement: 'A grand royal spectacle with soulful sufi melodies.',
    protectedCategory: 'entertainment',
    protectedMomentQuote: 'Live soulful qawwali night under fairy lights',
  }

  const basePlan: Plan = instantiatePlanFromBrief(sampleBrief)
  const planWithDNA: Plan = {
    ...basePlan,
    styleDNA: sampleDNA,
  }

  it('renders vibe statement, named palette dots, dimension pills, and protected moment quote', () => {
    render(<StyleDNACard plan={planWithDNA} />)

    // Vibe Statement in Fraunces serif styling
    expect(
      screen.getByText(/A grand royal spectacle with soulful sufi melodies/)
    ).toBeInTheDocument()

    // Named palette swatches
    expect(screen.getByText('Named Festive Palette')).toBeInTheDocument()
    // Each colour is announced once, by its name and hex in text; the dot itself is decorative.
    expect(screen.getByText('Marigold Amber')).toBeInTheDocument()
    expect(screen.getByText('#F7C873')).toBeInTheDocument()
    expect(screen.getByText('Gulabi Rose')).toBeInTheDocument()
    expect(screen.getByText('#F2A7B8')).toBeInTheDocument()
    expect(document.querySelector('[aria-label="Marigold Amber (#F7C873)"]')).toBeNull()

    // Dominant Dimension traits
    expect(screen.getByText('Dominant Dimensions')).toBeInTheDocument()
    expect(screen.getByText('Grand Scale')).toBeInTheDocument()
    expect(screen.getByText('90%')).toBeInTheDocument()
    expect(screen.getByText('High Energy')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()

    // Protected moment quote cardlet
    expect(screen.getByText('Protected Moment Quote')).toBeInTheDocument()
    expect(screen.getByText(/Live soulful qawwali night under fairy lights/)).toBeInTheDocument()
  })

  it('renders calm degradation note when activeTier === 3 with subtle retry action (D-14)', async () => {
    const handleRetry = vi.fn().mockResolvedValue(undefined)

    const tier3Version: PlanVersionRecord = {
      id: 'ver-2',
      eventId: planWithDNA.id,
      versionNumber: 2,
      reason: 'Tier 3 fallback applied',
      snapshot: planWithDNA,
      createdAt: new Date().toISOString(),
      meta: {
        run_record: {
          activeTier: 3,
          durationMs: 4,
          modelId: 'deterministic-heuristic-v1',
          fallbackReason: 'api_key_missing',
          timestamp: new Date().toISOString(),
        },
        styleDNA: sampleDNA,
      },
    }

    render(
      <StyleDNACard
        plan={planWithDNA}
        currentVersion={tier3Version}
        onRetryExtraction={handleRetry}
      />
    )

    // Calm degradation note copy
    expect(
      screen.getByText(
        'Showing standard style profile for now; your custom vibe will be infused when you retry.'
      )
    ).toBeInTheDocument()

    // Subtle Retry Extraction button
    const retryBtn = screen.getByRole('button', { name: /Retry Extraction/i })
    expect(retryBtn).toBeInTheDocument()

    fireEvent.click(retryBtn)
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it('opens retune sheet when clicking Edit Style DNA and saves modified dimensions', async () => {
    const handleRetune = vi.fn()

    render(<StyleDNACard plan={planWithDNA} onRetuneStyle={handleRetune} />)

    const editBtn = screen.getByRole('button', { name: /Edit Style DNA/i })
    fireEvent.click(editBtn)

    // Sheet should open with title
    expect(screen.getByText('Retune Style DNA')).toBeInTheDocument()

    // Click Save Retuned Style
    const saveBtn = screen.getByRole('button', { name: 'Save Retuned Style' })
    fireEvent.click(saveBtn)

    expect(handleRetune).toHaveBeenCalledTimes(1)
    const savedDimensions = handleRetune.mock.calls[0][0]
    expect(savedDimensions.scale).toBe(90)
    expect(savedDimensions.energy).toBe(85)
  })

  it('triggers AlertDialog on Reset to Baseline and confirms restoration (D-11, T-04-08)', async () => {
    const handleReset = vi.fn()

    render(<StyleDNACard plan={planWithDNA} onResetToBaseline={handleReset} />)

    const resetBtn = screen.getByRole('button', { name: /Reset to Baseline \(v1\)/i })
    fireEvent.click(resetBtn)

    // Confirmation dialog should be displayed with exact contract copy
    expect(screen.getByText('Reset to Baseline (v1)?')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Reset celebration plan to baseline archetype? All custom vibe multipliers will be reverted to default weights. Your current plan remains safely saved in version history.'
      )
    ).toBeInTheDocument()

    // Confirm dialog action
    const confirmBtn = screen.getByRole('button', { name: 'Reset to Baseline' })
    fireEvent.click(confirmBtn)

    expect(handleReset).toHaveBeenCalledTimes(1)
  })
})
