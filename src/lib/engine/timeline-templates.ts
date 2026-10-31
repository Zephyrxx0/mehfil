import type { BudgetCategory, MilestoneBandId } from './types'

export interface TaskTemplate {
  id: string
  title: string
  budgetCategory: BudgetCategory
  isCriticalPath: boolean
  criticalityRank: number // 1 = highest priority (venue), 2 = catering, 3 = photo, 4 = invites/favors, 5 = others
  notes?: string
}

export interface BandTemplate {
  id: MilestoneBandId
  name: string
  baselineLeadDays: number
  tasks: TaskTemplate[]
}

export const BAND_TEMPLATES: BandTemplate[] = [
  {
    id: 'milestone_t6m',
    name: 'Venue & Date Lock (T-6M)',
    baselineLeadDays: 180,
    tasks: [
      {
        id: 'task_venue_contract',
        title: 'Lock Venue & Date Contract',
        budgetCategory: 'venue',
        isCriticalPath: true,
        criticalityRank: 1,
        notes: 'Secures primary celebration date and staging slots.',
      },
      {
        id: 'task_photo_book',
        title: 'Book Lead Photographer & Cinematographer',
        budgetCategory: 'photo_film',
        isCriticalPath: false,
        criticalityRank: 3,
        notes: 'Top photo & film teams book 6+ months ahead for milestone dates.',
      },
    ],
  },
  {
    id: 'milestone_t3m',
    name: 'Catering & Core Vendors (T-3M)',
    baselineLeadDays: 90,
    tasks: [
      {
        id: 'task_catering_tasting',
        title: 'Catering Tasting & Menu Lock',
        budgetCategory: 'catering',
        isCriticalPath: true,
        criticalityRank: 2,
        notes:
          'Approve live food counters, dietary nuances (Jain/Vegan), and dinner service format.',
      },
      {
        id: 'task_decor_concept',
        title: 'Finalize Decor & Floral Visuals',
        budgetCategory: 'decor',
        isCriticalPath: false,
        criticalityRank: 5,
        notes: 'Align color palette and mandap/stage mockups.',
      },
      {
        id: 'task_entertainment_permit',
        title: 'Book Music, DJ & Sound Permits',
        budgetCategory: 'entertainment',
        isCriticalPath: false,
        criticalityRank: 5,
        notes: 'Secure sound licenses for music past 10:00 PM if needed.',
      },
    ],
  },
  {
    id: 'milestone_t1m',
    name: 'Invites & Outfits (T-1M)',
    baselineLeadDays: 30,
    tasks: [
      {
        id: 'task_invites_dispatch',
        title: 'Dispatch Digital & Physical Invites',
        budgetCategory: 'favors',
        isCriticalPath: true,
        criticalityRank: 4,
        notes: 'Send RSVPs with itinerary links and Google Maps directions.',
      },
      {
        id: 'task_attire_fittings',
        title: 'Final Wardrobe & Attire Fittings',
        budgetCategory: 'misc',
        isCriticalPath: false,
        criticalityRank: 5,
        notes: 'Complete alterations for core family and hosts.',
      },
    ],
  },
  {
    id: 'milestone_t2w',
    name: 'Final Numbers & Logistics (T-2W)',
    baselineLeadDays: 14,
    tasks: [
      {
        id: 'task_headcount_lock',
        title: 'Lock Final Headcount with Caterer & Venue',
        budgetCategory: 'catering',
        isCriticalPath: true,
        criticalityRank: 2,
        notes: 'Submit verified plate guarantee with 5% buffer threshold.',
      },
      {
        id: 'task_cash_envelopes',
        title: 'Prepare Vendor Envelopes & Contingency Cash',
        budgetCategory: 'contingency',
        isCriticalPath: false,
        criticalityRank: 5,
        notes: 'Cash envelopes for tips, transport, and unexpected day-of runs.',
      },
    ],
  },
  {
    id: 'milestone_day0',
    name: 'Day-Of Execution & Celebration',
    baselineLeadDays: 0,
    tasks: [
      {
        id: 'task_venue_handover',
        title: 'Stage & Sound Check with Venue Manager',
        budgetCategory: 'venue',
        isCriticalPath: true,
        criticalityRank: 1,
        notes: 'Verify lighting, generator backup, and bridal green room access.',
      },
      {
        id: 'task_celebration_start',
        title: 'Celebration Kickoff & Guest Welcome',
        budgetCategory: 'entertainment',
        isCriticalPath: false,
        criticalityRank: 5,
        notes: 'Welcome drinks and welcome aarti / guest reception.',
      },
    ],
  },
]

/**
 * Pure UTC calendar arithmetic subtracting days from an ISO date string.
 */
export function subtractDaysUTC(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const utcDate = new Date(Date.UTC(y, m - 1, d))
  const target = new Date(utcDate.getTime() - days * 86_400_000)
  return target.toISOString().slice(0, 10)
}

/**
 * Map an adopted idea's leadDays to the most appropriate milestone band.
 */
export function getTargetBandIdForLeadDays(leadDays: number): MilestoneBandId {
  if (leadDays >= 120) return 'milestone_t6m'
  if (leadDays >= 45) return 'milestone_t3m'
  if (leadDays >= 20) return 'milestone_t1m'
  if (leadDays >= 5) return 'milestone_t2w'
  return 'milestone_day0'
}
