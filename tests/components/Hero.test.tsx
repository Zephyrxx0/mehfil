import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HeroHeadline } from '@/components/hero/HeroHeadline'
import { HeroSection } from '@/components/hero/HeroSection'
import HomePage from '@/app/page'
import { JaliWatermark } from '@/components/hero/JaliWatermark'
import { CelebrationParticles } from '@/components/hero/CelebrationParticles'

describe('Centerpiece Kinetic Hero Component Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('HeroHeadline typography and sentiment cycling', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('renders headline words with font-serif display typography', () => {
      render(<HeroHeadline />)
      const heading = screen.getByTestId('hero-headline')
      expect(heading).toBeInTheDocument()
      expect(heading.className).toContain('font-serif')
      expect(heading).toHaveTextContent(/Where your .* moves in harmony\./)
    })

    it('cycles through sentiment archetypes every 3.5s (Wedding -> Milestone -> Soirée -> Mehfil -> Wedding)', () => {
      render(<HeroHeadline />)

      // Initial sentiment
      expect(screen.getByTestId('sentiment-container')).toHaveAttribute(
        'data-active-sentiment',
        'Wedding'
      )
      expect(screen.getByText('Wedding')).toBeInTheDocument()

      // Advance 3.5s -> Milestone
      act(() => {
        vi.advanceTimersByTime(3500)
      })
      expect(screen.getByTestId('sentiment-container')).toHaveAttribute(
        'data-active-sentiment',
        'Milestone'
      )
      expect(screen.getByText('Milestone')).toBeInTheDocument()

      // Advance 3.5s -> Soirée
      act(() => {
        vi.advanceTimersByTime(3500)
      })
      expect(screen.getByTestId('sentiment-container')).toHaveAttribute(
        'data-active-sentiment',
        'Soirée'
      )
      expect(screen.getByText('Soirée')).toBeInTheDocument()

      // Advance 3.5s -> Mehfil
      act(() => {
        vi.advanceTimersByTime(3500)
      })
      expect(screen.getByTestId('sentiment-container')).toHaveAttribute(
        'data-active-sentiment',
        'Mehfil'
      )
      expect(screen.getByText('Mehfil')).toBeInTheDocument()

      // Advance 3.5s -> back to Wedding
      act(() => {
        vi.advanceTimersByTime(3500)
      })
      expect(screen.getByTestId('sentiment-container')).toHaveAttribute(
        'data-active-sentiment',
        'Wedding'
      )
      expect(screen.getByText('Wedding')).toBeInTheDocument()
    })

    it('renders sentiment without blur filter under reduced motion', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      render(<HeroHeadline />)
      const sentimentEl = screen.getByTestId('sentiment-Wedding')
      expect(sentimentEl).toBeInTheDocument()
      // Under reduced motion, style filter should not contain blur
      expect(sentimentEl.style.filter || '').not.toContain('blur')
    })
  })

  describe('Devanagari Brand Wordmark & Branding Presence', () => {
    it('renders Tiro Devanagari Hindi wordmark ("महफ़िल") and "Mehfil" subtitle in brand badge', () => {
      render(<HeroSection onOpenBrief={vi.fn()} onSelectStarter={vi.fn()} />)

      const badge = screen.getByTestId('hero-brand-badge')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent('महफ़िल')
      expect(badge).toHaveTextContent('Mehfil — Words from models, numbers from code.')

      const devanagariSpan = badge.querySelector('.font-devanagari')
      expect(devanagariSpan).toBeInTheDocument()
      expect(devanagariSpan).toHaveTextContent('महफ़िल')
    })

    it('renders Devanagari brand wordmark in the page navigation header', () => {
      render(<HomePage />)
      const headerWordmarks = screen.getAllByText('महफ़िल')
      expect(headerWordmarks.length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/Mehfil/i).length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Primary CTA Pill & Modal Interaction', () => {
    it('renders "Start Your Mehfil" primary tactile CTA pill with active:scale-95 and marigold background', () => {
      const onOpenBrief = vi.fn()
      render(<HeroSection onOpenBrief={onOpenBrief} onSelectStarter={vi.fn()} />)

      const cta = screen.getByRole('button', { name: /Start Your Mehfil/i })
      expect(cta).toBeInTheDocument()
      expect(cta.className).toContain('rounded-full')
      expect(cta.className).toContain('bg-marigold')
      expect(cta.className).toContain('text-royal-plum')
      expect(cta.className).toContain('active:scale-95')

      fireEvent.click(cta)
      expect(onOpenBrief).toHaveBeenCalledTimes(1)
    })

    it('clicking "Start Your Mehfil" on HomePage opens the BriefModal', () => {
      render(<HomePage />)

      // Initially BriefModal dialog content is not open
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      const cta = screen.getByRole('button', { name: /Start Your Mehfil/i })
      fireEvent.click(cta)

      // Modal dialog should now be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Plan Your Celebration')).toBeInTheDocument()
      expect(screen.getByText(/Step 1 of 5/)).toBeInTheDocument()
    })
  })

  describe('Starter Chips and 1-Click Launching', () => {
    it('renders StarterChips with 1-click celebration options and triggers onSelectStarter', () => {
      const onSelectStarter = vi.fn()
      render(<HeroSection onOpenBrief={vi.fn()} onSelectStarter={onSelectStarter} />)

      const delhiStarter = screen.getByRole('button', { name: /Big Fat Delhi Wedding/i })
      expect(delhiStarter).toBeInTheDocument()

      fireEvent.click(delhiStarter)
      expect(onSelectStarter).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Delhi Grand Wedding',
          eventType: 'wedding',
        })
      )
    })

    it('clicking "Explore Sample Plan" triggers sample starter selection', () => {
      const onExploreSample = vi.fn()
      render(
        <HeroSection
          onOpenBrief={vi.fn()}
          onSelectStarter={vi.fn()}
          onExploreSample={onExploreSample}
        />
      )

      const exploreBtn = screen.getByRole('button', { name: /Explore Sample Plan/i })
      fireEvent.click(exploreBtn)
      expect(onExploreSample).toHaveBeenCalledTimes(1)
    })
  })

  describe('Reduced Motion Accessibility Behavior', () => {
    const originalMatchMedia = window.matchMedia

    afterEach(() => {
      window.matchMedia = originalMatchMedia
    })

    it('freezes JaliWatermark rotation animation under prefers-reduced-motion', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      render(<JaliWatermark />)
      const svg = screen.getByTestId('jali-svg')
      // Under reduced motion, animate-spin-slow should be disabled
      expect(svg.className).not.toContain('animate-spin-slow')
    })

    it('enables JaliWatermark rotation animation when reduced motion is not requested', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      render(<JaliWatermark />)
      const svg = screen.getByTestId('jali-svg')
      expect(svg.className).toContain('animate-spin-slow')
    })

    it('renders CelebrationParticles canvas safely under reduced motion', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      render(<CelebrationParticles />)
      const canvas = screen.getByTestId('celebration-particles')
      expect(canvas).toBeInTheDocument()
    })
  })
})
