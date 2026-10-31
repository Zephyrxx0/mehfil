-- Migration: 20261031130000_advisor_fixes.sql
-- Fixes from the Supabase security and performance advisors (31 Oct 2026).
-- Schema and grants only. No rows are read or changed. Safe to re-run.
--
-- What the advisor found, and what this does about it:
--   1. Five owner-based policies (auth.uid() = owner_id) still existed on the live project.
--      Migration 20261031000000 drops them, but a project that had them keeps them. They never
--      applied (the tables are closed to anon and authenticated), and they only added
--      per-row auth calls, so they are removed.
--   2. `authenticated` could execute the browser functions. The app never signs users in and
--      calls the API with the anon key only, so that grant is unused and is removed. anon keeps
--      its grants: the browser calls those functions by design (ADR-0010).
--   3. Two indexes were redundant or unused. idx_events_edit_key_hash duplicates the unique
--      constraint index on the same column. idx_events_owner_id indexes a column nothing sets.
--      idx_rate_limit_hits_time stays: the cleanup query uses it.

-- 1. Owner policies
DROP POLICY IF EXISTS "events_owner_all" ON public.events;
DROP POLICY IF EXISTS "plan_versions_owner_select" ON public.plan_versions;
DROP POLICY IF EXISTS "plan_versions_owner_insert" ON public.plan_versions;
DROP POLICY IF EXISTS "change_records_owner_select" ON public.change_records;
DROP POLICY IF EXISTS "change_records_owner_insert" ON public.change_records;

-- 2. The signed-in role never calls these
REVOKE EXECUTE ON FUNCTION public.create_event(text, text, date, text, integer, bigint, text, jsonb, text)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_editable_plan(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_shared_plan(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.list_plan_versions(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.regenerate_share_key(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.save_plan_version(uuid, text, uuid, jsonb, text, boolean)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_edit_key(uuid, text) FROM authenticated;

-- 3. Redundant and unused indexes
DROP INDEX IF EXISTS public.idx_events_edit_key_hash;
DROP INDEX IF EXISTS public.idx_events_owner_id;
