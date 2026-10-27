'use client'

import React, { useState } from 'react'
import type { EventBrief, Plan } from '@/lib/engine/types'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { BriefModal } from '@/components/intake/BriefModal'
import { PlanWorkspace } from '@/components/workspace/PlanWorkspace'
import { STARTER_OPTIONS } from '@/components/intake/StarterChips'
import { Sparkles, ArrowRight, ShieldCheck, Calculator, CalendarClock } from 'lucide-react'

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
            <span className="font-serif text-2xl font-bold tracking-tight text-royal-plum">
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
        /* Hero View (Zero Blank Screen, ADR-0001) */
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-royal-plum/15 bg-white/70 px-4 py-1.5 text-xs font-semibold text-royal-plum shadow-xs mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Words from models, numbers from code</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-bold text-royal-plum tracking-tight leading-tight sm:leading-none">
            Celebration planning with{' '}
            <span className="italic underline decoration-marigold underline-offset-8">
              mathematical integrity
            </span>
          </h1>

          <p className="mt-6 text-sm sm:text-base text-royal-plum/70 max-w-2xl leading-relaxed">
            Weddings, milestone birthdays, and cultural gatherings where budget, timeline, and vendors form a single
            interconnected plan. Re-balances dynamically in integer paise with zero hallucinated arithmetic.
          </p>

          {/* Primary CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2.5 rounded-full bg-royal-plum px-7 py-3 text-sm font-bold text-warm-ivory shadow-md hover:bg-royal-plum/90 active:scale-95 transition"
            >
              <span>Build Your Celebration Plan</span>
              <ArrowRight className="w-4 h-4 text-marigold" />
            </button>
          </div>

          {/* 1-Click Starter Section (D-02, ADR-0001) */}
          <div className="mt-12 w-full pt-8 border-t border-royal-plum/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-royal-plum/60 mb-3">
              Or instant-launch from an archetype in &lt;10ms:
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {STARTER_OPTIONS.map((starter) => (
                <button
                  key={starter.label}
                  type="button"
                  onClick={() => handleSelectStarter(starter.brief)}
                  className="rounded-full border border-royal-plum/15 bg-white/80 px-4 py-2 text-xs font-semibold text-royal-plum shadow-xs transition hover:border-marigold hover:bg-marigold/20 hover:shadow-sm active:scale-95"
                >
                  {starter.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3 Pillars Feature Callouts */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left w-full">
            <div className="rounded-2xl border border-royal-plum/8 bg-white/60 p-4 shadow-xs">
              <div className="rounded-lg bg-marigold/20 p-2 text-royal-plum w-fit mb-2.5">
                <Calculator className="w-4 h-4" />
              </div>
              <h4 className="font-serif font-bold text-sm text-royal-plum">
                Zero-Float Paise Precision
              </h4>
              <p className="mt-1 text-xs text-royal-plum/60">
                Hare-Niemeyer largest remainder guarantees exact rupee balances across every vendor line.
              </p>
            </div>

            <div className="rounded-2xl border border-royal-plum/8 bg-white/60 p-4 shadow-xs">
              <div className="rounded-lg bg-gulabi-rose/25 p-2 text-royal-plum w-fit mb-2.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="font-serif font-bold text-sm text-royal-plum">
                Protected Moment Immunity
              </h4>
              <p className="mt-1 text-xs text-royal-plum/60">
                Designate your non-negotiable moment (Catering, Photos, or Music). It is structurally immune to trimming.
              </p>
            </div>

            <div className="rounded-2xl border border-royal-plum/8 bg-white/60 p-4 shadow-xs">
              <div className="rounded-lg bg-royal-plum/10 p-2 text-royal-plum w-fit mb-2.5">
                <CalendarClock className="w-4 h-4" />
              </div>
              <h4 className="font-serif font-bold text-sm text-royal-plum">
                Backwards UTC Roadmap
              </h4>
              <p className="mt-1 text-xs text-royal-plum/60">
                Milestones schedule backwards from your event day with Immediate Action triage and .ics export.
              </p>
            </div>
          </div>
        </div>
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

