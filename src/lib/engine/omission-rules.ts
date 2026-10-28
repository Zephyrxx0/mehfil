import type { BudgetCategory, Paise, QuoteOmissionAdder, PackageTier } from './types'

/**
 * Pure TypeScript Category Omission Detection Engine (QUOTE-04, D-06)
 * Flags unstated statutory taxes (5% or 18% GST) and operational hardware/fees
 * (generator backup, overtime, waitstaff, travel lodging).
 */
export function detectQuoteOmissions(
  rawText: string,
  category: BudgetCategory,
  baseTierPaise: Paise
): QuoteOmissionAdder[] {
  const norm = rawText.toLowerCase()
  const omissions: QuoteOmissionAdder[] = []

  // 1. Catering Statutory & Service Rules
  if (category === 'catering') {
    const hasGST =
      norm.includes('gst included') ||
      norm.includes('inclusive of taxes') ||
      norm.includes('taxes included') ||
      norm.includes('including gst') ||
      norm.includes('all taxes included')

    if (!hasGST) {
      omissions.push({
        id: 'omission_gst_5',
        name: '+5% Catering GST estimate',
        category: 'catering',
        rateType: 'percentage',
        percentageValue: 5,
        amountPaise: Math.round(baseTierPaise * 0.05),
        rationale: 'Statutory 5% GST for outdoor catering services.',
        isEnabled: false,
      })
    }

    const hasStaff =
      norm.includes('service charge') ||
      norm.includes('waitstaff') ||
      norm.includes('servers') ||
      norm.includes('corkage') ||
      norm.includes('service staff')

    if (!hasStaff) {
      omissions.push({
        id: 'omission_waitstaff',
        name: 'Waitstaff & Service: ₹8,000',
        category: 'catering',
        rateType: 'fixed',
        fixedPaise: 800_000,
        amountPaise: 800_000,
        rationale: 'Service crew, captains, and chafing dish attendants often billed separately.',
        isEnabled: false,
      })
    }
  }

  // 2. Services 18% GST Rule (Decor, Photo/Film, Venue, Entertainment)
  if (
    category === 'decor' ||
    category === 'photo_film' ||
    category === 'venue' ||
    category === 'entertainment'
  ) {
    const hasGST =
      norm.includes('gst included') ||
      norm.includes('all taxes included') ||
      norm.includes('inclusive of taxes') ||
      norm.includes('including gst') ||
      norm.includes('taxes included')

    if (!hasGST) {
      omissions.push({
        id: 'omission_gst_18',
        name: '+18% GST estimate',
        category,
        rateType: 'percentage',
        percentageValue: 18,
        amountPaise: Math.round(baseTierPaise * 0.18),
        rationale: 'Statutory 18% GST for event production and creative services.',
        isEnabled: false,
      })
    }
  }

  // 3. Venue / Decor Power Backup Rule
  if (category === 'venue' || category === 'decor') {
    const hasPowerBackup =
      norm.includes('generator') ||
      norm.includes('dg set') ||
      norm.includes('power backup') ||
      norm.includes('genset')

    if (!hasPowerBackup) {
      omissions.push({
        id: 'omission_generator',
        name: 'Generator Power Backup: ₹15,000',
        category,
        rateType: 'fixed',
        fixedPaise: 1_500_000,
        amountPaise: 1_500_000,
        rationale: 'Outdoor lawn and heavy lighting setups require a dedicated DG set.',
        isEnabled: false,
      })
    }
  }

  // 4. Entertainment / DJ / Venue Curfew Overtime Rule
  if (category === 'entertainment' || category === 'venue') {
    const hasOvertime =
      norm.includes('overtime') ||
      norm.includes('after 10 pm') ||
      norm.includes('curfew') ||
      norm.includes('extended hours')

    if (!hasOvertime) {
      omissions.push({
        id: 'omission_overtime',
        name: 'Overtime buffer (after 10 PM): ₹10,000',
        category,
        rateType: 'fixed',
        fixedPaise: 1_000_000,
        amountPaise: 1_000_000,
        rationale: 'Sound curfew after 10 PM and extended hours incur venue and DJ overtime fees.',
        isEnabled: false,
      })
    }
  }

  // 5. Photo & Film Crew Travel & Lodging Rule
  if (category === 'photo_film') {
    const hasTravel =
      norm.includes('travel included') ||
      norm.includes('stay included') ||
      norm.includes('accommodation') ||
      norm.includes('travel covered')

    if (!hasTravel) {
      omissions.push({
        id: 'omission_crew_travel',
        name: 'Crew travel & stay buffer: ₹15,000',
        category: 'photo_film',
        rateType: 'fixed',
        fixedPaise: 1_500_000,
        amountPaise: 1_500_000,
        rationale: 'Outstation team travel, airport transfers, and local lodging buffer.',
        isEnabled: false,
      })
    }
  }

  return omissions
}

/**
 * Calculates a tier's total integer paise with active omission adders applied
 */
export function calculateTierTotalWithAdders(
  tier: PackageTier,
  adders: QuoteOmissionAdder[],
  activeAdderIds?: string[]
): Paise {
  let total = tier.baseTierPaise

  const activeAdders = activeAdderIds
    ? adders.filter(a => activeAdderIds.includes(a.id))
    : adders.filter(a => a.isEnabled)

  for (const adder of activeAdders) {
    if (adder.rateType === 'percentage') {
      const pct = adder.percentageValue ?? 0
      total += Math.round((tier.baseTierPaise * pct) / 100)
    } else {
      total += adder.fixedPaise ?? adder.amountPaise
    }
  }

  return total
}
