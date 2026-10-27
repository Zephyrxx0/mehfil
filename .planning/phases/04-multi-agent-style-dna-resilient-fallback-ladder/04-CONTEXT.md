# Phase 4: Multi-Agent Style DNA & Resilient Fallback Ladder - Context

**Gathered:** 2026-10-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 delivers the aesthetic personalization pipeline and zero-failure multi-model resilience:
- Curated 24-swatch visual vibe intake with hybrid local WebP assets in `/public/swatches/`, preset filters, and a strict 6–8 selection counter.
- Two-step micro-wizard in event intake: Step 3A (Swatch Selection) $\rightarrow$ Step 3B (Single-sentence Protected Moment input & 3 Forced-Choice Trade-offs: Feast/Spectacle, Intimate/Grand, Heritage/Modern).
- Style Analyst structured extraction: 8-axis bounded dimension profile (Formality, Energy, Scale, Heritage vs Modern, Feast vs Spectacle, Music, Decor Density, Indoor vs Outdoor) + Named Palette (3–4 festive hues) + 1-sentence vibe statement (strict prohibition against inferring demographic, ethnic, or religious identity from aesthetics).
- Planner bounded weight modulation: category line weights modulated strictly within `[0.75x, 1.25x]` (±25%) of archetype baseline, with Protected Moment mapped to its target category line locking a 1.25x floor multiplier and rose badge.
- Two-beat v2 Plan Reveal: instant arrival (<10ms) showing baseline v1, followed by a 1.2s smooth GSAP/Motion re-balance bar animation as Style DNA finishes, highlighting what shifted with spring physics (instant zero-delay snap when `prefers-reduced-motion` is active).
- v2 Change Explainer & Undo: highlighted v2 change banner and auto-updated ChangeExplainer in Pane 3 with plain-language rationale, plus a dedicated "Reset to Baseline (v1)" action in Style DNA card menu alongside standard append-only version history undo.
- Interactive Style DNA Card at the top of Pane 3 (Desktop) and Drawer (Mobile) displaying dimension pills, palette swatches, and an "Edit Style DNA" modal to retune slider knobs.
- Three-tier resilient fallback ladder (ADR-0007): Tier 1 (Gemma 4 with 1 schema-repair retry, 8s timeout) $\rightarrow$ Tier 2 (Gemini 2.0 Flash cloud escalation) $\rightarrow$ Tier 3 (pure deterministic heuristic extractor from swatches & trade-offs).
- Calm degradation UI: gentle note on Style DNA card ("Showing standard style profile for now; your custom vibe will be infused when you retry") with subtle "Retry Extraction" button and zero alarming error modals.
- Run Records & telemetry: structured invocation metadata attached to `plan_version.meta.run_record` (`active_tier`, `duration_ms`, `model_id`, `fallback_reason`) plus JSON console logging; seamless Tier 3 execution when API keys are absent.

</domain>

<decisions>
## Implementation Decisions

### Vibe Intake UX & Swatch Gallery
- **D-01:** Sequential step in intake wizard: Brief form $\rightarrow$ Vibe Gallery (swatches + moment + trade-offs) $\rightarrow$ Instant v1 baseline with animated v2 reveal. Keeps onboarding cohesive without extra navigation steps. — **Reversibility:** reversible
- **D-02:** Hybrid local WebP assets in `/public/swatches/` paired with festive tags, palette metadata, and SVG placeholder fallbacks. Guarantees fast, offline-safe operation and zero external network latency. — **Reversibility:** costly — asset storage and metadata registry contract
- **D-03:** Strict 6–8 selection counter with celebratory pill ('Pick 6 to 8 vibes (X/8 selected)') and quick preset filters (e.g. 'Royal Heritage', 'Garden Pastel', 'Minimalist Festive'). 'Continue' button enables only when 6 $\le$ count $\le$ 8. — **Reversibility:** reversible
- **D-04:** Two-step micro-wizard inside Vibe Intake: Step 3A (Pick 6–8 Swatches) $\rightarrow$ Step 3B (Protected Moment sentence input & 3 Forced-Choice Trade-offs: Feast/Spectacle, Intimate/Grand, Heritage/Modern). — **Reversibility:** reversible

