-- Migration: 20261031120000_shared_limits.sql
-- Shared abuse limits that hold across every server instance, plus a circuit breaker on plan creation.
--
-- Why: the rate limiter and the daily model-call cap lived in each server instance's memory, so on
-- serverless hosting the real ceiling was `limit x warm instances`. These counters live in Postgres,
-- so one count is shared by all of them (ADR-0011).
--
-- Who may call what:
--  * consume_rate_limit / consume_model_call are for the SERVER only (service_role). They take an
--    arbitrary bucket name, so if the public key could call them, anyone could fill a victim's
--    bucket to lock them out, or burn the whole daily model allowance.
--  * create_event stays callable with the public key, as before, but now throttles itself.
--
-- Safe to re-run: every statement is idempotent.

-- ---------------------------------------------------------------------------
-- 1. Counter storage (closed to the browser, like every other table)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limit_hits (
  id BIGSERIAL PRIMARY KEY,
  bucket TEXT NOT NULL CHECK (length(bucket) BETWEEN 1 AND 200),
  hit_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_hits_bucket_time ON public.rate_limit_hits (bucket, hit_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_hits_time ON public.rate_limit_hits (hit_at);

CREATE TABLE IF NOT EXISTS public.model_usage (
  day DATE PRIMARY KEY,
  calls INTEGER NOT NULL DEFAULT 0 CHECK (calls >= 0)
);

ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rate_limit_hits, public.model_usage FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.rate_limit_hits_id_seq FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Sliding-window rate limit (internal helper, not callable through the API)
-- ---------------------------------------------------------------------------
-- Records one hit and says whether it is allowed. Callers for the same bucket are serialised with
-- an advisory lock, so two instances cannot both take the last slot.
CREATE OR REPLACE FUNCTION public.mehfil_hit_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_window interval;
  v_count integer;
  v_oldest timestamptz;
BEGIN
  IF p_bucket IS NULL OR length(p_bucket) NOT BETWEEN 1 AND 200
     OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100000
     OR p_window_seconds IS NULL OR p_window_seconds NOT BETWEEN 1 AND 86400 THEN
    RAISE EXCEPTION 'invalid rate limit arguments' USING ERRCODE = '22023';
  END IF;

  v_window := make_interval(secs => p_window_seconds);
  PERFORM pg_advisory_xact_lock(hashtextextended(p_bucket, 0));

  DELETE FROM public.rate_limit_hits WHERE bucket = p_bucket AND hit_at < now() - v_window;

  SELECT count(*), min(hit_at) INTO v_count, v_oldest
  FROM public.rate_limit_hits
  WHERE bucket = p_bucket;

  IF v_count >= p_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'retry_after_seconds', greatest(1, ceil(extract(epoch FROM (v_oldest + v_window - now())))::integer)
    );
  END IF;

  INSERT INTO public.rate_limit_hits (bucket) VALUES (p_bucket);

  -- Keep the table small: now and then, drop everything older than the longest allowed window.
  IF random() < 0.02 THEN
    DELETE FROM public.rate_limit_hits WHERE hit_at < now() - interval '1 day';
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', p_limit - v_count - 1,
    'retry_after_seconds', 0
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Server-only API
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.mehfil_hit_rate_limit(p_bucket, p_limit, p_window_seconds);
$$;

-- Takes one model call from today's (UTC) allowance. The increment and the cap check are a single
-- statement, so concurrent callers can never push the count past the cap.
CREATE OR REPLACE FUNCTION public.consume_model_call(p_cap integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_calls integer;
BEGIN
  IF p_cap IS NULL OR p_cap < 0 OR p_cap > 1000000 THEN
    RAISE EXCEPTION 'invalid model cap' USING ERRCODE = '22023';
  END IF;
  IF p_cap = 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.model_usage AS usage (day, calls)
  VALUES ((now() AT TIME ZONE 'utc')::date, 1)
  ON CONFLICT (day) DO UPDATE SET calls = usage.calls + 1
  WHERE usage.calls < p_cap
  RETURNING usage.calls INTO v_calls;

  IF random() < 0.02 THEN
    DELETE FROM public.model_usage WHERE day < (now() AT TIME ZONE 'utc')::date - 30;
  END IF;

  RETURN v_calls IS NOT NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. create_event throttles itself (circuit breaker)
-- ---------------------------------------------------------------------------
-- The database cannot tell callers apart (the public key is shared by everyone), so this limits the
-- overall rate at which plans are created. That bounds how fast storage can grow if someone scripts
-- plan creation. The app falls back to saving the plan on the visitor's device while the breaker is
-- open, so legitimate users lose cloud sync for a few minutes, not their plan. It does not isolate
-- one abuser from another: per-client limits need the server route, and a distributed flood needs a
-- CAPTCHA or the platform's firewall.
--   Limit: 300 plans per rolling 10 minutes, across everyone.
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

  -- After validation, so malformed requests do not use up the allowance.
  IF NOT (public.mehfil_hit_rate_limit('create_event:all', 300, 600) ->> 'allowed')::boolean THEN
    RAISE EXCEPTION 'too many plans are being created right now, try again shortly'
      USING ERRCODE = '53400';
  END IF;

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

-- ---------------------------------------------------------------------------
-- 5. Grants
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.mehfil_hit_rate_limit(text, integer, integer)
  FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;

REVOKE ALL ON FUNCTION public.consume_model_call(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_model_call(integer) TO service_role;

-- create_event keeps the grants from the previous migration (public key may call it).
REVOKE ALL ON FUNCTION public.create_event(text, text, date, text, integer, bigint, text, jsonb, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_event(text, text, date, text, integer, bigint, text, jsonb, text)
  TO anon, authenticated, service_role;
