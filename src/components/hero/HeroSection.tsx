'use client'

import React from 'react'
import type { EventBrief } from '@/lib/engine/types'
import { HeroHeadline } from '@/components/hero/HeroHeadline'
import { JaliWatermark } from '@/components/hero/JaliWatermark'
import { CelebrationParticles } from '@/components/hero/CelebrationParticles'
import { StarterChips, STARTER_OPTIONS } from '@/components/intake/StarterChips'
import { Button } from '@/components/ui/button'
import { ArrowRight, Calculator, ShieldCheck, CalendarClock } from 'lucide-react'

interface HeroSectionProps {
  onOpenBrief: () => void
  onSelectStarter: (brief: EventBrief) => void
  onExploreSample?: () => void
}

export function HeroSection({
  onOpenBrief,
  onSelectStarter,
  onExploreSample,
}: HeroSectionProps) {
  const handleExploreSample = () => {
    if (onExploreSample) {
      onExploreSample()
    } else {
      onSelectStarter(STARTER_OPTIONS[0].brief)
    }
  }

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16 sm:py-24 max-w-5xl mx-auto text-center overflow-hidden">
      {/* Ambient Visual Layers */}
      <CelebrationParticles />
      <JaliWatermark />

      {/* Top Brand Badge */}
      <div
        data-testid="hero-brand-badge"
        className="inline-flex items-center gap-2.5 rounded-full border border-royal-plum/10 bg-white/70 px-4 py-1.5 shadow-xs mb-8 backdrop-blur-xs"
      >
        <span className="font-devanagari text-base font-bold text-royal-plum">
          महफ़िल
        </span>
        <span className="h-3.5 w-px bg-royal-plum/20" />
        <span className="font-sans text-xs font-semibold text-royal-plum/80">
          Mehfil — Words from models, numbers from code.
        </span>
      </div>

      {/* Centerpiece Kinetic Headline */}
      <HeroHeadline />

      {/* Subtitle */}
      <p className="mt-6 text-base sm:text-lg text-royal-plum/70 max-w-2xl leading-relaxed mx-auto">
        A deterministic celebration planner that protects your moments, guarantees every rupee, and adapts in milliseconds.
      </p>

      {/* Primary & Secondary Actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button
          variant="pill"
          size="hero"
          onClick={onOpenBrief}
          className="h-14 px-8 rounded-full bg-marigold text-royal-plum font-bold text-lg shadow-[0_8px_24px_-4px_rgba(247,200,115,0.45)] hover:bg-marigold/95 active:scale-95 transition-all gap-2"
        >
          <span>Start Your Mehfil</span>
          <ArrowRight className="w-5 h-5 text-royal-plum" />
        </Button>

        <button
          type="button"
          onClick={handleExploreSample}
          className="text-sm font-semibold text-royal-plum/70 hover:text-royal-plum underline underline-offset-4 decoration-royal-plum/20 hover:decoration-royal-plum transition-colors"
        >
          Explore Sample Plan
        </button>
      </div>

      {/* 1-Click Starter Section */}
      <div className="mt-12 w-full pt-8 border-t border-royal-plum/8 flex flex-col items-center">
        <StarterChips onSelect={onSelectStarter} />
      </div>

      {/* 3 Pillars Feature Callouts */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left w-full">
        <div className="rounded-2xl border border-royal-plum/8 bg-white/60 p-5 shadow-xs backdrop-blur-xs">
          <div className="rounded-lg bg-marigold/20 p-2 text-royal-plum w-fit mb-2.5">
            <Calculator className="w-4 h-4" />
          </div>
          <h4 className="font-serif font-bold text-sm text-royal-plum">
            Zero-Float Paise Precision
          </h4>
          <p className="mt-1 text-xs text-royal-plum/60 leading-relaxed">
            Hare-Niemeyer largest remainder guarantees exact rupee balances across every vendor line.
          </p>
        </div>

        <div className="rounded-2xl border border-royal-plum/8 bg-white/60 p-5 shadow-xs backdrop-blur-xs">
          <div className="rounded-lg bg-gulabi-rose/25 p-2 text-royal-plum w-fit mb-2.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="font-serif font-bold text-sm text-royal-plum">
            Protected Moment Immunity
          </h4>
          <p className="mt-1 text-xs text-royal-plum/60 leading-relaxed">
            Designate your non-negotiable moment (Catering, Photos, or Music). It is structurally immune to trimming.
          </p>
        </div>

        <div className="rounded-2xl border border-royal-plum/8 bg-white/60 p-5 shadow-xs backdrop-blur-xs">
          <div className="rounded-lg bg-royal-plum/10 p-2 text-royal-plum w-fit mb-2.5">
            <CalendarClock className="w-4 h-4" />
          </div>
          <h4 className="font-serif font-bold text-sm text-royal-plum">
            Backwards UTC Roadmap
          </h4>
          <p className="mt-1 text-xs text-royal-plum/60 leading-relaxed">
            Milestones schedule backwards from your event day with Immediate Action triage and .ics export.
          </p>
        </div>
      </div>
    </section>
  )
}
