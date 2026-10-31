import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ShareSaveModal } from '@/components/workspace/ShareSaveModal'

vi.mock('@/lib/storage/persistence', () => ({
  persistence: { regenerateShareKey: vi.fn() },
}))

describe('ShareSaveModal header', () => {
  it('reserves right padding so the title clears the absolute close button', () => {
    render(
      <ShareSaveModal
        open
        onOpenChange={vi.fn()}
        planId="plan-1"
        planTitle="Riya & Kabir Wedding"
        editKey="secreteditkey1234567890abcdef1234567890"
        initialShareToken="publicsharetoken123"
      />
    )
    const title = screen.getByRole('heading', { name: /Share & Save Celebration/i })
    const header = title.parentElement as HTMLElement
    expect(header).toHaveClass('pr-10')
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })
})