### Style DNA Calibration & Planner Multipliers
- **D-05:** Comprehensive 8-axis profile: Formality, Energy, Scale, Heritage vs Modern, Feast vs Spectacle, Music, Decor Density, Indoor vs Outdoor (each bounded 0–100) + Named Palette (3–4 hues) + 1-sentence vibe statement. Matches PRD §3.2. — **Reversibility:** costly — impacts Zod schema and engine modulation contracts
- **D-06:** Clamping bounds of $\pm$25% (`[0.75x, 1.25x]` multiplier per category line): gives meaningful, noticeable festive leaning while preserving structural budget safety and preventing model distortion. — **Reversibility:** costly — arithmetic invariant contract
- **D-07:** Protected Moment mapping: Style Analyst maps sentence to closest budget line category + locks a 1.25x floor multiplier, tagging the line with the exact user quote and rose badge. — **Reversibility:** reversible
- **D-08:** Interactive Style DNA Card at the top of Pane 3 (Desktop) and Drawer (Mobile) with dimension pills, named palette swatches, and an 'Edit Style DNA' button that opens a slider sheet to retune values and recalculate. — **Reversibility:** reversible

### v2 Plan Reveal & Transition Choreography
- **D-09:** Two-beat reveal: Instant workspace arrival showing baseline v1 (<10ms), followed by a 1.2s smooth GSAP/Motion re-balance bar animation as Style DNA finishes, highlighting what shifted with zero blank wait screens. — **Reversibility:** reversible
- **D-10:** Highlighted v2 Change Banner + auto-updated ChangeExplainer in Pane 3 with plain-language rationale: 'Infused [Vibe Name]: Elevated Decor (+₹X) and Entertainment (+₹Y); Protected Moment held firm at floor.' — **Reversibility:** reversible
- **D-11:** Dedicated 'Reset to Baseline (v1)' action inside Style DNA card menu, plus standard 1-click forward restore in Version History. — **Reversibility:** reversible
- **D-12:** Full accessible motion: Spring physics on budget bars and counter numbers, with automatic zero-delay instant snaps when `prefers-reduced-motion` is active. — **Reversibility:** reversible

### Fallback Ladder & Calm Degradation
- **D-13:** 8-second timeout for Tier 1 (Gemma 4) with 1 immediate zero-temp schema-repair retry, escalating immediately to Gemini 2.0 Flash (Tier 2) before dropping to deterministic Tier 3. — **Reversibility:** costly — pipeline orchestrator architecture
- **D-14:** Calm reassuring note on Style DNA card when degrading to Tier 3: 'Showing standard style profile for now; your custom vibe will be infused when you retry' with a subtle 'Retry Extraction' button. Zero alarming error dialogs. — **Reversibility:** reversible
- **D-15:** Structured Run Records attached directly to plan_version metadata (`meta.run_record`: active_tier, duration_ms, model_id, fallback_reason) + structured JSON console logging. Transparent with zero extra migration table needed. — **Reversibility:** costly — version metadata schema contract
- **D-16:** Seamless local mock/heuristic: if no API key is present in environment, seamlessly execute Tier 3 deterministic extractor with a friendly dev console log. 100% testable out-of-the-box. — **Reversibility:** reversible

