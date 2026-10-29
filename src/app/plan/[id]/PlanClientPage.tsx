'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { usePathname, useRouter, useSearchParams, useSelectedLayoutSegment } from 'next/navigation'
import type { Plan } from '@/lib/engine/types'
import { persistence } from '@/lib/storage/persistence'
import { PlanWorkspace } from '@/components/workspace/PlanWorkspace'
import { UnlockEditDialog } from '@/components/workspace/UnlockEditDialog'
import { isPlanTab } from '@/components/workspace/tabs'
import { Button } from '@/components/ui/button'

export interface PlanClientPageProps {
  planId: string
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      {children}
    </div>
  )
}

export function PlanClientPage({ planId }: PlanClientPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const segment = useSelectedLayoutSegment()
  const activeTab = isPlanTab(segment) ? segment : 'budget'

  const keyFromUrl = searchParams.get('key') || undefined

  const [plan, setPlan] = useState<Plan | null>(null)
  const [isReadOnly, setIsReadOnly] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isUnlockOpen, setIsUnlockOpen] = useState<boolean>(false)
  const [claimedKey, setClaimedKey] = useState<string | undefined>(keyFromUrl)

  useEffect(() => {
    let isMounted = true

    async function initializePlan() {
      setIsLoading(true)
      let effectiveKey = keyFromUrl

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
          // Immediately strip the secret capability token from the address bar
          router.replace(pathname)
        }
      }

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
    // Only reload when the plan itself changes, not when switching tabs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId])

  if (isLoading) {
    return (
      <CenteredMessage>
        <div role="status" className="flex flex-col items-center gap-4">
          <Loader2 className="h-7 w-7 animate-spin text-marigold" aria-hidden="true" />
          <p className="text-sm text-royal-plum/60">Opening your plan...</p>
        </div>
      </CenteredMessage>
    )
  }

  if (!plan) {
    return (
      <CenteredMessage>
        <div className="max-w-md">
          <h1 className="font-serif text-2xl font-bold text-royal-plum">Celebration Plan Not Found</h1>
          <p className="mt-3 text-base leading-relaxed text-royal-plum/70">
            We couldn’t find a plan with this identifier. It may have expired, or it was created in a
            different browser.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/new">Create New Celebration</Link>
            </Button>
            <Button variant="outline" onClick={() => setIsUnlockOpen(true)}>
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
      </CenteredMessage>
    )
  }

  return (
    <>
      <PlanWorkspace
        initialPlan={plan}
        isReadOnly={isReadOnly}
        editKey={claimedKey}
        activeTab={activeTab}
        basePath={`/plan/${planId}`}
        onUnlockEdit={() => setIsUnlockOpen(true)}
      />

      <UnlockEditDialog
        open={isUnlockOpen}
        onOpenChange={setIsUnlockOpen}
        planId={planId}
        onUnlocked={() => {
          setIsReadOnly(false)
          persistence.getPlan(planId).then((res) => {
            if (res) setPlan(res.plan)
          })
        }}
      />
    </>
  )
}
