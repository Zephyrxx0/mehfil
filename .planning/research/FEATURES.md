# Feature Research

**Domain:** AI-Augmented Celebration & Milestone Event Planning Engine  
**Researched:** 2026-10-27  
**Confidence:** HIGH  

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Template Archetypes** | Weddings, birthdays, and community events need tailored starting lines. | LOW | Hardcoded in engine: base weights, floors, elasticity, and task templates. |
| **Budget Breakdown Table** | Users need to see categorized allocations (Venue, Catering, Decor, Photography). | MEDIUM | Rendered in Warm Ivory, Plum text, with Marigold progress bars. |
| **Backwards Timeline Calendar** | Organizers book backwards from the event date, not forward from today. | MEDIUM | Topological sort on task lead times with date risk markers. |
| **Vendor Shortlist / Checklist** | Questions to ask vendors per category (caterer tasting rules, power backup). | LOW | Model selects emphasis from closed question bank based on Style DNA. |
| **Exportable Schedule & Budget** | Organizers need to share or print plans outside the web app. | LOW | Standard `.ics` local calendar export and CSV/JSON downloads without external APIs. |

### Differentiators (Competitive Advantage)

Features that set Mehfil apart from generic checklist tools and AI chatbots.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Linked Engine Re-Balancing** | Changing guest count or budget re-balances lines live without breaking floors. | HIGH | Pure TypeScript deterministic solver; largest-remainder paise allocation. |
| **Protected Moment Guarantee** | The one non-negotiable family experience has a hard floor immune to budget trimming. | MEDIUM | Immutable floor logic enforced in `engine/budget.ts` (ADR-0004). |
| **Prompt-Quarantined Quote Check** | Parses messy WhatsApp/PDF vendor quotes with verbatim source highlighting and omission flags. | HIGH | Tool-less Quote Analyst model + interactive tier selection before committing (ADR-0003). |
| **Budget-Neutral Idea Displacement** | Ideas actively displace elastic lines instead of inflating the budget or sitting as passive pins. | MEDIUM | Calculates exact funding trade-offs across flexible categories (ADR-0004). |
| **Compressed Mode Scheduling** | Late short-notice events display a calm 'Immediate Triage' list rather than 25 red alerts. | MEDIUM | Dependency-weighted critical path filtering (ADR-0005). |
| **Zero-Login Dual-Link Collaboration** | Instant anonymous start with private Organizer Edit Key and sanitized Family Share Link. | MEDIUM | Supabase RLS policies + hashed public tokens (ADR-0006). |
| **Festive Soft Aesthetics** | Invitation-inspired warm ivory/marigold/rose UI with kinetic Fraunces typography. | MEDIUM | Codified in `DESIGN.md`; zero SaaS dark-mode or generic blue slop. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good on the surface but destroy core value or project velocity.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **In-App Direct Payments / Deposits** | Users ask to pay vendors directly. | Massive legal liability, escrow regulations, payment gateway overhead, out of scope for 7-day build. | Negotiation Drafter generates WhatsApp/email counter-offers and payment milestone tasks. |
| **Full Vendor Marketplace** | Users want to browse a directory of thousands of vendors. | Creating chicken-and-egg cold start marketplace ruins the product scope; stale reviews. | Use Google Places API adapter to fetch real nearby candidates dynamically (PRD Section 11.1). |
| **Free-Form Chatbot with Code Exec** | Users want to ask arbitrary questions. | Vulnerable to prompt injection, hallucinated numbers, and layout breaking. | Closed Registry Generative UI where models select allowlisted components by entity ID (ADR-0008). |
| **Arbitrary Multi-File Image Upload** | Users want to upload phone camera rolls. | Privacy liabilities, virus scanning, upload failures on mobile data. | Curated 24-swatch aesthetic gallery for instant onboarding (ADR-0009). |

## Feature Dependencies

```
[Event Brief & Template Baseline (v1)]
    └──requires──> [Pure Arithmetic Budget Engine]
    └──requires──> [Topological Timeline Engine]

[Style DNA Extraction (Vision)]
    └──requires──> [Curated 24 Style Swatches]
    └──modulates──> [Planner Budget Weights (v2)]
    └──enriches──> [Vendor Checklist & Ideas]

[Quote Check & Quarantine]
    └──requires──> [Tool-less Quote Analyst]
    └──mutates──> [Committed Line Amounts]
    └──triggers──> [Live Re-Balancing Solver]

[Idea Adoption]
    └──requires──> [Idea Curator Schema]
    └──triggers──> [Budget-Neutral Displacement]
    └──respects──> [Protected Moment Floor]
```

## MVP Definition (v1 Launch Scope)

Minimum viable product for Prompt Wars Challenge 5 submission:

- [ ] **Event Intake**: Brief modal capturing type, date, city, guests, budget $\rightarrow$ instant v1 baseline.
- [ ] **Vibe Intake**: Curated 24-swatch selector $\rightarrow$ Gemma 4 Style DNA extraction.
- [ ] **Linked Planning Workspace**: 3-pane desktop / 4-tab mobile workspace with live budget & timeline.
- [ ] **Protected Moment**: Explicit floor lock and visual Gulabi Rose highlight.
- [ ] **Quote Check**: Interactive tier selection, omission warnings, and verbatim source phrase preview.
- [ ] **Idea Displacement**: Curated idea adoption with visible line donation feedback and undo.
- [ ] **Dual-Link Sharing**: Capability Edit URL and sanitized read-only Family Share view.
- [ ] **Zero-Failure Fallback**: Three-tier ladder ensuring seamless demo operation.

---
*Feature research for: Mehfil Celebration Planner*  
*Researched: 2026-10-27*
