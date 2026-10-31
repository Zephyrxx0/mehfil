# Phase 3: Anonymous Persistence & Dual-Link Collaboration - Context

**Gathered:** 2026-10-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers server persistence, immutable versioning, and zero-login cross-device resumption and sharing:
- Supabase schema migrations for `events`, `plan_versions`, `change_records`, and PostgreSQL Row-Level Security (RLS) policies.
- Anonymous Supabase sessions with isolated user IDs without login forms or account friction.
- Capability URL routing (`/plan/[id]?key=[token]` and `/share/[token]`).
- Seamless cross-device session claim: validating unguessable edit token against SHA-256 hash in Postgres, setting edit authorization in session/cookie, and immediately cleaning URL via `router.replace`.
- Celebratory editorial read-only Family Share view (`/share/[token]`): sanitized category totals, Protected Moment showcase, ceremony milestone timeline, and 1-click filtered guest calendar (`.ics`) export; sensitive vendor quote breakdowns, negotiation notes, and internal buffers strictly stripped on the server.
- Immutable append-only version history records with 800ms debounce / interaction-end commits, pure TypeScript deterministic change explanations, reverse-chronological timeline cards in Pane 3 / Mobile Bottom Sheet, and one-click forward restore undo.
- Local-first resilience: graceful fallback to localStorage when offline or unconfigured, plus subtle top-bar sync badge (`● Saved to Cloud` / `○ Syncing...` / `⚡ Saved Locally`) and optimistic concurrency conflict banner.

</domain>

<decisions>
## Implementation Decisions

### Capability Keys & Cross-Device Claiming
- **D-01:** Top-bar "Share & Save" trigger with modal featuring 1-click Copy, QR Code for phone camera scanning, and WhatsApp self-share button. — **Reversibility:** reversible
- **D-02:** Automatic seamless claim: opening `/plan/[id]?key=[token]` validates token against Postgres hash, claims edit authority into session/cookie, and strips secret from URL query params (via router.replace) to prevent accidental shoulder-surfing or URL sharing. — **Reversibility:** costly — impacts URL routing, middleware, and auth session hydration
- **D-03:** Graceful downgrade to Read-Only with an "Unlock Editing" badge if a visitor lands on `/plan/[id]` without a valid Edit Key or cookie, opening an "Enter Edit Key" dialog for organizers who forgot to append their token. — **Reversibility:** reversible
- **D-04:** Secure 32-byte URL-safe nanoid/token stored as a SHA-256 hash in Postgres `events.edit_key_hash` (constant-time comparison) to protect against DB read leaks, with clean URL format `bookmymehfil.vercel.app/plan/[id]?key=[token]`. — **Reversibility:** one-way — database schema and cryptographic security contract

### Family Share Link Experience
- **D-05:** Celebratory Editorial Overview layout for `/share/[token]`: warm life-milestone presentation featuring event countdown, category breakdown, Protected Moment showcase, and key timeline milestones, without intimidating workspace sliders or editing chrome. — **Reversibility:** reversible
- **D-06:** Server-side sanitization showing category totals & timeline, but strictly stripping vendor quote breakdowns, negotiation notes, and internal contingency buffers from the DB response payload. — **Reversibility:** one-way — API boundary security and privacy contract
- **D-07:** Filtered Guest Calendar Export on `/share/[token]`: 1-click 'Add to Calendar' button that generates an `.ics` containing only celebration ceremony dates and public milestones (stripping vendor booking/payment deadlines). — **Reversibility:** reversible
- **D-08:** 'Regenerate Link' button in Share Modal immediately creates a fresh share token and updates `events.share_key_hash`, instantly invalidating any previously distributed links with a calm 'Link Expired' screen. — **Reversibility:** costly — invalidation logic and state update

### Version Snapshot Granularity & Undo
- **D-09:** Interaction-commit with 800ms debounce: live UI updates in real-time (<10ms), while an immutable version record is written to Supabase on interaction end (`onPointerUp`, input `onBlur`, or 800ms idle) with a consolidated change explanation. — **Reversibility:** costly — state management and save orchestration
- **D-10:** Pure append-only forward restore: clicking Undo generates `v(N+1)` whose state matches `v(N-1)`, logging 'Reverted to v{N-1} ({reason})' so history is completely immutable and audit-trailed without destructive deletes. — **Reversibility:** one-way — immutable storage and audit contract
- **D-11:** Reverse-chronological history cards in Pane 3 (desktop) / Bottom Sheet (mobile) with timestamp, plain-language change summary, and 1-click 'Restore this version' button on any past snapshot. — **Reversibility:** reversible
- **D-12:** Pure TypeScript deterministic diff engine: generates exact plain-language sentences directly from integer paise deltas ('Scaled Catering by ₹X by drawing from Decor (-₹Y) and Sound (-₹Z); Protected Moment held firm') with zero LLM latency and 100% mathematical fidelity. — **Reversibility:** costly — core diff calculation contract

