import type { BudgetCategory, Paise, QuoteOmissionAdder } from './types'

/**
 * Declarative quote-omission rules. A rule fires when the vendor's category is in
 * `categories` and none of `coveredBy` keywords appear in the (lowercased) quote text.
 * Table order is result order.
 */

export interface OmissionContext {
  category: BudgetCategory
  baseTierPaise: Paise
}

export interface OmissionRule {
  id: string
  categories: BudgetCategory[]
  /** Lowercase phrases that mean the vendor already covers this item. */
  coveredBy: string[]
  build: (ctx: OmissionContext) => QuoteOmissionAdder
}

/** Builds a percentage-of-base adder (e.g. GST). */
function percentageAdder(
  id: string,
  name: string,
  percentageValue: number,
  rationale: string
): OmissionRule['build'] {
  return ({ category, baseTierPaise }) => ({
    id,
    name,
    category,
    rateType: 'percentage',
    percentageValue,
    amountPaise: Math.round(baseTierPaise * (percentageValue / 100)),
    rationale,
    isEnabled: false,
  })
}

/** Builds a fixed-amount adder (paise). */
function fixedAdder(
  id: string,
  name: string,
  fixedPaise: Paise,
  rationale: string
): OmissionRule['build'] {
  return ({ category }) => ({
    id,
    name,
    category,
    rateType: 'fixed',
    fixedPaise,
    amountPaise: fixedPaise,
    rationale,
    isEnabled: false,
  })
}

const GST_PHRASES = [
  'gst included',
  'inclusive of taxes',
  'taxes included',
  'including gst',
  'all taxes included',
]

export const OMISSION_RULES: OmissionRule[] = [
  {
    id: 'omission_gst_5',
    categories: ['catering'],
    coveredBy: GST_PHRASES,
    build: percentageAdder(
      'omission_gst_5',
      '+5% Catering GST estimate',
      5,
      'Statutory 5% GST for outdoor catering services.'
    ),
  },
  {
    id: 'omission_waitstaff',
    categories: ['catering'],
    coveredBy: ['service charge', 'waitstaff', 'servers', 'corkage', 'service staff'],
    build: fixedAdder(
      'omission_waitstaff',
      'Waitstaff & Service: ₹8,000',
      800_000,
      'Service crew, captains, and chafing dish attendants often billed separately.'
    ),
  },
  {
    id: 'omission_gst_18',
    categories: ['decor', 'photo_film', 'venue', 'entertainment'],
    coveredBy: GST_PHRASES,
    build: percentageAdder(
      'omission_gst_18',
      '+18% GST estimate',
      18,
      'Statutory 18% GST for event production and creative services.'
    ),
  },
  {
    id: 'omission_generator',
    categories: ['venue', 'decor'],
    coveredBy: ['generator', 'dg set', 'power backup', 'genset'],
    build: fixedAdder(
      'omission_generator',
      'Generator Power Backup: ₹15,000',
      1_500_000,
      'Outdoor lawn and heavy lighting setups require a dedicated DG set.'
    ),
  },
  {
    id: 'omission_overtime',
    categories: ['entertainment', 'venue'],
    coveredBy: ['overtime', 'after 10 pm', 'curfew', 'extended hours'],
    build: fixedAdder(
      'omission_overtime',
      'Overtime buffer (after 10 PM): ₹10,000',
      1_000_000,
      'Sound curfew after 10 PM and extended hours incur venue and DJ overtime fees.'
    ),
  },
  {
    id: 'omission_crew_travel',
    categories: ['photo_film'],
    coveredBy: ['travel included', 'stay included', 'accommodation', 'travel covered'],
    build: fixedAdder(
      'omission_crew_travel',
      'Crew travel & stay buffer: ₹15,000',
      1_500_000,
      'Outstation team travel, airport transfers, and local lodging buffer.'
    ),
  },
]
