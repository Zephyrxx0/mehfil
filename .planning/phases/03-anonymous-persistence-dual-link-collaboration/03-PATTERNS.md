# Phase 03: Anonymous Persistence & Dual-Link Collaboration — Code Patterns & Analog Mappings

**Phase:** 03 - Anonymous Persistence & Dual-Link Collaboration  
**Authoritative Specs:** `03-CONTEXT.md`, `03-RESEARCH.md`, `03-UI-SPEC.md`, `PRD.md`, `DESIGN.md`, `docs/adr/0006-dual-link-anonymous-capability-model.md`  
**Status:** Complete & Ready for Planning  

---

## 1. Executive Architecture & Flow Mapping

Phase 3 delivers server persistence, immutable versioning, zero-login cross-device resumption via capability keys, sanitized read-only family sharing, local-first offline fallback, and deterministic plain-language diff generation.

### System Data Flow Architecture

```
                                  [Organizer on Desktop / Mobile]
                                                 │
                                                 ▼
                                     src/app/plan/[id]/page.tsx
                                                 │
                       ┌─────────────────────────┴─────────────────────────┐
                       │ (Has ?key=token)                                  │ (No key & no cookie)
                       ▼                                                   ▼
            POST /api/plan/[id]/claim                             Read-Only Workspace
                       │                                                   │
         ┌─────────────┴─────────────┐                                     ▼
         │ Valid                     │ Invalid                   "Unlock Editing" Dialog
         ▼                           ▼                                     │
Set HttpOnly Cookie        Downgrade to Read-Only                          ▼
router.replace('/plan/[id]')                                     POST /api/plan/[id]/claim
         │
         ▼
[Editable Workspace: PlanWorkspace.tsx]
   │
   ├── User interaction (slider drag, guest scale, protected moment lock)
   │     │
   │     ▼
   │   Instant local state update (<10ms)
   │     │
   │     ▼
   │   800ms debounce / interaction-end (onPointerUp / onBlur)
   │     │
   │     ▼
   │   diff.ts (Pure TS deterministic delta & sentence generator)
   │     │
   │     ▼
   │   persistence.ts (PersistenceAdapter)
   │     │
   │     ├── Cloud Available?
   │     │     ├── YES ──► Supabase PostgreSQL (events, plan_versions, change_records)
   │     │     │             └── Optimistic Concurrency Check (parent_version_id match)
   │     │     │                   ├── Match: Version committed -> "● Saved to Cloud"
   │     │     │                   └── Mismatch: ConcurrencyConflictBanner shown
   │     │     └── NO / Offline ──► localStorage -> "⚡ Saved Locally"
   │     │
   │     ▼
   └── Top-Bar & Sidebar
         ├── SyncStatusBadge.tsx ("● Saved to Cloud" / "○ Syncing..." / "⚡ Saved Locally")
         ├── ShareSaveModal.tsx
         │     ├── Tab 1: Organizer Edit Key (Copy Key, SVG QR Code, WhatsApp Self-Share)
         │     └── Tab 2: Family Share Link (Copy Link, WhatsApp Share, Regenerate / Invalidate)
         └── ChangeExplainer.tsx (Reverse-chronological cards + Forward Restore Undo)

                                  [Guest / Family on Mobile / Desktop]
                                                 │
                                                 ▼
                                     src/app/share/[token]/page.tsx
                                                 │
                                                 ▼
                                     Database SHA-256 Lookup
                                                 │
                       ┌─────────────────────────┴─────────────────────────┐
                       │ Token Matches events.share_key_hash               │ Hash mismatch (invalidated)
                       ▼                                                   ▼
            sanitizePlanForSharing(plan)                          "Celebration Link Expired"
                       │                                          (Calm notice + Return Home)
                       ▼
            Celebratory Editorial Showcase
              ├── Countdown Banner ("45 days to celebration")
              ├── Cherished Priority Card (Gulabi Rose Protected Moment)
              ├── Aggregate Rupee Category Proportions (No vendor quotes/margins)
              ├── Ceremony Timeline Milestones
              └── Filtered Guest Calendar Export (.ics)
```

---

## 2. Complete Inventory of Files: Created & Modified

| File Path | Role | Data Flow | Closest Analog in Repo |
| :--- | :--- | :--- | :--- |
| `supabase/migrations/20261027000000_create_collaboration_schema.sql` | DB Migration | SQL DDL -> Postgres tables, indexes, RLS policies | `03-RESEARCH.md` §4.2, §4.3 |
| `supabase/seed.sql` | Local DB Seed | SQL DML -> Mock events, plan_versions, change_records | `src/lib/engine/archetypes.ts` |
| `src/types/database.ts` | Type Contract | Supabase PostgREST schema -> TypeScript types | `src/lib/engine/types.ts` |
| `src/lib/supabase/client.ts` | Client Singleton | Browser runtime -> `createBrowserClient` from `@supabase/ssr` | `src/lib/utils.ts` |
| `src/lib/supabase/server.ts` | Server Client | Next.js 15 Server Component / Route Handler -> `createServerClient` | `src/lib/engine/ics.ts` (pure server context) |
| `src/lib/supabase/middleware.ts` | Middleware Adapter | Next.js request/response -> session cookie refresh | Next.js 15 SSR cookie handling |
| `src/lib/engine/crypto.ts` | Security Engine | Web Crypto API -> 32-byte tokens & SHA-256 constant-time hashes | `src/lib/engine/currency.ts` |
| `src/lib/engine/diff.ts` | Math Delta Engine | `Plan` $v(N-1)$ vs $v(N)$ -> Deterministic plain-language sentence | `src/lib/engine/budget.ts` |
| `src/lib/engine/sanitization.ts` | Privacy Boundary | Full `Plan` -> `SanitizedSharedPlan` (strips vendor notes/margins) | `src/lib/engine/timeline.ts` |
| `src/lib/engine/types.ts` (MODIFIED) | Domain Types | Extended versioning, diff, audit, and sanitized payload types | Existing `src/lib/engine/types.ts` |
| `src/lib/storage/persistence.ts` | Storage Adapter | `Plan` -> Supabase cloud or localStorage fallback + concurrency check | `src/lib/engine/budget.ts` |
| `src/app/api/plan/[id]/claim/route.ts` | Route Handler | `POST { key }` -> validates hash -> sets cookie `mehfil_edit_[id]` | Next.js 15 Route Handler pattern |
| `src/app/api/plan/[id]/regenerate-share/route.ts` | Route Handler | `POST` (authed) -> creates new share token -> updates `share_key_hash` | Next.js 15 Route Handler pattern |
| `src/components/ui/tooltip.tsx` | UI Primitive | Radix Tooltip -> Warm Ivory popover content | `src/components/ui/dialog.tsx` |
| `src/components/ui/tabs.tsx` | UI Primitive | Radix Tabs -> Segmented tab triggers and content | `src/components/ui/sheet.tsx` |
| `src/components/ui/alert-dialog.tsx` | UI Primitive | Radix Alert Dialog -> Terracotta destructive modal confirmation | `src/components/ui/dialog.tsx` |
| `src/components/workspace/SyncStatusBadge.tsx` | Workspace UI | Persistence state -> Pill badge with tooltip & animated check | `src/components/ui/badge.tsx` |
| `src/components/workspace/ShareSaveModal.tsx` | Workspace UI | Edit & Share tokens -> 2-tab Dialog (QR code, Copy, WhatsApp) | `src/components/intake/BriefModal.tsx` |
| `src/components/workspace/UnlockEditDialog.tsx` | Workspace UI | User key input -> `/api/plan/[id]/claim` -> unlocks editing | `src/components/intake/StepEventBasics.tsx` |
| `src/components/workspace/ConcurrencyConflictBanner.tsx` | Workspace UI | Conflict state -> Alert banner with "Refresh" or "Commit Fork" | `src/components/workspace/ShortfallBanner.tsx` |
| `src/components/workspace/ChangeExplainer.tsx` (MODIFIED) | Workspace UI | Version stack -> Reverse-chronological cards + Forward Restore | Existing `ChangeExplainer.tsx` |
| `src/components/workspace/WorkspaceShell.tsx` (MODIFIED) | Layout Shell | Responsive 3-pane / 4-tab shell + top-bar sync & share triggers | Existing `WorkspaceShell.tsx` |
| `src/components/workspace/PlanWorkspace.tsx` (MODIFIED) | Workspace Root | Plan mutations -> 800ms debounce -> diff engine -> persistence | Existing `PlanWorkspace.tsx` |
| `src/app/plan/[id]/page.tsx` | Page Route | Capability URL -> validates key, claims cookie, cleans URL | `src/app/page.tsx` |
| `src/app/share/[token]/page.tsx` | Page Route | Family Share URL -> loads sanitized plan -> editorial layout + .ics | `src/app/page.tsx` |
| `tests/engine/diff.test.ts` | Test Suite | Diff engine assertions across 5 mutation types | `tests/engine/budget.test.ts` |
| `tests/engine/sanitization.test.ts` | Test Suite | Privacy assertions ensuring 0 private vendor leak | `tests/engine/timeline.test.ts` |
| `tests/engine/crypto.test.ts` | Test Suite | Token entropy and SHA-256 hash validation | `tests/engine/currency.test.ts` |
| `tests/storage/persistence.test.ts` | Test Suite | Storage adapter, localStorage fallback, and concurrency conflict | `tests/engine/archetypes.test.ts` |
| `tests/components/ShareSaveModal.test.tsx` | Test Suite | Modal rendering, tabs, QR code, clipboard copy, link regenerate | `tests/components/BriefModal.test.tsx` |
| `tests/components/FamilyShareView.test.tsx` | Test Suite | Sanitized layout, countdown, Protected Moment, expired state | `tests/components/WorkspaceShell.test.tsx` |
| `tests/components/CapabilityRouter.test.tsx` | Test Suite | Auto-claim, URL sanitization, read-only downgrade, unlock | `tests/components/PlanWorkspace.test.tsx` |

