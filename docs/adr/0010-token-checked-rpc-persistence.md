# 10. Token-Checked RPC Persistence Replaces Owner-RLS

Status: Accepted. Amends [ADR-0006](0006-dual-link-anonymous-capability-model.md), whose anonymous sessions and owner-based row-level security this record replaces. Extended by [ADR-0011](0011-shared-abuse-limits.md) and by the later additions below.

Cloud persistence goes through `SECURITY DEFINER` Postgres functions that verify a plain capability token inside the database.

## Context

ADR-0006 assumed Supabase anonymous sessions and `owner_id = auth.uid()` policies. No code signs users in or sets `owner_id`, so every direct table access was denied and cloud save never ran. A second device could not read the plan either. The browser also compared stored hashes itself, which made a hash as good as a credential, and the original test suite mocked the database, so none of this showed up.

## Decision

1. Row-Level Security stays enabled on `events`, `plan_versions` and `change_records`, with no policies for `anon` or `authenticated`, and table privileges are revoked from both roles. Direct table access is denied twice over.
2. The functions `create_event`, `verify_edit_key`, `get_editable_plan`, `save_plan_version`, `list_plan_versions` and `regenerate_share_key` take the **plain** edit key, hash it with SHA-256 in the database and compare there. `get_shared_plan` takes the plain share token. No hash is ever accepted as a credential.
3. `create_event` generates both tokens with `gen_random_bytes(32)`, returns them once, and stores only their hashes. Event ids are database-generated UUIDs.
4. Every function pins `search_path`, is closed to `PUBLIC`, and answers "wrong key" and "no such plan" the same way, so the API is not a lookup oracle.
5. `save_plan_version` serialises writers per event with a row lock and reports a stale parent as a conflict together with the newest version (optimistic concurrency, D-15). Versions and audit rows reject `UPDATE`.
6. Each version stores a full plan `snapshot` (`jsonb`), because budget lines alone cannot restore style DNA, quotes or adopted ideas.
7. The creator's browser keeps the edit key and the family share token in `localStorage`, because the database cannot show either again. A second device receives the edit key through the edit link, the claim route checks it, and the device keeps it only after the database accepts it.
8. There is no session cookie. The database re-checks the key on every call, so a cookie would add a credential without removing any check. The claim route is a rate-limited verifier that fails closed with 503 in production when no database is configured.
9. The browser and the server reach these functions through a small fetch client (`src/lib/supabase/rpc-client.ts`) instead of the Supabase SDK. The app has no accounts and never uses Supabase Auth, Storage or Realtime, so the SDK added about 230 KB of client JavaScript and a session store nobody read. Access control lives in the functions, not in the client.
10. Local-only mode (no Supabase) keeps working from `localStorage`. It cannot produce a share link, and the UI says so instead of showing a placeholder.

## Consequences

- Cross-device editing and family share links work with no login.
- The real SQL is tested on an in-process Postgres (PGlite): table lockdown, token handling, conflicts, immutability, link revocation and the grants on every function. TypeScript tests talk to that same database, so the argument names and JSON shapes are checked as well.
- The first-load JavaScript of the workspace page fell from 348 KB to 279 KB when the SDK was removed.
- Edit-key brute force is bounded by a 256-bit token plus the route rate limit. The key is compared as a SHA-256 hash, so timing reveals nothing usable. The route limit does not cover callers who use the public key to call the functions directly, so the database also limits failed keys per plan (see Later additions).

## Residual risks

- A key stored in `localStorage` can be read by script running in the page. The nonce-based CSP (S9) is the mitigation; an HttpOnly sealed-key cookie behind server routes would remove the exposure, at the cost of routing every save through the server.
- `create_event` is callable by anyone holding the public anon key. It is size-limited and, since [ADR-0011](0011-shared-abuse-limits.md), throttled by a global circuit breaker, but it cannot tell callers apart. Put a Supabase/edge rate limit or CAPTCHA in front of it if it is abused.
- All seven migrations in `supabase/migrations/` must be applied to the live project (`supabase db push`) before the cloud paths work there. The ones this record introduced or depends on are `20261031000000` (the token-checked functions), `20261031120000` (shared limits) and `20261031130000` (advisor fixes). The later two, `20261031140000` and `20261031150000`, are described below. Until the migrations are applied, the app runs in local mode.
- **Accepted advisor warnings.** The Supabase advisor flags the seven browser-facing `SECURITY DEFINER` functions as callable by `anon` (`create_event`, `get_editable_plan`, `get_shared_plan`, `list_plan_versions`, `regenerate_share_key`, `save_plan_version`, `verify_edit_key`). This is the design: the browser holds only the public key, and each function checks the capability token itself. `anon` cannot be removed from them, and `SECURITY INVOKER` would not work because `anon` cannot read the tables. The advisor will keep showing these. `authenticated` has no grant on any of them, since the app never signs users in (migration `20261031130000`). The advisor also reports `RLS enabled, no policy` on `model_usage` and `rate_limit_hits`. That is deliberate: only the service role may use those tables. The same is true of `edit_key_failures` (migration `20261031140000`), which only the database functions write.

## Later additions

Two migrations add limits that run inside the database. The public key lets anyone call the functions without going through a server route, so a limit in a route would not cover them.

1. **Per-plan edit-key failure limit** (`20261031140000_edit_key_failure_limit.sql`). The check sits inside `mehfil_edit_key_matches`, which every edit-key function calls. Each wrong or malformed key for an existing, active plan adds a row to `edit_key_failures`. After 20 failures for one plan within 10 minutes, every attempt on that plan is refused without looking at the key, so the correct key is refused too, until the old failures age out. A correct key records nothing, other plans are unaffected, and an unknown plan id records nothing, so random ids cannot fill the table. The answer is the same `false` whether the plan is unknown, archived, locked out or the key is wrong. Because the helper now writes, `verify_edit_key`, `get_editable_plan` and `list_plan_versions` were re-created as `VOLATILE`. PostgREST allows `VOLATILE` functions only through `POST`, which is what the fetch client uses.
   - **Trade-off:** anyone who knows a plan id can send 20 wrong keys and delay the organizer's cloud sync, including saves and opening the plan on another device, for up to 10 minutes. A plan id is not secret: it appears in the edit link. The lockout is accepted because it cannot expose a plan, and the 256-bit key is the real protection. While it lasts, the organizer's browser keeps the latest edit on the device, keeps its stored edit key, and shows "Sync paused" instead of "Saved Locally"; the next change after the lockout lapses saves to the cloud again.
2. **Share-link open limit** (`20261031150000_share_link_open_limit.sql`). It adds a per-plan limit of 120 opens per minute on family links; unknown links cost no write. `get_shared_plan` looks the plan up by the hash of the token first and counts an open only when the token matches a real, active plan, in the bucket `share_open:<event id>` through `mehfil_hit_rate_limit`. Over the limit it returns an empty result, the same as an unknown or replaced link. A malformed, unknown or replaced token writes nothing, so random tokens can neither fill the table nor use up another family's allowance. `get_shared_plan` is now `VOLATILE` for the same reason as above.
   - **Trade-off:** the count is shared by everyone who holds the link, so one person opening it in a loop can make it appear expired to the others for the rest of that minute.
