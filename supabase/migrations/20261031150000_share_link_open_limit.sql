-- Migration: 20261031150000_share_link_open_limit.sql
-- Per-plan limit on how often a family share link can be opened, enforced inside the database.
--
-- Why: get_shared_plan is callable with the public anon key, so anyone who holds a share link (or a
-- script that has it) can call the function directly and read the plan in a tight loop, skipping any
-- limit applied in a server route. Each open reads the plan and its latest version, so an unbounded
-- loop is a cheap way to load the database. The limit is shared by every caller of the same link.
--
-- Rule: a share link can be opened at most 120 times per rolling 60 seconds, PER PLAN. The count uses
-- the shared helper public.mehfil_hit_rate_limit with the bucket 'share_open:' || <event id>. Over the
-- limit, the function returns an empty result, exactly like an unknown or revoked link, so it does not
-- say why. Other plans are unaffected.
--
-- Unknown keys cost nothing: the plan is looked up by the hash of the key first, and only a key that
-- matches a real active plan is counted. A malformed key, an unknown key, a revoked key (see
-- regenerate_share_key) and an archived plan write nothing and touch nobody's bucket. So sending random
-- keys can neither fill the table nor lock another family out of its link. The bucket is named after
-- the plan, which the caller cannot choose without already holding a valid key.
--
-- Consequence for callers: the function now writes, so it is VOLATILE (it was STABLE). PostgREST only
-- allows VOLATILE functions through POST, which is what the app's rpc client uses. The signature and
-- column list are unchanged, so CREATE OR REPLACE is enough and the query logic is the same as in
-- 20261031000000_token_checked_access.sql.
--
-- Safe to re-run: every statement is idempotent.

CREATE OR REPLACE FUNCTION public.get_shared_plan(p_share_key text)
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
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  IF p_share_key IS NULL OR length(p_share_key) NOT BETWEEN 16 AND 256 THEN
    RETURN;
  END IF;

  -- Find the plan first. No match means nothing is written and no bucket is touched.
  SELECT e.id INTO v_event_id
  FROM public.events e
  WHERE e.share_key_hash = public.mehfil_sha256_hex(p_share_key)
    AND e.status = 'active'
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- A real plan: count this open. Over the limit looks the same as an unknown link.
  IF NOT (public.mehfil_hit_rate_limit('share_open:' || v_event_id::text, 120, 60) ->> 'allowed')::boolean THEN
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

-- Grants, restated as they stand after 20261031130000_advisor_fixes.sql:
-- anon (the browser's public key) and service_role may execute; PUBLIC and authenticated may not.
REVOKE ALL ON FUNCTION public.get_shared_plan(text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_plan(text) TO anon, service_role;