---

## 3. Pattern Specifications: Database & Schema

### 3.1 Migration File: `supabase/migrations/20261027000000_create_collaboration_schema.sql`

- **Role:** DDL definitions for PostgreSQL database schema, indexes for capability lookups, and RLS policies.
- **Closest Analog:** `03-RESEARCH.md` §4.2 and §4.3.
- **Key Invariants:**
  1. `events.edit_key_hash` and `events.share_key_hash` must be `TEXT UNIQUE NOT NULL`. Raw tokens are never stored.
  2. `plan_versions` is strictly append-only. No `UPDATE` or `DELETE` RLS policies.
  3. `total_budget_paise` stored as `BIGINT`. No float money.
- **Concrete Code Blueprint:**
  ```sql
  -- Migration: 20261027000000_create_collaboration_schema.sql

  -- 1. Events table
  CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('wedding', 'birthday', 'community')),
    event_date DATE NOT NULL,
    city TEXT NOT NULL,
    guest_count INTEGER NOT NULL CHECK (guest_count > 0),
    total_budget_paise BIGINT NOT NULL CHECK (total_budget_paise >= 0),
    protected_category TEXT NOT NULL,
    edit_key_hash TEXT NOT NULL UNIQUE,
    share_key_hash TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_events_edit_key_hash ON public.events(edit_key_hash);
  CREATE INDEX IF NOT EXISTS idx_events_share_key_hash ON public.events(share_key_hash);
  CREATE INDEX IF NOT EXISTS idx_events_owner_id ON public.events(owner_id);

  -- 2. Plan Versions table (strictly immutable)
  CREATE TABLE IF NOT EXISTS public.plan_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL CHECK (version_number >= 1),
    parent_version_id UUID REFERENCES public.plan_versions(id),
    reason TEXT NOT NULL,
    lines JSONB NOT NULL,
    tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    totals JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_accepted BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_event_version UNIQUE (event_id, version_number)
  );

  CREATE INDEX IF NOT EXISTS idx_plan_versions_event_id ON public.plan_versions(event_id);
  CREATE INDEX IF NOT EXISTS idx_plan_versions_parent ON public.plan_versions(parent_version_id);

  -- 3. Change Records table (audit log per version)
  CREATE TABLE IF NOT EXISTS public.change_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_version_id UUID NOT NULL REFERENCES public.plan_versions(id) ON DELETE CASCADE,
    deltas JSONB NOT NULL DEFAULT '[]'::jsonb,
    explanation TEXT NOT NULL,
    is_floor_protected BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_change_records_version ON public.change_records(plan_version_id);

  -- 4. Row-Level Security
  ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.plan_versions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.change_records ENABLE ROW LEVEL SECURITY;

  -- Events RLS
  CREATE POLICY "events_owner_all" ON public.events
    FOR ALL TO authenticated, anon
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

  -- Plan Versions RLS: SELECT and INSERT only (no UPDATE / DELETE)
  CREATE POLICY "plan_versions_owner_select" ON public.plan_versions
    FOR SELECT TO authenticated, anon
    USING (
      EXISTS (
        SELECT 1 FROM public.events
        WHERE public.events.id = public.plan_versions.event_id
          AND public.events.owner_id = auth.uid()
      )
    );

  CREATE POLICY "plan_versions_owner_insert" ON public.plan_versions
    FOR INSERT TO authenticated, anon
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.events
        WHERE public.events.id = public.plan_versions.event_id
          AND public.events.owner_id = auth.uid()
      )
    );

  -- Change Records RLS: SELECT and INSERT only
  CREATE POLICY "change_records_owner_select" ON public.change_records
    FOR SELECT TO authenticated, anon
    USING (
      EXISTS (
        SELECT 1 FROM public.plan_versions
        JOIN public.events ON public.events.id = public.plan_versions.event_id
        WHERE public.plan_versions.id = public.change_records.plan_version_id
          AND public.events.owner_id = auth.uid()
      )
    );

  CREATE POLICY "change_records_owner_insert" ON public.change_records
    FOR INSERT TO authenticated, anon
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.plan_versions
        JOIN public.events ON public.events.id = public.plan_versions.event_id
        WHERE public.plan_versions.id = public.change_records.plan_version_id
          AND public.events.owner_id = auth.uid()
      )
    );
  ```

### 3.2 TypeScript Contracts: `src/types/database.ts`

- **Role:** Strict typings for Supabase client queries matching the migration schema.
- **Closest Analog:** `src/lib/engine/types.ts`.
- **Concrete Code Blueprint:**
  ```ts
  export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

  export interface Database {
    public: {
      Tables: {
        events: {
          Row: {
            id: string
            owner_id: string | null
            title: string
            event_type: 'wedding' | 'birthday' | 'community'
            event_date: string
            city: string
            guest_count: number
            total_budget_paise: number
            protected_category: string
            edit_key_hash: string
            share_key_hash: string
            status: 'active' | 'archived'
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            owner_id?: string | null
            title: string
            event_type: 'wedding' | 'birthday' | 'community'
            event_date: string
            city: string
            guest_count: number
            total_budget_paise: number
            protected_category: string
            edit_key_hash: string
            share_key_hash: string
            status?: 'active' | 'archived'
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            owner_id?: string | null
            title?: string
            event_type?: 'wedding' | 'birthday' | 'community'
            event_date?: string
            city?: string
            guest_count?: number
            total_budget_paise?: number
            protected_category?: string
            edit_key_hash?: string
            share_key_hash?: string
            status?: 'active' | 'archived'
            created_at?: string
            updated_at?: string
          }
        }
        plan_versions: {
          Row: {
            id: string
            event_id: string
            version_number: number
            parent_version_id: string | null
            reason: string
            lines: Json
            tasks: Json
            totals: Json
            is_accepted: boolean
            created_at: string
          }
          Insert: {
            id?: string
            event_id: string
            version_number: number
            parent_version_id?: string | null
            reason: string
            lines: Json
            tasks?: Json
            totals?: Json
            is_accepted?: boolean
            created_at?: string
          }
          Update: never // STRICTLY IMMUTABLE — updates forbidden
        }
        change_records: {
          Row: {
            id: string
            plan_version_id: string
            deltas: Json
            explanation: string
            is_floor_protected: boolean
            created_at: string
          }
          Insert: {
            id?: string
            plan_version_id: string
            deltas?: Json
            explanation: string
            is_floor_protected?: boolean
            created_at?: string
          }
          Update: never // STRICTLY IMMUTABLE — updates forbidden
        }
      }
    }
  }
  ```

---

## 4. Pattern Specifications: Supabase Client Infrastructure

