# Requirements: Mehfil (महफ़िल)

**Defined:** 2026-10-27  
**Core Value:** Words from models, numbers from code: the planning engine guarantees mathematical consistency, immutable versioned re-balancing, and protected floors across budget and timeline, ensuring a family's celebration budget can never be distorted by model arithmetic errors or prompt injection.

## v1 Requirements

### Event Brief & Baseline Generation

- [ ] **BRIEF-01**: User can input core event parameters (type: wedding/birthday/community, date, city, guest count, total budget in ₹) via a focused modal intake.
- [ ] **BRIEF-02**: Engine immediately instantiates a mathematically balanced, complete v1 plan from hardcoded archetype templates in <10ms without waiting for LLM completion (ADR-0001).
- [ ] **BRIEF-03**: User can specify optional constraints (dietary restrictions, elderly accessibility, essential cultural rituals) that parameterize vendor search questions.

### Vibe Intake & Style DNA

- [x] **VIBE-01**: User can select 6 to 8 visual references from a curated gallery of 24 licensed Style Swatches (ADR-0009).
- [x] **VIBE-02**: User can input their single-sentence Protected Moment and answer three forced-choice trade-off pairs.
- [x] **VIBE-03**: Style Analyst extracts structured Style DNA (bounded dimensions: formality, energy, scale, traditional vs. modern, and a named palette) via vision analysis.
- [x] **VIBE-04**: Planner applies bounded multiplier modulation to baseline weights, producing an audited v2 version diff with plain-language rationale.

### Linked Budget Engine

- [ ] **BUDGET-01**: Engine computes all allocations in integer paise using the largest-remainder method, guaranteeing line totals sum exactly to total budget.
- [ ] **BUDGET-02**: Adjusting guest count dynamically scales per-guest lines (catering, favors) while preserving fixed lines and minimum floors.
- [x] **BUDGET-03**: When allocations or quotes exceed budget, engine enters an explicit Infeasible State and calculates three deterministic remedies (increase budget, reduce guests, trim elastic lines) without blocking user input (ADR-0002).
- [x] **BUDGET-04**: Downward re-balancing strictly respects Line Elasticity rankings, trimming flexible lines (decor, entertainment) first.

### Timeline & Compressed Scheduling

- [ ] **TIME-01**: Engine calculates backwards schedule from event date based on task lead-times, guest scale multipliers, and predecessor dependencies.
- [x] **TIME-02**: Engine detects environmental date risks (peak wedding seasons, national holidays, seasonal weather) and inserts lead-time advisories.
- [x] **TIME-03**: For short-notice events with standard milestones in the past, engine activates Compressed Mode, elevating a prioritized Critical Path triage queue (ADR-0005).
- [ ] **TIME-04**: User can export the backwards timeline as a local `.ics` iCalendar file for import into Google Calendar or Apple Calendar.

### Protected Moment Floor

- [ ] **MOMENT-01**: User can designate one budget line as their Protected Moment, locking a raised non-negotiable monetary floor.
- [x] **MOMENT-02**: The Protected Moment allocation is strictly immune to downward re-balancing and idea displacement (ADR-0004).
- [ ] **MOMENT-03**: UI renders a distinct Gulabi Rose highlight, lock icon, and micro-haptic feedback when the Protected Moment holds against changes.

### Quote Check & Quarantine

- [ ] **QUOTE-01**: User can paste unstructured vendor quote text or upload invoice screenshots into a dedicated quote intake.
- [ ] **QUOTE-02**: Quote Analyst operates under strict prompt quarantine with zero tool access and zero write authority, extracting items, tiers, and omissions (ADR-0003).
- [ ] **QUOTE-03**: Numeric Guard enforces the Verbatim Evidence Rule: extracted numbers must match exact text substrings; unanchored figures are dropped.
- [ ] **QUOTE-04**: Engine scans category rules and flags common unstated costs (GST, generator backup, overtime fees, service charges).
- [ ] **QUOTE-05**: User reviews an interactive Quote Check card, selects the desired package tier, verifies flagged omissions, and previews plan-wide re-balancing before committing.
- [ ] **QUOTE-06**: Accepting a quote commits the monetary actual to the budget line and marks the associated timeline booking task complete.

### Personalized Idea Curation & Displacement

- [x] **IDEA-01**: Idea Curator proposes personalized enhancements matching Style DNA and event type, each carrying cost ranges and lead times.
- [x] **IDEA-02**: Adopting an idea calculates deterministic budget-neutral displacement from elastic lines without touching the Protected Moment (ADR-0004).
- [x] **IDEA-03**: User can toggle adopted ideas off with one-click undo, cleanly restoring displaced funds to donor lines.

### Anonymous Access & Dual-Link Collaboration

