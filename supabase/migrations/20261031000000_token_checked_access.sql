-- Migration: 20261031000000_token_checked_access.sql
-- ADR-0010: token-checked RPC persistence replaces owner-based row-level security.
--
-- Why: the original policies required `owner_id = auth.uid()`, but the app never signs users
-- in, so every direct table access was denied and cloud save never worked. A second device
-- could not read a plan either.
--
-- Model: the tables are closed to `anon` and `authenticated`. All access goes through the
-- SECURITY DEFINER functions below. Each takes the PLAIN capability token, hashes it inside
-- the database and compares there, so no hash is ever a credential and the browser never
-- compares hashes.
--
-- Safe to re-run: every statement is idempotent.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Full plan snapshot per version
-- ---------------------------------------------------------------------------
-- `lines` alone cannot restore a plan (style DNA, quotes and adopted ideas live beside it).
ALTER TABLE public.plan_versions ADD COLUMN IF NOT EXISTS snapshot JSONB;

-- ---------------------------------------------------------------------------
-- 2. Close the tables
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "events_owner_all" ON public.events;
DROP POLICY IF EXISTS "plan_versions_owner_select" ON public.plan_versions;
DROP POLICY IF EXISTS "plan_versions_owner_insert" ON public.plan_versions;
DROP POLICY IF EXISTS "change_records_owner_select" ON public.change_records;
DROP POLICY IF EXISTS "change_records_owner_insert" ON public.change_records;

-- RLS stays enabled with no policies: deny by default. The REVOKEs are a second layer.
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_records ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.events, public.plan_versions, public.change_records
  FROM PUBLIC, anon, authenticated;

-- Versions and audit rows are append-only.
CREATE OR REPLACE FUNCTION public.reject_row_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION '% rows are immutable', TG_TABLE_NAME USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS plan_versions_no_update ON public.plan_versions;
CREATE TRIGGER plan_versions_no_update
  BEFORE UPDATE ON public.plan_versions
  FOR EACH ROW EXECUTE FUNCTION public.reject_row_update();

DROP TRIGGER IF EXISTS change_records_no_update ON public.change_records;
CREATE TRIGGER change_records_no_update
  BEFORE UPDATE ON public.change_records
  FOR EACH ROW EXECUTE FUNCTION public.reject_row_update();

