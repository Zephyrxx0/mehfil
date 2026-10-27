# Mehfil (महफ़िल)

## What This Is

Mehfil (महफ़िल) is an intelligent, interconnected planning workspace for milestone celebrations (weddings, milestone birthdays, cultural gatherings) where budget, timeline, vendors, and personalized ideas form a single mathematically linked plan. When an organizer changes guest count, dates, or vendor quotes, the entire plan re-balances dynamically with visible plain-language explanations and one-click undo. Built for non-technical family organizers and community volunteers who need reassurance and financial precision rather than complex spreadsheets or generic chatbot advice.

## Core Value

Words from models, numbers from code: the planning engine guarantees mathematical consistency, immutable versioned re-balancing, and protected floors across budget and timeline, ensuring a family's celebration budget can never be distorted by model arithmetic errors or prompt injection.

## Business Context

- **Customer**: Non-technical family organizers (weddings, milestone birthdays) and community volunteers (societies, colleges, cultural gatherings).
- **Revenue model**: Open-source virtual challenge project / potential premium planning tier; zero-friction anonymous onboarding without paywalls.
- **Success metric**: 100% mathematical consistency (all lines sum to budget in integer paise), sub-second live re-balancing, and zero-failure demo degradation.
- **Strategy notes**: Prompt Wars Virtual Challenge 5: Celebration & Event Planner (7-day build).

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **Event Intake & Baseline Generation**: Prompt-free brief intake (type, date, city, guest count, total budget in ₹) instantly creating an immutable v1 Linked Plan from deterministic template archetypes (ADR-0001).
- [ ] **Vibe Intake & Style DNA Extraction**: Curated gallery of 24 licensed Style Swatches, single-line Protected Moment definition, and three forced-choice trade-offs yielding structured Style DNA via vision extraction (ADR-0009).
- [ ] **Linked Planning Engine**: Pure TypeScript budget and backwards-scheduled timeline engine with largest-remainder paise arithmetic, elasticity-based downward re-balancing, and topological critical path scheduling (ADR-0002, ADR-0005).
- [ ] **Protected Moment Floor**: Inviolable budget floor guarantee ensuring the organizer's signature moment can never be trimmed during automatic re-balancing or idea displacement (ADR-0004).
- [ ] **Quote Check & Quarantine**: Tool-less, prompt-quarantined extraction of vendor quotes (PDF, text, OCR) with verbatim source phrase verification, omission flagging, and interactive tier selection before budget commitment (ADR-0003).
- [ ] **Personalized Idea Curation**: Dynamic idea catalog proposing bespoke enhancements that actively mutate the plan via budget-neutral displacement of elastic lines (ADR-0004).
- [ ] **Cross-Device Dual-Link Capability**: Anonymous Supabase sessions with high-entropy Organizer Edit Keys for accountless continuation and sanitized Family Share Links for read-only collaboration (ADR-0006).
- [ ] **Closed Registry Generative UI**: Generative UI layout selection constrained to allowlisted shadcn/ui components with entity ID binding and zero numeric or temporal model output (ADR-0008).
- [ ] **Three-Tier Fallback Ladder**: Zero-failure resilience ladder (Gemma 4 repair retry -> Gemini Flash cloud escalation -> static template fallback) with calm user degradation (ADR-0007).
- [ ] **Festive Soft Design System**: Restrained 3-hue palette (Warm Ivory `#FFF8EE`, Marigold `#F7C873`, Gulabi Rose `#F2A7B8`) anchored by Royal Plum ink (`#3A2442`) with kinetic Fraunces typography and shadcn/ui primitives.

### Out of Scope

- **Direct In-App Booking & Payments**: Out of scope for 7-day build; Mehfil is a planning and decision engine, not a payment gateway.
- **Open-Ended Vendor Marketplace**: Out of scope; local candidates are surfaced via Places API adapters with place IDs rather than managing vendor portals.
- **User Accounts & Password Authentication**: Intentionally omitted to eliminate onboarding drop-off; replaced by Supabase anonymous sessions and cryptographically unguessable Edit Key capability URLs.
- **Direct Vendor Messaging**: Out of scope; Negotiation Drafter generates copy-paste counter-offers for WhatsApp/email rather than in-app chat.
- **Multi-User Real-Time CRDT Collaboration**: Out of scope; family collaboration is handled cleanly via versioned read-only Family Share Links.
- **Dark Mode**: Explicitly omitted to preserve the warm, festive cotton-paper invitation aesthetic.

## Context

- **Foundational Documents**: Built strictly to the specifications in `PRD.md`, the design tokens in `DESIGN.md`, the domain glossary in `CONTEXT.md`, and architectural decisions in `docs/adr/0001` through `0009`.
- **Target Audience**: Mobile-first family organizers under high emotional stress and logistical overwhelm who need calm clarity and trustworthy calculations.
- **Technical Environment**: Next.js App Router on Vercel, Supabase (Postgres with Row-Level Security), Vercel AI SDK with Google Gemma 4 and Gemini Flash providers, Tailwind CSS, shadcn/ui, Motion, GSAP, and Lenis.

## Constraints

- **Arithmetic Ownership**: Pure code owns all figures and dates. Models are structurally banned from generating monetary amounts or dates.
- **Currency & Precision**: All financial amounts are stored and calculated as integers in paise (`INR`), avoiding any floating-point rounding errors.
- **Palette Discipline**: Maximum 3 pastel hues (Ivory, Marigold, Rose) with Plum ink; pastels are fills only, never text; WCAG AAA 4.5:1+ contrast mandatory.
- **Timeline Limits**: 7-day build cycle for virtual competition; strict P0 prioritization with Day-1 gates.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Deterministic Baseline First (ADR-0001) | Eliminates blank loading screens; guarantees instant FCP and total resilience against model downtime | ✓ Good |
| Permissive Shortfall State (ADR-0002) | Real quotes exceed budgets; presenting 3 deterministic calculation remedies builds trust over blocking user input | ✓ Good |
| Quote Quarantine & Evidence Rule (ADR-0003) | Untrusted vendor text cannot execute prompt injection; all figures require verbatim source phrases | ✓ Good |
| Budget-Neutral Idea Displacement (ADR-0004) | Personalization must move numbers without budget inflation; Protected Moment remains immune | ✓ Good |
| Compressed Mode Timeline Triage (ADR-0005) | Short-notice events sort by topological critical path rather than displaying 25 overdue warnings | ✓ Good |
| Dual-Link Anonymous Capability Model (ADR-0006) | Zero login friction with cross-device edit resumption and sanitized family share views | ✓ Good |
| Three-Tier Agent Fallback Ladder (ADR-0007) | Gemma 4 repair -> Gemini Flash -> deterministic template guarantees 100% demo uptime | ✓ Good |
| Closed Registry Entity ID Binding (ADR-0008) | Models select layouts only; components resolve authoritative figures directly from engine | ✓ Good |
| Curated Style Swatches for Vibe Intake (ADR-0009) | Eliminates upload latency, virus scans, and privacy liability during 7-day build | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-27 after initialization*

