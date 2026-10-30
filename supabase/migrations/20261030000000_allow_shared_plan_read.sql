-- Migration: 20261030000000_allow_shared_plan_read.sql
-- Security Hardening: Expose safe read-only plan RPC for public shared links.
-- Uses SECURITY DEFINER to allow anonymous family members to read active celebration
-- summaries via share_key_hash without relaxing RLS table policies or leaking edit_key_hash.

CREATE OR REPLACE FUNCTION public.get_shared_plan(p_share_key_hash text)
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
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.event_type,
    e.event_date,
    e.city,
    e.guest_count,
    e.total_budget_paise,
    e.protected_category,
    e.status,
    pv.lines
  FROM public.events e
  LEFT JOIN LATERAL (
    SELECT pv_inner.lines
    FROM public.plan_versions pv_inner
    WHERE pv_inner.event_id = e.id
    ORDER BY pv_inner.version_number DESC
    LIMIT 1
  ) pv ON true
  WHERE e.share_key_hash = p_share_key_hash
    AND e.status = 'active'
  LIMIT 1;
END;
$$;

-- Grant execution to public anon and authenticated roles
REVOKE ALL ON FUNCTION public.get_shared_plan(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_plan(text) TO anon, authenticated, service_role;
