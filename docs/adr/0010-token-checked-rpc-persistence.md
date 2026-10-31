# 10. Token-Checked RPC Persistence Replaces Owner-RLS

Amends ADR-0006. Cloud persistence goes through `SECURITY DEFINER` Postgres functions that verify a plain capability token inside the database.

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
- Edit-key brute force is bounded by a 256-bit token plus the route rate limit. Lookup is by the hash of the token, so timing reveals nothing usable.

## Residual risks

- A key stored in `localStorage` can be read by script running in the page. The nonce-based CSP (S9) is the mitigation; an HttpOnly sealed-key cookie behind server routes would remove the exposure, at the cost of routing every save through the server.
- `create_event` is callable by anyone holding the public anon key. It is size-limited, but not rate-limited per client. Put a Supabase/edge rate limit or CAPTCHA in front of it if it is abused.
- Migration `20261031000000` must be applied to the live project (`supabase db push`) before the cloud paths work there. Until then the app runs in local mode.
