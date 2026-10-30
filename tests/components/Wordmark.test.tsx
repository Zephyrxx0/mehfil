import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Wordmark } from '@/components/brand/Wordmark'
import { TITLE_VIEWBOX } from '@/components/hero/title-paths'

describe('Wordmark Component (Brand Consistency)', () => {
  it('renders the authentic landing page Ewert vector glyphs', () => {
    const { container } = render(<Wordmark size="md" />)
    
    // Screen reader accessible name
    expect(screen.getByText('Mehfil (महफ़िल)')).toBeInTheDocument()

    // SVG wordmark element
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('viewBox', TITLE_VIEWBOX)
    expect(svg).toHaveClass('h-8')

    // Clean textContent without Frankenstein string
    expect(container.textContent).toBe('Mehfil (महफ़िल)')
  })

  it('adjusts height class based on size prop', () => {
    const { container: cSm } = render(<Wordmark size="sm" />)
    expect(cSm.querySelector('svg')).toHaveClass('h-6')

    const { container: cLg } = render(<Wordmark size="lg" />)
    expect(cLg.querySelector('svg')).toHaveClass('h-10')
  })
})
