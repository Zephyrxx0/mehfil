import { getServerSupabase } from '@/lib/supabase/server'
import { hashCapabilityToken } from '@/lib/engine/crypto'
import { sanitizePlanForSharing } from '@/lib/engine/sanitization'
import { calculateBackwardsTimeline } from '@/lib/engine/timeline'
import { ShareClientView } from './ShareClientView'
import type { Plan, SanitizedSharedPlan } from '@/lib/engine/types'

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

      // Query active event matching share_key_hash
      const { data: event, error: eventErr } = await supabase
        .from('events')
        .select('*')
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
            totalBudgetPaise: event.total_budget_paise,
            protectedCategory: event.protected_category as any,
          },
          lines: (latestVer?.lines as any) || [],
          totalBudgetPaise: event.total_budget_paise,
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
      console.warn('[SharePage] Cloud share lookup error:', e)
    }
  }

  // If not found in cloud or hash mismatch, treat as expired (D-08)
  return <ShareClientView sanitizedPlan={null} />
}
