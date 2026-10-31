import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState } from 'react'
import { StepVibeSwatches } from '@/components/intake/StepVibeSwatches'
import { StepVibeTradeoffs, type VibeTradeoffs } from '@/components/intake/StepVibeTradeoffs'
import { SWATCHES } from '@/data/swatches'
import { VIBE_MAX, VIBE_MIN } from '@/lib/vibe-limits'

const pickCopy = (n: number) => `Pick ${VIBE_MIN} to ${VIBE_MAX} vibes (${n}/${VIBE_MAX} selected)`
const readyCopy = (n: number) => `Ready! ${n}/${VIBE_MAX} vibes selected`
const confirmName = `Confirm ${VIBE_MIN} to ${VIBE_MAX} Vibes`

describe('Vibe Intake Components (VIBE-01, VIBE-02, D-01, D-03, D-04)', () => {
  describe('StepVibeSwatches Component', () => {
    function SwatchesWrapper({ initialIds = [] }: { initialIds?: string[] }) {
      const [ids, setIds] = useState<string[]>(initialIds)
      return <StepVibeSwatches selectedSwatchIds={ids} onChange={setIds} showCta={true} />
    }

    const list = () => within(screen.getByRole('list', { name: 'Vibe references' }))

    it('renders all 24 curated swatches in a list with a category dropdown and the AI button', () => {
      render(<SwatchesWrapper />)

      expect(screen.getByText('Visual Vibe Gallery')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Category' })).toHaveTextContent('All categories')
      expect(screen.getByRole('button', { name: 'Describe your vibe' })).toBeInTheDocument()

      expect(list().getAllByRole('listitem')).toHaveLength(SWATCHES.length)
      expect(list().getByText('Royal Amber Courtyard')).toBeInTheDocument()
      expect(list().getByText('Marigold Cascade')).toBeInTheDocument()
      expect(list().getByText('Gulabi Rose Palace')).toBeInTheDocument()
    })

    it('filters the list by one or more categories from the multi-select dropdown', async () => {
      const user = userEvent.setup()
      render(<SwatchesWrapper />)

      await user.click(screen.getByRole('button', { name: 'Category' }))
      await user.click(await screen.findByRole('menuitemcheckbox', { name: /Garden Pastel/ }))

      // The menu stays open so a second category can be ticked.
      await user.click(screen.getByRole('menuitemcheckbox', { name: /High Energy Mela/ }))
      // Radix hides the rest of the page from assistive tech while a menu is open, hence `hidden`.
      expect(screen.getByRole('button', { name: 'Category', hidden: true })).toHaveTextContent(
        '2 categories'
      )

      await user.keyboard('{Escape}')

      const expected = SWATCHES.filter((s) =>
        s.tags.some((t) => t === 'Garden Pastel' || t === 'High Energy Mela')
      )
      expect(list().getAllByRole('listitem')).toHaveLength(expected.length)
      expect(list().getByText('Pastel Floral Shamiana')).toBeInTheDocument()
      expect(list().queryByText('Royal Amber Courtyard')).not.toBeInTheDocument()

      // "All categories" clears the filter.
      await user.click(screen.getByRole('button', { name: 'Category' }))
      await user.click(await screen.findByRole('menuitemcheckbox', { name: 'All categories' }))
      await user.keyboard('{Escape}')
      expect(list().getAllByRole('listitem')).toHaveLength(SWATCHES.length)
    })

    it('shows the full title and description of the focused swatch in the detail card', async () => {
      const user = userEvent.setup()
      render(<SwatchesWrapper />)

      const target = SWATCHES[3]
      await user.click(list().getByText(target.title))

      const card = within(screen.getByRole('article', { name: `${target.title} details` }))
      expect(card.getByRole('heading', { name: target.title })).toBeInTheDocument()
      // Nothing is clipped: the whole description is in the DOM, not a line-clamped excerpt.
      expect(card.getByText(target.description)).toBeInTheDocument()
      for (const hex of target.palette) expect(card.getByText(hex)).toBeInTheDocument()

      // Previewing does not select.
      expect(screen.getByText(pickCopy(0))).toBeInTheDocument()
      await user.click(card.getByRole('button', { name: 'Add to my vibes' }))
      expect(screen.getByText(pickCopy(1))).toBeInTheDocument()
      expect(card.getByRole('button', { name: 'Remove from my vibes' })).toBeInTheDocument()
    })

    it(`displays counter pill reflecting selected count and disables CTA below ${VIBE_MIN}`, () => {
      render(<SwatchesWrapper initialIds={SWATCHES.slice(0, VIBE_MIN - 1).map((s) => s.id)} />)

      expect(screen.getByText(pickCopy(VIBE_MIN - 1))).toBeInTheDocument()
      const cta = screen.getByRole('button', { name: confirmName })
      expect(cta).toBeDisabled()
      expect(cta).toHaveAttribute('aria-disabled', 'true')
    })

    it(`enables primary CTA when ${VIBE_MIN} to ${VIBE_MAX} swatches are selected with celebratory copy`, () => {
      const minIds = SWATCHES.slice(0, VIBE_MIN).map((s) => s.id)
      render(<SwatchesWrapper initialIds={minIds} />)

      expect(screen.getByText(readyCopy(VIBE_MIN))).toBeInTheDocument()
      const cta = screen.getByRole('button', { name: confirmName })
      expect(cta).not.toBeDisabled()
      expect(cta).toHaveAttribute('aria-disabled', 'false')
    })

    it('rejects a selection past the maximum, blocks addition, and displays the warning', () => {
      const maxIds = SWATCHES.slice(0, VIBE_MAX).map((s) => s.id)
      render(<SwatchesWrapper initialIds={maxIds} />)

      expect(screen.getByText(readyCopy(VIBE_MAX))).toBeInTheDocument()

      // Try selecting one more than the maximum
      const extra = SWATCHES[VIBE_MAX]
      fireEvent.click(screen.getByRole('button', { name: `Select ${extra.title}` }))

      // Warning copy must appear
      expect(
        screen.getByText(`Maximum ${VIBE_MAX} swatches reached. Tap a selected swatch to deselect.`)
      ).toBeInTheDocument()

      // Pill should still show the maximum selected
      expect(screen.getByText(readyCopy(VIBE_MAX))).toBeInTheDocument()
    })
  })

  describe('Describe your vibe (AI)', () => {
    function Wrapper({ initialIds = [] }: { initialIds?: string[] }) {
      const [ids, setIds] = useState<string[]>(initialIds)
      return <StepVibeSwatches selectedSwatchIds={ids} onChange={setIds} />
    }

    afterEach(() => vi.unstubAllGlobals())

    it('replaces the selection with the suggested vibes and lets the user undo', async () => {
      const user = userEvent.setup()
      const suggested = SWATCHES.slice(10, 10 + VIBE_MAX).map((s) => s.id)
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { swatchIds: suggested, reasoning: 'Warm brass and marigold.', source: 'ai' },
        }),
      })
      vi.stubGlobal('fetch', fetchMock)

      const before = SWATCHES.slice(0, 2).map((s) => s.id)
      render(<Wrapper initialIds={before} />)
      expect(screen.getByText(pickCopy(2))).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Describe your vibe' }))
      const submit = await screen.findByRole('button', { name: 'Find my vibes' })
      expect(submit).toBeDisabled()

      await user.type(
        screen.getByRole('textbox', { name: 'Describe your vibe' }),
        'Warm brass and marigold'
      )
      await user.click(submit)

      await waitFor(() => expect(screen.getByText(readyCopy(VIBE_MAX))).toBeInTheDocument())
      expect(screen.getByText(/Picked for you: Warm brass and marigold\./)).toBeInTheDocument()

      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe('/api/vibes/suggest')
      expect(JSON.parse(init.body)).toEqual({ description: 'Warm brass and marigold' })

      await user.click(screen.getByRole('button', { name: /Undo/ }))
      expect(screen.getByText(pickCopy(2))).toBeInTheDocument()
    })

    it('shows the error and keeps the selection when the request fails', async () => {
      const user = userEvent.setup()
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          json: async () => ({ success: false, error: 'Describe the vibe in a few words' }),
        })
      )

      render(<Wrapper />)
      await user.click(screen.getByRole('button', { name: 'Describe your vibe' }))
      await user.type(await screen.findByRole('textbox', { name: 'Describe your vibe' }), 'abc')
      await user.click(screen.getByRole('button', { name: 'Find my vibes' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Describe the vibe in a few words')
      expect(screen.getByText(pickCopy(0))).toBeInTheDocument()
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
      const spectacleRadio = screen
        .getAllByRole('radio')
        .find((el) => el.textContent?.includes('Dazzling Stage & Visual Production'))
      expect(spectacleRadio).toHaveAttribute('aria-checked', 'true')

      // Click 'Grand High-Energy Extravaganza'
      const grandOption = screen.getByText('Grand High-Energy Extravaganza')
      fireEvent.click(grandOption)
      const grandRadio = screen
        .getAllByRole('radio')
        .find((el) => el.textContent?.includes('Grand High-Energy Extravaganza'))
      expect(grandRadio).toHaveAttribute('aria-checked', 'true')

      // Click 'Contemporary Chic & Minimalist Elegance'
      const modernOption = screen.getByText('Contemporary Chic & Minimalist Elegance')
      fireEvent.click(modernOption)
      const modernRadio = screen
        .getAllByRole('radio')
        .find((el) => el.textContent?.includes('Contemporary Chic & Minimalist Elegance'))
      expect(modernRadio).toHaveAttribute('aria-checked', 'true')

      // Verify Primary CTA copy
      expect(screen.getByRole('button', { name: 'Infuse Style DNA' })).toBeInTheDocument()
    })
  })
})