### 4.1 Client Component Singleton: `src/lib/supabase/client.ts`

- **Role:** Initializes browser-side Supabase client singleton using `@supabase/ssr`.
- **Closest Analog:** `src/lib/utils.ts`.
- **Concrete Code Blueprint:**
  ```ts
  import { createBrowserClient } from '@supabase/ssr'
  import type { Database } from '@/types/database'

  let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

  export function getClientSupabase() {
    if (clientInstance) return clientInstance

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      // Returns null when running in offline or unconfigured environments
      return null
    }

    clientInstance = createBrowserClient<Database>(url, key)
    return clientInstance
  }
  ```

### 4.2 Server Component / Route Handler Helper: `src/lib/supabase/server.ts`

- **Role:** Next.js 15 async cookie adapter for Server Components, Route Handlers, and Server Actions.
- **Important Note:** Next.js 15 `cookies()` returns a `Promise<ReadonlyRequestCookies>`. Must `await cookies()`.
- **Concrete Code Blueprint:**
  ```ts
  import { createServerClient } from '@supabase/ssr'
  import { cookies } from 'next/headers'
  import type { Database } from '@/types/database'

  export async function getServerSupabase() {
    const cookieStore = await cookies()

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) return null

    return createServerClient<Database>(url, key, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Can be ignored if called from Server Component (cookies cannot be mutated there)
          }
        },
      },
    })
  }
  ```

---

## 5. Pattern Specifications: Core Pure TypeScript Engines

### 5.1 Cryptographic Helpers: `src/lib/engine/crypto.ts`

- **Role:** Web Crypto API helper for generating 256-bit unguessable tokens and constant-time SHA-256 hashes. Operates seamlessly in Node.js 18+ and modern browsers without external heavy crypto libraries.
- **Closest Analog:** `src/lib/engine/currency.ts`.
- **Concrete Code Blueprint:**
  ```ts
  /**
   * Generates a 32-byte cryptographically secure random capability token.
   * Formatted as a 64-character lowercase hex string.
   */
  export function generateCapabilityToken(): string {
    const bytes = new Uint8Array(32)
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(bytes)
    } else {
      // Node.js environment
      const crypto = require('crypto')
      crypto.randomFillSync(bytes)
    }
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  /**
   * Computes SHA-256 hash of a capability token string.
   * Returns a 64-character hex string.
   */
  export async function hashCapabilityToken(token: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(token)

    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    } else {
      const crypto = require('crypto')
      return crypto.createHash('sha256').update(token).digest('hex')
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks on hash verification.
   */
  export function constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false
    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return result === 0
  }
  ```

### 5.2 Deterministic Plain-Language Diff Engine: `src/lib/engine/diff.ts`

- **Role:** Compares two immutable `Plan` snapshots ($v(N-1)$ and $v(N)$) and computes exact plain-language sentences directly from integer paise deltas. Zero LLM latency, zero hallucinated math, 100% mathematical fidelity.
- **Closest Analog:** `src/lib/engine/budget.ts` and `src/components/workspace/ChangeExplainer.tsx`.
- **Key Deterministic Sentence Rules (D-12, ADR-0004):**
  1. **Undo / Forward Restore:** `"Reverted to v{k} ({previousReason})"`
  2. **Guest Scaling:** `"Scaled guest count to {N} ({+ΔG} guests). Scaled {recipients} by drawing from {donors}{protectedMomentStatus}."`
  3. **Total Budget Change:** `"{Increased|Decreased} total budget by {formatINR(abs(ΔB))}; apportioned across flexible lines."`
  4. **Protected Moment:** `"Locked Protected Moment for {category}; non-negotiable floor enforced."`
- **Concrete Code Blueprint:**
  ```ts
  import type { Plan, PlanChangeDelta } from '@/lib/engine/types'
  import { formatINR } from './currency'

  export interface PlanDiffInput {
    prevPlan: Plan
    nextPlan: Plan
    actionType?: 'guest_scale' | 'budget_change' | 'protected_lock' | 'restore' | 'manual'
    restoredVersionNumber?: number
    restoredReason?: string
  }

  export interface PlanDiffResult {
    summary: string
    deltas: PlanChangeDelta[]
    isFloorProtected: boolean
    donorCategories: string[]
    recipientCategories: string[]
  }

  export function computePlanDiff(input: PlanDiffInput): PlanDiffResult {
    const { prevPlan, nextPlan, actionType, restoredVersionNumber, restoredReason } = input

    // 1. Forward Restore
    if (actionType === 'restore' && restoredVersionNumber !== undefined) {
      const reasonSuffix = restoredReason ? ` (${restoredReason})` : ''
      return {
        summary: `Reverted to v${restoredVersionNumber}${reasonSuffix}`,
        deltas: [],
        isFloorProtected: Boolean(nextPlan.brief.protectedCategory),
        donorCategories: [],
        recipientCategories: [],
      }
    }

    // Compute line deltas
    const deltas: PlanChangeDelta[] = []
    const donorCategories: string[] = []
    const recipientCategories: string[] = []

    for (const nextLine of nextPlan.lines) {
      const prevLine = prevPlan.lines.find((l) => l.id === nextLine.id)
      const prevPaise = prevLine ? prevLine.currentPaise : nextLine.baselinePaise
      const deltaPaise = nextLine.currentPaise - prevPaise

      if (deltaPaise !== 0) {
        deltas.push({
          category: nextLine.name,
          deltaPaise,
        })
        if (deltaPaise > 0) {
          recipientCategories.push(nextLine.name)
        } else {
          donorCategories.push(nextLine.name)
        }
      }
    }

    const isFloorProtected = Boolean(nextPlan.brief.protectedCategory)
    let protectedSuffix = ''
    if (isFloorProtected) {
      protectedSuffix = '; Protected Moment held firm'
    }

    // 2. Protected Moment Change
    if (prevPlan.brief.protectedCategory !== nextPlan.brief.protectedCategory) {
      const catName = nextPlan.brief.protectedCategory.replace('_', ' ')
      return {
        summary: `Locked Protected Moment for ${catName}; non-negotiable floor enforced`,
        deltas,
        isFloorProtected: true,
        donorCategories,
        recipientCategories,
      }
    }

    // 3. Guest Count Change
    if (prevPlan.brief.guestCount !== nextPlan.brief.guestCount) {
      const prevG = prevPlan.brief.guestCount
      const nextG = nextPlan.brief.guestCount
      const deltaG = nextG - prevG
      const signG = deltaG > 0 ? `+${deltaG}` : `${deltaG}`

      let scalingDetails = ''
      if (recipientCategories.length > 0 && donorCategories.length > 0) {
        scalingDetails = ` Scaled ${recipientCategories.join(', ')} by drawing from ${donorCategories.join(', ')}`
      } else if (recipientCategories.length > 0) {
        scalingDetails = ` Scaled ${recipientCategories.join(', ')}`
      }

      return {
        summary: `Scaled guest count to ${nextG} (${signG} guests).${scalingDetails}${protectedSuffix}.`,
        deltas,
        isFloorProtected,
        donorCategories,
        recipientCategories,
      }
    }

    // 4. Total Budget Change
    if (prevPlan.totalBudgetPaise !== nextPlan.totalBudgetPaise) {
      const deltaB = nextPlan.totalBudgetPaise - prevPlan.totalBudgetPaise
      const actionVerb = deltaB > 0 ? 'Increased' : 'Decreased'
      return {
        summary: `${actionVerb} total budget by ${formatINR(Math.abs(deltaB))}; apportioned across flexible lines${protectedSuffix}.`,
        deltas,
        isFloorProtected,
        donorCategories,
        recipientCategories,
      }
    }

    // 5. Default fallback
    return {
      summary: deltas.length > 0
        ? `Adjusted allocations across ${deltas.length} categories${protectedSuffix}.`
        : 'All allocations balanced in harmony.',
      deltas,
      isFloorProtected,
      donorCategories,
      recipientCategories,
    }
  }
  ```

### 5.3 Server-Side Sanitization Engine: `src/lib/engine/sanitization.ts`

