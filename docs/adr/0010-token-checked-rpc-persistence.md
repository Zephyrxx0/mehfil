# 10. Token-Checked RPC Persistence Replaces Owner-RLS

Amends ADR-0006. Cloud persistence goes through `SECURITY DEFINER` Postgres functions that verify a plain capability token inside the database.

## Context
ADR-0006 assumed Supabase anonymous sessions and `owner_id = auth.uid()` policies. No code signs users in or sets `owner_id`, so every direct table access was denied and cloud save never ran. A second device could not read the plan either. The browser also compared stored hashes itself, which made a hash equivalent to a credential.

## Decision
1. Row-Level Security stays enabled on `events`, `plan_versions` and `change_records`, with no policies for `anon` or `authenticated`. Direct table access is denied.
2. Functions `create_event`, `get_editable_plan`, `save_plan_version`, `list_plan_versions`, `regenerate_share_key` and `verify_edit_key` accept the plain edit key, hash it with SHA-256 in the database and compare there. `get_shared_plan` accepts the share-token hash as before.
3. `create_event` generates both tokens with `gen_random_bytes(32)` and returns them once. Only hashes are stored.
4. The `mehfil_edit_<id>` cookie holds an HMAC-signed, expiring session value, never a stored hash. Routes return 503 in production when the signing secret or Supabase settings are missing.
5. Local-only mode (no Supabase) keeps working from localStorage but cannot produce a share link. The UI says so.

## Consequences
- Cross-device edit and family share links work with no login.
- Tests run the real SQL on PGlite, so mocked-client gaps like this cannot recur.
- Edit-key brute force is bounded by the 256-bit token plus the route rate limit.