### Local Fallback & Sync Feedback
- **D-13:** Local-first resilience: when offline or if Supabase keys are not configured, automatically persist events and version history to localStorage, enabling full planning and seamless auto-sync when cloud is available. — **Reversibility:** costly — persistence adapter architecture
- **D-14:** Top-bar subtle status badge: gentle indicator (`● Saved to Cloud` / `○ Syncing...` / `⚡ Saved Locally`) with a subtle checkmark animation providing immediate organizer peace of mind. — **Reversibility:** reversible
- **D-15:** Optimistic concurrency with polite banner: if an incoming save detects a newer version in the database (`parent_version_id` mismatch), display a calm banner: 'Plan updated from another device — Refresh to see latest or commit as new version'. — **Reversibility:** costly — conflict detection logic
- **D-16:** Standard `supabase/migrations/` migration file with complete RLS policies, indexes, and auto-generated TypeScript contracts in `src/types/database.ts` plus a local seed file. — **Reversibility:** one-way — database migration contract

### the agent's Discretion
- Exact nanoid generation utilities and SHA-256 web crypto helper implementations.
- QR Code rendering library or SVG generation for the share modal.
- Transition animations and toast durations for the sync status pill.
- Supabase client initialization helper supporting both server and client components in Next.js 15.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture Decision Records (ADRs)
- `docs/adr/0006-dual-link-anonymous-capability-model.md` — Dual-link capability model for accountless cross-device access and server-side sanitized read-only family sharing.
- `docs/adr/0001-deterministic-baseline-first.md` — Deterministic archetype baseline instant instantiation (<10ms).
- `docs/adr/0002-permissive-shortfall-with-remedies.md` — Shortfall calculation state and integer paise invariants.
- `docs/adr/0004-idea-displacement-with-protected-immunity.md` — Protected Moment immunity and elastic donor line displacement.
- `docs/adr/0005-compressed-mode-timeline-triage.md` — Timeline milestone scheduling and .ics calendar generation.

### Specifications & PRD
- `PRD.md` §3.1 — Event Intake Brief and deterministic archetype generation.
- `PRD.md` §4.1 — Plain-language re-balancing feedback, immutable versioned snapshots, and one-click undo.
- `PRD.md` §4.2 — Backwards-scheduled timeline, milestone intervals, and calendar export.
- `PRD.md` §9.5 — Data storage, Supabase PostgreSQL schema, RLS policies, and anonymous auth sessions.
- `DESIGN.md` — 3-hue palette discipline, typography, and WCAG AAA contrast rules.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/engine/budget.ts` & `src/lib/engine/timeline.ts`: Pure TypeScript calculation engines operating on integer paise and backwards topological dates.
- `src/lib/engine/currency.ts`: Indian numbering formatting utility (`formatINR`).
- `src/components/workspace/WorkspaceShell.tsx`: Responsive 3-pane desktop workspace and 4-tab mobile drawer navigation.
- `src/components/workspace/ChangeExplainer.tsx`: Change Explainer UI component with existing undo hook and plain-language summary card slots.
- `src/components/ui/`: Styled shadcn primitives (`dialog.tsx`, `button.tsx`, `card.tsx`, `badge.tsx`, `sheet.tsx`, `slider.tsx`).

### Established Patterns
- Pure functional engine separation: calculation logic strictly lives in `src/lib/engine/` and UI strictly consumes immutable snapshots.
- Integer paise monetary amounts with largest-remainder apportionment at rupee display boundaries.
- No client-side logins or complex auth overhead (ready for Supabase anonymous sessions).

### Integration Points
- `src/lib/supabase/`: Client and server Supabase helpers (`client.ts`, `server.ts`, `middleware.ts`).
- `supabase/migrations/`: PostgreSQL schema migrations for `events`, `plan_versions`, `change_records`, and RLS policies.
- `src/lib/engine/diff.ts`: Deterministic plain-language change explanation generator comparing `v(N-1)` vs `v(N)`.
- `src/lib/storage/`: Persistence adapter abstracting Supabase cloud calls and localStorage offline fallback.
- `src/app/plan/[id]/page.tsx`: Capability router validating secret edit key or claiming session.
- `src/app/share/[token]/page.tsx`: Sanitized celebratory read-only family view.
- `src/components/workspace/ShareSaveModal.tsx`: Modal for Copy Edit Key, QR Code, WhatsApp share, and Share Link generation.
- `src/components/workspace/SyncStatusBadge.tsx`: Reassuring top-bar sync indicator.

</code_context>

<specifics>
## Specific Ideas

- WhatsApp share link prefilled with friendly milestone message: "Here's our [Event Name] celebration plan on Mehfil! Take a look: [Share URL]".
- QR code in Share & Save modal allowing organizer to immediately scan with phone camera and resume editing on mobile.
- Router cleans secret token from URL bar with `router.replace` after claiming so sharing the browser URL does not accidentally expose edit privileges.
- Filtered `.ics` export on Family Share page containing only celebratory gatherings and pooja/ceremony timings, hiding vendor payment due dates.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-Anonymous Persistence & Dual-Link Collaboration*
*Context gathered: 2026-10-27*

