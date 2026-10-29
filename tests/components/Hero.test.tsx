import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HeroSection } from '@/components/hero/HeroSection'
import { TitleDraw } from '@/components/hero/TitleDraw'
import { TITLE_GLYPHS } from '@/components/hero/title-paths'
import HomePage from '@/app/page'

describe('Landing page', () => {
  it('draws "Mehfil" in Ewert as SVG outlines', () => {
    render(<TitleDraw />)
    const title = screen.getByTestId('hero-title')
    expect(title.tagName).toBe('H1')
    // Accessible name carries both scripts; the drawing itself is decorative.
    expect(title).toHaveTextContent('Mehfil')
    expect(title).toHaveTextContent('महफ़िल')
    expect(title.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')

    // The full Latin wordmark is drawn; no Devanagari glyphs in the mark.
    const latin = TITLE_GLYPHS.filter((g) => g.script === 'latin')
    const devanagari = TITLE_GLYPHS.filter((g) => g.script === 'devanagari')
    expect(latin).toHaveLength(6)
    expect(devanagari).toHaveLength(0)
    expect(title.querySelectorAll('path')).toHaveLength(TITLE_GLYPHS.length)
  })

  it('has two links into the app and does nothing by itself', () => {
    render(<HomePage />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/new', '/new?starter=wedding'])
    expect(screen.getByRole('link', { name: 'Start planning' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See a sample plan' })).toBeInTheDocument()
    // No forms, inputs or buttons on the landing page.
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
  })

  it('has no footer, no feature cards and no starter chips', () => {
    const { container } = render(<HeroSection />)
    expect(container.querySelector('footer')).toBeNull()
    expect(container.querySelectorAll('h4')).toHaveLength(0)
    expect(screen.queryByText(/Celebration Starters/i)).toBeNull()
  })

  it('places three decorative hairline figures in the background', () => {
    const { container } = render(<HeroSection />)
    const figures = container.querySelectorAll('.hairline-mehendi')
    expect(figures).toHaveLength(3)
    figures.forEach((f) => expect(f).toHaveAttribute('aria-hidden', 'true'))
  })
})
