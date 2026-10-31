-- !! LOCAL DEVELOPMENT ONLY. NEVER RUN THIS AGAINST A PRODUCTION DATABASE. !!
-- The edit and share tokens below are published in this file, so anyone who can read
-- the repository can open or edit the seeded celebration.
-- Seed: supabase/seed.sql
-- Mehfil Milestone 1: Realistic seed data based on South Indian Wedding Archetype

DO $$
DECLARE
  v_event_id UUID := '11111111-1111-1111-1111-111111111111';
  v_version_id UUID := '22222222-2222-2222-2222-222222222222';
  -- Precomputed SHA-256 for test edit token '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  -- sha256: 4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce
  v_edit_hash TEXT := '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce';
  -- Precomputed SHA-256 for test share token 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210'
  -- sha256: 12f468dc04332ab8a14ec47183eec17621f3fc4cfa432049e62cf0c4516ff2be
  v_share_hash TEXT := '12f468dc04332ab8a14ec47183eec17621f3fc4cfa432049e62cf0c4516ff2be';
BEGIN
  -- 1. Insert Event
  INSERT INTO public.events (
    id,
    title,
    event_type,
    event_date,
    city,
    guest_count,
    total_budget_paise,
    protected_category,
    edit_key_hash,
    share_key_hash,
    status
  ) VALUES (
    v_event_id,
    'Kavya & Siddharth Wedding',
    'wedding',
    '2026-11-20',
    'Chennai',
    250,
    150000000, -- ₹15,00,000 (15 Lakhs in paise)
    'catering',
    v_edit_hash,
    v_share_hash,
    'active'
  ) ON CONFLICT (id) DO NOTHING;

  -- 2. Insert Initial Version v1
  INSERT INTO public.plan_versions (
    id,
    event_id,
    version_number,
    parent_version_id,
    reason,
    lines,
    tasks,
    totals,
    is_accepted
  ) VALUES (
    v_version_id,
    v_event_id,
    1,
    NULL,
    'Initial plan created from South Indian Wedding archetype',
    '[
      {"id": "line-venue", "name": "Traditional Mandapam & Venue", "category": "venue", "lineType": "fixed", "baselinePaise": 37500000, "currentPaise": 37500000},
      {"id": "line-catering", "name": "Traditional Sadhya Feast", "category": "catering", "lineType": "per_guest", "baselinePaise": 45000000, "currentPaise": 45000000, "isProtected": true},
      {"id": "line-decor", "name": "Fresh Marigold & Jasmine Floral Decor", "category": "decor", "lineType": "flexible", "baselinePaise": 22500000, "currentPaise": 22500000, "elasticityRank": 3},
      {"id": "line-photo", "name": "Candid Photography & Film", "category": "photo_film", "lineType": "fixed", "baselinePaise": 18000000, "currentPaise": 18000000},
      {"id": "line-nadaswaram", "name": "Classical Nadaswaram & Thavil Troupe", "category": "entertainment", "lineType": "fixed", "baselinePaise": 7500000, "currentPaise": 7500000, "elasticityRank": 1},
      {"id": "line-favors", "name": "Tamboolam Bags & Gifts", "category": "favors", "lineType": "per_guest", "baselinePaise": 4500000, "currentPaise": 4500000, "elasticityRank": 2},
      {"id": "line-misc", "name": "Pooja Items & Logistics", "category": "misc", "lineType": "flexible", "baselinePaise": 7500000, "currentPaise": 7500000},
      {"id": "line-buffer", "name": "Contingency Reserve", "category": "contingency", "lineType": "buffer", "baselinePaise": 7500000, "currentPaise": 7500000}
    ]'::jsonb,
    '[]'::jsonb,
    '{"totalBudgetPaise": 150000000}'::jsonb,
    true
  ) ON CONFLICT (id) DO NOTHING;

  -- 3. Insert Change Record
  INSERT INTO public.change_records (
    plan_version_id,
    deltas,
    explanation,
    is_floor_protected
  ) VALUES (
    v_version_id,
    '[]'::jsonb,
    'Initial plan created with South Indian Wedding archetype; Catering selected as Protected Moment floor.',
    true
  ) ON CONFLICT DO NOTHING;

END $$;
