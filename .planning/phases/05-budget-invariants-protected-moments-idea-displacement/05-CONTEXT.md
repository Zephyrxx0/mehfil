# Phase 5: Budget Invariants, Protected Moments & Idea Displacement - Context

**Gathered:** 2026-10-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 completes Mehfil's dynamic mathematical engine with:
1. Protected Moment immunity against downward re-balancing or displacement, with Gulabi Rose tactile/visual highlights (MOMENT-02, MOMENT-03, ADR-0004).
2. Permissive Shortfall State: engine marks Infeasible State when allocations/guest surge exceed budget and provides 3 deterministic remedies (increase budget, reduce guests, trim elastic lines in elasticity order) without blocking user inputs (BUDGET-03, BUDGET-04, ADR-0002).
3. Idea Curator and Zero-Sum Displacement: curated personalized celebration ideas proposed by Style DNA & event type; adopting an idea calculates deterministic budget-neutral displacement from flexible lines, with 1-click undo cleanly restoring funds (IDEA-01, IDEA-02, IDEA-03, ADR-0004).
4. Environmental Date Risks & Calendar Intelligence: pure TypeScript date engine detects peak Indian wedding season (Saya/Muhurat dates), monsoon/summer weather risks, and holiday clashes with lead-time buffers, and activates calm Compressed Mode triage for short-notice milestones (TIME-02, TIME-03, ADR-0005).

Out of scope for Phase 5: Untrusted vendor quote ingestion, OCR, and Generative UI closed registry (Phase 6).
</domain>

<decisions>
## Implementation Decisions

### Curated Idea Catalog & Adoption UI (IDEA-01, IDEA-02, IDEA-03)
- **D-01:** Dedicated "Curated Ideas" tab / sheet in `WorkspaceShell` with category filters (keeps budget cards clean while providing rich storytelling, cost tags, and lead times).
- **D-02:** Hybrid Curated Engine: structured idea catalogue indexed by Style DNA & Event Type, with AI personalization of descriptions and nuance notes (cached/deterministic structure with personalized nuance text).
- **D-03:** Direct toggle switch on Idea Card with live re-balancing, animated donor deductions, and an immediate "Undo Idea" pill in the bottom action bar.
- **D-04:** Permissive Shortfall Adoption (ADR-0002): adopting an idea that exhausts flexible donor capacity transitions the plan into an Infeasible State with the Shortfall Banner and 3 calculation remedies, rather than blocking the organizer.

### Donor Line Displacement Visualization (BUDGET-04, MOMENT-02, MOMENT-03)
- **D-05:** Inline Donor Tags: donor `BudgetLineCards` show a deduction badge (e.g., "-₹15,000 for Chai Bar") with an interactive link or tooltip referencing the adopted idea.
- **D-06:** Strict Elasticity Rank Order (BUDGET-04): flexible lines absorb displacement in strict elasticity rank order (Misc -> Entertainment -> Decor), draining lowest rank first down to its 40% floor before touching the next donor line.
- **D-07:** Exact Inverse Reversion (IDEA-03): toggling an idea off restores exact paise amounts back to the specific donor lines from which they were deducted in reverse order.
- **D-08:** Protected Moment Immunity Feedback: tactile micro-haptic (`navigator.vibrate`), Gulabi Rose lock shimmer animation, and explicit tooltip: "Protected Moment is mathematically immune to displacement" (ADR-0004).

### Environmental Date Risks & Weather Advisories (TIME-02, TIME-03)
- **D-09:** Dual Timeline Presentation: ambient seasonal summary banner atop the Timeline tab PLUS contextual advisory pills on affected milestone cards (e.g. Venue, Decor).
- **D-10:** Full Indian Celebration Rules: engine evaluates date and city for Peak Saya/Muhurat dates (Nov–Feb, Apr–May), Monsoon outdoor risks (Jun–Aug), Peak Summer heat (May–Jun), and major national holiday clashes.
- **D-11:** Dynamic Lead-Time Buffers: automatically expand task lead-days during detected peak seasons (e.g. Venue shifts from 180d to 210d) with a "+30d peak buffer" badge.
- **D-12:** Calm Triage Banner (ADR-0005): Warm Marigold/Plum banner highlighting "Compressed Planning Mode: Immediate Action items for this week" without demoralizing red alert warnings.