- **Role:** Strictly projects a celebration `Plan` and `TimelineSchedule` into a celebratory public payload for `/share/[token]`. Strips raw vendor quotes, internal contingency buffers, draft negotiation notes, and all capability hashes at the server API boundary (D-06).
- **Closest Analog:** `src/lib/engine/timeline.ts`.
- **Concrete Code Blueprint:**
  ```ts
  import type { Plan, TimelineSchedule, TimelineTask, BudgetCategory, Paise } from './types'

  export interface SanitizedSharedPlan {
    id: string
    title: string
    eventType: 'wedding' | 'birthday' | 'community'
    eventDate: string
    city: string
    guestCount: number
    totalBudgetPaise: Paise
    categoryTotals: Record<BudgetCategory, Paise>
    categoryPercentages: Record<BudgetCategory, number>
    protectedMoment: {
      category: BudgetCategory
      name: string
      isProtected: boolean
    }
    publicMilestones: Array<{
      id: string
      title: string
      budgetCategory: BudgetCategory
      targetDate: string
      leadDays: number
      isCeremony: boolean
    }>
    isExpired?: boolean
  }

  export function sanitizePlanForSharing(
    plan: Plan,
    schedule: TimelineSchedule
  ): SanitizedSharedPlan {
    // 1. Calculate high-level category totals (whole paise aggregates only)
    const categoryTotals: Record<string, Paise> = {}
    for (const line of plan.lines) {
      // Internal contingency buffer strictly excluded from public category breakdown
      if (line.category === 'contingency') continue

      categoryTotals[line.category] = (categoryTotals[line.category] || 0) + line.currentPaise
    }

    // 2. Calculate integer percentages
    const totalWithoutContingency = Object.values(categoryTotals).reduce((a, b) => a + b, 0)
    const categoryPercentages: Record<string, number> = {}
    for (const [cat, paise] of Object.entries(categoryTotals)) {
      categoryPercentages[cat] = totalWithoutContingency > 0
        ? Math.round((paise / totalWithoutContingency) * 100)
        : 0
    }

    // 3. Find Protected Moment display info
    const protectedLine = plan.lines.find((l) => l.isProtected || l.category === plan.brief.protectedCategory)
    const protectedMoment = {
      category: plan.brief.protectedCategory,
      name: protectedLine ? protectedLine.name : plan.brief.protectedCategory,
      isProtected: true,
    }

    // 4. Filter timeline milestones: ONLY public celebration ceremonies and milestones within 14 days
    // Vendor booking deadlines, contract signatures, and payment milestones are strictly excluded
    const publicMilestones: SanitizedSharedPlan['publicMilestones'] = []
    for (const band of schedule.milestoneBands) {
      for (const task of band.tasks) {
        // Exclude internal vendor / payment / negotiation tasks
        const isInternalTask =
          task.title.toLowerCase().includes('book') ||
          task.title.toLowerCase().includes('contract') ||
          task.title.toLowerCase().includes('deposit') ||
          task.title.toLowerCase().includes('payment') ||
          task.title.toLowerCase().includes('quote')

        if (!isInternalTask) {
          publicMilestones.push({
            id: task.id,
            title: task.title,
            budgetCategory: task.budgetCategory,
            targetDate: task.targetDate,
            leadDays: task.leadDays,
            isCeremony: task.leadDays <= 2 || task.budgetCategory === 'venue',
          })
        }
      }
    }

    return {
      id: plan.id,
      title: plan.brief.title,
      eventType: plan.brief.eventType,
      eventDate: plan.brief.eventDate,
      city: plan.brief.city,
      guestCount: plan.brief.guestCount,
      totalBudgetPaise: plan.totalBudgetPaise,
      categoryTotals: categoryTotals as Record<BudgetCategory, Paise>,
      categoryPercentages: categoryPercentages as Record<BudgetCategory, number>,
      protectedMoment,
      publicMilestones,
    }
  }
  ```

---

## 6. Pattern Specifications: Persistence & Concurrency Storage Adapter

### 6.1 Unified Storage Adapter: `src/lib/storage/persistence.ts`

- **Role:** Abstracts Supabase PostgreSQL persistence and `localStorage` offline fallback. Transparently coordinates version creation, optimistic concurrency checks ($parent\_version\_id$), capability key validation, and version restoration.
- **Closest Analog:** `src/lib/engine/budget.ts` + React state in `PlanWorkspace.tsx`.
- **Key Invariants:**
  1. If Supabase keys are absent or network requests fail, write/read seamlessly to `localStorage`.
  2. Optimistic concurrency check: if DB has a newer `version_number` than `parent_version_id`, return `{ status: 'conflict', latestVersion, conflictPlan }`.
  3. Version history is strictly append-only.
- **Concrete Code Blueprint:**
  ```ts
  import type { Plan, PlanVersionRecord } from '@/lib/engine/types'
  import { getClientSupabase } from '@/lib/supabase/client'
  import { hashCapabilityToken } from '@/lib/engine/crypto'

  export interface SavePlanResult {
    status: 'saved_cloud' | 'saved_local' | 'conflict' | 'error'
    versionNumber?: number
    versionId?: string
    conflictPlan?: Plan
    error?: string
  }

  export interface PersistenceAdapter {
    savePlan(
      plan: Plan,
      parentVersionId?: string,
      diffSummary?: string,
      editKey?: string
    ): Promise<SavePlanResult>
    getPlan(planId: string, editKey?: string): Promise<{ plan: Plan; isReadOnly: boolean } | null>
    getVersionHistory(planId: string): Promise<PlanVersionRecord[]>
    restoreVersion(planId: string, targetVersion: number, editKey?: string): Promise<SavePlanResult>
  }

  const LOCAL_STORAGE_PREFIX = 'mehfil_plan_'
  const LOCAL_VERSIONS_PREFIX = 'mehfil_versions_'

  export class HybridPersistenceAdapter implements PersistenceAdapter {
    async savePlan(
      plan: Plan,
      parentVersionId?: string,
      diffSummary = 'Adjusted plan allocations',
      editKey?: string
    ): Promise<SavePlanResult> {
      const supabase = getClientSupabase()

      // 1. Try Supabase cloud save if available
      if (supabase && editKey) {
        try {
          const editKeyHash = await hashCapabilityToken(editKey)

          // Check event exists and capability matches
          const { data: event, error: eventErr } = await supabase
            .from('events')
            .select('id, edit_key_hash')
            .eq('id', plan.id)
            .single()

          if (!eventErr && event && event.edit_key_hash === editKeyHash) {
            // Check concurrency: query latest version
            const { data: latestVer } = await supabase
              .from('plan_versions')
              .select('id, version_number, lines')
              .eq('event_id', plan.id)
              .order('version_number', { ascending: false })
              .limit(1)
              .maybeSingle()

            const nextVersionNumber = latestVer ? latestVer.version_number + 1 : 1

            // Concurrency conflict check
            if (latestVer && parentVersionId && latestVer.id !== parentVersionId) {
              return {
                status: 'conflict',
                versionNumber: latestVer.version_number,
                conflictPlan: { ...plan, lines: latestVer.lines as any },
              }
            }

            // Insert immutable version record
            const { data: newVer, error: verErr } = await supabase
              .from('plan_versions')
              .insert({
                event_id: plan.id,
                version_number: nextVersionNumber,
                parent_version_id: parentVersionId || null,
                reason: diffSummary,
                lines: plan.lines as any,
                totals: { totalBudgetPaise: plan.totalBudgetPaise } as any,
              })
              .select('id, version_number')
              .single()

            if (!verErr && newVer) {
              // Insert change record
              await supabase.from('change_records').insert({
                plan_version_id: newVer.id,
                explanation: diffSummary,
                is_floor_protected: Boolean(plan.brief.protectedCategory),
              })

              return {
                status: 'saved_cloud',
                versionNumber: newVer.version_number,
                versionId: newVer.id,
              }
            }
          }
        } catch (e) {
          console.warn('[HybridPersistence] Cloud save failed, falling back to local:', e)
        }
      }

      // 2. Offline / LocalStorage Fallback (D-13)
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(LOCAL_STORAGE_PREFIX + plan.id, JSON.stringify(plan))

          const rawHistory = window.localStorage.getItem(LOCAL_VERSIONS_PREFIX + plan.id)
          const history: PlanVersionRecord[] = rawHistory ? JSON.parse(rawHistory) : []
          const nextVersionNumber = history.length + 1

          const newVersion: PlanVersionRecord = {
            id: `local-v-${Date.now()}`,
            eventId: plan.id,
            versionNumber: nextVersionNumber,
            reason: diffSummary,
            createdAt: new Date().toISOString(),
            snapshot: plan,
          }

          history.unshift(newVersion)
          window.localStorage.setItem(LOCAL_VERSIONS_PREFIX + plan.id, JSON.stringify(history))

          return {
            status: 'saved_local',
            versionNumber: nextVersionNumber,
            versionId: newVersion.id,
          }
        }
      } catch (localErr) {
        return { status: 'error', error: String(localErr) }
      }

      return { status: 'saved_local' }
    }

    async getPlan(planId: string, editKey?: string): Promise<{ plan: Plan; isReadOnly: boolean } | null> {
      const supabase = getClientSupabase()

      if (supabase) {
        try {
          const { data: event } = await supabase.from('events').select('*').eq('id', planId).single()
          if (event) {
            const { data: latestVer } = await supabase
              .from('plan_versions')
              .select('*')
              .eq('event_id', planId)
              .order('version_number', { ascending: false })
              .limit(1)
              .single()

            let isAuthorized = false
            if (editKey) {
              const hash = await hashCapabilityToken(editKey)
              isAuthorized = event.edit_key_hash === hash
            }

            const reconstructedPlan: Plan = {
              id: event.id,
              brief: {
                title: event.title,
                eventType: event.event_type as any,
                eventDate: event.event_date,
                city: event.city,
                guestCount: event.guest_count,
                totalBudgetPaise: event.total_budget_paise,
                protectedCategory: event.protected_category as any,
              },
              lines: (latestVer?.lines as any) || [],
              totalBudgetPaise: event.total_budget_paise,
              baselineGuestCount: event.guest_count,
            }

            return { plan: reconstructedPlan, isReadOnly: !isAuthorized }
          }
        } catch {
          // Fall back to local
        }
      }

      if (typeof window !== 'undefined') {
        const local = window.localStorage.getItem(LOCAL_STORAGE_PREFIX + planId)
        if (local) {
          return { plan: JSON.parse(local), isReadOnly: false }
        }
      }

      return null
    }

    async getVersionHistory(planId: string): Promise<PlanVersionRecord[]> {
      const supabase = getClientSupabase()

      if (supabase) {
        try {
          const { data } = await supabase
            .from('plan_versions')
            .select('id, event_id, version_number, reason, created_at, lines')
            .eq('event_id', planId)
            .order('version_number', { ascending: false })

          if (data && data.length > 0) {
            return data.map((row) => ({
              id: row.id,
              eventId: row.event_id,
              versionNumber: row.version_number,
              reason: row.reason,
              createdAt: row.created_at,
              snapshot: { lines: row.lines } as any,
            }))
          }
        } catch {
          // Fallback
        }
      }

      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(LOCAL_VERSIONS_PREFIX + planId)
        if (raw) return JSON.parse(raw)
      }

      return []
    }

    async restoreVersion(planId: string, targetVersion: number, editKey?: string): Promise<SavePlanResult> {
      const history = await this.getVersionHistory(planId)
      const target = history.find((v) => v.versionNumber === targetVersion)
      if (!target || !target.snapshot) {
        return { status: 'error', error: `Version ${targetVersion} not found` }
      }

      // Forward restore creates v(N+1) matching snapshot of v(k)
      return this.savePlan(
        target.snapshot,
        history[0]?.id,
        `Reverted to v${targetVersion} (${target.reason})`,
        editKey
      )
    }
  }

  export const persistence = new HybridPersistenceAdapter()
  ```

