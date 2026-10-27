---
phase: "05"
plan: "02"
status: "completed"
date: "2026-10-28"
requirements:
  - IDEA-01
  - TIME-02
  - TIME-03
tags:
  - environmental-risks
  - pure-utc
  - peak-saya
  - dynamic-buffers
  - compressed-mode
  - curated-ideas
  - style-dna-personalization
---

# Phase 05 Plan 02 Summary: Pure UTC Environmental Date Risk Intelligence, Dynamic Lead-Time Buffers & Curated Celebration Catalog

## Overview

Plan 05-02 delivers the pure UTC environmental date hazard engine, dynamic lead-time expansion system (+30d/+15d peak Saya buffers), ADR-0005 Compressed Mode critical path triage, and the culturally authentic curated Indian celebration enhancements catalog with deterministic Style DNA personalization.

## Key Deliverables

1. **Pure UTC Environmental Risk Engine (`src/lib/engine/environmental.ts`)**:
   - `detectEnvironmentalRisks(eventDateStr, city, eventType)`:
     - Pure UTC string parsing via split('-') preventing browser timezone day shifts (T-05-05).
     - Peak Winter Saya detection (`peak_saya_winter`): Nov 1 to Feb 28/29 for weddings, attaching +30d buffer for venue & photo_film.
     - Peak Summer Saya detection (`peak_saya_summer`): Apr 15 to May 31 for weddings, attaching +15d buffer for venue.
     - Monsoon Outdoor Hazard detection (`monsoon_outdoor`): Jun 15 to Aug 31 pan-India, extended to Sep 15 for West Coast regions (Mumbai, Goa, Kochi, Pune, Western Ghats).
     - Extreme Summer Heat detection (`extreme_summer_heat`): May 1 to Jun 30 across North & Central India (Delhi NCR, Jaipur, Lucknow, Ahmedabad, Chandigarh), alerting catering and decor.
     - National Holiday & Dry Day Clash detection (`holiday_clash`): Jan 26, Aug 15, Oct 2, Dec 31, alerting entertainment sound curfews past 10 PM and dry day civic rules.
     - Generates calm, reassuring festive summaries avoiding alarmist panic.

2. **Dynamic Lead-Time Expansion & Timeline Integration (`src/lib/engine/timeline.ts`)**:
   - `calculateBackwardsTimeline` extended with `environmentalAnalysis` and `adoptedIdeas`:
     - Dynamically shifts T-6M milestone target date earlier by +30d (or +15d) during peak Saya seasons.
     - Annotates affected milestone tasks with `appliedBufferDays`, `environmentalRiskId`, and contextual `environmentalAdvisory` notes.
     - Injects adopted celebration ideas (`adoptedIdeas`) into matching milestone bands (T-6M, T-3M, T-1M, T-2W, Day-0) with `originIdeaId`.
     - ADR-0005 Compressed Mode: For events scheduled on short notice (<60 days), packages past milestones into an Immediate Action triage sprint sorted strictly by topological criticality (Venue=1, Catering=2, Photo=3).

3. **Culturally Authentic Curated Celebration Catalog (`src/data/curatedIdeas.ts`)**:
   - Comprehensive static catalog of 14 authentic celebration enhancements:
     1. Kulhad Chai & Filter Coffee Bar (`catering`, ₹15,000, 21d lead) — कुल्हड़ चाय एवं फ़िल्टर कॉफ़ी बार
     2. Live Shehnai & Nagada Jugalbandi (`entertainment`, ₹25,000, 45d lead) — शहनाई व नगाड़ा जुगलबंदी
     3. Live Jalebi & Chilled Rabdi Counter (`catering`, ₹20,000, 14d lead) — लाइव जलेबी व लच्छेदार रबड़ी
     4. Live Caricature & Guest Keepsake Pavilion (`entertainment`, ₹18,000, 30d lead) — लाइव व्यंग्यचित्र व स्मृति दीर्घा
     5. Terracotta Jali & Marigold Photo Pavilion (`decor`, ₹35,000, 30d lead) — टेराकोटा जाली व गेंदा पुष्प मंडप
     6. Gulab-Jal & Ittar Welcoming Station (`favors`, ₹12,000, 14d lead) — गुलाब-जल व इत्र स्वागत केंद्र
     7. Handcrafted Brass Diya & Seed Favors (`favors`, ₹16,000, 21d lead) — हस्तनिर्मित पीतल दीया व बीज उपहार
     8. Vintage Matka Kulfi & Falooda Bicycle Cart (`catering`, ₹14,000, 10d lead) — मटका कुल्फ़ी व फ़ालूदा सायकल
     9. Acoustic Sufi & Ghazal Baithak (`entertainment`, ₹40,000, 60d lead) — सूफ़ी व ग़ज़ल महफ़िल बैठक
     10. Floral Petal Shower Entry Rig (`decor`, ₹30,000, 30d lead) — पुष्प वर्षा स्वागत यंत्र
     11. High-Energy Dhol Tasha Procession (`entertainment`, ₹22,000, 21d lead) — ढोल ताशा वाद्य पथक
     12. Vintage Polaroid Guestbook Station (`photo_film`, ₹15,000, 14d lead) — विंटेज पोलारॉइड स्मृति पट्टिका
     13. Handloom Safa & Pagdi Tying Counter (`favors`, ₹24,000, 21d lead) — साफ़ा व पगड़ी बंधन केंद्र
     14. Fairy Light & Brass Chandelier Canopy (`decor`, ₹42,000, 45d lead) — स्वर्ण झूमर व दीप वितान
   - All costs in whole integer paise (divisible by 100), authentic Devanagari titles, and actionable execution tasks.

4. **Deterministic Style DNA Personalization Engine (`src/data/curatedIdeas.ts`)**:
   - `getPersonalizedIdeas(brief, styleDNA)`:
     - Filters catalog strictly by celebration `eventType`.
     - Calculates deterministic dimension affinity scores across `heritageVsModern`, `scale`, `feastVsSpectacle`, and `energy`.
     - Sorts matching enhancements in descending score order with secondary sort on idea id.
     - Pure, synchronous, and executes in <1ms without LLM latency.

5. **Automated Test Coverage**:
   - `tests/engine/calendar-risks.test.ts`: 8 tests verifying winter Saya +30d venue/photo buffers, summer Saya +15d buffers, summer heat, monsoon pan-India and West Coast windows, holiday curfews, 30-day target date shifts, Compressed Mode triage, and adopted idea task injection.
   - `tests/engine/idea-catalog.test.ts`: 9 tests verifying integer paise validity, Devanagari script presence, event type filtering, Style DNA heritage/modern/feast promotion, and sub-millisecond execution time.

## Verification

- `pnpm vitest run tests/engine/calendar-risks.test.ts tests/engine/timeline.test.ts`: 13 passed (100%)
- `pnpm vitest run tests/engine/idea-catalog.test.ts`: 9 passed (100%)
- `pnpm vitest run tests/engine/`: 14 test files passed (104 tests)
- `pnpm vitest run`: 32 test files passed (222 tests)