- [ ] **COLLAB-01**: Visitor automatically receives an anonymous Supabase session with isolated user ID under PostgreSQL Row-Level Security.
- [ ] **COLLAB-02**: User can copy a private Organizer Edit Key URL embedding an unguessable token to resume editing across browsers and devices without accounts (ADR-0006).
- [ ] **COLLAB-03**: User can generate a sanitized read-only Family Share Link backed by a one-way hashed token, hiding vendor quotes, draft notes, and private negotiations.
- [ ] **COLLAB-04**: Plan versions are strictly immutable and append-only; undo operations create a new forward version restoring previous snapshots.

### Closed Registry Generative UI

- [ ] **GENUI-01**: Models are structurally restricted to selecting allowlisted shadcn/ui components (`VendorChecklist`, `IdeaGrid`, `QuoteReport`, `ScenarioComparison`) via Zod schema (ADR-0008).
- [ ] **GENUI-02**: Entity ID Binding: component schemas reject numeric amounts and dates; components resolve authoritative figures directly from engine state.
- [x] **GENUI-03**: Three-tier fallback ladder (Gemma repair retry $\rightarrow$ Gemini Flash cloud escalation $\rightarrow$ static template fallback) ensures zero-failure operation during live demos (ADR-0007).

### Visual Design System & Kinetic Landing

- [ ] **DESIGN-01**: Full UI implements the 3-hue festive palette: Warm Ivory (`#FFF8EE`), Marigold (`#F7C873`), Gulabi Rose (`#F2A7B8`), and Royal Plum ink (`#3A2442`) adhering to WCAG AAA contrast guidelines.
- [ ] **DESIGN-02**: Landing page features big, bold center-stage animated typography in `Fraunces` paired with Devanagari script (`Tiro Devanagari Hindi`), ambient celebration micro-motion, and a single minimalist CTA.
- [ ] **DESIGN-03**: Responsive workspace layout: 3-pane desktop (Budget, Timeline, Change Explainer) and 4-tab mobile view with persistent bottom sheet change records.

## v2 Requirements

### Deferred Enhancements

- **ENH-01**: Custom multi-file user image upload with signed URLs and background S3/Supabase storage lifecycle (deferred per ADR-0009).
- **ENH-02**: Generative AI moodboard image synthesis using Gemini Imagen model.
- **ENH-03**: Multi-language generation supporting Hindi, Urdu, and regional Indian languages natively.
- **ENH-04**: Native vendor messaging integration (direct WhatsApp Business API webhook dispatcher).

## Out of Scope

| Feature | Reason |
|---------|--------|
| In-App Payment Gateway & Escrow | Regulatory compliance, escrow licenses, and high complexity for a 7-day build; Mehfil is a planning workspace. |
| Open Vendor Marketplace Portal | Managing vendor accounts and cold-start supply dynamics is out of scope; Google Places API is used for local candidates. |
| User Accounts & Password Auth | Causes severe onboarding drop-off; replaced by Supabase anonymous sessions and unguessable capability Edit Keys. |
| Real-Time Multi-User CRDT Collaboration | High synchronization overhead; addressed cleanly through versioned read-only Family Share Links. |
| Dark Mode | Intentionally excluded to preserve the festive, tactile Indian cotton-paper invitation aesthetic. |

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRIEF-01 | Phase 1 | Pending |
| BRIEF-02 | Phase 1 | Pending |
| BRIEF-03 | Phase 1 | Pending |
| BUDGET-01 | Phase 1 | Pending |
| BUDGET-02 | Phase 1 | Pending |
| TIME-01 | Phase 1 | Pending |
| TIME-04 | Phase 1 | Pending |
| MOMENT-01 | Phase 1 | Pending |
| DESIGN-01 | Phase 2 | Pending |
| DESIGN-02 | Phase 2 | Pending |
| DESIGN-03 | Phase 2 | Pending |
| COLLAB-01 | Phase 3 | Pending |
| COLLAB-02 | Phase 3 | Pending |
| COLLAB-03 | Phase 3 | Pending |
| COLLAB-04 | Phase 3 | Pending |
| VIBE-01 | Phase 4 | Complete |
| VIBE-02 | Phase 4 | Complete |
| VIBE-03 | Phase 4 | Complete |
| VIBE-04 | Phase 4 | Complete |
| GENUI-03 | Phase 4 | Complete |
| BUDGET-03 | Phase 5 | Complete |
| BUDGET-04 | Phase 5 | Complete |
| MOMENT-02 | Phase 5 | Complete |
| MOMENT-03 | Phase 5 | Pending |
| IDEA-01 | Phase 5 | Pending |
| IDEA-02 | Phase 5 | Complete |
| IDEA-03 | Phase 5 | Complete |
| TIME-02 | Phase 5 | Pending |
| TIME-03 | Phase 5 | Pending |
| QUOTE-01 | Phase 6 | Pending |
| QUOTE-02 | Phase 6 | Pending |
| QUOTE-03 | Phase 6 | Pending |
| QUOTE-04 | Phase 6 | Pending |
| QUOTE-05 | Phase 6 | Pending |
| QUOTE-06 | Phase 6 | Pending |
| GENUI-01 | Phase 6 | Pending |
| GENUI-02 | Phase 6 | Pending |

**Coverage:**

- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-27*
