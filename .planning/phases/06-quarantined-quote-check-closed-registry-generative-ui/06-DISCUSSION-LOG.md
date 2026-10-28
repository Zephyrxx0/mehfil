# Phase 6: Quarantined Quote Check & Closed Registry Generative UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-28
**Phase:** 06-quarantined-quote-check-closed-registry-generative-ui
**Areas discussed:** Quote Intake & OCR Ingestion Flow, Verbatim Evidence Guard & Omission Detection, Tier Selection, Plan Re-Balance Preview & Commitment, Closed Registry Generative UI Architecture & Layouts

---

## Quote Intake & OCR Ingestion Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Contextual entry on BudgetLineCard + Unified Quote Sheet | Clicking 'Check Quote' on any budget line opens a slide-over sheet with that category pre-selected, while also allowing switching or viewing past quotes. | ✓ |
| Dedicated standalone 'Quotes' tab in WorkspaceShell | A new top-level tab alongside Budget, Timeline, and Curated Ideas dedicated entirely to vendor quotes and negotiation. | |
| Modal Dialog triggered exclusively from BudgetLineCard | A lightweight focused dialog tied strictly to that single line with no top-level tab. | |

**User's choice:** Contextual entry on BudgetLineCard + Unified Quote Sheet

---

| Option | Description | Selected |
|--------|-------------|----------|
| Dual input (Pasted text & Image upload) via AI SDK Multimodal + Sample starter quotes | User can paste text (WhatsApp/emails) or drop an image (JPEG/PNG/WebP processed via Gemini vision), with instant pre-loaded sample quotes for 1-click testing. | ✓ |
| Pasted text only with sample quotes | Focus exclusively on raw text pasting (WhatsApp/email copy-paste) to eliminate image payload latency, with sample quotes available. | |
| Client-side OCR with fallback | Run browser-side OCR (Tesseract.js) to convert images into text before passing pure text to the Quote Analyst. | |

**User's choice:** Dual input (Pasted text & Image upload) via AI SDK Multimodal + Sample starter quotes

---

| Option | Description | Selected |
|--------|-------------|----------|
| XML-Quarantined System Prompt + Vercel AI SDK generateObject (Tool-less) | Quote text is wrapped in `<untrusted_vendor_quote>` tags, system instructions explicitly forbid instruction execution, zero tools are bound, and output is strictly coerced to Zod QuoteExtractionSchema. | ✓ |
| Two-stage pipeline (Sanitizer + Extractor) | First pass strips prompt injection keywords, script tags, and markdown formatting, second pass extracts structured pricing. | |
| Heuristic regex-first extraction with LLM fallback | Attempt regex-based currency/tier pattern extraction first, and only call Quote Analyst if regex fails. | |

**User's choice:** XML-Quarantined System Prompt + Vercel AI SDK generateObject (Tool-less)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Normalized PackageTier Schema with code-computed totals | Quote Analyst extracts tier name, items, pricing type ('flat' vs 'per_guest'), stated rate, and verbatim source anchor. Pure TS engine computes integer paise total (scaling per-guest by plan's guest count). | ✓ |
| Model-computed total with text anchor | Model extracts the pre-summed total directly from the quote text and rejects quotes that do not explicitly state a final total. | |
| Single selected package with manual tier switch | Model extracts whatever package is highlighted or listed first as default, with a dropdown to view alternate raw paragraphs. | |

**User's choice:** Normalized PackageTier Schema with code-computed totals

---

## Verbatim Evidence Guard & Omission Detection

| Option | Description | Selected |
|--------|-------------|----------|
| Two-Phase Verbatim Anchor Guard | Model must provide sourceAnchor (exact snippet e.g. 'Rs 1,50,000/-'). Pure TS guard verifies snippet is a verbatim substring of raw quote AND regex-parses the number from that snippet. If unanchored or mismatched, the item is dropped with a warning. | ✓ |
| Strict Character-for-Character Exact Match | Extracted numeric string must literally appear character-by-character in the raw text without currency symbol or comma stripping. | |
| Fuzzy Levenshtein matching with user warning | If verbatim substring fails due to OCR character glitches (e.g. 'O' for '0'), flag with amber alert asking user to verify before accepting. | |

