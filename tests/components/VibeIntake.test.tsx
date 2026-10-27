import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React, { useState } from 'react'
import { StepVibeSwatches } from '@/components/intake/StepVibeSwatches'
import { StepVibeTradeoffs, type VibeTradeoffs } from '@/components/intake/StepVibeTradeoffs'
import { SWATCHES } from '@/data/swatches'

describe('Vibe Intake Components (VIBE-01, VIBE-02, D-01, D-03, D-04)', () => {
  describe('StepVibeSwatches Component', () => {
    function SwatchesWrapper({ initialIds = [] }: { initialIds?: string[] }) {
      const [ids, setIds] = useState<string[]>(initialIds)
      return (
        <StepVibeSwatches
          selectedSwatchIds={ids}
          onChange={setIds}
          showCta={true}
        />
      )
    }

    it('renders all 24 curated swatches and filter chips', () => {
      render(<SwatchesWrapper />)

      expect(screen.getByText('Visual Vibe Gallery')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Royal Heritage' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Garden Pastel' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Minimalist Festive' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'High Energy Mela' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Intimate Classic' })).toBeInTheDocument()

      // Should render swatches from registry
      expect(screen.getByText('Royal Amber Courtyard')).toBeInTheDocument()
      expect(screen.getByText('Marigold Cascade')).toBeInTheDocument()
      expect(screen.getByText('Gulabi Rose Palace')).toBeInTheDocument()
    })

    it('filters swatches when clicking preset filter chips', () => {
      render(<SwatchesWrapper />)

      // Filter by 'Garden Pastel'
      fireEvent.click(screen.getByRole('button', { name: 'Garden Pastel' }))

      // Swatches with Garden Pastel should show
      expect(screen.getByText('Pastel Floral Shamiana')).toBeInTheDocument()

      // Swatches not tagged with Garden Pastel should not show
      expect(screen.queryByText('Royal Amber Courtyard')).not.toBeInTheDocument()

      // Click 'All' to restore
      fireEvent.click(screen.getByRole('button', { name: 'All' }))
      expect(screen.getByText('Royal Amber Courtyard')).toBeInTheDocument()
    })

    it('displays counter pill reflecting selected count and disables CTA below 6', () => {
      render(<SwatchesWrapper />)

      expect(screen.getByText('Pick 6 to 8 vibes (0/8 selected)')).toBeInTheDocument()
      const cta = screen.getByRole('button', { name: 'Confirm 6 to 8 Vibes' })
      expect(cta).toBeDisabled()
      expect(cta).toHaveAttribute('aria-disabled', 'true')
    })

    it('enables primary CTA when 6 to 8 swatches are selected with celebratory copy', () => {
      const sixIds = SWATCHES.slice(0, 6).map((s) => s.id)
      render(<SwatchesWrapper initialIds={sixIds} />)

      expect(screen.getByText('Ready! 6/8 vibes selected')).toBeInTheDocument()
      const cta = screen.getByRole('button', { name: 'Confirm 6 to 8 Vibes' })
      expect(cta).not.toBeDisabled()
      expect(cta).toHaveAttribute('aria-disabled', 'false')
    })

    it('rejects 9th selection, blocks addition, and displays warning message (T-04-07)', () => {
      const eightIds = SWATCHES.slice(0, 8).map((s) => s.id)
      render(<SwatchesWrapper initialIds={eightIds} />)

      expect(screen.getByText('Ready! 8/8 vibes selected')).toBeInTheDocument()

      // Try selecting 9th swatch
      const ninthSwatch = SWATCHES[8]
      fireEvent.click(screen.getByText(ninthSwatch.title))

      // Warning copy must appear
      expect(
        screen.getByText('Maximum 8 swatches reached. Tap a selected swatch to deselect.')
      ).toBeInTheDocument()

      // Pill should still show 8/8 selected
      expect(screen.getByText('Ready! 8/8 vibes selected')).toBeInTheDocument()
    })
  })

  describe('StepVibeTradeoffs Component', () => {
    function TradeoffsWrapper() {
      const [moment, setMoment] = useState('')
      const [tradeoffs, setTradeoffs] = useState<VibeTradeoffs>({
        feastVsSpectacle: 'feast',
        intimateVsGrand: 'intimate',
        heritageVsModern: 'heritage',
      })

      return (
        <StepVibeTradeoffs
          protectedMoment={moment}
          onProtectedMomentChange={setMoment}
          tradeoffs={tradeoffs}
          onTradeoffsChange={setTradeoffs}
          showCta={true}
        />
      )
    }

    it('captures single-sentence Protected Moment with 200 char limit and live counter', () => {
      render(<TradeoffsWrapper />)

      expect(
        screen.getByText('Single-Sentence Protected Moment (Immune from Trimming)')
      ).toBeInTheDocument()
      expect(screen.getByText('(0/200)')).toBeInTheDocument()

      const textarea = screen.getByPlaceholderText(
        'e.g. Live soulful qawwali night under fairy lights'
      )

      fireEvent.change(textarea, {
        target: { value: 'Soulful sufi music under banyan tree with warm lights' },
      })

      expect(screen.getByText('(53/200)')).toBeInTheDocument()
      expect(textarea).toHaveValue('Soulful sufi music under banyan tree with warm lights')
    })

    it('enforces 200 character boundary on Protected Moment input', () => {
      render(<TradeoffsWrapper />)

      const textarea = screen.getByPlaceholderText(
        'e.g. Live soulful qawwali night under fairy lights'
      )

      const longString = 'a'.repeat(250)
      fireEvent.change(textarea, {
        target: { value: longString },
      })

      // Input should be capped to 200 characters
      expect(textarea).toHaveValue('a'.repeat(200))
      expect(screen.getByText('(200/200)')).toBeInTheDocument()
    })

    it('renders and selects all 3 forced-choice trade-off card pairs', () => {
      render(<TradeoffsWrapper />)

      // Pair 1: Feast vs Spectacle
      expect(screen.getByText('Sumptuous Multi-Course Dining')).toBeInTheDocument()
      expect(screen.getByText('Dazzling Stage & Visual Production')).toBeInTheDocument()

      // Pair 2: Intimate vs Grand
      expect(screen.getByText('Warm & Cozy Close Circle')).toBeInTheDocument()
      expect(screen.getByText('Grand High-Energy Extravaganza')).toBeInTheDocument()

      // Pair 3: Heritage vs Modern
      expect(screen.getByText('Timeless Rituals & Cultural Craft')).toBeInTheDocument()
      expect(screen.getByText('Contemporary Chic & Minimalist Elegance')).toBeInTheDocument()

      // Click 'Dazzling Stage & Visual Production'
      const spectacleOption = screen.getByText('Dazzling Stage & Visual Production')
      fireEvent.click(spectacleOption)
      const spectacleRadio = screen.getAllByRole('radio').find(
        (el) => el.textContent?.includes('Dazzling Stage & Visual Production')
      )
      expect(spectacleRadio).toHaveAttribute('aria-checked', 'true')

      // Click 'Grand High-Energy Extravaganza'
      const grandOption = screen.getByText('Grand High-Energy Extravaganza')
      fireEvent.click(grandOption)
      const grandRadio = screen.getAllByRole('radio').find(
        (el) => el.textContent?.includes('Grand High-Energy Extravaganza')
      )
      expect(grandRadio).toHaveAttribute('aria-checked', 'true')

      // Click 'Contemporary Chic & Minimalist Elegance'
      const modernOption = screen.getByText('Contemporary Chic & Minimalist Elegance')
      fireEvent.click(modernOption)
      const modernRadio = screen.getAllByRole('radio').find(
        (el) => el.textContent?.includes('Contemporary Chic & Minimalist Elegance')
      )
      expect(modernRadio).toHaveAttribute('aria-checked', 'true')

      // Verify Primary CTA copy
      expect(screen.getByRole('button', { name: 'Infuse Style DNA' })).toBeInTheDocument()
    })
  })
})
