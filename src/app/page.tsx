'use client'

import React, { useState } from 'react'
import type { EventBrief, Plan } from '@/lib/engine/types'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { BriefModal } from '@/components/intake/BriefModal'
import { PlanWorkspace } from '@/components/workspace/PlanWorkspace'
import { HeroSection } from '@/components/hero/HeroSection'
import { STARTER_OPTIONS } from '@/components/intake/StarterChips'
import { Sparkles } from 'lucide-react'

export default function HomePage() {
  const [activePlan, setActivePlan] = useState<Plan | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSelectStarter = (brief: EventBrief) => {
    const plan = instantiatePlanFromBrief(brief)
    setActivePlan(plan)
  }

  return (
    <main className="min-h-screen flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="border-b border-royal-plum/8 bg-warm-ivory/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-devanagari text-2xl font-bold tracking-tight text-royal-plum">
              महफ़िल
            </span>
            <span className="text-xs uppercase tracking-widest text-royal-plum/50 font-medium">
              Mehfil
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-royal-plum px-4 py-1.5 text-xs font-semibold text-warm-ivory shadow-xs hover:bg-royal-plum/90 active:scale-95 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-marigold" />
              <span>{activePlan ? 'Re-plan Event' : 'Plan Celebration'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {activePlan ? (
        <PlanWorkspace
          initialPlan={activePlan}
          onResetPlan={() => setActivePlan(null)}
        />
      ) : (
        <HeroSection
          onOpenBrief={() => setIsModalOpen(true)}
          onSelectStarter={handleSelectStarter}
          onExploreSample={() => handleSelectStarter(STARTER_OPTIONS[0].brief)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-royal-plum/8 py-6 text-center text-xs text-royal-plum/50">
        Mehfil (महफ़िल) • Built for Prompt Wars Virtual Challenge 5 • Mathematical Integrity First
      </footer>

      {/* Brief Intake Modal */}
      <BriefModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPlanCreated={(plan) => setActivePlan(plan)}
      />
    </main>
  )
}