**User's choice:** Two-Phase Verbatim Anchor Guard

---

| Option | Description | Selected |
|--------|-------------|----------|
| Pure TS Category Rules Engine + Interactive Omission Adders | Code scans quote text for inclusion keywords ('GST included', 'taxes extra'). Missing items surface as interactive toggle chips (e.g. '+18% GST estimate', 'Generator ₹15,000') that dynamically recompute the tier total before commitment. | ✓ |
| Model-driven omission extraction with manual number entry | The Quote Analyst outputs what appears to be missing based on context, and the organizer manually enters any expected add-on rupees. | |
| Static advisory checklist | Render an informational warning banner listing common unstated fees for that category, without adding them to the quote math. | |

**User's choice:** Pure TS Category Rules Engine + Interactive Omission Adders

---

| Option | Description | Selected |
|--------|-------------|----------|
| Interactive Inline Source Pills + View Raw Quote drawer/tab | Each extracted item features a 'Source: "..."' badge in Marigold pill. Clicking opens or scrolls to the exact highlighted phrase in the original quote text. | ✓ |
| Side-by-side Dual Pane (Desktop) / Toggle (Mobile) | Left pane displays raw quote with glowing yellow text highlights, right pane displays interactive tier card. | |
| Minimalist Info Tooltip | Subtle source icon next to each number showing the verbatim phrase on hover/tap. | |

**User's choice:** Interactive Inline Source Pills + View Raw Quote drawer/tab

---

| Option | Description | Selected |
|--------|-------------|----------|
| Transparent Dropped Items Pill + Manual Add | Strip unanchored figures from the tier calculation, but display a calm amber alert: '1 figure excluded (could not verify in source text: ₹45,000)' with a one-click 'Add manually' option. | ✓ |
| Strict Hard Block | If any number fails the Verbatim Evidence Rule, reject the extraction entirely and ask the user to re-paste cleaner text. | |
| Silent Discard | Silently drop unanchored numbers without showing an alert to keep the interface uncluttered. | |

**User's choice:** Transparent Dropped Items Pill + Manual Add

---

## Tier Selection, Plan Re-Balance Preview & Commitment

| Option | Description | Selected |
|--------|-------------|----------|
| Real-Time Plan Impact Preview | Selecting any tier or toggling omission adders instantly computes a live preview diff showing exactly which donor lines absorb the delta (or if Permissive Shortfall triggers), with surplus/deficit badges before committing. | ✓ |
| Step-by-step 'Preview Impact' Modal | User selects a tier, clicks 'Preview Plan Re-balance', sees a modal summarizing deltas, and confirms commitment from there. | |
| Immediate commit without preview | Clicking a tier commits immediately and user uses the Undo bar if unsatisfied. | |

**User's choice:** Real-Time Plan Impact Preview

---

| Option | Description | Selected |
|--------|-------------|----------|
| Locked Line with Variance Badge & Re-open action | BudgetLineCard displays a 'Committed' badge with vendor name, locks currentPaise at actuals, shows budget-vs-actual variance (e.g. 'Saved ₹25,000' or '+₹15,000'), and provides an 'Unlock / Replace Quote' action. | ✓ |
| Permanent Immutable Lock | The line is strictly frozen at actuals with no unlock option; user must use Undo History to roll back. | |
| Uncommitted soft reference | The quote is attached as a reference document, but the line remains elastic and does not freeze its current amount. | |

**User's choice:** Locked Line with Variance Badge & Re-open action

---

| Option | Description | Selected |
|--------|-------------|----------|
| Automatic primary task completion with celebratory toast | Engine auto-resolves the primary booking task for that category (e.g. 'Book Venue & Finalize Contract'), sets isCompleted: true, links quoteId, and triggers celebration micro-feedback. | ✓ |
| Interactive Task Confirmation Checklist | During quote commitment, display matching timeline tasks for that category and let user confirm which ones are completed. | |
| Manual task checking only | Budget line commits, but user manually checks off the timeline task on the Timeline tab. | |

