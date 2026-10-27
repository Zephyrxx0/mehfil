'use client'

import React, { useState } from 'react'
import type { EventBrief, Plan } from '@/lib/engine/types'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { formatINR } from '@/lib/engine/currency'
import { BriefModal } from '@/components/intake/BriefModal'
import { PlanWorkspace } from '@/components/workspace/PlanWorkspace'
import { HeroSection } from '@/components/hero/HeroSection'
import { STARTER_OPTIONS } from '@/components/intake/StarterChips'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export default function HomePage() {
  const [activePlan, setActivePlan] = useState<Plan | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSelectStarter = (brief: EventBrief) => {
    const plan = instantiatePlanFromBrief(brief)
    setActivePlan(plan)
  }

  return (
    <main className="min-h-screen flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="border-b border-royal-plum/8 bg-warm-ivory/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-devanagari text-2xl font-bold tracking-tight text-royal-plum">
              महफ़िल
            </span>
            <span className="text-xs uppercase tracking-widest text-royal-plum/50 font-medium">
              Mehfil
            </span>
          </div>

          {activePlan && (
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-royal-plum/10 bg-royal-plum/5 px-3.5 py-1 text-xs">
              <span className="font-semibold text-royal-plum truncate max-w-[200px]">
                {activePlan.brief.title}
              </span>
              <span className="text-royal-plum/30">•</span>
              <span className="text-royal-plum/70">{activePlan.brief.eventDate}</span>
              <span className="text-royal-plum/30">•</span>
              <span className="font-bold text-royal-plum tabular-nums">
                {formatINR(activePlan.totalBudgetPaise)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            {activePlan ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="gap-1.5 text-xs font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 text-marigold" />
                <span>Re-plan Event</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="gap-1.5 text-xs font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 text-royal-plum" />
                <span>Plan Celebration</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area with Motion Crossfade */}
      <div className="w-full flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {activePlan ? (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full flex-1"
            >
              <PlanWorkspace
                initialPlan={activePlan}
                onResetPlan={() => setIsModalOpen(true)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full flex-1"
            >
              <HeroSection
                onOpenBrief={() => setIsModalOpen(true)}
                onSelectStarter={handleSelectStarter}
                onExploreSample={() => handleSelectStarter(STARTER_OPTIONS[0].brief)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="border-t border-royal-plum/8 py-6 text-center text-xs text-royal-plum/50">
        Mehfil (महफ़िल) • Built for Prompt Wars Virtual Challenge 5 • Mathematical Integrity First
      </footer>

      {/* Brief Intake Modal */}
      <BriefModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPlanCreated={(plan) => {
          setActivePlan(plan)
          setIsModalOpen(false)
        }}
        initialBrief={activePlan?.brief}
      />
    </main>
  )
}
