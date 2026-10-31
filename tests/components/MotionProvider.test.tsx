import React, { useContext } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MotionConfigContext } from 'motion/react'
import { MotionProvider } from '@/components/providers/MotionProvider'

function ReadReducedMotion({ onRead }: { onRead: (value: string | undefined) => void }) {
  onRead(useContext(MotionConfigContext).reducedMotion)
  return null
}

describe('MotionProvider (A1)', () => {
  it('sets reducedMotion to "user" for every descendant motion component', () => {
    let seen: string | undefined
    render(
      <MotionProvider>
        <ReadReducedMotion onRead={(v) => (seen = v)} />
      </MotionProvider>
    )
    expect(seen).toBe('user')
  })
})
