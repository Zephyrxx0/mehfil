import type {
  CuratedIdea,
  EventBrief,
  StyleDNA,
} from '../lib/engine/types'

/**
 * Culturally authentic curated Indian celebration enhancements (IDEA-01).
 * All financial costs are stored in pure integer Paise (1 rupee = 100 paise).
 * Includes Devanagari flourishes and actionable timeline task milestones.
 */
export const CURATED_IDEAS: CuratedIdea[] = [
  {
    id: 'kulhad_chai_bar',
    title: 'Kulhad Chai & Filter Coffee Bar',
    devanagariTitle: 'कुल्हड़ चाय एवं फ़िल्टर कॉफ़ी बार',
    tagline: 'Steaming ginger masala chai and South Indian filter coffee in clay pots',
    description:
      'A welcoming artisanal beverage station serving hand-poured adrak-elaichi chai and Kaapi in eco-friendly terracotta kulhads.',
    category: 'catering',
    eventTypes: ['wedding', 'birthday', 'community'],
    costPaise: 15_000_00, // ₹15,000
    leadDays: 21,
    styleTags: ['heritage', 'intimate', 'comfort', 'feast'],
    culturalNuance:
      'Terracotta kulhads infuse a warm earthy aroma (mitti ki khushboo), creating an inviting communal gathering spot.',
    timelineTask: {
      title: 'Book Kulhad Chai Artisan & Tasting',
      notes: 'Confirm raw terracotta cups, ginger-cardamom spice blend, and live brewer setup.',
    },
  },
  {
    id: 'live_shehnai_jugalbandi',
    title: 'Live Shehnai & Nagada Jugalbandi',
    devanagariTitle: 'शहनाई व नगाड़ा जुगलबंदी',
    tagline: 'Soulful classical auspicious gateway melody',
    description:
      'Traditional Ustad ensemble welcoming arrival processions with resonant classical Ragas and celebratory rhythm.',
    category: 'entertainment',
    eventTypes: ['wedding'],
    costPaise: 25_000_00, // ₹25,000
    leadDays: 45,
    styleTags: ['heritage', 'grand', 'royal', 'acoustic'],
    culturalNuance:
      'Shehnai notes are deeply sanctified in Indian Vedic tradition, signaling Mangal sound at milestone family unions.',
    timelineTask: {
      title: 'Book Classical Shehnai Troupe',
      notes: 'Finalize gateway riser location and acoustic sound check without harsh amplification.',
    },
  },
  {
    id: 'live_jalebi_rabdi',
    title: 'Live Jalebi & Chilled Rabdi Counter',
    devanagariTitle: 'लाइव जलेबी व लच्छेदार रबड़ी',
    tagline: 'Crisp spirals soaked in saffron syrup paired with slow-reduced milk',
    description:
      'Master Halwai frying piping hot saffron jalebis live on a brass kadhai served over cold, pistachio-garnished rabdi.',
    category: 'catering',
    eventTypes: ['wedding', 'birthday', 'community'],
    costPaise: 20_000_00, // ₹20,000
    leadDays: 14,
    styleTags: ['feast', 'heritage', 'playful'],
    culturalNuance:
      'The contrast of hot, crisp sweet batter against chilled creamy rabdi is an iconic festive indulgence across North India.',
    timelineTask: {
      title: 'Contract Master Halwai & Sweet Station',
      notes: 'Confirm pure desi ghee sourcing, brass counter aesthetic, and allergen signage.',
    },
  },
  {
    id: 'caricature_pavilion',
    title: 'Live Caricature & Guest Keepsake Pavilion',
    devanagariTitle: 'लाइव व्यंग्यचित्र व स्मृति दीर्घा',
    tagline: 'Hand-drawn whimsical portraits for guests to take home',
    description:
      'Skilled artists creating delightful personalized 3-minute caricatures on branded handmade cotton cardstock.',
    category: 'entertainment',
    eventTypes: ['wedding', 'birthday', 'community'],
    costPaise: 18_000_00, // ₹18,000
    leadDays: 30,
    styleTags: ['modern', 'playful', 'intimate'],
    culturalNuance:
      'A low-pressure, interactive social nook where guests can mingle and receive a cherished tactile souvenir.',
    timelineTask: {
      title: 'Retain Caricature Artists & Custom Paper',
      notes: 'Design branded celebration stamp for sketch cardstock and confirm easel lighting.',
    },
  },
  {
    id: 'terracotta_marigold_jali',
    title: 'Terracotta Jali & Marigold Photo Pavilion',
    devanagariTitle: 'टेराकोटा जाली व गेंदा पुष्प मंडप',
    tagline: 'Architectural lattice backdrops with fragrant marigold garlands',
    description:
      'Handcrafted red terracotta jali screens woven with fresh marigold strings and brass urns for memorable family portraits.',
    category: 'decor',
    eventTypes: ['wedding', 'birthday', 'community'],
    costPaise: 35_000_00, // ₹35,000
    leadDays: 30,
    styleTags: ['heritage', 'artisan', 'grand', 'spectacle'],
    culturalNuance:
      'Genda phool represents solar vitality and joy, while artisanal jali patterns evoke timeless Rajasthani haveli architecture.',
    timelineTask: {
      title: 'Approve Terracotta Backdrop Mockup',
      notes: 'Verify fresh marigold delivery timing 4 hours before ceremony kickoff.',
    },
  },
  {
    id: 'gulab_ittar_welcome',
    title: 'Gulab-Jal & Ittar Welcoming Station',
    devanagariTitle: 'गुलाब-जल व इत्र स्वागत केंद्र',
    tagline: 'A fragrant royal greeting with natural floral essences',
    description:
      'Hosts in traditional attire mist arriving guests with chilled Kannauj rosewater and apply pure Ruh Gulab and Khus ittar on wrist cuffs.',
    category: 'favors',
    eventTypes: ['wedding', 'community'],
    costPaise: 12_000_00, // ₹12,000
    leadDays: 14,
    styleTags: ['heritage', 'intimate', 'sensory'],
    culturalNuance:
      'Reviving the Awadhi and Mughal courtly etiquette of welcoming honored guests through reviving olfactory sensory comfort.',
    timelineTask: {
      title: 'Order Kannauj Artisanal Ittar & Rosewater Sprayers',
      notes: 'Confirm brass gulab-pash flasks and organic skin-safe botanical distillations.',
    },
  },
  {
    id: 'brass_diya_seed_favors',
    title: 'Handcrafted Brass Diya & Seed Favors',
    devanagariTitle: 'हस्तनिर्मित पीतल दीया व बीज उपहार',
    tagline: 'Eco-conscious living souvenirs celebrating growth and light',
    description:
      'Solid brass mini oil lamps paired with plantable marigold seed paper cards inside woven jute gift pouches.',
    category: 'favors',
    eventTypes: ['wedding', 'birthday', 'community'],
    costPaise: 16_000_00, // ₹16,000
    leadDays: 21,
    styleTags: ['sustainable', 'heritage', 'intimate'],
    culturalNuance:
      'Gifting a brass diya symbolizes sharing the family hearth light, while wildflower seeds let the celebration bloom in guest homes.',
    timelineTask: {
      title: 'Procure Brass Favors & Seed Cards',
      notes: 'Package favors in cotton drawstring bags with personalized calligraphed tags.',
    },
  },
  {
    id: 'vintage_matka_kulfi',
    title: 'Vintage Matka Kulfi & Falooda Bicycle Cart',
    devanagariTitle: 'मटका कुल्फ़ी व फ़ालूदा सायकल',
    tagline: 'Slow-churned malai kulfi served from traditional ice-salt churns',
    description:
      'A restored retro ice cream bicycle cart serving hand-sliced kesar-pista matka kulfi with rose syrup falooda and sabja seeds.',
    category: 'catering',
    eventTypes: ['wedding', 'birthday', 'community'],
    costPaise: 14_000_00, // ₹14,000
    leadDays: 10,
    styleTags: ['nostalgic', 'playful', 'feast'],
    culturalNuance:
      'Captures the nostalgia of childhood summer evenings with the ringing bell of the neighborhood kulfi wallah.',
    timelineTask: {
      title: 'Book Retro Kulfi Vendor & Bicycle Cart',
      notes: 'Select kulfi flavors (Kesar Pista, Paan, Mango) and confirm cart placement near dessert bar.',
    },
  },
  {
    id: 'acoustic_sufi_baithak',
    title: 'Acoustic Sufi & Ghazal Baithak',
    devanagariTitle: 'सूफ़ी व ग़ज़ल महफ़िल बैठक',
    tagline: 'Intimate candlelit carpet baithak with poetry and melody',
    description:
      'Low takht seating with bolsters, floor carpets, and acoustic musicians playing harmonium, tabla, and soulful Sufiana kalam.',
    category: 'entertainment',
    eventTypes: ['wedding', 'community'],
    costPaise: 40_000_00, // ₹40,000
    leadDays: 60,
    styleTags: ['heritage', 'intimate', 'acoustic'],
    culturalNuance:
      'A traditional Mehfil baithak dissolves the divide between performers and listeners, encouraging impromptu Wah-Wah appreciation.',
    timelineTask: {
      title: 'Curate Ghazal Ensemble & Takht Seating',
      notes: 'Arrange brass floor lanterns, bolsters, and acoustic balanced vocal monitors.',
    },
  },
  {
    id: 'floral_petal_shower',
    title: 'Floral Petal Shower Entry Rig',
    devanagariTitle: 'पुष्प वर्षा स्वागत यंत्र',
    tagline: 'A cinematic cascade of fragrant fresh rose and marigold petals',
    description:
      'Concealed overhead petal drops showering the couple or honoree in fresh indigenous rose petals during grand entry.',
    category: 'decor',
    eventTypes: ['wedding', 'birthday'],
    costPaise: 30_000_00, // ₹30,000
    leadDays: 30,
    styleTags: ['grand', 'spectacle', 'romantic'],
    culturalNuance:
      'Pushpa Vrishti (blessing with flowers) is an ancient royal welcome signifying good fortune and celebratory grandeur.',
    timelineTask: {
      title: 'Inspect Entry Rig & Order Bulk Petals',
      notes: 'Ensure petals are fresh, destemmed, and non-staining; test trigger release.',
    },
  },
  {
    id: 'dhol_tasha_procession',
    title: 'High-Energy Dhol Tasha Procession',
    devanagariTitle: 'ढोल ताशा वाद्य पथक',
    tagline: 'Thunderous acoustic rhythms leading a joyful procession',
    description:
      'Traditional Nashik/Puneri dhol and tasha ensemble delivering infectious high-energy percussive beats for the arrival parade.',
    category: 'entertainment',
    eventTypes: ['wedding', 'birthday', 'community'],
    costPaise: 22_000_00, // ₹22,000
    leadDays: 21,
    styleTags: ['high-energy', 'grand', 'traditional'],
    culturalNuance:
      'The synchronized resonance of traditional dhol creates an electric communal trance that brings guests of all generations to dance.',
    timelineTask: {
      title: 'Book Dhol Tasha Pathak & Map Procession',
      notes: 'Confirm assembly timing, safety spacing, and procession entry route with venue.',
    },
  },
  {
    id: 'vintage_polaroid_station',
    title: 'Vintage Polaroid Guestbook Station',
    devanagariTitle: 'विंटेज पोलारॉइड स्मृति पट्टिका',
    tagline: 'Instant analog photos pasted with handwritten blessings',
    description:
      'Station with retro instant cameras, film packs, metallic pens, and an artisan-bound mulberry paper scrapbook.',
    category: 'photo_film',
    eventTypes: ['wedding', 'birthday', 'community'],
    costPaise: 15_000_00, // ₹15,000
    leadDays: 14,
    styleTags: ['modern', 'intimate', 'nostalgic'],
    culturalNuance:
      'Allows guests to immediately document intimate memories in raw analog form alongside heartfelt personal notes.',
    timelineTask: {
      title: 'Order Polaroid Film, Cameras & Bound Book',
      notes: 'Assign dedicated station attendant to assist guests with loading film cartridges.',
    },
  },
  {
    id: 'handloom_safa_tying',
    title: 'Handloom Safa & Pagdi Tying Counter',
    devanagariTitle: 'साफ़ा व पगड़ी बंधन केंद्र',
    tagline: 'Artisanal turban draping for guests in ceremonial handlooms',
    description:
      'Master turban artists tying heritage Rajasthani Leheriya and Chanderi safas with royal kalgi brooches for Baraatis and hosts.',
    category: 'favors',
    eventTypes: ['wedding'],
    costPaise: 24_000_00, // ₹24,000
    leadDays: 21,
    styleTags: ['heritage', 'grand', 'ceremonial'],
    culturalNuance:
      'Draping the safa is a sacred honor bestowing dignity and cultural belonging upon every member of the celebration.',
    timelineTask: {
      title: 'Contract Turban Artists & Fabric Yardage',
      notes: 'Confirm colors matching celebration palette and allocate 3 artists for rapid tying.',
    },
  },
  {
    id: 'fairy_light_brass_canopy',
    title: 'Fairy Light & Brass Chandelier Canopy',
    devanagariTitle: 'स्वर्ण झूमर व दीप वितान',
    tagline: 'A starlit tunnel of warm light and suspended brass lanterns',
    description:
      'Overhead tunnel canopy with thousands of warm micro-LED lights accented by suspended handcrafted Moradabad brass chandeliers.',
    category: 'decor',
    eventTypes: ['wedding', 'birthday', 'community'],
    costPaise: 42_000_00, // ₹42,000
    leadDays: 45,
    styleTags: ['grand', 'modern', 'spectacle'],
    culturalNuance:
      'Evokes the celestial canopy of an ancient starry night, elevating the dining or dance arena into an ethereal dreamscape.',
    timelineTask: {
      title: 'Finalize Lighting Truss & Generator Plan',
      notes: 'Coordinate truss rigging load test and dedicated generator power circuit.',
    },
  },
]