---

## 7. Pattern Specifications: Next.js 15 Route Handlers

### 7.1 Capability Claim Endpoint: `src/app/api/plan/[id]/claim/route.ts`

- **Role:** Verifies unguessable edit token against SHA-256 hash in Postgres `events.edit_key_hash`. On match, issues an `HttpOnly` session cookie (`mehfil_edit_[id]`) authorizing browser edits, and returns `{ authorized: true }`.
- **Closest Analog:** Next.js 15 Route Handler pattern.
- **Concrete Code Blueprint:**
  ```ts
  import { NextRequest, NextResponse } from 'next/server'
  import { getServerSupabase } from '@/lib/supabase/server'
  import { hashCapabilityToken, constantTimeCompare } from '@/lib/engine/crypto'
  import { cookies } from 'next/headers'

  export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) {
    const { id: planId } = await context.params
    const body = await req.json().catch(() => ({}))
    const token = body.key

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Missing capability key' }, { status: 400 })
    }

    const supabase = await getServerSupabase()
    if (!supabase) {
      // Offline / Local development fallback: authorize session
      const cookieStore = await cookies()
      cookieStore.set(`mehfil_edit_${planId}`, 'local_authorized', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
      return NextResponse.json({ authorized: true, mode: 'local' })
    }

    // 1. Query event from database
    const { data: event, error } = await supabase
      .from('events')
      .select('id, edit_key_hash')
      .eq('id', planId)
      .single()

    if (error || !event) {
      return NextResponse.json({ error: 'Celebration not found' }, { status: 404 })
    }

    // 2. Hash incoming token and constant-time compare
    const tokenHash = await hashCapabilityToken(token)
    const isMatch = constantTimeCompare(tokenHash, event.edit_key_hash)

    if (!isMatch) {
      return NextResponse.json({ authorized: false, error: 'Invalid capability key' }, { status: 403 })
    }

    // 3. Set HttpOnly authorization cookie
    const cookieStore = await cookies()
    cookieStore.set(`mehfil_edit_${planId}`, tokenHash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    return NextResponse.json({ authorized: true })
  }
  ```

### 7.2 Share Invalidation Endpoint: `src/app/api/plan/[id]/regenerate-share/route.ts`

- **Role:** Generates a fresh share capability token, computes its SHA-256 hash, and updates `events.share_key_hash` in PostgreSQL. Immediately invalidates old shared links (D-08).
- **Concrete Code Blueprint:**
  ```ts
  import { NextRequest, NextResponse } from 'next/server'
  import { getServerSupabase } from '@/lib/supabase/server'
  import { generateCapabilityToken, hashCapabilityToken } from '@/lib/engine/crypto'
  import { cookies } from 'next/headers'

  export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) {
    const { id: planId } = await context.params
    const cookieStore = await cookies()
    const authCookie = cookieStore.get(`mehfil_edit_${planId}`)?.value

    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized to modify celebration' }, { status: 401 })
    }

    const supabase = await getServerSupabase()
    if (!supabase) {
      const newShareToken = generateCapabilityToken()
      return NextResponse.json({ shareToken: newShareToken, status: 'regenerated_local' })
    }

    // Generate new unguessable share token and hash
    const newShareToken = generateCapabilityToken()
    const newShareHash = await hashCapabilityToken(newShareToken)

    const { error } = await supabase
      .from('events')
      .update({ share_key_hash: newShareHash, updated_at: new Date().toISOString() })
      .eq('id', planId)

    if (error) {
      return NextResponse.json({ error: 'Failed to regenerate share key' }, { status: 500 })
    }

    return NextResponse.json({ shareToken: newShareToken, status: 'regenerated' })
  }
  ```

---

## 8. Pattern Specifications: UI Primitives

### 8.1 Tooltip Primitive: `src/components/ui/tooltip.tsx`

- **Role:** Hover explanation popover for top-bar sync badge and version info.
- **Closest Analog:** `src/components/ui/dialog.tsx`.
- **Concrete Code Blueprint:**
  ```tsx
  'use client'

  import * as React from 'react'
  import * as TooltipPrimitive from '@radix-ui/react-tooltip'
  import { cn } from '@/lib/utils'

  export const TooltipProvider = TooltipPrimitive.Provider
  export const Tooltip = TooltipPrimitive.Root
  export const TooltipTrigger = TooltipPrimitive.Trigger

  export const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
  >(({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 overflow-hidden rounded-xl border border-royal-plum/10 bg-warm-ivory px-3 py-1.5 text-xs font-medium text-royal-plum shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  ))
  TooltipContent.displayName = TooltipPrimitive.Content.displayName
  ```

### 8.2 Tabs Primitive: `src/components/ui/tabs.tsx`

