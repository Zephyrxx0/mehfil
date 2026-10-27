-- Migration: 20261027000000_create_collaboration_schema.sql
-- Mehfil Milestone 1: Phase 3 Anonymous Persistence & Collaboration Schema
-- Pure code owns arithmetic: BigInt integer paise currency, strictly immutable version records.

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

-- Plan Versions RLS: SELECT and INSERT only (strictly immutable - no UPDATE / DELETE)
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

-- Change Records RLS: SELECT and INSERT only (strictly immutable - no UPDATE / DELETE)
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