### the agent's Discretion
- Exact swatch filenames, titles, tags, and palette hex definitions in `/public/swatches/swatches.json`.
- Specific prompt wording for Style Analyst and Planner within Vercel AI SDK structured generation pipelines.
- Micro-interactions on swatch card selection (subtle gold ring, checkmark badge, and spring pop).
- Heuristic fallback scoring algorithm mapping swatch tags and trade-offs directly to the 8-dimension profile.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture Decision Records (ADRs)
- `docs/adr/0007-three-tier-agent-fallback-ladder.md` — Three-tier agent fallback ladder (Gemma 4 repair retry $\rightarrow$ Gemini Flash cloud escalation $\rightarrow$ static template fallback) with Run Records.
- `docs/adr/0009-curated-style-swatches-first.md` — Closed library of 24 curated Style Swatches for Vibe Intake eliminating photo upload latency and security risks.
- `docs/adr/0001-deterministic-baseline-first.md` — Deterministic baseline plan generation (<10ms) preceding model modulation.
- `docs/adr/0002-permissive-shortfall-with-remedies.md` — Integer paise arithmetic and shortfall invariants.
- `docs/adr/0004-idea-displacement-with-protected-immunity.md` — Protected Moment immunity and elastic donor line displacement.
- `docs/adr/0006-dual-link-anonymous-capability-model.md` — Immutable version history snapshots and dual-link capability model.
- `docs/adr/0008-closed-registry-entity-id-binding.md` — Pure model weights/labels; engine owns all numbers and dates.

### Specifications & PRD
- `PRD.md` §3.2 — Style DNA structured profile dimensions, safeguards (no identity inference), and editable card.
- `PRD.md` §3.3 — Protected Moment definition and elevation.
- `PRD.md` §4.1 — Vibe intake workflow (swatches, moment, trade-offs) and plan reveal sequence.
- `PRD.md` §9.4 — Multi-agent pipeline specifications (Style Analyst, Planner, Explainer) and prompt contracts.
- `PRD.md` §10.2 — Initial allocation formula: base weights $\times$ bounded multipliers $\rightarrow$ guest scaling $\rightarrow$ protected floor $\rightarrow$ largest-remainder paise.
- `PRD.md` §11 — Animation & choreography (plan reveal, re-balance bar animation, Style DNA assembly).
- `DESIGN.md` — 3-hue palette discipline, typography, and WCAG AAA contrast guidelines.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/engine/budget.ts`: Pure TypeScript budget calculation engine (`rebalanceBudget`, `calculateBaselineBudget`, largest-remainder paise allocation).
- `src/lib/engine/timeline.ts`: Pure TypeScript timeline scheduler (`scheduleMilestones`, compressed mode triage).
- `src/lib/engine/diff.ts`: Plain-language deterministic diff generator comparing `v(N-1)` vs `v(N)`.
- `src/lib/engine/types.ts`: Core data structures (`BudgetLine`, `TimelineMilestone`, `PlanSnapshot`, `EventBrief`).
- `src/components/intake/BriefModal.tsx`: Existing 3-step brief intake modal (`StepEventBasics`, `StepNuances`, `StepScaleBudget`), ready to extend with Step 3A & Step 3B.
- `src/components/workspace/ChangeExplainer.tsx`: Change Explainer UI component with version history cards and undo restore handlers.
- `src/components/workspace/BudgetLineCard.tsx`: Individual budget line card with animated bars and Protected Moment badge.
- `src/components/workspace/WorkspaceShell.tsx`: Responsive 3-pane desktop workspace and 4-tab mobile drawer navigation.

### Established Patterns
- Pure functional engine separation: calculation logic strictly lives in `src/lib/engine/` and UI strictly consumes immutable snapshots.
- Integer paise monetary amounts with largest-remainder apportionment at rupee display boundaries.
- Words from models, numbers from code: agents output weights, labels, and explanations; engine converts them into exact figures.

### Integration Points
- `src/lib/ai/`: Agent schemas and orchestrator pipeline (Style Analyst, Planner, Fallback Ladder).
- `src/data/swatches.json`: 24 curated swatches registry with local image paths, tags, and aesthetic profiles.
- `public/swatches/`: Local WebP swatch visual assets and SVGs.
- `src/components/intake/StepVibeSwatches.tsx` & `src/components/intake/StepVibeTradeoffs.tsx`: Intake wizard steps.
- `src/components/workspace/StyleDNACard.tsx`: Interactive Style DNA display and retune sheet in Pane 3 / Mobile Drawer.
- `src/lib/engine/style.ts`: Style DNA dimension mapping and bounded weight modulation engine.

</code_context>
