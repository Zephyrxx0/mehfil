# Phase 6: Quarantined Quote Check & Closed Registry Generative UI - Context

**Gathered:** 2026-10-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 delivers Mehfil's untrusted quote ingestion pipeline, prompt quarantine sandbox, and closed-registry Generative UI architecture:
1. **Tool-less Quote Ingestion & Prompt Quarantine (QUOTE-01, QUOTE-02, ADR-0003):** Dual input (pasted text & multimodal image upload) with XML-quarantined prompt isolation, zero tool access, zero database write authority, and structured output extraction conforming to `QuoteExtractionSchema`.
2. **Numeric Guard & Category Omission Engine (QUOTE-03, QUOTE-04):** Two-phase Verbatim Evidence Rule enforcing exact source text substring anchors for all numeric amounts (dropping unanchored figures with calm amber transparency), coupled with a pure TypeScript category omission engine detecting unstated costs (GST 18%, generator backup, overtime fees, corkage/staff) as interactive re-calculating add-on chips.
3. **Interactive Quote Check & Plan Commitment (QUOTE-05, QUOTE-06):** Interactive Quote Check card with real-time plan impact preview (showing live donor line displacement or Permissive Shortfall remedies before commitment), committing actuals to lock the budget line with variance indicators, and automatically completing associated timeline booking tasks with celebratory feedback.
4. **Closed Registry Generative UI with Entity ID Binding (GENUI-01, GENUI-02, GENUI-03, ADR-0008, ADR-0007):** Allowlisted shadcn/ui components (`VendorChecklist`, `IdeaGrid`, `QuoteReport`, `ScenarioComparison`) taking strictly entity IDs (`lineId`, `quoteId`, `ideaId`) with zero model-generated figures/dates, living interactive dispatches, contextual Smart Inspector sheet integration, and seamless 3-tier fallback to deterministic static templates.

Out of scope: Open vendor marketplace portal, direct payments/escrow, direct vendor messaging (WhatsApp business API).
</domain>

<decisions>
## Implementation Decisions

### Quote Intake & OCR Ingestion Flow (QUOTE-01, QUOTE-02, ADR-0003)
- **D-01: Contextual Entry on BudgetLineCard + Unified Quote Sheet.** Clicking "Check Quote" on any budget line opens a slide-over sheet with that line's category pre-selected, while also allowing switching categories or reviewing past ingested quotes.
- **D-02: Dual Input (Pasted Text & Image Upload) + Instant Sample Starter Quotes.** Supports both raw unstructured text paste (WhatsApp/email quotes) and image/screenshot drop (JPEG/PNG/WebP processed via Gemini vision), along with pre-loaded realistic Indian celebration sample quotes for 1-click testing.
- **D-03: XML-Quarantined System Prompt & Tool-less Execution.** Raw quote text is enclosed within `<untrusted_vendor_quote>` tags. System instructions explicitly forbid executing user instructions embedded in vendor text. The AI SDK invocation binds zero tools (`tools: {}`) and strictly coerces output via `generateObject` with Zod schema.
- **D-04: Normalized PackageTier Schema with Pure Code Arithmetic.** The Quote Analyst extracts package tiers, line items, pricing types (`flat` vs `per_guest`), stated rates, and verbatim source anchors. The pure TypeScript engine computes total integer paise (scaling per-guest lines by `plan.brief.guestCount`).

### Verbatim Evidence Guard & Omission Detection (QUOTE-03, QUOTE-04)
- **D-05: Two-Phase Verbatim Anchor Guard.** Every numeric figure extracted by the model must supply a `sourceAnchor` (verbatim snippet from quote, e.g. "Rs 1,50,000/-"). The pure TS guard verifies that the snippet exists verbatim as a case-insensitive substring in the raw quote text, AND that the numeric value inside parses to the extracted amount.
- **D-06: Pure TS Category Rules Engine + Interactive Omission Adders.** Pure code rules evaluate quote text against category-specific inclusion keywords (e.g. "GST included", "taxes extra", "generator included"). Omitted costs surface as interactive toggle chips (e.g. `+18% GST estimate`, `Generator ₹15,000`) that dynamically recalculate the tier total in real time before commitment.
- **D-07: Interactive Inline Source Pills + View Raw Quote Drawer.** Each extracted line item displays a "Source: '...'" Marigold badge pill. Clicking it opens or scrolls to the exact highlighted phrase in the original quote text.
- **D-08: Transparent Dropped Items Pill with Manual Entry Fallback.** Any unanchored or unverified figures extracted by the model are stripped from the tier total, but displayed in a calm amber alert pill (`1 figure excluded: ₹45,000 (no source text match)`) with a 1-click "Add manually" option.

