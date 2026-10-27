# Architecture Research

**Domain:** AI-Augmented Celebration & Milestone Event Planning Engine  
**Researched:** 2026-10-27  
**Confidence:** HIGH  

## System Structure & Component Boundaries

The architecture is strictly layered into four decoupled tiers:

```
+-------------------------------------------------------------------------------+
|                             CLIENT / PRESENTATION                             |
|  - Next.js 15 App Router (React Server Components + Client Islands)           |
|  - Closed Component Registry (shadcn/ui + custom tokens from DESIGN.md)       |
|  - Animated Hero & Centerpiece (Fraunces Display, Motion, GSAP, Lenis)         |
|  - Responsive Shell (Desktop 3-Pane / Mobile 4-Tab Bottom Sheet)             |
+---------------------------------------+---------------------------------------+
                                        | (HTTPS / Route Handlers)
+---------------------------------------v---------------------------------------+
|                           BOUNDARY & ORCHESTRATION                            |
|  - Input Guard (Zod parsing, rate limiting, token & file size caps)           |
|  - Session Context (Supabase anonymous token / Edit Key claim handler)         |
|  - Orchestrator (Coordinates parallel lookups, vision, and planning pipelines)|
|  - Output Guard (Schema validation, numeric consistency check, content strip) |
+-------------------+-----------------------------------+-----------------------+
                    |                                   |
+-------------------v-------------------+       +-------v-----------------------+
|       PURE TS ENGINE (NUMERICAL)      |       |      AGENT TIER (SEMANTIC)    |
|  - Largest-Remainder Paise Budget     |       |  - Tool-less Style Analyst    |
|  - Elasticity Re-Balancing Solver     |       |  - Bounded Planner Modulator  |
|  - Backwards Topological Timeline     |       |  - Quarantined Quote Analyst  |
|  - Infeasible State & Shortfall Logic |       |  - Idea Curator (Zod Schemas) |
|  - Displacement Calculator            |       |  - 3-Tier Fallback Ladder     |
+-------------------+-------------------+       +-------------------------------+
                    |
+-------------------v-----------------------------------------------------------+
|                          PERSISTENCE (SUPABASE POSTGRES)                      |
|  - Immutable Version History (plan_versions, change_records)                  |
|  - Row-Level Security (Anonymous User IDs)                                   |
|  - Capability Links (Organizer Edit Keys, Family Share Link Hashes)          |
|  - In-Database Caching & Rate Limits (external_cache, rate_limits)            |
+-------------------------------------------------------------------------------+
```

## Data Flow & Invariants

### 1. Plan Initialization Flow
1. **Client $\rightarrow$ Server**: Organizer submits Brief (`type, date, city, guests, budget`).
2. **Deterministic Baseline**: Pure engine instantiates `v1 Plan` from template weights in `< 10ms`.
3. **Database Write**: `v1` is committed to `plan_versions` with an empty parent pointer.
4. **Immediate Response**: Client renders full budget table and backwards timeline instantly (Zero FCP delay, ADR-0001).
5. **Background AI Enrichment**: Vibe Intake triggers Style Analyst and Planner. Bounded multipliers compute a `v2 Plan` diff.
6. **Audited Transition**: User sees plain-language explanation of what moved and accepts or reverts.

### 2. Quote Verification Flow
1. **Client $\rightarrow$ Server**: Untrusted quote text or image uploaded to Route Handler.
2. **Quote Quarantine**: Input Guard strips metadata; quote text wrapped in boundary delimiters.
3. **Quote Analyst**: Tool-less model extracts structured tiers, amounts, omissions, and exact source text snippets.
4. **Numeric Guard**: Rejects numbers without verbatim source match (ADR-0003).
5. **Interactive Preview**: Client displays Quote Check card. User selects tier and confirms omitted fees.
6. **Committed Mutation**: Accepted amount locks budget line; engine re-balances flexible lines.

### 3. Idea Displacement Flow
1. **Curator $\rightarrow$ Client**: Idea Curator suggests candidate enhancements adhering to Style DNA.
2. **Displacement Check**: Engine calculates funding requirements and checks flexible headroom without violating Protected Moment floor (ADR-0004).
3. **Optimistic Preview**: Client visually highlights donating lines and displays resulting budget shift.
4. **Atomic Commit**: Accepting creates `v(N+1)` version with associated timeline tasks and one-click undo.

## Build Order & Dependencies

```
Phase 1: Core Domain Engine & Template Archetypes
    └── Pure TS budget solver (paise, largest-remainder)
    └── Backwards topological timeline scheduler
    └── Hardcoded archetypes (wedding, birthday, community)

Phase 2: Database Layer & Anonymous Capability Auth
    └── Supabase schema migrations (immutable versions, change_records)
    └── RLS policies for anonymous sessions
    └── Dual-link capability generators (Edit Key & Share Link)

Phase 3: Design System & Celebratory Landing Experience
    └── Tailwind tokens and globals.css mapped to DESIGN.md
    └── shadcn/ui component integration with Warm Ivory / Marigold / Plum
    └── Big animated Fraunces kinetic hero with celebration micro-motion

Phase 4: Multi-Agent Pipeline & Fallback Ladder
    └── AI SDK integration with Gemma 4 & Gemini Flash
    └── Style Analyst, Planner, and Idea Curator schemas
    └── 3-tier fallback ladder and run records logging

Phase 5: Quote Check & Quarantine Boundary
    └── Tool-less Quote Analyst prompt & schema
    └── Verbatim source phrase matcher & omission detector
    └── Interactive Quote Check preview card & committed re-balancing

Phase 6: Closed Registry Generative UI & Workspace Shell
    └── 3-pane desktop workspace and 4-tab mobile drawer
    └── Entity ID binding renderer for allowlisted components
    └── Plain-language change explainer panel with one-click undo

Phase 7: End-to-End Verification, Performance & Submission
    └── Invariant property tests (exact paise sums, floor guarantees)
    └── Obscura automated browser validation & accessibility audit
    └── Demo seeding and submission documentation
```

---
*Architecture research for: Mehfil Celebration Planner*  
*Researched: 2026-10-27*