### Permissive Shortfall Remedies Execution (BUDGET-03, BUDGET-04, ADR-0002)
- **D-13:** Immediate Atomic Update: one-click remedy application immediately recalculates allocations, clears infeasible state, and records an immutable version snapshot with explanation.
- **D-14:** Two-Tier Undo: immediate "Undo Remedy" pill in bottom action bar for instant reversal + permanent version rollback in the version history drawer.
- **D-15:** Targeted Sequential Trim (BUDGET-04): Remedy 3 ("Trim Flexible Lines") trims flexible lines in strict elasticity order only until the exact deficit is covered (not a blunt clamp to all floors).
- **D-16:** Non-Blocking Persistence (ADR-0002): plans in Infeasible State save and sync normally; share links and `.ics` exports carry a calm advisory pill stating the unallocated deficit.

### the agent's Discretion
- Exact styling details of the Idea Card typography, Devanagari flourishes, and badge iconography following `DESIGN.md`.
- Specific curated celebration ideas catalog items per archetype and cultural nuance (e.g. Chai Cart, Live Shehnai, Jali Photo Booth, Vintage Car Entry, Mithai Station).
- Exact date window bounding for peak Saya dates and regional weather alerts.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture Decision Records
- `docs/adr/0001-pure-code-arithmetic-engine.md` — Integer paise arithmetic, models banned from numbers
- `docs/adr/0002-permissive-shortfall-state.md` — Infeasible state and 3 deterministic remedies
- `docs/adr/0004-idea-adoption-zero-sum.md` — Zero-sum idea displacement and Protected Moment immunity
- `docs/adr/0005-compressed-timeline-mode.md` — Short-notice topological triage and critical path

### Specifications & Design System
- `DESIGN.md` — 3 pastel hues (Ivory, Marigold, Gulabi Rose), Plum ink, micro-haptics, WCAG AAA contrast
- `PRD.md` §3.3 & §3.4 — Budget balancing, Protected Moments, and Idea displacement contracts
- `.planning/REQUIREMENTS.md` — BUDGET-03, BUDGET-04, MOMENT-02, MOMENT-03, IDEA-01, IDEA-02, IDEA-03, TIME-02, TIME-03
</canonical_refs>

<code_context>
## Existing Codebase Patterns & Integration Points

- `src/lib/engine/budget.ts`: Contains `rebalanceGuestCount`, `calculateShortfallRemedies`, `apportionRupees`, and `setProtectedMoment`. Needs extension for zero-sum idea displacement (`adoptIdea`, `retractIdea`) and sequential elasticity trimming.
- `src/lib/engine/timeline.ts`: Contains `calculateBackwardsTimeline`, milestone templates, and basic Compressed Mode grouping. Needs extension for environmental date risk detection (Saya dates, monsoon/heat, holiday clashes) and dynamic lead-time buffers.
- `src/lib/engine/types.ts`: Contains `BudgetLine`, `Plan`, `ShortfallRemedy`, `TimelineSchedule`. Needs domain types for `CuratedIdea`, `IdeaDisplacementRecord`, and `EnvironmentalRiskAdvisory`.
- `src/components/workspace/ShortfallBanner.tsx`: Existing banner component for Infeasible State; needs support for immediate 1-click remedy execution with two-tier undo.
- `src/components/workspace/BudgetLineCard.tsx`: Existing card rendering Protected Moment and line types; needs inline donor tag indicators for displaced funds and micro-haptic feedback.
- `src/components/workspace/WorkspaceShell.tsx`: Main workspace shell orchestrating tabs; needs "Curated Ideas" tab/drawer integration and seasonal advisory banner atop Timeline.
</code_context>

<deferred>
## Deferred Ideas

- None noted during this discussion. All scope remains tightly anchored to Phase 5 requirements.
</deferred>

