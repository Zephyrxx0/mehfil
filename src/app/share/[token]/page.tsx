import React from 'react'
import type { Metadata } from 'next'
import { createLogger } from '@/lib/logger'
import { getServerRpc } from '@/lib/supabase/server'
import { sanitizePlanForSharing } from '@/lib/engine/sanitization'
import { calculateBackwardsTimeline } from '@/lib/engine/timeline'
import { CloudPlans } from '@/lib/storage/cloud-plans'
import { ShareClientView } from './ShareClientView'

const logger = createLogger('share-page')

// Static on purpose: the title must not name the family's celebration. The link is a
// capability URL, so it stays out of search indexes.
export const metadata: Metadata = {
  title: { absolute: 'Family view — Mehfil' },
  robots: { index: false, follow: false },
}

interface SharePageProps {
  params: Promise<{ token: string }>
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params
  const client = token ? getServerRpc() : null

  if (client) {
    try {
      // The database hashes the token itself and returns only the family-safe fields, so
      // anonymous visitors never touch the tables or the edit key hash.
      const plan = await new CloudPlans(client).getSharedPlan(token)
      if (plan) {
        const schedule = calculateBackwardsTimeline(plan.brief.eventDate, plan.brief.guestCount)
        return <ShareClientView sanitizedPlan={sanitizePlanForSharing(plan, schedule)} />
      }
    } catch (err) {
      logger.warn('shared plan lookup failed', { err })
    }
  }

  // Unknown, revoked or unreachable: show the expired view (D-08).
  return <ShareClientView sanitizedPlan={null} />
}