### Tier Selection, Plan Re-Balance Preview & Commitment (QUOTE-05, QUOTE-06)
- **D-09: Real-Time Plan Impact Preview.** Toggling between tiers or clicking omission adders dynamically computes and renders a live preview diff bar showing exactly which flexible donor lines will be trimmed (in elasticity order), or whether Permissive Shortfall will be triggered, before the user commits.
- **D-10: Locked Line with Variance Badge & Re-open Action.** Committing a quote locks `currentPaise` at actuals, sets `isCommitted: true`, displays a Marigold "Committed" badge with vendor name, visualizes budget-vs-actual variance (e.g. "Saved ₹25,000" or "+₹15,000 actual"), and provides an "Unlock / Replace Quote" action.
- **D-11: Automatic Primary Task Completion with Celebratory Toast.** Committing a quote auto-resolves the primary booking task for that category (e.g. "Book Venue & Finalize Contract"), sets `isCompleted: true`, links the `quoteId`, and triggers celebration micro-feedback.
- **D-12: Automatic Elastic Displacement + Permissive Shortfall Fallback.** When an accepted quote exceeds the line's allocation, the excess delta is funded by displacing flexible lines in elasticity order (Misc -> Entertainment -> Decor), respecting Protected Moment immunity. If capacity runs out, the plan smoothly transitions into Permissive Shortfall with the 3 calculation remedies.

### Closed Registry Generative UI Architecture & Layouts (GENUI-01, GENUI-02, GENUI-03, ADR-0008)
- **D-13: Strict Section Descriptor with Entity ID Resolution.** The model selects from an allowlisted component enum (`VendorChecklist`, `IdeaGrid`, `QuoteReport`, `ScenarioComparison`), specifies a `layoutVariant` (`compact` | `detailed` | `side_by_side`), and provides an `entityIds` array (`lineIds`, `quoteIds`, `ideaIds`). The client components resolve all figures, titles, and dates directly from live Plan context.
- **D-14: Contextual Smart Inspector & Scenario Sheet.** Generative UI is presented within a slide-over Smart Inspector / Scenario Sheet (or during quote evaluations and multi-vendor comparisons), offering editorial guidance alongside structured comparisons.
- **D-15: Seamless 3-Tier Fallback to Static Registry Template.** If the model fails schema validation (or repair retry / escalation times out), the system falls back to a deterministic static template populated with active entity IDs and displays a subtle toast ("Viewing standard comparison layout"), ensuring 0% blank screen rate.
- **D-16: Fully Interactive Living Components.** Generative UI components support live user interaction (toggling omission chips, switching comparison tiers, committing quotes) with immediate dispatch into the reactive plan engine.

### the agent's Discretion
- Micro-interactions, spring transitions, and celebration particle bursts during quote commit following `DESIGN.md`.
- Category-specific default omission rates (18% GST on services, 5% on catering, ₹15,000 on generator backups for outdoor lawns, ₹10,000 overtime on DJs).
- Sample quote fixtures for instant demo testing (Catering, Venue, Decor, Photo/Film).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture Decision Records
- `docs/adr/0003-quote-quarantine-and-interactive-verification.md` — Zero-authority Quote Analyst, Verbatim Evidence Rule, and interactive tier gate.
- `docs/adr/0008-closed-registry-entity-id-binding.md` — Allowlisted shadcn/ui components, Entity ID Binding, and zero model-written figures/dates.
- `docs/adr/0001-deterministic-baseline-first.md` — Integer paise arithmetic, models structurally banned from numbers.
- `docs/adr/0002-permissive-shortfall-with-remedies.md` — Infeasible state and 3 deterministic calculation remedies.
- `docs/adr/0004-idea-displacement-with-protected-immunity.md` — Protected Moment immunity and elastic line displacement.
- `docs/adr/0007-three-tier-agent-fallback-ladder.md` — Zero-failure demo resilience ladder.

