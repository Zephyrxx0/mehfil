import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UnlockEditDialog } from '@/components/workspace/UnlockEditDialog'

describe('UnlockEditDialog copy', () => {
  it('does not state a key length', () => {
    render(<UnlockEditDialog open onOpenChange={() => {}} planId="p" onUnlocked={() => {}} />)
    expect(
      screen.getByText(
        'Paste the edit key or the full edit link shared by the celebration creator.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/32-character/)).not.toBeInTheDocument()
  })
})
