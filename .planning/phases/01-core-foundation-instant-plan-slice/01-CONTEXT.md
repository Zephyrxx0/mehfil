# Phase 1: Core Foundation & Instant Plan Slice - Context

**Gathered:** 2026-10-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the foundational celebration planning slice:
- Focused 3-step brief intake modal with 1-click quick-start preset chips.
- Instant (<10ms) deterministic v1 plan generation from hardcoded archetypes (Indian Wedding, Milestone Birthday, Community Cultural Meet).
- Pure TypeScript budget engine operating strictly on integer paise using the largest-remainder method, dynamic per-guest scaling against elastic lines with invariant budget protection and a 40% floor.
- Signature Protected Moment (MOMENT-01) locking and immunity from downward trimming.
- Backwards topological timeline scheduler with calendar date math, "Immediate Action" compressed triage for close event dates, and local `.ics` calendar export.

</domain>

<decisions>
## Implementation Decisions

### Intake Flow Experience
- **D-01:** Stepped micro-wizard (3 focused steps: Event Basics [type, date, city] -> Scale & Budget [guest count, total budget] -> Cultural Nuances & Constraints) for a calm, non-overwhelming mobile-friendly flow. — **Reversibility:** reversible
- **D-02:** 1-click starter chips at top of intake modal ("Big Fat Delhi Wedding ₹25L", "Intimate 50th Birthday ₹5L", "Society Diwali Gala ₹8L") that prefill all fields instantly for testing and live evaluation. — **Reversibility:** reversible
- **D-03:** Step 3 captures cultural nuances/constraints (BRIEF-03) via multi-select chip tags ([Pure Veg / Jain Catering], [Elderly Accessibility & Ramps], [Late Night Sound Permit], [Morning Pooja / Ritual Slots]) + optional custom note, with an explicit "Skip & Generate" action. — **Reversibility:** reversible
- **D-04:** Gentle 300ms celebration reveal with a brief "Balancing budget & timeline..." confirmation pulse before transitioning into the populated workspace (matching ADR-0001 <10ms computation while reassuring non-technical users). — **Reversibility:** reversible

### Archetype Presets & Cultural Defaults
- **D-05:** 3 primary milestone archetypes out of the box in Phase 1: Indian Wedding (multi-day: Sangeet, Mehendi, Main), Milestone Birthday (50th Golden/Silver), and Community Cultural Meet (Diwali/Society Utsav). — **Reversibility:** costly — changes schema and baseline templates across engine
- **D-06:** 7 standard categories across archetypes: Venue & Stage, Catering & Drinks, Decor & Flowers, Photo & Film, Entertainment & Sound, Favors & Invites, Miscellaneous + an explicit 5% Contingency Buffer line. — **Reversibility:** costly — establishes baseline line-item schema
- **D-07:** Default signature Protected Moment (MOMENT-01) pre-assigned per archetype (Wedding -> Catering Feast, Birthday -> Entertainment & Cake, Community -> Grand Feast) with an obvious 1-click star/lock icon on every line allowing immediate reassignment anytime. — **Reversibility:** reversible
- **D-08:** Authentic Indian numbering system (e.g. ₹25,00,000 with Indian comma grouping and Lakh/Crore compact badges like ₹25L) with input supporting both plain numbers (2500000) and Lakh shortcuts (25L). — **Reversibility:** reversible

### Budget Scaling Dynamics
- **D-09:** Fixed Total Budget invariant: guest count increases scale per-guest lines (Catering, Favors) up by re-balancing downwards from elastic lines (Decor, Entertainment), keeping Protected Moment untouched. If elastic lines hit minimum floor, surface Shortfall remedies (ADR-0002). — **Reversibility:** one-way — core invariant of Mehfil planning arithmetic
- **D-10:** Display whole Rupees (₹) in primary UI via largest-remainder apportionment at rupee boundary, maintaining integer paise precision internally to guarantee 100% sum consistency without visual ±₹1 discrepancies. — **Reversibility:** costly — formatting and rounding contract
- **D-11:** Archetype minimum floor ratio: elastic lines cannot squeeze below 40% of their baseline; reaching 40% triggers Permissive Shortfall remedies per ADR-0002. — **Reversibility:** costly — solver constraint threshold
- **D-12:** Dual plain-language communication: top summary banner with explanation and undo action + inline (+/-) change pills on affected cards. — **Reversibility:** reversible