### Specifications & Design System
- `DESIGN.md` — 3-hue festive palette (Warm Ivory, Marigold, Gulabi Rose with Royal Plum ink), micro-haptics, WCAG AAA contrast.
- `PRD.md` §3.5 & §3.6 — Quote check contracts, unstated cost rules, and Generative UI registry.
- `.planning/REQUIREMENTS.md` — QUOTE-01 through QUOTE-06, GENUI-01 through GENUI-03.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/ai/schemas.ts`: Contains existing Zod schemas (`StyleDNASchema`, `PlannerModulationSchema`, `AgentRunRecordSchema`). Needs extension for `QuoteExtractionSchema`, `PackageTierSchema`, and `GenerativeUILayoutSchema`.
- `src/lib/ai/orchestrator.ts`: Contains the 3-tier fallback ladder (`runWithFallback`). Can be extended for `runQuoteAnalyst` and `runGenerativeUILayout`.
- `src/lib/engine/budget.ts`: Contains `rebalanceGuestCount`, `adoptIdea`, `retractIdea`, `calculateShortfallRemedies`. Needs extension for `commitQuote`, `unlockQuote`, and quote-driven elastic displacement.
- `src/lib/engine/timeline.ts`: Contains `calculateBackwardsTimeline`, `TimelineTask`, and milestone bands. Needs utility to mark task completed and link `quoteId`.
- `src/components/workspace/BudgetLineCard.tsx`: Displays line allocations, Protected Moment highlights, and donor badges. Needs "Check Quote" trigger button, committed status badge, variance pill, and re-open action.
- `src/components/workspace/WorkspaceShell.tsx`: Coordinates tabs and drawers. Needs integration for the Unified Quote Sheet and Smart Inspector / Scenario Sheet.

### Established Patterns
- All financial calculations are pure integer paise (`Paise` type) in `src/lib/engine/currency.ts` and `budget.ts`.
- Models are strictly banned from generating money figures; numbers come from code.
- Prompt injection protection via XML encapsulation and zero tool binding.

### Integration Points
- `src/lib/engine/types.ts`: Define domain types for `VendorQuote`, `PackageTier`, `ExtractedQuoteItem`, `QuoteOmissionAdder`, `GenerativeUILayout`.
- `src/lib/ai/quote-analyst.ts`: New module executing the tool-less, prompt-quarantined extraction via Vercel AI SDK.
- `src/lib/engine/quote-guard.ts`: Pure TS Numeric Guard validating verbatim substring anchors and category omission rules.
- `src/components/quotes/`: Directory for `QuoteIntakeSheet`, `QuoteCheckCard`, and the 4 Generative UI components (`VendorChecklist`, `IdeaGrid`, `QuoteReport`, `ScenarioComparison`).
</code_context>

<specifics>
## Specific Ideas

- Realistic festive sample quotes for 1-click testing:
  1. *Royal Caterers Wedding Thali package* (3-course vegetarian, ₹950/plate, unstated 5% GST & service charge).
  2. *Shadi Mandap & Floral Decor quote* (Entrance arch + Mandap stage ₹1,80,000, unstated generator backup).
  3. *Cinematic Wedding Film & Photography* (Tiers: Classic ₹1,20,000, Drone + Teaser ₹2,10,000, unstated travel/stay).
- Inline verbatim text highlighting with Marigold badge pills and smooth scroll to source excerpt in raw quote drawer.
- Celebratory particle blast when committing quote and booking milestone.
</specifics>

<deferred>
## Deferred Ideas

- None — discussion strictly remained within Phase 6 scope.
</deferred>

---

*Phase: 06-quarantined-quote-check-closed-registry-generative-ui*
*Context gathered: 2026-10-28*

