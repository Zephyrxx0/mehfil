'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { usePathname, useRouter, useSearchParams, useSelectedLayoutSegment } from 'next/navigation'
import type { Plan } from '@/lib/engine/types'
import { persistence } from '@/lib/storage/persistence'
import { capabilityStore } from '@/lib/storage/capability-store'
import { PlanWorkspace } from '@/components/workspace/PlanWorkspace'
import { UnlockEditDialog } from '@/components/workspace/UnlockEditDialog'
import { isPlanTab } from '@/components/workspace/tabs'
import { Button } from '@/components/ui/button'
import { createLogger } from '@/lib/logger'
const logger = createLogger('plan-page')

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
  const [editKey, setEditKey] = useState<string | undefined>(undefined)
  const [shareToken, setShareToken] = useState<string | undefined>(undefined)

  useEffect(() => {
    let isMounted = true

    async function initializePlan() {
      setIsLoading(true)
      let effectiveKey = capabilityStore.getEditKey(planId)

      // A key in the address bar is checked by the server, kept in this browser only if it
      // is accepted, and removed from the URL right away (D-02).
      if (keyFromUrl) {
        try {
          const res = await fetch(`/api/plan/${planId}/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: keyFromUrl }),
          })
          if (res.ok) {
            capabilityStore.setEditKey(planId, keyFromUrl)
            effectiveKey = keyFromUrl
          }
        } catch (e) {
          logger.warn('[PlanPage] Auto-claim network error:', e)
        } finally {
          // Immediately strip the secret capability token from the address bar
          router.replace(pathname)
        }
      }

      const data = await persistence.getPlan(planId, effectiveKey)
      if (isMounted) {
        // Read after getPlan: it forgets a key the server rejected.
        setEditKey(capabilityStore.getEditKey(planId))
        setShareToken(capabilityStore.getShareToken(planId))
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
          <p className="text-sm text-royal-plum/70">Opening your plan...</p>
        </div>
      </CenteredMessage>
    )
  }

  if (!plan) {
    return (
      <CenteredMessage>
        <div className="max-w-md">
          <h1 className="font-serif text-2xl font-bold text-royal-plum">
            Celebration Plan Not Found
          </h1>
          <p className="mt-3 text-base leading-relaxed text-royal-plum/70">
            We couldn’t find a plan with this identifier. It may have expired, or it was created in
            a different browser.
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
                setEditKey(capabilityStore.getEditKey(planId))
                setShareToken(capabilityStore.getShareToken(planId))
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
        editKey={editKey}
        initialShareToken={shareToken}
        activeTab={activeTab}
        basePath={`/plan/${planId}`}
        onUnlockEdit={() => setIsUnlockOpen(true)}
      />

      <UnlockEditDialog
        open={isUnlockOpen}
        onOpenChange={setIsUnlockOpen}
        planId={planId}
        onUnlocked={() => {
          persistence.getPlan(planId).then((res) => {
            if (!res) return
            setPlan(res.plan)
            setIsReadOnly(res.isReadOnly)
            setEditKey(capabilityStore.getEditKey(planId))
            setShareToken(capabilityStore.getShareToken(planId))
          })
        }}
      />
    </>
  )
}