- **Role:** Accessible tabs for `ShareSaveModal` ("Organizer Edit Key" / "Family Share Link").
- **Closest Analog:** `src/components/ui/sheet.tsx`.
- **Concrete Code Blueprint:**
  ```tsx
  'use client'

  import * as React from 'react'
  import * as TabsPrimitive from '@radix-ui/react-tabs'
  import { cn } from '@/lib/utils'

  export const Tabs = TabsPrimitive.Root

  export const TabsList = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
  >(({ className, ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-full bg-royal-plum/5 p-1 text-royal-plum',
        className
      )}
      {...props}
    />
  ))
  TabsList.displayName = TabsPrimitive.List.displayName

  export const TabsTrigger = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
  >(({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold ring-offset-warm-ivory transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-royal-plum focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-marigold data-[state=active]:text-royal-plum data-[state=active]:shadow-xs',
        className
      )}
      {...props}
    />
  ))
  TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

  export const TabsContent = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
  >(({ className, ...props }, ref) => (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-4 ring-offset-warm-ivory focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-royal-plum focus-visible:ring-offset-2',
        className
      )}
      {...props}
    />
  ))
  TabsContent.displayName = TabsPrimitive.Content.displayName
  ```

---

## 9. Pattern Specifications: Workspace UI Components

### 9.1 Top-Bar Sync Status Badge: `src/components/workspace/SyncStatusBadge.tsx`

- **Role:** Reassuring indicator in workspace top bar displaying persistence state (`● Saved to Cloud` / `○ Syncing...` / `⚡ Saved Locally`) (D-14).
- **Closest Analog:** `src/components/ui/badge.tsx`.
- **States & Typography:**
  - `cloud_saved`: Solid dot `w-2 h-2 rounded-full bg-[#4A7C59]` (Cardamom Green), text: "Saved to Cloud", accompanied by checkmark icon.
  - `syncing`: Hollow ring `w-2 h-2 rounded-full border-2 border-[#F7C873] animate-pulse` (Marigold), text: "Syncing...".
  - `local_saved`: Terracotta lightning bolt `w-3 h-3 text-[#D95D39]`, text: "Saved Locally".
- **Concrete Code Blueprint:**
  ```tsx
  'use client'

  import React from 'react'
  import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
  import { Check, Zap, Loader2 } from 'lucide-react'
  import { cn } from '@/lib/utils'

  export type SyncState = 'cloud_saved' | 'syncing' | 'local_saved'

  interface SyncStatusBadgeProps {
    status: SyncState
    lastSavedTimestamp?: string
    className?: string
  }

  export function SyncStatusBadge({ status, lastSavedTimestamp, className }: SyncStatusBadgeProps) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-royal-plum/10 bg-warm-ivory px-3 py-1 text-xs font-medium text-royal-plum shadow-2xs transition-colors cursor-help',
                className
              )}
            >
              {status === 'cloud_saved' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#4A7C59]" aria-hidden="true" />
                  <span>Saved to Cloud</span>
                  <Check className="w-3 h-3 text-[#4A7C59]" />
                </>
              )}

              {status === 'syncing' && (
                <>
                  <Loader2 className="w-3 h-3 text-marigold animate-spin" />
                  <span>Syncing...</span>
                </>
              )}

              {status === 'local_saved' && (
                <>
                  <Zap className="w-3 h-3 text-[#D95D39] fill-[#D95D39]" />
                  <span>Saved Locally</span>
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {status === 'cloud_saved' && (
              <p>All changes stored securely in Supabase. {lastSavedTimestamp && `(${lastSavedTimestamp})`}</p>
            )}
            {status === 'syncing' && <p>Saving immutable version snapshot...</p>}
            {status === 'local_saved' && (
              <p>Working offline or without cloud keys; stored safely in browser storage.</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  ```

### 9.2 Share & Save Modal: `src/components/workspace/ShareSaveModal.tsx`

