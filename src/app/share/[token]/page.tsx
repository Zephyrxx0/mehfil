import React from 'react'
import { getServerSupabase } from '@/lib/supabase/server'
import { hashCapabilityToken } from '@/lib/engine/crypto'
import { sanitizePlanForSharing } from '@/lib/engine/sanitization'
import { calculateBackwardsTimeline } from '@/lib/engine/timeline'
import { ShareClientView } from './ShareClientView'
import type { Plan } from '@/lib/engine/types'
import { createLogger } from '@/lib/logger'
const logger = createLogger('share-page')

interface SharePageProps {
  params: Promise<{ token: string }>
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params

  if (!token) {
    return <ShareClientView sanitizedPlan={null} />
  }

  const supabase = await getServerSupabase()

  if (supabase) {
    try {
      const tokenHash = await hashCapabilityToken(token)

      // 1. Primary path: Call SECURITY DEFINER RPC get_shared_plan (Task 3.2)
      // This allows anonymous family members to read sanitized celebratory plans
      // without bypassing RLS or exposing edit_key_hash.
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_shared_plan', {
        p_share_key_hash: tokenHash,
      })

      const sharedRow = rpcData?.[0]

      if (!rpcErr && sharedRow) {
        const reconstructedPlan: Plan = {
          id: sharedRow.id,
          brief: {
            title: sharedRow.title,
            eventType: sharedRow.event_type as any,
            eventDate: sharedRow.event_date,
            city: sharedRow.city,
            guestCount: sharedRow.guest_count,
            totalBudgetPaise: Number(sharedRow.total_budget_paise),
            protectedCategory: sharedRow.protected_category as any,
          },
          lines: (sharedRow.lines as any) || [],
          totalBudgetPaise: Number(sharedRow.total_budget_paise),
          baselineGuestCount: sharedRow.guest_count,
        }

        const schedule = calculateBackwardsTimeline(
          reconstructedPlan.brief.eventDate,
          reconstructedPlan.brief.guestCount
        )

        const sanitized = sanitizePlanForSharing(reconstructedPlan, schedule)
        return <ShareClientView sanitizedPlan={sanitized} />
      }

      // 2. Fallback query (restricted to safe public fields, never edit_key_hash)
      const { data: event, error: eventErr } = await supabase
        .from('events')
        .select(
          'id, title, event_type, event_date, city, guest_count, total_budget_paise, protected_category, status'
        )
        .eq('share_key_hash', tokenHash)
        .eq('status', 'active')
        .single()

      if (!eventErr && event) {
        // Query latest plan version
        const { data: latestVer } = await supabase
          .from('plan_versions')
          .select('lines')
          .eq('event_id', event.id)
          .order('version_number', { ascending: false })
          .limit(1)
          .single()

        const reconstructedPlan: Plan = {
          id: event.id,
          brief: {
            title: event.title,
            eventType: event.event_type as any,
            eventDate: event.event_date,
            city: event.city,
            guestCount: event.guest_count,
            totalBudgetPaise: Number(event.total_budget_paise),
            protectedCategory: event.protected_category as any,
          },
          lines: (latestVer?.lines as any) || [],
          totalBudgetPaise: Number(event.total_budget_paise),
          baselineGuestCount: event.guest_count,
        }

        const schedule = calculateBackwardsTimeline(
          reconstructedPlan.brief.eventDate,
          reconstructedPlan.brief.guestCount
        )

        const sanitized = sanitizePlanForSharing(reconstructedPlan, schedule)
        return <ShareClientView sanitizedPlan={sanitized} />
      }
    } catch (e) {
      logger.warn('[SharePage] Cloud share lookup error:', e)
    }
  }

  // If not found in cloud or hash mismatch, treat as expired (D-08)
  return <ShareClientView sanitizedPlan={null} />
}
