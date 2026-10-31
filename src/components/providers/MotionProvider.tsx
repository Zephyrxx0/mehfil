'use client'

import React, { type ReactNode } from 'react'
import { MotionConfig } from 'motion/react'

/**
 * Makes every Motion component honour the visitor's `prefers-reduced-motion`
 * setting (transform and layout animations are skipped, opacity still fades).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