-- ---------------------------------------------------------------------------
-- 3. Private helpers (not callable through the API)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mehfil_sha256_hex(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = public, extensions, pg_temp
AS $$
  SELECT encode(digest(p_text, 'sha256'), 'hex');
$$;

-- True when `p_edit_key` is the edit key of the active event. The lookup is by the hash of a
-- 256-bit random token, so equality here leaks nothing an attacker can use.
CREATE OR REPLACE FUNCTION public.mehfil_edit_key_matches(p_event_id uuid, p_edit_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT p_edit_key IS NOT NULL
    AND length(p_edit_key) BETWEEN 16 AND 256
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = p_event_id
        AND e.status = 'active'
        AND e.edit_key_hash = public.mehfil_sha256_hex(p_edit_key)
    );
$$;

-- Rejects oversized or malformed plan snapshots before they are stored.
CREATE OR REPLACE FUNCTION public.mehfil_assert_snapshot(p_snapshot jsonb)
RETURNS void
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_snapshot IS NULL
     OR jsonb_typeof(p_snapshot) <> 'object'
     OR jsonb_typeof(p_snapshot -> 'lines') <> 'array'
     OR jsonb_typeof(p_snapshot -> 'brief') <> 'object' THEN
    RAISE EXCEPTION 'invalid plan snapshot' USING ERRCODE = '22023';
  END IF;
  IF octet_length(p_snapshot::text) > 1000000 THEN
    RAISE EXCEPTION 'plan snapshot too large' USING ERRCODE = '22023';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_row_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mehfil_sha256_hex(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mehfil_edit_key_matches(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mehfil_assert_snapshot(jsonb) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Public API
-- ---------------------------------------------------------------------------

-- Creates an event and its first version. Generates both tokens in the database and returns
-- them once; only their hashes are stored.
CREATE OR REPLACE FUNCTION public.create_event(
  p_title text,
  p_event_type text,
  p_event_date date,
  p_city text,
  p_guest_count integer,
  p_total_budget_paise bigint,
  p_protected_category text,
  p_snapshot jsonb,
  p_reason text DEFAULT 'Initial plan'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_edit_key text := encode(gen_random_bytes(32), 'hex');
  v_share_key text := encode(gen_random_bytes(32), 'hex');
  v_event_id uuid;
  v_version_id uuid;
BEGIN
  IF p_title IS NULL OR length(btrim(p_title)) NOT BETWEEN 1 AND 200
     OR p_city IS NULL OR length(btrim(p_city)) NOT BETWEEN 1 AND 120
     OR p_protected_category IS NULL OR length(p_protected_category) NOT BETWEEN 1 AND 40 THEN
    RAISE EXCEPTION 'invalid event details' USING ERRCODE = '22023';
  END IF;
  PERFORM public.mehfil_assert_snapshot(p_snapshot);

  INSERT INTO public.events (
    title, event_type, event_date, city, guest_count, total_budget_paise,
    protected_category, edit_key_hash, share_key_hash
  ) VALUES (
    btrim(p_title), p_event_type, p_event_date, btrim(p_city), p_guest_count, p_total_budget_paise,
    p_protected_category, public.mehfil_sha256_hex(v_edit_key), public.mehfil_sha256_hex(v_share_key)
  )
  RETURNING id INTO v_event_id;

  INSERT INTO public.plan_versions (
    event_id, version_number, parent_version_id, reason, lines, totals, snapshot
  ) VALUES (
    v_event_id, 1, NULL, left(coalesce(nullif(btrim(p_reason), ''), 'Initial plan'), 500),
    p_snapshot -> 'lines',
    jsonb_build_object('totalBudgetPaise', p_total_budget_paise),
    p_snapshot
  )
  RETURNING id INTO v_version_id;

  INSERT INTO public.change_records (plan_version_id, explanation)
  VALUES (v_version_id, left(coalesce(nullif(btrim(p_reason), ''), 'Initial plan'), 500));

  RETURN jsonb_build_object(
    'event_id', v_event_id,
    'edit_key', v_edit_key,
    'share_key', v_share_key,
    'version_id', v_version_id,
    'version_number', 1
  );
END;
$$;

-- Used by the claim route to check a key before the browser keeps it.
CREATE OR REPLACE FUNCTION public.verify_edit_key(p_event_id uuid, p_edit_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT public.mehfil_edit_key_matches(p_event_id, p_edit_key);
$$;

-- Latest plan for an organizer. Returns NULL for a wrong key and for an unknown plan alike.
CREATE OR REPLACE FUNCTION public.get_editable_plan(p_event_id uuid, p_edit_key text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.mehfil_edit_key_matches(p_event_id, p_edit_key) THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'event', jsonb_build_object(
      'id', e.id,
      'title', e.title,
      'event_type', e.event_type,
      'event_date', e.event_date,
      'city', e.city,
      'guest_count', e.guest_count,
      'total_budget_paise', e.total_budget_paise,
      'protected_category', e.protected_category
    ),
    'version', CASE WHEN pv.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', pv.id,
      'version_number', pv.version_number,
      'lines', pv.lines,
      'snapshot', pv.snapshot
    ) END
  )
  INTO v_result
  FROM public.events e
  LEFT JOIN LATERAL (
    SELECT v.id, v.version_number, v.lines, v.snapshot
    FROM public.plan_versions v
    WHERE v.event_id = e.id
    ORDER BY v.version_number DESC
    LIMIT 1
  ) pv ON true
  WHERE e.id = p_event_id;

  RETURN v_result;
END;
$$;

-- Appends a version. Writers are serialised on the event row, and a stale parent is reported
-- as a conflict together with the newest version (optimistic concurrency, D-15).
CREATE OR REPLACE FUNCTION public.save_plan_version(
  p_event_id uuid,
  p_edit_key text,
  p_parent_version_id uuid,
  p_snapshot jsonb,
  p_reason text,
  p_is_floor_protected boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_brief jsonb;
  v_latest public.plan_versions%ROWTYPE;
  v_new_id uuid;
  v_new_number integer;
  v_reason text := left(coalesce(nullif(btrim(p_reason), ''), 'Adjusted plan'), 500);
BEGIN
  IF NOT public.mehfil_edit_key_matches(p_event_id, p_edit_key) THEN
    RETURN jsonb_build_object('status', 'unauthorized');
  END IF;
  PERFORM public.mehfil_assert_snapshot(p_snapshot);
  v_brief := p_snapshot -> 'brief';

  -- Serialise concurrent writers for this event.
  PERFORM 1 FROM public.events WHERE id = p_event_id FOR UPDATE;

  SELECT * INTO v_latest
  FROM public.plan_versions
  WHERE event_id = p_event_id
  ORDER BY version_number DESC
  LIMIT 1;

  IF FOUND AND p_parent_version_id IS NOT NULL AND v_latest.id <> p_parent_version_id THEN
    RETURN jsonb_build_object(
      'status', 'conflict',
      'version_id', v_latest.id,
      'version_number', v_latest.version_number,
      'snapshot', v_latest.snapshot,
      'lines', v_latest.lines
    );
  END IF;

  v_new_number := coalesce(v_latest.version_number, 0) + 1;

  INSERT INTO public.plan_versions (
    event_id, version_number, parent_version_id, reason, lines, totals, snapshot
  ) VALUES (
    p_event_id, v_new_number, p_parent_version_id, v_reason,
    p_snapshot -> 'lines',
    jsonb_build_object('totalBudgetPaise', p_snapshot -> 'totalBudgetPaise'),
    p_snapshot
  )
  RETURNING id INTO v_new_id;

  INSERT INTO public.change_records (plan_version_id, explanation, is_floor_protected)
  VALUES (v_new_id, v_reason, coalesce(p_is_floor_protected, false));

  -- Keep the event summary (used by the family view) in step with the plan.
  UPDATE public.events SET
    title = coalesce(nullif(btrim(v_brief ->> 'title'), ''), title),
    event_date = coalesce((v_brief ->> 'eventDate')::date, event_date),
    city = coalesce(nullif(btrim(v_brief ->> 'city'), ''), city),
    guest_count = coalesce((v_brief ->> 'guestCount')::integer, guest_count),
    total_budget_paise = coalesce((p_snapshot ->> 'totalBudgetPaise')::bigint, total_budget_paise),
    protected_category = coalesce(nullif(v_brief ->> 'protectedCategory', ''), protected_category),
    updated_at = now()
  WHERE id = p_event_id;

  RETURN jsonb_build_object(
    'status', 'saved',
    'version_id', v_new_id,
    'version_number', v_new_number
  );
END;
$$;

-- Version history for an organizer, newest first. Empty for a wrong key or unknown plan.
CREATE OR REPLACE FUNCTION public.list_plan_versions(p_event_id uuid, p_edit_key text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  IF NOT public.mehfil_edit_key_matches(p_event_id, p_edit_key) THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'id', v.id,
      'version_number', v.version_number,
      'parent_version_id', v.parent_version_id,
      'reason', v.reason,
      'created_at', v.created_at,
      'lines', v.lines,
      'snapshot', v.snapshot
    ) ORDER BY v.version_number DESC)
    FROM public.plan_versions v
    WHERE v.event_id = p_event_id
  ), '[]'::jsonb);
END;
$$;

-- Replaces the family share link. Previously shared links stop working immediately.
CREATE OR REPLACE FUNCTION public.regenerate_share_key(p_event_id uuid, p_edit_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_share_key text := encode(gen_random_bytes(32), 'hex');
BEGIN
  IF NOT public.mehfil_edit_key_matches(p_event_id, p_edit_key) THEN
    RETURN NULL;
  END IF;

  UPDATE public.events
  SET share_key_hash = public.mehfil_sha256_hex(v_share_key), updated_at = now()
  WHERE id = p_event_id;

  RETURN jsonb_build_object('share_key', v_share_key);
END;
$$;

-- Read-only family view. Takes the PLAIN share token (the 20261030 version took its hash).
-- Never returns the edit key hash, quotes or notes.
DROP FUNCTION IF EXISTS public.get_shared_plan(text);
CREATE FUNCTION public.get_shared_plan(p_share_key text)
RETURNS TABLE (
  id UUID,
  title TEXT,
  event_type TEXT,
  event_date DATE,
  city TEXT,
  guest_count INTEGER,
  total_budget_paise BIGINT,
  protected_category TEXT,
  status TEXT,
  lines JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  IF p_share_key IS NULL OR length(p_share_key) NOT BETWEEN 16 AND 256 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    e.id, e.title, e.event_type, e.event_date, e.city, e.guest_count,
    e.total_budget_paise, e.protected_category, e.status, pv.lines
  FROM public.events e
  LEFT JOIN LATERAL (
    SELECT v.lines
    FROM public.plan_versions v
    WHERE v.event_id = e.id
    ORDER BY v.version_number DESC
    LIMIT 1
  ) pv ON true
  WHERE e.share_key_hash = public.mehfil_sha256_hex(p_share_key)
    AND e.status = 'active'
  LIMIT 1;
END;
$$;

DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.create_event(text, text, date, text, integer, bigint, text, jsonb, text)',
    'public.verify_edit_key(uuid, text)',
    'public.get_editable_plan(uuid, text)',
    'public.save_plan_version(uuid, text, uuid, jsonb, text, boolean)',
    'public.list_plan_versions(uuid, text)',
    'public.regenerate_share_key(uuid, text)',
    'public.get_shared_plan(text)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated, service_role', fn);
  END LOOP;
END;
$$;
