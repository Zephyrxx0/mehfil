# Roadmap: Mehfil (महफ़िल)

## Overview

Mehfil delivers a production-grade, mathematically verified celebration planning workspace in 6 Vertical MVP slices. Starting with an instant deterministic baseline and pure TypeScript planning arithmetic, the roadmap progresses through festive design tokens and centerpiece typography, anonymous dual-link persistence, multimodal style extraction with zero-failure fallbacks, deep constraint & displacement solvers, and prompt-quarantined vendor quote verification over a closed component registry.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Core Foundation & Instant Plan Slice** - Brief intake, deterministic template archetypes, integer paise budget engine, and backwards topological timeline.
- [x] **Phase 2: Festive Design System & Centerpiece Kinetic Hero** - 3-hue palette tokens, shadcn/ui primitives, and big bold Fraunces animated typography hero with celebration micro-motion.
- [ ] **Phase 3: Anonymous Persistence & Dual-Link Collaboration** - Supabase RLS migrations, immutable version snapshots, Organizer Edit Keys, and sanitized Family Share Links.
- [ ] **Phase 4: Multi-Agent Style DNA & Resilient Fallback Ladder** - 24-swatch vibe intake, vision extraction, bounded Planner modulation diffs, and 3-tier zero-failure fallback ladder.
- [ ] **Phase 5: Budget Invariants, Protected Moments & Idea Displacement** - Protected Moment immunity, Permissive Shortfall remedies, budget-neutral idea displacement, and Compressed Mode scheduling.
- [ ] **Phase 6: Quarantined Quote Check & Closed Registry Generative UI** - Tool-less Quote Analyst, verbatim source anchor validation, interactive Quote Check cards, and entity-ID-bound closed registry UI.

---

## Phase Details

### Phase 1: Core Foundation & Instant Plan Slice

**Goal**: Ship an end-to-end working celebration slice: brief intake modal, instant deterministic v1 plan generation from archetypes, pure TS budget engine with integer paise & largest-remainder allocation, and backwards topological timeline.
**Mode**: mvp
**Depends on**: Nothing (first phase)
**Requirements**: BRIEF-01, BRIEF-02, BRIEF-03, BUDGET-01, BUDGET-02, TIME-01, TIME-04, MOMENT-01
**Success Criteria**:

1. Organizer can submit an event brief (type, date, city, guests, budget) and immediately see a fully balanced v1 plan with zero blank loading screens (ADR-0001).
2. Guest count adjustments dynamically scale per-guest lines while preserving fixed lines, and all line amounts sum exactly to total budget in integer paise.
3. Backwards timeline renders milestone target dates from event date and exports cleanly as a valid `.ics` calendar file.

**Plans**: 3 plans

Plans:
**Wave 1**

- [x] 01-01: Pure TypeScript budget engine (integer paise, largest-remainder solver, per-guest scaling, template archetypes).

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02: Backwards topological timeline scheduler with calendar date math and `.ics` export generator.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03: Event brief intake modal and baseline workspace view wiring budget and timeline into a functional interactive slice.

### Phase 2: Festive Design System & Centerpiece Kinetic Hero

**Goal**: Deliver the visual identity, token architecture, and the centerpiece landing experience honoring DESIGN.md.
**Mode**: mvp
**Depends on**: Phase 1
**Requirements**: DESIGN-01, DESIGN-02, DESIGN-03
**Success Criteria**:

1. Full application adopts the 3-hue palette (Warm Ivory `#FFF8EE`, Marigold `#F7C873`, Gulabi Rose `#F2A7B8` with Royal Plum ink `#3A2442`) meeting WCAG AAA 4.5:1+ contrast on all fills.
2. Landing page displays big, bold, center-stage animated typography in Fraunces and Devanagari (`Tiro Devanagari Hindi`) with celebration micro-particles and a single minimalist CTA to launch the app.
3. Responsive workspace shell supports 3-pane desktop layout and 4-tab mobile drawer navigation.

**Plans**: 3 plans

Plans:
**Wave 1**

- [x] 02-01: Tailwind configuration, Google fonts setup (Fraunces, Plus Jakarta Sans, Tiro Devanagari Hindi), and CSS variable tokens in `globals.css`.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02: shadcn/ui components installation and custom Mehfil token styling (buttons, cards, badges, dialogs, sliders, sheets).

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-03: Center-stage kinetic headline with spring physics, ambient festive particles, and minimalist app launch CTA.

### Phase 3: Anonymous Persistence & Dual-Link Collaboration

**Goal**: Implement server persistence, immutable versioning, and zero-login cross-device resumption and sharing.
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: COLLAB-01, COLLAB-02, COLLAB-03, COLLAB-04
**Success Criteria**:

