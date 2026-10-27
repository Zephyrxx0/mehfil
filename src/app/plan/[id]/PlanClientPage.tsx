'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Plan } from '@/lib/engine/types'
import { persistence } from '@/lib/storage/persistence'
import { PlanWorkspace } from '@/components/workspace/PlanWorkspace'
import { UnlockEditDialog } from '@/components/workspace/UnlockEditDialog'
import { Button } from '@/components/ui/button'
import { Lock, Loader2 } from 'lucide-react'
import Link from 'next/link'

export interface PlanClientPageProps {
  planId: string
  initialKey?: string
}

export function PlanClientPage({ planId, initialKey }: PlanClientPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [plan, setPlan] = useState<Plan | null>(null)
  const [isReadOnly, setIsReadOnly] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isUnlockOpen, setIsUnlockOpen] = useState<boolean>(false)
  const [claimedKey, setClaimedKey] = useState<string | undefined>(initialKey)

  useEffect(() => {
    let isMounted = true

    async function initializePlan() {
      setIsLoading(true)
      const keyFromUrl = initialKey || searchParams.get('key')
      let effectiveKey = keyFromUrl || undefined

      // If key is present in query parameters, claim session and clean URL immediately (D-02)
      if (keyFromUrl) {
        try {
          const res = await fetch(`/api/plan/${planId}/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: keyFromUrl }),
          })
          if (res.ok) {
            setClaimedKey(keyFromUrl)
            effectiveKey = keyFromUrl
          }
        } catch (e) {
          console.warn('[PlanPage] Auto-claim network error:', e)
        } finally {
          // Immediately strip secret capability token from browser address bar (<50ms)
          router.replace(`/plan/${planId}`)
        }
      }

      // Fetch plan from persistence adapter
      const data = await persistence.getPlan(planId, effectiveKey)
      if (isMounted) {
        if (data) {
          setPlan(data.plan)
          setIsReadOnly(data.isReadOnly)
        } else {
          setPlan(null)
        }
        setIsLoading(false)
      }
    }

    initializePlan()

    return () => {
      isMounted = false
    }
  }, [planId, initialKey])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-ivory flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-marigold/20 text-royal-plum animate-pulse">
            <span className="font-devanagari text-3xl font-bold">म</span>
          </div>
          <p className="text-sm font-medium text-royal-plum/70 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-royal-plum/50" />
            Opening celebration workspace...
          </p>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-warm-ivory flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="h-12 w-12 mx-auto rounded-2xl bg-royal-plum/5 flex items-center justify-center text-royal-plum">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-royal-plum">
            Celebration Plan Not Found
          </h1>
          <p className="text-sm text-royal-plum/70 leading-relaxed">
            We couldn’t find an active celebration plan with this identifier. It may have expired or the link may be incomplete.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-royal-plum text-warm-ivory">
              <Link href="/">Create New Celebration</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsUnlockOpen(true)}
            >
              Enter Edit Key
            </Button>
          </div>
        </div>

        <UnlockEditDialog
          open={isUnlockOpen}
          onOpenChange={setIsUnlockOpen}
          planId={planId}
          onUnlocked={() => {
            persistence.getPlan(planId).then((res) => {
              if (res) {
                setPlan(res.plan)
                setIsReadOnly(res.isReadOnly)
              }
            })
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Read-Only Banner / Status if unauthenticated */}
      {isReadOnly && (
        <aside
          role="status"
          aria-label="Read-only view notification"
          className="bg-marigold/25 border-b border-marigold/40 px-4 py-2 text-xs sm:text-sm font-medium text-royal-plum flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-royal-plum/70" />
            <span>
              <strong>Read-Only View:</strong> You are viewing this plan without organizer edit capability.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsUnlockOpen(true)}
            className="h-7 text-xs bg-warm-ivory hover:bg-white text-royal-plum border-royal-plum/20"
          >
            Unlock Organizer Editing
          </Button>
        </aside>
      )}

      <PlanWorkspace
        initialPlan={plan}
        isReadOnly={isReadOnly}
        editKey={claimedKey}
      />

      <UnlockEditDialog
        open={isUnlockOpen}
        onOpenChange={setIsUnlockOpen}
        planId={planId}
        onUnlocked={() => {
          setIsReadOnly(false)
          // Refresh plan state
          persistence.getPlan(planId).then((res) => {
            if (res) setPlan(res.plan)
          })
        }}
      />
    </div>
  )
}
