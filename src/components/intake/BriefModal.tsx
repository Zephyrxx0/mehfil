'use client'

import React, { useState } from 'react'
import type { EventBrief, EventType, BudgetCategory, Plan } from '@/lib/engine/types'
import { parseINRInput } from '@/lib/engine/currency'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { StarterChips } from './StarterChips'
import { StepEventBasics } from './StepEventBasics'
import { StepScaleBudget } from './StepScaleBudget'
import { StepNuances } from './StepNuances'
import { X, ArrowRight, ArrowLeft, Loader2, Sparkles } from 'lucide-react'

interface BriefModalProps {
  isOpen: boolean
  onClose: () => void
  onPlanCreated: (plan: Plan) => void
}

export function BriefModal({ isOpen, onClose, onPlanCreated }: BriefModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isRevealing, setIsRevealing] = useState(false)

  // Form State
  const [title, setTitle] = useState('My Celebration')
  const [eventType, setEventType] = useState<EventType>('wedding')
  const [eventDate, setEventDate] = useState('2026-11-20')
  const [city, setCity] = useState('Delhi')
  const [guestCount, setGuestCount] = useState(300)
  const [rawBudgetInput, setRawBudgetInput] = useState('25L')
  const [protectedCategory, setProtectedCategory] = useState<BudgetCategory>('catering')
  const [nuances, setNuances] = useState<string[]>([])
  const [customNotes, setCustomNotes] = useState('')

  if (!isOpen) return null

  const handleStarterSelect = (starterBrief: EventBrief) => {
    setIsRevealing(true)
    setTimeout(() => {
      const plan = instantiatePlanFromBrief(starterBrief)
      setIsRevealing(false)
      onPlanCreated(plan)
      onClose()
    }, 300)
  }

  const handleGenerate = () => {
    let budgetPaise = 250_000_000
    try {
      budgetPaise = parseINRInput(rawBudgetInput)
    } catch {
      // Fallback
    }

    const brief: EventBrief = {
      title: title.trim() || 'My Celebration',
      eventType,
      eventDate,
      city: city.trim() || 'Delhi',
      guestCount: guestCount || 100,
      totalBudgetPaise: budgetPaise,
      protectedCategory,
      nuances,
      customNotes,
    }

    setIsRevealing(true)
    setTimeout(() => {
      const plan = instantiatePlanFromBrief(brief)
      setIsRevealing(false)
      onPlanCreated(plan)
      onClose()
    }, 300)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-royal-plum/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-3xl border border-royal-plum/10 bg-warm-ivory p-6 shadow-2xl transition-all sm:p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-1.5 text-royal-plum/50 hover:bg-royal-plum/5 hover:text-royal-plum"
        >
          <X className="w-5 h-5" />
        </button>

        {isRevealing ? (
          /* 300ms Reveal State (D-04) */
          <div className="flex flex-col items-center justify-center py-16 text-center animate-pulse">
            <div className="rounded-full bg-marigold/20 p-4 mb-4 text-marigold">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-xl font-serif font-bold text-royal-plum">
              Balancing budget & timeline...
            </h3>
            <p className="mt-1 text-xs text-royal-plum/60">
              Applying integer paise precision & milestone scheduling
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Header & 1-Click Starters */}
            <div className="flex flex-col gap-4 border-b border-royal-plum/10 pb-5">
              <div>
                <h2 className="text-2xl font-serif font-bold text-royal-plum">
                  Plan Your Celebration
                </h2>
                <p className="text-xs text-royal-plum/60 mt-0.5">
                  Step {step} of 3 — Instant mathematical plan generation
                </p>
              </div>

              {/* Starter Chips */}
              <StarterChips onSelect={handleStarterSelect} />
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    s === step
                      ? 'bg-royal-plum'
                      : s < step
                      ? 'bg-marigold'
                      : 'bg-royal-plum/10'
                  }`}
                />
              ))}
            </div>

            {/* Step Content */}
            <div className="min-h-[260px]">
              {step === 1 && (
                <StepEventBasics
                  title={title}
                  eventType={eventType}
                  eventDate={eventDate}
                  city={city}
                  onChange={(fields) => {
                    if (fields.title !== undefined) setTitle(fields.title)
                    if (fields.eventType !== undefined) {
                      setEventType(fields.eventType)
                      // Auto-update recommended protected category based on archetype
                      if (fields.eventType === 'wedding') setProtectedCategory('catering')
                      if (fields.eventType === 'birthday') setProtectedCategory('photo_film')
                      if (fields.eventType === 'community') setProtectedCategory('entertainment')
                    }
                    if (fields.eventDate !== undefined) setEventDate(fields.eventDate)
                    if (fields.city !== undefined) setCity(fields.city)
                  }}
                />
              )}

              {step === 2 && (
                <StepScaleBudget
                  guestCount={guestCount}
                  rawBudgetInput={rawBudgetInput}
                  protectedCategory={protectedCategory}
                  onChange={(fields) => {
                    if (fields.guestCount !== undefined) setGuestCount(fields.guestCount)
                    if (fields.rawBudgetInput !== undefined) setRawBudgetInput(fields.rawBudgetInput)
                    if (fields.protectedCategory !== undefined) setProtectedCategory(fields.protectedCategory)
                  }}
                />
              )}

              {step === 3 && (
                <StepNuances
                  nuances={nuances}
                  customNotes={customNotes}
                  onChange={(fields) => {
                    if (fields.nuances !== undefined) setNuances(fields.nuances)
                    if (fields.customNotes !== undefined) setCustomNotes(fields.customNotes)
                  }}
                />
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between border-t border-royal-plum/10 pt-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-royal-plum/80 hover:bg-royal-plum/5 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                {step === 3 && (
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="rounded-full border border-royal-plum/20 px-4 py-2 text-xs font-medium text-royal-plum hover:bg-royal-plum/5 transition"
                  >
                    Skip & Generate
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-royal-plum px-5 py-2 text-xs font-semibold text-warm-ivory shadow-sm hover:bg-royal-plum/90 active:scale-95 transition"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="inline-flex items-center gap-1.5 rounded-full bg-royal-plum px-6 py-2 text-xs font-semibold text-warm-ivory shadow-sm hover:bg-royal-plum/90 active:scale-95 transition"
                  >
                    <span>Generate Celebration Plan</span>
                    <Sparkles className="w-3.5 h-3.5 text-marigold" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
