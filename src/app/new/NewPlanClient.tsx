'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { EventBrief, Plan } from '@/lib/engine/types'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { persistence, saveNewPlan } from '@/lib/storage/persistence'
import { BriefWizard, type WizardStep } from '@/components/intake/BriefWizard'
import { STARTER_OPTIONS, resolveStarterBrief } from '@/components/intake/StarterChips'
import { Wordmark } from '@/components/brand/Wordmark'

function parseStep(raw: string | null): WizardStep {
  const n = Number(raw)
  return n >= 1 && n <= 5 ? (Math.floor(n) as WizardStep) : 1
}

export function NewPlanClient() {
  const router = useRouter()
  const params = useSearchParams()

  const starterKey = params.get('starter')
  const fromId = params.get('from')
  const step = parseStep(params.get('step'))

  const [initialBrief, setInitialBrief] = useState<EventBrief | undefined>(undefined)
  const [isReady, setIsReady] = useState(!fromId)

  const openPlan = async (plan: Plan) => {
    const saved = await saveNewPlan(plan)
    router.push(`/plan/${saved.id}/budget`)
  }

  // /new?starter=wedding opens a ready-made plan straight away.
  useEffect(() => {
    if (!starterKey) return
    const starter = STARTER_OPTIONS.find((s) => s.key === starterKey)
    if (!starter) return
    let cancelled = false
    const plan = instantiatePlanFromBrief(resolveStarterBrief(starter.brief))
    saveNewPlan(plan).then((saved) => {
      if (!cancelled) router.replace(`/plan/${saved.id}/budget`)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starterKey])

  // /new?from=<plan id> pre-fills the wizard from an existing plan's brief.
  useEffect(() => {
    if (!fromId) return
    let cancelled = false
    persistence.getPlan(fromId).then((res) => {
      if (cancelled) return
      setInitialBrief(res?.plan.brief)
      setIsReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [fromId])

  const goToStep = (next: WizardStep) => {
    const q = new URLSearchParams()
    if (fromId) q.set('from', fromId)
    q.set('step', String(next))
    router.push(`/new?${q.toString()}`, { scroll: true })
  }

  const isStarting = Boolean(starterKey && STARTER_OPTIONS.some((s) => s.key === starterKey))

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center px-4 sm:px-6">
        <Link href="/" className="transition-opacity hover:opacity-80" aria-label="Mehfil home">
          <Wordmark size="md" />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-10 pt-4 sm:px-6 sm:pt-8">
        <h1 className="sr-only">Plan Your Celebration</h1>
        {isStarting ? (
          <div role="status" className="flex flex-col items-center gap-4 py-24 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-marigold" aria-hidden="true" />
            <p className="text-sm text-royal-plum/60">Preparing your plan...</p>
          </div>
        ) : isReady ? (
          <BriefWizard
            key={initialBrief ? 'prefilled' : 'blank'}
            initialBrief={initialBrief}
            step={step}
            onStepChange={goToStep}
            onPlanCreated={openPlan}
          />
        ) : null}
      </main>
    </div>
  )
}