- **Role:** Dual-link modal presenting the Organizer Edit Key (with SVG QR code and WhatsApp self-share) and Family Share Link (with WhatsApp share and Regenerate Link dialog) (D-01, D-08).
- **Closest Analog:** `src/components/intake/BriefModal.tsx`.
- **Concrete Code Blueprint:**
  ```tsx
  'use client'

  import React, { useState } from 'react'
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
  import { Button } from '@/components/ui/button'
  import { QRCodeSVG } from 'qrcode.react'
  import { Copy, Check, Share2, MessageCircle, RefreshCw, Lock, ShieldCheck } from 'lucide-react'

  interface ShareSaveModalProps {
    planId: string
    eventName: string
    editToken: string
    shareToken: string
    onRegenerateShareKey?: () => Promise<string>
  }

  export function ShareSaveModal({
    planId,
    eventName,
    editToken,
    shareToken,
    onRegenerateShareKey,
  }: ShareSaveModalProps) {
    const [copiedKey, setCopiedKey] = useState(false)
    const [copiedShare, setCopiedShare] = useState(false)
    const [activeShareToken, setActiveShareToken] = useState(shareToken)
    const [isRegenerating, setIsRegenerating] = useState(false)

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bookmymehfil.vercel.app'
    const editUrl = `${baseUrl}/plan/${planId}?key=${editToken}`
    const shareUrl = `${baseUrl}/share/${activeShareToken}`

    const handleCopyEditKey = async () => {
      await navigator.clipboard.writeText(editUrl)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2500)
    }

    const handleCopyShareLink = async () => {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 2500)
    }

    const handleWhatsAppEditShare = () => {
      const text = encodeURIComponent(`Mehfil Celebration Organizer Key for ${eventName}: ${editUrl}`)
      window.open(`https://wa.me/?text=${text}`, '_blank')
    }

    const handleWhatsAppFamilyShare = () => {
      const text = encodeURIComponent(`Here's our ${eventName} celebration plan on Mehfil! Take a look: ${shareUrl}`)
      window.open(`https://wa.me/?text=${text}`, '_blank')
    }

    const handleRegenerate = async () => {
      if (!onRegenerateShareKey) return
      setIsRegenerating(true)
      try {
        const freshToken = await onRegenerateShareKey()
        setActiveShareToken(freshToken)
      } finally {
        setIsRegenerating(false)
      }
    }

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
            <Share2 className="w-3.5 h-3.5 text-royal-plum" />
            <span>Share & Save</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-lg p-6 sm:p-8 rounded-3xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-2xl font-serif">Share & Save Celebration</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="edit_key" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="edit_key">Organizer Edit Key</TabsTrigger>
              <TabsTrigger value="family_share">Family Share Link</TabsTrigger>
            </TabsList>

            {/* Tab 1: Organizer Edit Key */}
            <TabsContent value="edit_key" className="space-y-4 pt-2">
              <div className="rounded-2xl border border-royal-plum/10 bg-royal-plum/2 p-4 text-xs text-royal-plum/80 leading-relaxed">
                <span className="font-semibold text-royal-plum">Keep this private.</span> Anyone with this capability
                key can modify budgets, guests, and dates.
              </div>

              {/* URL Box */}
              <div className="flex gap-2 items-center">
                <input
                  readOnly
                  value={editUrl}
                  className="w-full h-10 px-3.5 rounded-full border border-royal-plum/15 bg-white/60 text-xs text-royal-plum font-mono focus:outline-hidden"
                />
                <Button
                  onClick={handleCopyEditKey}
                  variant={copiedKey ? 'secondary' : 'default'}
                  className="shrink-0 h-10 px-4 text-xs font-semibold"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copiedKey ? 'Private Key Copied!' : 'Copy Private Edit Key'}
                </Button>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-royal-plum/8 shadow-2xs">
                <QRCodeSVG value={editUrl} size={160} level="M" />
                <p className="mt-3 text-xs text-royal-plum/70 font-medium">
                  Scan with phone camera to resume editing on mobile
                </p>
              </div>

              {/* WhatsApp Self-Share */}
              <Button
                variant="outline"
                onClick={handleWhatsAppEditShare}
                className="w-full h-10 gap-2 text-xs font-semibold"
              >
                <MessageCircle className="w-4 h-4 text-[#2E5A44]" />
                <span>Send Edit Key via WhatsApp</span>
              </Button>
            </TabsContent>

            {/* Tab 2: Family Share Link */}
            <TabsContent value="family_share" className="space-y-4 pt-2">
              <div className="rounded-2xl border border-royal-plum/10 bg-warm-ivory p-4 text-xs text-royal-plum/80 leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-marigold shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-royal-plum">Safe for family and guests.</span> Hides sensitive
                  vendor pricing, negotiation notes, and internal buffers.
                </div>
              </div>

              {/* Share URL Box */}
              <div className="flex gap-2 items-center">
                <input
                  readOnly
                  value={shareUrl}
                  className="w-full h-10 px-3.5 rounded-full border border-royal-plum/15 bg-white/60 text-xs text-royal-plum font-mono focus:outline-hidden"
                />
                <Button
                  onClick={handleCopyShareLink}
                  variant={copiedShare ? 'secondary' : 'default'}
                  className="shrink-0 h-10 px-4 text-xs font-semibold"
                >
                  {copiedShare ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copiedShare ? 'Share Link Copied!' : 'Copy Family Share Link'}
                </Button>
              </div>

              {/* WhatsApp Share */}
              <Button
                variant="default"
                onClick={handleWhatsAppFamilyShare}
                className="w-full h-11 gap-2 text-xs font-semibold"
              >
                <MessageCircle className="w-4 h-4 text-royal-plum" />
                <span>Share Plan via WhatsApp</span>
              </Button>

              {/* Invalidation Trigger */}
              <div className="pt-2 border-t border-royal-plum/8 flex justify-between items-center text-xs">
                <span className="text-royal-plum/60">Need to revoke distributed links?</span>
                <button
                  type="button"
                  disabled={isRegenerating}
                  onClick={handleRegenerate}
                  className="text-[#D95D39] font-semibold hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={cn('w-3 h-3', isRegenerating && 'animate-spin')} />
                  <span>Regenerate Share Link</span>
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    )
  }
  ```

### 9.3 Optimistic Concurrency Conflict Banner: `src/components/workspace/ConcurrencyConflictBanner.tsx`

- **Role:** Non-blocking notification banner displayed when an incoming save detects a newer version in the database (`parent_version_id` mismatch) (D-15).
- **Closest Analog:** `src/components/workspace/ShortfallBanner.tsx`.
- **Concrete Code Blueprint:**
  ```tsx
  'use client'

  import React from 'react'
  import { AlertTriangle, RefreshCw, GitFork } from 'lucide-react'
  import { Button } from '@/components/ui/button'

  interface ConcurrencyConflictBannerProps {
    onRefreshLatest: () => void
    onCommitAsFork: () => void
  }

  export function ConcurrencyConflictBanner({
    onRefreshLatest,
    onCommitAsFork,
  }: ConcurrencyConflictBannerProps) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-[#D95D39]/30 bg-warm-ivory p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-[#D95D39] shrink-0" />
          <p className="text-xs font-medium text-royal-plum">
            Plan updated from another device — your local draft is out of sync.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefreshLatest}
            className="h-8 gap-1.5 px-3 text-xs font-semibold"
          >
            <RefreshCw className="w-3 h-3 text-royal-plum" />
            <span>Refresh to Latest Plan</span>
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onCommitAsFork}
            className="h-8 gap-1.5 px-3 text-xs font-semibold"
          >
            <GitFork className="w-3 h-3 text-royal-plum" />
            <span>Commit as New Snapshot</span>
          </Button>
        </div>
      </div>
    )
  }
  ```

---

## 10. Pattern Specifications: Pages & Routes

### 10.1 Capability URL Route: `src/app/plan/[id]/page.tsx`

- **Role:** Capability routing: if `?key=[token]` is present in URL, verifies capability against database hash via `/api/plan/[id]/claim`, sets edit cookie, and cleans URL bar via `router.replace` in <50ms. If visitor has no key and no cookie, downgrades to Read-Only mode with "Unlock Editing" badge (D-02, D-03).
- **Closest Analog:** `src/app/page.tsx`.
- **Concrete Code Blueprint:**
  ```tsx
  'use client'

  import React, { useEffect, useState } from 'react'
  import { useParams, useSearchParams, useRouter } from 'next/navigation'
  import { PlanWorkspace } from '@/components/workspace/PlanWorkspace'
  import { persistence } from '@/lib/storage/persistence'
  import type { Plan } from '@/lib/engine/types'
  import { Loader2 } from 'lucide-react'

  export default function PlanCapabilityPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()

    const planId = params.id as string
    const keyParam = searchParams.get('key')

    const [plan, setPlan] = useState<Plan | null>(null)
    const [isReadOnly, setIsReadOnly] = useState(false)
    const [editToken, setEditToken] = useState<string | null>(keyParam)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      async function initializeSession() {
        if (!planId) return

        // 1. If keyParam exists, claim capability into cookie
        if (keyParam) {
          try {
            const res = await fetch(`/api/plan/${planId}/claim`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key: keyParam }),
            })
            const data = await res.json()
            if (data.authorized) {
              setEditToken(keyParam)
              setIsReadOnly(false)
            } else {
              setIsReadOnly(true)
            }
          } catch {
            // Local fallback
            setEditToken(keyParam)
          }

          // D-02: Clean URL bar immediately via router.replace
          router.replace(`/plan/${planId}`)
        }

        // 2. Load plan
        const result = await persistence.getPlan(planId, keyParam || editToken || undefined)
        if (result) {
          setPlan(result.plan)
          setIsReadOnly(result.isReadOnly)
        }
        setIsLoading(false)
      }

      initializeSession()
    }, [planId, keyParam, router])

    if (isLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-warm-ivory">
          <Loader2 className="w-8 h-8 text-marigold animate-spin mb-3" />
          <p className="text-xs font-semibold text-royal-plum/70 font-serif">
            Opening your celebration harmony...
          </p>
        </div>
      )
    }

    if (!plan) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-warm-ivory px-4 text-center">
          <h2 className="text-2xl font-serif font-bold text-royal-plum">Celebration Not Found</h2>
          <p className="mt-2 text-xs text-royal-plum/60 max-w-sm">
            Please check the link provided by your host or start a new celebration.
          </p>
        </div>
      )
    }

    return (
      <main className="min-h-screen bg-warm-ivory">
        <PlanWorkspace
          initialPlan={plan}
          isReadOnly={isReadOnly}
          editToken={editToken || undefined}
        />
      </main>
    )
  }
  ```

### 10.2 Celebratory Editorial Family Share Page: `src/app/share/[token]/page.tsx`

- **Role:** Warm life-milestone presentation featuring event countdown, category breakdown, Protected Moment showcase, ceremony milestone timeline, and 1-click filtered guest calendar (`.ics`) export. Sensitive vendor pricing and negotiation notes are completely absent (D-05, D-06, D-07, D-08).
- **Closest Analog:** `src/components/workspace/WorkspaceShell.tsx`.
- **Concrete Code Blueprint:**
  ```tsx
  'use client'

  import React, { useEffect, useState } from 'react'
  import { useParams } from 'next/navigation'
  import type { SanitizedSharedPlan } from '@/lib/engine/sanitization'
  import { formatINR } from '@/lib/engine/currency'
  import { Button } from '@/components/ui/button'
  import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
  import { Badge } from '@/components/ui/badge'
  import { Calendar, Clock, ShieldCheck, Download, AlertCircle } from 'lucide-react'
  import Link from 'next/link'

  export default function FamilySharePage() {
    const params = useParams()
    const token = params.token as string

    const [sharedPlan, setSharedPlan] = useState<SanitizedSharedPlan | null>(null)
    const [isExpired, setIsExpired] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      async function loadSharedPlan() {
        if (!token) return
        try {
          const res = await fetch(`/api/share/${token}`)
          if (res.status === 410) {
            setIsExpired(true)
          } else if (res.ok) {
            const data = await res.json()
            setSharedPlan(data)
          } else {
            setIsExpired(true)
          }
        } catch {
          setIsExpired(true)
        } finally {
          setIsLoading(false)
        }
      }

      loadSharedPlan()
    }, [token])

    if (isExpired) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-warm-ivory px-4 text-center">
          <div className="rounded-3xl border border-royal-plum/10 bg-white/60 p-8 max-w-md shadow-lg flex flex-col items-center">
            <AlertCircle className="w-10 h-10 text-marigold mb-3" />
            <h2 className="text-2xl font-serif font-bold text-royal-plum">Celebration Link Expired</h2>
            <p className="mt-2 text-xs text-royal-plum/70 leading-relaxed">
              The celebration organizer has refreshed this link. Please request the latest share link from the host.
            </p>
            <Link href="/" className="mt-6">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                Return to Mehfil Home
              </Button>
            </Link>
          </div>
        </div>
      )
    }

    if (!sharedPlan) return null

    return (
      <main className="min-h-screen bg-warm-ivory py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
          {/* Celebratory Header */}
          <div className="text-center flex flex-col items-center">
            <span className="font-devanagari text-2xl font-bold tracking-tight text-royal-plum mb-2">
              महफ़िल • Mehfil
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-royal-plum tracking-tight leading-tight">
              {sharedPlan.title}
            </h1>
            <p className="mt-3 text-sm font-medium text-royal-plum/70">
              {sharedPlan.city} • {sharedPlan.eventDate} • {sharedPlan.guestCount} Guests
            </p>
          </div>

          {/* Protected Moment Cherished Priority Card */}
          <div className="rounded-3xl border border-royal-plum/10 bg-gulabi-rose/30 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-royal-plum" />
              <span className="text-xs uppercase tracking-wider font-bold text-royal-plum">
                Cherished Celebration Priority
              </span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-royal-plum">
              Our Protected Moment: {sharedPlan.protectedMoment.name}
            </h3>
            <p className="mt-1 text-xs text-royal-plum/70 leading-relaxed">
              This sacred celebration element is non-negotiable and guaranteed in our planning harmony.
            </p>
          </div>

          {/* Category Proportions Breakdown */}
          <Card className="rounded-3xl border border-royal-plum/10 bg-warm-ivory p-6">
            <CardHeader className="p-0 pb-4 border-b border-royal-plum/8">
              <CardTitle className="text-xl font-serif">Celebration Allocations</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(sharedPlan.categoryTotals).map(([cat, paise]) => (
                <div key={cat} className="p-3 rounded-2xl bg-white/60 border border-royal-plum/8">
                  <div className="text-xs capitalize text-royal-plum/60">{cat.replace('_', ' ')}</div>
                  <div className="text-sm font-bold text-royal-plum tabular-nums mt-0.5">
                    {formatINR(paise)}
                  </div>
                  <div className="text-2xs text-royal-plum/50 font-medium">
                    {sharedPlan.categoryPercentages[cat as any] || 0}% share
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Ceremony Timeline */}
          <Card className="rounded-3xl border border-royal-plum/10 bg-warm-ivory p-6">
            <CardHeader className="p-0 pb-4 border-b border-royal-plum/8">
              <CardTitle className="text-xl font-serif">Ceremonies & Celebrations</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-4 flex flex-col gap-3">
              {sharedPlan.publicMilestones.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-white/60 border border-royal-plum/8 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-marigold" />
                    <div>
                      <h4 className="text-xs font-bold text-royal-plum">{m.title}</h4>
                      <p className="text-2xs text-royal-plum/50 mt-0.5">{m.targetDate}</p>
                    </div>
                  </div>
                  {m.isCeremony && (
                    <Badge variant="secondary" className="text-2xs">
                      Ceremony
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Filtered Guest Calendar Export CTA */}
          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              className="h-12 px-8 rounded-full bg-marigold text-royal-plum font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform gap-2"
            >
              <Download className="w-4 h-4 text-royal-plum" />
              <span>Add Ceremonies to Calendar (.ics)</span>
            </Button>
          </div>
        </div>
      </main>
    )
  }
  ```

---

## 11. Test Patterns & Fixtures

### 11.1 Deterministic Diff Engine Test: `tests/engine/diff.test.ts`

- **Role:** Asserts that all 5 mutation types generate exact mathematical plain-language sentences with zero LLM hallucination and accurate Indian numbering.
- **Closest Analog:** `tests/engine/budget.test.ts`.
- **Concrete Test Excerpt:**
  ```ts
  import { describe, it, expect } from 'vitest'
  import { computePlanDiff } from '@/lib/engine/diff'
  import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
  import { rebalanceGuestCount, setProtectedMoment } from '@/lib/engine/budget'

  describe('Deterministic Plan Diff Engine', () => {
    const basePlan = instantiatePlanFromBrief({
      title: 'Sharma Wedding',
      eventType: 'wedding',
      eventDate: '2026-12-18',
      city: 'Jaipur',
      guestCount: 200,
      totalBudgetPaise: 250000000, // 25 Lakhs
      protectedCategory: 'catering',
    })

    it('generates exact diff sentence on guest scaling with donor displacement', () => {
      const nextPlan = rebalanceGuestCount(basePlan, 250)
      const diff = computePlanDiff({ prevPlan: basePlan, nextPlan })

      expect(diff.summary).toContain('Scaled guest count to 250 (+50 guests)')
      expect(diff.summary).toContain('Protected Moment held firm')
      expect(diff.deltas.length).toBeGreaterThan(0)
    })

    it('generates forward restore sentence on undo operation', () => {
      const diff = computePlanDiff({
        prevPlan: basePlan,
        nextPlan: basePlan,
        actionType: 'restore',
        restoredVersionNumber: 2,
        restoredReason: 'Scaled guest count to 200',
      })

      expect(diff.summary).toBe('Reverted to v2 (Scaled guest count to 200)')
      expect(diff.deltas).toEqual([])
    })
  })
  ```

### 11.2 Privacy Sanitization Test: `tests/engine/sanitization.test.ts`

- **Role:** Verifies that internal buffers, vendor quotes, and negotiation notes never leak into the shared payload.
- **Closest Analog:** `tests/engine/timeline.test.ts`.
- **Concrete Test Excerpt:**
  ```ts
  import { describe, it, expect } from 'vitest'
  import { sanitizePlanForSharing } from '@/lib/engine/sanitization'
  import { calculateBackwardsTimeline } from '@/lib/engine/timeline'
  import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'

  describe('Server-Side Privacy Sanitization', () => {
    const plan = instantiatePlanFromBrief({
      title: 'Family Celebration',
      eventType: 'wedding',
      eventDate: '2026-11-20',
      city: 'Delhi',
      guestCount: 150,
      totalBudgetPaise: 150000000,
      protectedCategory: 'venue',
    })
    const schedule = calculateBackwardsTimeline(plan.brief.eventDate, plan.brief.guestCount)

    it('strictly excludes contingency internal buffers from shared totals', () => {
      const sanitized = sanitizePlanForSharing(plan, schedule)
      expect(sanitized.categoryTotals).not.toHaveProperty('contingency')
    })

    it('strictly filters out vendor negotiation and payment tasks from public milestones', () => {
      const sanitized = sanitizePlanForSharing(plan, schedule)
      for (const milestone of sanitized.publicMilestones) {
        expect(milestone.title.toLowerCase()).not.toContain('contract')
        expect(milestone.title.toLowerCase()).not.toContain('deposit')
        expect(milestone.title.toLowerCase()).not.toContain('payment')
      }
    })
  })
  ```

---

## 12. Critical Implementation Invariants & Anti-Patterns Checklist

- [ ] **No Raw Edit Tokens in DB:** Capability tokens are stored solely as SHA-256 hashes (`events.edit_key_hash`, `events.share_key_hash`).
- [ ] **Instant URL Sanitization:** `/plan/[id]?key=[token]` validates key and immediately calls `router.replace('/plan/' + id)` so the query param never remains in the address bar.
- [ ] **Strictly Append-Only Versions:** Undo commits `v(N+1)` with snapshot matching `v(k)` and logs `Reverted to v{k}`. `DELETE FROM plan_versions` is strictly forbidden.
- [ ] **Integer Paise Integrity:** No float arithmetic anywhere in database columns, diff engine, or version snapshots. Rupees formatted only at display boundary.
- [ ] **Zero Vendor Leaks on `/share`:** Vendor contract notes, internal buffers, and individual candidate quotes are stripped before sending the response.
- [ ] **Async Next.js 15 Cookies:** Always `await cookies()` before reading or mutating cookies. Never mutate cookies inside Server Components.
- [ ] **Offline Graceful Fallback:** If `NEXT_PUBLIC_SUPABASE_URL` is unconfigured or fetch fails, seamlessly persist and read from `localStorage`.
- [ ] **3-Hue Discipline:** Pastels are exclusively fills; text is always high-contrast Royal Plum (`#3A2442`). Gulabi Rose (`#F2A7B8`) strictly reserved for Protected Moments (10%).

---
*Patterns mapped and ready for phase execution.*