1. Visitors receive an anonymous Supabase session with isolated user ID under PostgreSQL RLS without login forms.
2. Organizer can copy a private Organizer Edit Key URL and claim the session on a separate browser/device to continue editing (ADR-0006).
3. Family Share Link renders a sanitized read-only celebratory snapshot with quotes and private notes excluded.
4. Plan mutations are saved as immutable append-only version records with one-click undo restoring prior snapshots.

**Plans**: 3 plans

Plans:

- [ ] 03-01: Supabase database schema migrations for events, plan_versions, change_records, and RLS policies.
- [ ] 03-02: Capability URL router (`/plan/[id]` with secret token claim and `/share/[token]` read-only view).
- [ ] 03-03: Immutable version history manager with change log records and one-click undo API.

### Phase 4: Multi-Agent Style DNA & Resilient Fallback Ladder

**Goal**: Deliver the visual onboarding and AI style modulation with a zero-failure resilience ladder.
**Mode**: mvp
**Depends on**: Phase 3
**Requirements**: VIBE-01, VIBE-02, VIBE-03, VIBE-04, GENUI-03
**Success Criteria**:

1. Organizer can pick 6-8 swatches from the 24-swatch gallery, enter the Protected Moment, and answer 3 trade-offs (ADR-0009).
2. Style Analyst extracts structured Style DNA via vision, and Planner proposes bounded multipliers as an audited v2 plan diff.
3. If primary model times out or fails validation, the three-tier fallback ladder escalates to Gemini Flash or degrades calmly to archetype defaults with a friendly user notification (ADR-0007).

**Plans**: 3 plans

Plans:

- [ ] 04-01: Curated 24 Style Swatches gallery component and Vibe Intake interactive questionnaire.
- [ ] 04-02: Vercel AI SDK pipeline for Style Analyst (vision) and Planner (weights & rationale) with strict Zod schemas.
- [ ] 04-03: Three-tier fallback orchestrator (repair retry -> Gemini Flash escalation -> static template fallback) with run records logging.

### Phase 5: Budget Invariants, Protected Moments & Idea Displacement

**Goal**: Complete the dynamic mathematical engine with Protected Moment immunity, Permissive Shortfall remedies, and budget-neutral idea displacement.
**Mode**: mvp
**Depends on**: Phase 4
**Requirements**: BUDGET-03, BUDGET-04, MOMENT-02, MOMENT-03, IDEA-01, IDEA-02, IDEA-03, TIME-02, TIME-03
**Success Criteria**:

1. The Protected Moment holds its raised floor with complete immunity against downward re-balancing or idea displacement, displaying Gulabi Rose highlights (ADR-0004).
2. When allocations exceed budget, the engine marks an Infeasible State and offers 3 deterministic calculation remedies (ADR-0002).
3. Adopting a curated idea computes exact budget-neutral displacement from elastic lines with visible feedback and one-click undo.
4. Short-notice events activate Compressed Mode, isolating the Critical Path triage list without displaying 25 overdue errors (ADR-0005).

**Plans**: 3 plans

Plans:

- [ ] 05-01: Protected Moment floor immunity algebra and Permissive Shortfall calculation solver with 3 deterministic remedies.
- [ ] 05-02: Idea Curator catalog and budget-neutral displacement engine with donor-line visual feedback and undo.
- [ ] 05-03: Date-risk environmental advisory adapters and Compressed Mode topological critical-path scheduler.

### Phase 6: Quarantined Quote Check & Closed Registry Generative UI

**Goal**: Safely ingest untrusted vendor quotes and render interactive comparison views over a closed component registry.
**Mode**: mvp
**Depends on**: Phase 5
**Requirements**: QUOTE-01, QUOTE-02, QUOTE-03, QUOTE-04, QUOTE-05, QUOTE-06, GENUI-01, GENUI-02
**Success Criteria**:

1. Organizer can paste quote text or upload invoices; the tool-less Quote Analyst extracts tiers, amounts, and omission flags under prompt quarantine (ADR-0003).
2. Numeric Guard verifies verbatim text anchors for all extracted numbers, rejecting unanchored figures.
3. Interactive Quote Check card lets user select a package tier, confirm omitted costs, and preview plan re-balancing before committing the actual to the budget line.
4. Generative UI strictly composes allowlisted shadcn components using Entity ID Binding with zero model-written code, HTML, or hallucinated numbers (ADR-0008).

**Plans**: 3 plans

Plans:

- [ ] 06-01: Tool-less Quote Analyst prompt quarantine pipeline and verbatim evidence anchor validator.
- [ ] 06-02: Interactive Quote Check comparison card with omission warnings and committed budget locking.
- [ ] 06-03: Closed Component Registry renderer with Entity ID Binding for dynamic layouts and scenario comparisons.

---
*Roadmap created: 2026-10-27*
