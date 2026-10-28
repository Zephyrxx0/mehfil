import type { BudgetCategory } from '@/lib/engine/types'

export interface SampleQuoteFixture {
  id: string
  name: string
  category: BudgetCategory
  rawText: string
  headlineRate: string
}

export const SAMPLE_QUOTES: SampleQuoteFixture[] = [
  {
    id: 'royal_caterers_thali',
    name: 'Royal Caterers — Grand Thali & Buffet',
    category: 'catering',
    headlineRate: '₹950 / plate',
    rawText: `*ROYAL CATERERS & BANQUET SERVICES*
Ref: RC-2026-DEL-0418
Date: 12-Oct-2026

Namaste! Thank you for considering Royal Caterers for your auspicious family celebration.
Please find below our signature festive buffet menu & commercial proposal:

*Package: Royal Vegetarian Grand Thali & Buffet*
- Welcome Drinks: Kesar Badam Milk, Fresh Mint Mojito (Live Counter)
- Starters (4 Veg): Paneer Tikka Angaare, Crispy Corn Chaat, Hara Bhara Kebab, Dahi Ke Kebab
- Main Course: Paneer Butter Masala, Dal Makhani (slow-cooked 24 hrs), Kashmiri Dum Aloo, Subz Biryani with Burani Raita
- Assorted Breads: Butter Naan, Laccha Paratha, Missi Roti (Live Tandoor)
- Desserts: Gulab Jamun with Rabdi, Hot Jalebi with Rabdi live counter, Kulfi Falooda

Commercial Rate:
Per Plate Charge: Rs 950/- per plate
Minimum Guest Guarantee: 250 guests
Chafing dishes, premium bone china crockery, and cutlery included.

Exclusions:
Taxes as applicable. Service staff & waitstaff gratuity to be settled separately. Special ice carvings on request.
Payment Terms: 25% advance booking, 50% 1 week prior, 25% balance at event conclusion.`,
  },
  {
    id: 'shadi_mandap_decor',
    name: 'Shadi Mandap — Floral & Stage Styling',
    category: 'decor',
    headlineRate: '₹1,80,000 flat',
    rawText: `*SHADI MANDAP & FLORAL DESIGN STUDIO*
Quotation for Milestone Celebration
Date: 15-Nov-2026

Dear Family,
We are delighted to submit our customized Mandap & Stage styling proposal:

*Floral Extravaganza Package*
1. Grand Floral Entrance Arch (Fresh Marigold & Mogra with Brass Urli decor): Rs 40,000
2. Sacred Vedic Mandap Setup (4-pillar carved setup with hanging floral strings & havan kund): Rs 95,000
3. Reception Stage Backdrop (Gulabi Rose draping with floral chandeliers): Rs 45,000

Total Stated Package: Rs 1,80,000/-

Inclusions:
All artificial & fresh floral materials, setup & strike crew, fairy lights, brass lamps.
Exclusions:
All government taxes extra. Sound and DG power generator set to be provided by client / venue.
Payment Terms: 50% on contract sign-off, 50% on setup day before ceremony start.`,
  },
  {
    id: 'cinematic_wedding_film',
    name: 'Dhanshree Cinema — Photo & Film',
    category: 'photo_film',
    headlineRate: 'From ₹1,20,000',
    rawText: `*DHANSHREE CINEMATIC WEDDING FILMS*
Rate Card & Packages 2026-2027

Dear Client,
Capturing your sacred celebration with soul, warmth, and cinematic grandeur.

--- Tier 1: Classic Heritage ---
- 1 Traditional Photographer & 1 Candid Photographer
- 1 Traditional Videographer
- High-res edited digital album (300 photos)
- Full HD event coverage video (60 mins)
Classic Package Investment: Rs 1,20,000

--- Tier 2: Royal Cinema & Drone ---
- 2 Candid Photographers & 1 Traditional Photographer
- 2 Cinematic Cinematographers + 1 4K Drone Pilot
- 4K Cinematic Teaser (3-4 mins) + Feature Film (45 mins)
- 2 Luxury Leather-bound Albums + Raw Footage Hard Drive
Royal Cinema Package Investment: Rs 2,10,000

Inclusions:
High-end color grading, drone permits for local venue area.
Exclusions:
Government GST applicable. Outstation crew accommodation and travel tickets outside Delhi NCR extra.
Payment: 30% booking advance, 50% on event date, 20% on teaser delivery.`,
  },
  {
    id: 'royal_heritage_lawn',
    name: 'Royal Heritage Lawn & Haveli',
    category: 'venue',
    headlineRate: '₹2,50,000 / day',
    rawText: `*ROYAL HERITAGE LAWNS & HAVELI*
Booking Confirmation & Quote Memo
Date: 20-Oct-2026

Event Space: Grand Front Lawn & Courtyard Haveli
Rental Duration: 12 Hours (12:00 PM to 12:00 Midnight)

Commercial Quotation:
- Main Lawn & Courtyard Rental: Rs 2,00,000
- Green Rooms (2 AC Luxury Bridal Suites): Rs 50,000
Total Venue Stated Cost: Rs 2,50,000

Inclusions:
Basic perimeter security, housekeeping & cleanup during event, parking valet space for 150 cars.
Exclusions:
18% GST extra as per statutory norms. Electricity consumption meter reading charged at Rs 18/unit.
Strict local sound curfew at 10:00 PM. Overtime penalty beyond midnight at Rs 10,000 per hour.
Payment: 50% advance to block dates, 50% 15 days prior to event. Refundable security deposit: Rs 50,000.`,
  },
]
