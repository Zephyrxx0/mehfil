'use client'

import React, { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'

interface Petal {
  x: number
  y: number
  radius: number
  scale: number
  rotation: number
  vRot: number
  vy: number
  swayPhase: number
  swaySpeed: number
  color: string
  opacity: number
}

const COLORS = ['#F7C873', '#F2A7B8'] // Marigold and Gulabi Rose

export function CelebrationParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Safe getContext check (prevents happy-dom test crashes)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Respect prefers-reduced-motion
    const prefersReduced =
      shouldReduceMotion ||
      (typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches)

    if (prefersReduced) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    let animationFrameId: number
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    let width = window.innerWidth
    let height = window.innerHeight

    const setupDimensions = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      if (ctx.setTransform) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      } else if (ctx.scale) {
        ctx.scale(dpr, dpr)
      }
    }

    setupDimensions()

    const handleResize = () => {
      setupDimensions()
    }
    window.addEventListener('resize', handleResize)

    // Maintain a pool of 30 petals (within 25–35 specified)
    const petals: Petal[] = Array.from({ length: 30 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 6 + Math.random() * 6,
      scale: 0.6 + Math.random() * 0.8,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.02,
      vy: 0.3 + Math.random() * 0.5,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.02,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: 0.35 + Math.random() * 0.35,
    }))

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      for (const p of petals) {
        p.y += p.vy
        p.swayPhase += p.swaySpeed
        p.x += Math.sin(p.swayPhase) * 0.5
        p.rotation += p.vRot

        // Wrap around viewport edges
        if (p.y > height + 20) {
          p.y = -20
          p.x = Math.random() * width
        }
        if (p.x > width + 20) p.x = -20
        if (p.x < -20) p.x = width + 20

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.scale(p.scale, p.scale)
        ctx.beginPath()
        ctx.moveTo(0, -p.radius)
        ctx.bezierCurveTo(
          p.radius * 0.8,
          -p.radius * 0.5,
          p.radius * 0.8,
          p.radius * 0.5,
          0,
          p.radius
        )
        ctx.bezierCurveTo(
          -p.radius * 0.8,
          p.radius * 0.5,
          -p.radius * 0.8,
          -p.radius * 0.5,
          0,
          -p.radius
        )
        ctx.closePath()
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.opacity
        ctx.fill()
        ctx.restore()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [shouldReduceMotion])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="celebration-particles"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  )
}