### Timeline Checkpoints & ICS Export
- **D-13:** Phased milestone bands (T-6 Months: Venue & Date Lock, T-3 Months: Catering & Vendors, T-1 Month: Invites & Fittings, T-2 Weeks: Final Numbers, Day-Of: Execution) with task cards underneath each band. — **Reversibility:** reversible
- **D-14:** Immediate Action sprint triage (ADR-0005 baseline): when an event date is close and standard backwards milestone dates fall in the past, bundle them into a high-priority "Immediate Action (This Week)" triage group instead of scattering intimidating red error alerts. — **Reversibility:** costly — timeline scheduler grouping logic
- **D-15:** All-day milestone calendar events in generated `.ics` file with an automatic 9:00 AM reminder alert and description listing associated tasks and vendor guidelines. — **Reversibility:** reversible
- **D-16:** Clickable budget category pill on timeline milestone cards (e.g. [Catering • ₹7,50,000]) that smoothly highlights and scrolls to the corresponding budget line in the workspace. — **Reversibility:** reversible

### the agent's Discretion
- Specific styling of micro-wizard stepper pills and transition motion curves.
- Concrete lead-time day offsets for archetype milestone bands (e.g. 180 days, 90 days, 30 days, 14 days, 0 days).
- Internal TypeScript module organization for the pure planning engine (`src/lib/engine/budget.ts`, `src/lib/engine/timeline.ts`, etc.).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture Decision Records (ADRs)
- `docs/adr/0001-deterministic-baseline-first.md` — Deterministic archetype baseline instant instantiation (<10ms) without model dependencies.
- `docs/adr/0002-permissive-shortfall-with-remedies.md` — Permissive shortfall state and the 3 deterministic calculation remedies when budget floor/capacity is exceeded.
- `docs/adr/0004-idea-displacement-with-protected-immunity.md` — Protected Moment immunity and elastic donor line displacement mechanics.
- `docs/adr/0005-compressed-mode-timeline-triage.md` — Backwards timeline topological triage and Compressed Mode for short-notice milestones.

### Specifications & PRD
- `PRD.md` §3.1 — Event Intake Brief and deterministic archetype generation.
- `PRD.md` §4.1 — Linked Planning Engine mathematical model, integer paise precision, and largest-remainder algorithm.
- `PRD.md` §4.2 — Backwards-scheduled timeline, milestone intervals, and calendar export.
- `DESIGN.md` — 3-hue palette discipline, typography (Fraunces & Tiro Devanagari Hindi), and WCAG AAA contrast rules.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Specification files in root: `PRD.md`, `DESIGN.md`, `CONTEXT.md`, and 9 ADRs in `docs/adr/`.
- Greenfield application setup: Next.js App Router with TypeScript, Tailwind CSS, and shadcn/ui to be initialized.

### Established Patterns
- Pure functional engine: Separation of pure TypeScript calculation logic (budget & timeline) from React UI components.
- Zero floating-point money: Integer paise (`bigint` or integer `number` where max celebration budget ₹100 Cr fits safely in JavaScript `Number.MAX_SAFE_INTEGER`).
- Mathematical immutability: State transformations return new plan snapshots.

### Integration Points
- `src/lib/engine/budget.ts` -> Pure calculation engine for baseline, scaling, and largest-remainder apportionment.
- `src/lib/engine/timeline.ts` -> Pure calculation engine for backwards schedule dates, compressed triage, and `.ics` generation.
- `src/components/intake/BriefModal.tsx` -> 3-step micro-wizard for initial event brief.
- `src/components/workspace/` -> Baseline workspace view wiring budget cards and timeline milestone bands.

</code_context>

<specifics>
## Specific Ideas

- Indian Numbering Formatter utility (`formatINR(paise, { compact: boolean })`) outputting authentic lakh/crore commas (`₹25,00,000` / `₹25L`).
- Quick demo chips on top of modal so evaluators and developers can click once to experience a complete, balanced Indian Wedding, Milestone 50th, or Diwali Utsav plan.
- Distinct Gulabi Rose highlight and lock badge on the Protected Moment line item.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed strictly within Phase 1 scope. (Style DNA extraction is scoped for Phase 4; Supabase persistence and share links for Phase 3; Quote Check for Phase 6).

</deferred>

---

*Phase: 1-Core Foundation & Instant Plan Slice*
*Context gathered: 2026-10-27*