**User's choice:** Automatic primary task completion with celebratory toast

---

| Option | Description | Selected |
|--------|-------------|----------|
| Automatic Elastic Displacement + Permissive Shortfall fallback | Engine displaces the delta from flexible lines in elasticity order (Misc -> Entertainment -> Decor), respecting Protected Moment immunity. If capacity runs out, plan enters Permissive Shortfall with the 3 calculation remedies. | ✓ |
| Manual donor line picker | Prompt user to select exactly which donor lines should fund the quote's excess before allowing commitment. | |
| Strict Over-Budget Prevention | Block committing any quote higher than the line's current allocation until the user explicitly raises total budget. | |

**User's choice:** Automatic Elastic Displacement + Permissive Shortfall fallback

---

## Closed Registry Generative UI Architecture & Layouts

| Option | Description | Selected |
|--------|-------------|----------|
| Strict Section Descriptor with Entity ID Resolution | Model selects componentName ('VendorChecklist' \| 'IdeaGrid' \| 'QuoteReport' \| 'ScenarioComparison'), layoutVariant ('compact' \| 'detailed' \| 'side_by_side'), and entityIds array. The registry component resolves all amounts, titles, and dates directly from the live Plan state. | ✓ |
| Block Template Registry | Model selects from predefined holistic dashboard templates (e.g. 'VendorNegotiationView', 'BigDecisionComparison') which pre-wire fixed slots with entity IDs. | |
| Slot-based UI DSL | Model outputs an allowlisted component tree with child slots, where each slot accepts only entity ID reference objects. | |

**User's choice:** Strict Section Descriptor with Entity ID Resolution

---

| Option | Description | Selected |
|--------|-------------|----------|
| Contextual Smart Inspector & Scenario Sheet | Triggered during quote evaluation, multi-vendor comparison, or plan scenario checks, sliding in or embedding as a dedicated high-fidelity view with editorial guidance. | ✓ |
| Full-Screen 'Curated Perspective' View Mode | A toggle in the top bar to switch the entire workspace between standard 3-pane view and AI-curated Generative UI dashboard. | |
| Embedded Dynamic Feed Cards | Generative UI cards appear as dismissable insights directly inside the Budget and Timeline tab feeds. | |

**User's choice:** Contextual Smart Inspector & Scenario Sheet

---

| Option | Description | Selected |
|--------|-------------|----------|
| Seamless 3-Tier Fallback to Static Registry Template | If Gemma 4 fails repair retry and Gemini Flash escalation times out, render deterministic static registry template with all relevant entity IDs and a subtle toast ('Viewing standard comparison layout'). Zero blank screen. | ✓ |
| Strict Error State with Retry Button | Show a card with 'Could not generate custom layout' and a manual 'Retry Generation' button. | |
| Silent Fallback without Toast | Fall back directly to the default static template without any notification to the user. | |

**User's choice:** Seamless 3-Tier Fallback to Static Registry Template

---

| Option | Description | Selected |
|--------|-------------|----------|
| Fully Interactive Living Components | Components support live interaction (toggling omission chips, switching scenario tiers, one-click quote commitment) with immediate dispatch to the plan engine. | ✓ |
| Read-Only Editorial Presentation with 'Apply' Button | The components render read-only comparison views; a single 'Apply This Scenario' button executes the changes atomically. | |
| Summary Cards with Deep Links | Components show read-only summaries with links that jump the user to the relevant budget line or idea card to perform actions. | |

**User's choice:** Fully Interactive Living Components

---

## the agent's Discretion

- Micro-interactions, spring transitions, and celebration particle bursts during quote commit following `DESIGN.md`.
- Category-specific default omission rates (18% GST on services, 5% on catering, ₹15,000 on generator backups for outdoor lawns, ₹10,000 overtime on DJs).
- Sample quote fixtures for instant demo testing (Catering, Venue, Decor, Photo/Film).

## Deferred Ideas

- None noted during this discussion. All scope remains tightly anchored to Phase 6 requirements.