/**
 * Deterministic personalization engine (IDEA-01).
 * Filters celebration ideas by eventType and ranks them using Style DNA affinities.
 * Pure, synchronous, and runs in <1ms without LLM latency.
 */
export function getPersonalizedIdeas(
  brief: EventBrief,
  styleDNA?: StyleDNA
): CuratedIdea[] {
  // 1. Strict event type filtering
  const matchingIdeas = CURATED_IDEAS.filter(idea =>
    idea.eventTypes.includes(brief.eventType)
  )

  // 2. Return unranked catalog if no styleDNA is provided
  if (!styleDNA) {
    return [...matchingIdeas]
  }

  const { dimensions } = styleDNA

  // 3. Deterministic dimension scoring
  function calculateAffinityScore(idea: CuratedIdea): number {
    let score = 0
    const tags = new Set(idea.styleTags.map(t => t.toLowerCase()))

    // Dimension: Heritage vs Modern (0 = Heritage, 100 = Modern)
    if (dimensions.heritageVsModern < 50) {
      // Heritage affinity
      const heritageWeight = (50 - dimensions.heritageVsModern) / 50 // 0 to 1
      if (tags.has('heritage')) score += 30 * heritageWeight
      if (tags.has('traditional')) score += 25 * heritageWeight
      if (tags.has('ceremonial') || tags.has('royal')) score += 15 * heritageWeight
      if (tags.has('modern')) score -= 20 * heritageWeight
    } else {
      // Modern affinity
      const modernWeight = (dimensions.heritageVsModern - 50) / 50 // 0 to 1
      if (tags.has('modern')) score += 30 * modernWeight
      if (tags.has('playful') && idea.category !== 'catering') score += 15 * modernWeight
      if (tags.has('heritage') || tags.has('traditional')) score -= 20 * modernWeight
    }

    // Dimension: Scale (0 = Intimate, 100 = Grand)
    if (dimensions.scale < 50) {
      const intimateWeight = (50 - dimensions.scale) / 50
      if (tags.has('intimate') || tags.has('comfort')) {
        score += 20 * intimateWeight
      }
      if (tags.has('grand')) {
        score -= 10 * intimateWeight
      }
    } else {
      const grandWeight = (dimensions.scale - 50) / 50
      if (tags.has('grand') || tags.has('royal')) {
        score += 20 * grandWeight
      }
      if (tags.has('intimate')) {
        score -= 10 * grandWeight
      }
    }

    // Dimension: Feast vs Spectacle (0 = Feast, 100 = Spectacle)
    if (dimensions.feastVsSpectacle < 50) {
      const feastWeight = (50 - dimensions.feastVsSpectacle) / 50
      if (tags.has('feast') || idea.category === 'catering') {
        score += 25 * feastWeight
      }
    } else {
      const spectacleWeight = (dimensions.feastVsSpectacle - 50) / 50
      if (tags.has('spectacle') || idea.category === 'decor') {
        score += 25 * spectacleWeight
      }
    }

    // Dimension: Energy (0 = Chill/Acoustic, 100 = High-Energy)
    if (dimensions.energy >= 50) {
      const energyWeight = (dimensions.energy - 50) / 50
      if (tags.has('high-energy')) {
        score += 15 * energyWeight
      }
    } else {
      const acousticWeight = (50 - dimensions.energy) / 50
      if (tags.has('acoustic') || tags.has('intimate')) {
        score += 15 * acousticWeight
      }
    }

    return score
  }

  // 4. Sort deterministically: descending score, with secondary sort on idea id
  return [...matchingIdeas].sort((a, b) => {
    const scoreDiff = calculateAffinityScore(b) - calculateAffinityScore(a)
    if (Math.abs(scoreDiff) > 0.001) {
      return scoreDiff
    }
    return a.id.localeCompare(b.id)
  })
}
