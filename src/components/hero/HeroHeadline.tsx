'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'motion/react'

export const SENTIMENTS = ['Wedding', 'Milestone', 'Soirée', 'Mehfil'] as const

export function HeroHeadline() {
  const [index, setIndex] = useState(0)
  const reducedMotionHook = useReducedMotion()
  const prefersReduced = Boolean(
    reducedMotionHook ||
    (typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SENTIMENTS.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  }

  const wordVariants: Variants = {
    hidden: prefersReduced ? { opacity: 0 } : { opacity: 0, y: 24 },
    visible: prefersReduced
      ? { opacity: 1, transition: { duration: 0.2 } }
      : {
          opacity: 1,
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 120,
            damping: 18,
          },
        },
  }

  const activeSentiment = SENTIMENTS[index]

  return (
    <div className="flex flex-col items-center text-center">
      <motion.h1
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        data-testid="hero-headline"
        data-active-sentiment={activeSentiment}
        className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-[5.25rem] font-bold text-royal-plum tracking-[-0.03em] leading-[1.05] max-w-5xl"
      >
        <motion.span variants={wordVariants} className="inline-block">
          Where
        </motion.span>{' '}
        <motion.span variants={wordVariants} className="inline-block">
          your
        </motion.span>{' '}
        <span
          data-testid="sentiment-container"
          data-active-sentiment={activeSentiment}
          className="inline-block relative min-w-[190px] sm:min-w-[280px] md:min-w-[340px] h-[1.15em] overflow-hidden align-bottom text-left"
        >
          <AnimatePresence mode="popLayout">
            <motion.span
              key={activeSentiment}
              data-testid={`sentiment-${activeSentiment}`}
              data-sentiment={activeSentiment}
              initial={
                prefersReduced
                  ? { opacity: 0 }
                  : { y: 28, opacity: 0, filter: 'blur(4px)' }
              }
              animate={
                prefersReduced
                  ? { opacity: 1 }
                  : { y: 0, opacity: 1, filter: 'blur(0px)' }
              }
              exit={
                prefersReduced
                  ? { opacity: 0 }
                  : { y: -28, opacity: 0, filter: 'blur(4px)' }
              }
              transition={
                prefersReduced
                  ? { duration: 0.2 }
                  : { type: 'spring', stiffness: 120, damping: 18, mass: 1.2 }
              }
              className="absolute inset-0 inline-block italic text-royal-plum underline decoration-marigold decoration-4 underline-offset-8"
            >
              {activeSentiment}
            </motion.span>
          </AnimatePresence>
        </span>{' '}
        <motion.span variants={wordVariants} className="inline-block">
          moves
        </motion.span>{' '}
        <motion.span variants={wordVariants} className="inline-block">
          in
        </motion.span>{' '}
        <motion.span variants={wordVariants} className="inline-block">
          harmony.
        </motion.span>
      </motion.h1>
    </div>
  )
}
