'use client'

import React, { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

export function JaliWatermark() {
  const shouldReduceMotion = useReducedMotion()

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Subtle dampened translation offset (max ±6px)
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 })
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 })

  useEffect(() => {
    if (shouldReduceMotion) return

    // Desktop parallax only when hovering is supported
    const isFinePointer =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches

    if (!isFinePointer) return

    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const targetX = ((e.clientX - cx) / cx) * 6 // max ±6px
      const targetY = ((e.clientY - cy) / cy) * 6
      mouseX.set(targetX)
      mouseY.set(targetY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [shouldReduceMotion, mouseX, mouseY])

  const prefersReduced = Boolean(
    shouldReduceMotion ||
    (typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  )

  return (
    <div
      aria-hidden="true"
      data-testid="jali-watermark"
      className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 opacity-[0.06] select-none"
    >
      <motion.div
        data-testid="jali-tilt-container"
        style={{
          x: prefersReduced ? 0 : springX,
          y: prefersReduced ? 0 : springY,
        }}
      >
        <svg
          viewBox="0 0 800 800"
          data-testid="jali-svg"
          className={cn(
            'w-[600px] h-[600px] sm:w-[850px] sm:h-[850px] stroke-royal-plum fill-none',
            !prefersReduced && 'animate-spin-slow'
          )}
          strokeWidth="1.2"
        >
          {/* Concentric 8-fold Indian geometric jali rings & petals */}
          <circle cx="400" cy="400" r="380" strokeDasharray="6 6" />
          <circle cx="400" cy="400" r="320" />
          <circle cx="400" cy="400" r="240" strokeDasharray="4 4" />
          <circle cx="400" cy="400" r="160" />
          <circle cx="400" cy="400" r="80" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 400 400)`}>
              <path d="M400,20 C430,120 470,220 400,320 C330,220 370,120 400,20 Z" />
              <path
                d="M400,80 C420,160 450,240 400,320 C350,240 380,160 400,80 Z"
                strokeDasharray="2 2"
              />
            </g>
          ))}
        </svg>
      </motion.div>
    </div>
  )
}
