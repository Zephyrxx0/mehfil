-- Migration: 20261031140000_edit_key_failure_limit.sql
-- Per-plan limit on FAILED edit-key attempts, enforced inside the database.
--
-- Why: the five edit-key RPCs (verify_edit_key, get_editable_plan, save_plan_version,
-- list_plan_versions, regenerate_share_key) are callable with the public anon key, so anyone can
-- call them directly and skip any limit applied in a server route. Edit keys are 256-bit, so
-- guessing one is not feasible; this limit only cuts abuse and noise. They all funnel through
-- public.mehfil_edit_key_matches, so the limit lives there.
--
-- Rule: once a plan has 20 failed attempts in the last 10 minutes, every attempt on that plan is
-- refused WITHOUT looking at the key (the correct key is refused too) until old failures age out.
-- A correct key records nothing. Other plans are unaffected. The answer is the same `false` whether
-- the plan is unknown, archived, locked out or the key is wrong, so nothing new is revealed.
--
-- Consequence for the callers: the helper now writes, so it is VOLATILE, and a STABLE function may
-- not call a volatile one that writes. verify_edit_key, get_editable_plan and list_plan_versions
-- were declared STABLE, so they are re-created below as VOLATILE with otherwise identical bodies.
-- save_plan_version and regenerate_share_key were already VOLATILE and are not touched. Over HTTP,
-- PostgREST only allows VOLATILE functions through POST, which is what supabase-js rpc() uses.
--
-- Safe to re-run: every statement is idempotent.

-- ---------------------------------------------------------------------------
-- 1. Failure storage (closed to the browser, like rate_limit_hits)
-- ---------------------------------------------------------------------------
-- No foreign key on purpose: a failure row must never block deleting a plan, and rows expire fast.
CREATE TABLE IF NOT EXISTS public.edit_key_failures (
  event_id UUID NOT NULL,
  failed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Serves the lockout count and the per-plan cleanup.
CREATE INDEX IF NOT EXISTS idx_edit_key_failures_event_time
  ON public.edit_key_failures (event_id, failed_at);
-- Serves the occasional table-wide cleanup (event_id is not in the predicate there).
CREATE INDEX IF NOT EXISTS idx_edit_key_failures_time ON public.edit_key_failures (failed_at);

ALTER TABLE public.edit_key_failures ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.edit_key_failures FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. The helper: check the key, count failures, lock out after 20 in 10 minutes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mehfil_edit_key_matches(p_event_id uuid, p_edit_key text)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_hash text;
  v_active boolean;
  v_recent integer;
BEGIN
  IF p_event_id IS NULL THEN
    RETURN false;
  END IF;

  -- Locked out: refuse without looking at the key. The inner LIMIT stops the count at 20.
  SELECT count(*) INTO v_recent
  FROM (
    SELECT 1
    FROM public.edit_key_failures f
    WHERE f.event_id = p_event_id
      AND f.failed_at > now() - interval '10 minutes'
    LIMIT 20
  ) recent;
  IF v_recent >= 20 THEN
    RETURN false;
  END IF;

  SELECT e.edit_key_hash INTO v_hash
  FROM public.events e
  WHERE e.id = p_event_id
    AND e.status = 'active';
  v_active := FOUND;

  IF p_edit_key IS NULL THEN
    RETURN false;
  END IF;

  IF v_active
     AND length(p_edit_key) BETWEEN 16 AND 256
     AND v_hash = public.mehfil_sha256_hex(p_edit_key) THEN
    RETURN true;
  END IF;

  -- Wrong or malformed key. Only count it for a plan that exists, so unknown ids cannot fill the table.
  IF v_active THEN
    INSERT INTO public.edit_key_failures (event_id) VALUES (p_event_id);

    -- Keep the table small. Always trim this plan's old rows (uses the (event_id, failed_at) index).
    DELETE FROM public.edit_key_failures
    WHERE event_id = p_event_id
      AND failed_at < now() - interval '1 hour';

    -- Now and then trim every plan's old rows (uses the failed_at index), so plans that stop
    -- being attacked do not leave rows behind.
    IF random() < 0.02 THEN
      DELETE FROM public.edit_key_failures WHERE failed_at < now() - interval '1 hour';
    END IF;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.mehfil_edit_key_matches(uuid, text) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Callers that were STABLE, re-created as VOLATILE (bodies unchanged)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_edit_key(p_event_id uuid, p_edit_key text)
RETURNS boolean
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT public.mehfil_edit_key_matches(p_event_id, p_edit_key);
$$;

CREATE OR REPLACE FUNCTION public.get_editable_plan(p_event_id uuid, p_edit_key text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
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

CREATE OR REPLACE FUNCTION public.list_plan_versions(p_event_id uuid, p_edit_key text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
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

-- ---------------------------------------------------------------------------
-- 4. Grants, restated as they stand after 20261031130000_advisor_fixes.sql
-- ---------------------------------------------------------------------------
-- anon (the browser's public key) and service_role may execute; PUBLIC and authenticated may not.
REVOKE ALL ON FUNCTION public.verify_edit_key(uuid, text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_edit_key(uuid, text) TO anon, service_role;

REVOKE ALL ON FUNCTION public.get_editable_plan(uuid, text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.get_editable_plan(uuid, text) TO anon, service_role;

REVOKE ALL ON FUNCTION public.list_plan_versions(uuid, text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.list_plan_versions(uuid, text) TO anon, service_role;
