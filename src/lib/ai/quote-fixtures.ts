import type { QuoteExtractionInput } from './schemas'

/**
 * Known sample-quote fixtures for the Tier 3 zero-network heuristic (D-02, ADR-0007).
 * A fixture applies when the upper-cased quote text contains any of its `needles`.
 * Order matters: the first matching fixture wins.
 */
export interface QuoteFixture {
  readonly needles: readonly string[]
  readonly quote: QuoteExtractionInput
}

export const QUOTE_FIXTURES: readonly QuoteFixture[] = [
  {
    needles: ['ROYAL CATERERS'],
    quote: {
      vendorName: 'Royal Caterers & Banquet Services',
      category: 'catering',
      statedInclusions: ['Chafing dishes', 'Bone china crockery', 'Live tandoor counter'],
      statedExclusions: ['Taxes as applicable', 'Waitstaff gratuity'],
      paymentTerms: '25% advance booking, 50% 1 week prior, 25% balance at event conclusion.',
      tiers: [
        {
          tierId: 'tier_royal_buffet',
          name: 'Royal Vegetarian Grand Thali & Buffet',
          description: 'Signature 3-course festive vegetarian buffet',
          lineItems: [
            {
              description: 'Per Plate Charge',
              amountStated: 950,
              pricingType: 'per_guest',
              sourceAnchor: 'Rs 950/- per plate',
            },
          ],
        },
      ],
    },
  },
  {
    needles: ['SHADI MANDAP'],
    quote: {
      vendorName: 'Shadi Mandap & Floral Design Studio',
      category: 'decor',
      statedInclusions: [
        'All artificial & fresh floral materials',
        'Setup & strike crew',
        'Brass lamps',
      ],
      statedExclusions: ['All government taxes extra', 'Sound and DG power generator set'],
      paymentTerms: '50% on contract sign-off, 50% on setup day before ceremony start.',
      tiers: [
        {
          tierId: 'tier_floral_extravaganza',
          name: 'Floral Extravaganza Package',
          tierTotalStated: 180000,
          tierTotalSourceAnchor: 'Total Stated Package: Rs 1,80,000/-',
          lineItems: [
            {
              description: 'Grand Floral Entrance Arch',
              amountStated: 40000,
              pricingType: 'flat',
              sourceAnchor:
                'Grand Floral Entrance Arch (Fresh Marigold & Mogra with Brass Urli decor): Rs 40,000',
            },
            {
              description: 'Sacred Vedic Mandap Setup',
              amountStated: 95000,
              pricingType: 'flat',
              sourceAnchor:
                'Sacred Vedic Mandap Setup (4-pillar carved setup with hanging floral strings & havan kund): Rs 95,000',
            },
            {
              description: 'Reception Stage Backdrop',
              amountStated: 45000,
              pricingType: 'flat',
              sourceAnchor:
                'Reception Stage Backdrop (Gulabi Rose draping with floral chandeliers): Rs 45,000',
            },
          ],
        },
      ],
    },
  },
  {
    needles: ['DHANSHREE CINEMATIC', 'DHANSHREE CINEMA'],
    quote: {
      vendorName: 'Dhanshree Cinematic Wedding Films',
      category: 'photo_film',
      statedInclusions: ['High-end color grading', 'Local drone permits'],
      statedExclusions: ['Government GST applicable', 'Outstation crew accommodation'],
      paymentTerms: '30% booking advance, 50% on event date, 20% on teaser delivery.',
      tiers: [
        {
          tierId: 'tier_classic_heritage',
          name: 'Classic Heritage',
          description: 'Traditional and candid photo coverage',
          tierTotalStated: 120000,
          tierTotalSourceAnchor: 'Classic Package Investment: Rs 1,20,000',
          lineItems: [
            {
              description: 'Classic Package Investment',
              amountStated: 120000,
              pricingType: 'flat',
              sourceAnchor: 'Classic Package Investment: Rs 1,20,000',
            },
          ],
        },
        {
          tierId: 'tier_royal_cinema',
          name: 'Royal Cinema & Drone',
          description: 'Full cinema crew with 4K drone',
          tierTotalStated: 210000,
          tierTotalSourceAnchor: 'Royal Cinema Package Investment: Rs 2,10,000',
          lineItems: [
            {
              description: 'Royal Cinema Package Investment',
              amountStated: 210000,
              pricingType: 'flat',
              sourceAnchor: 'Royal Cinema Package Investment: Rs 2,10,000',
            },
          ],
        },
      ],
    },
  },
  {
    needles: ['ROYAL HERITAGE LAWN', 'ROYAL HERITAGE LAWNS'],
    quote: {
      vendorName: 'Royal Heritage Lawns & Haveli',
      category: 'venue',
      statedInclusions: [
        'Basic perimeter security',
        'Housekeeping & cleanup',
        'Parking valet space',
      ],
      statedExclusions: [
        '18% GST extra as per statutory norms',
        'Electricity consumption meter reading',
      ],
      paymentTerms: '50% advance to block dates, 50% 15 days prior to event.',
      tiers: [
        {
          tierId: 'tier_grand_lawn_haveli',
          name: 'Grand Front Lawn & Courtyard Haveli',
          tierTotalStated: 250000,
          tierTotalSourceAnchor: 'Total Venue Stated Cost: Rs 2,50,000',
          lineItems: [
            {
              description: 'Main Lawn & Courtyard Rental',
              amountStated: 200000,
              pricingType: 'flat',
              sourceAnchor: 'Main Lawn & Courtyard Rental: Rs 2,00,000',
            },
            {
              description: 'Green Rooms (2 AC Luxury Bridal Suites)',
              amountStated: 50000,
              pricingType: 'flat',
              sourceAnchor: 'Green Rooms (2 AC Luxury Bridal Suites): Rs 50,000',
            },
          ],
        },
      ],
    },
  },
]
