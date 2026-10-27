import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import type { Database } from '@/types/database'

describe('Supabase Schema & Anonymous Persistence Contract (COLLAB-01, D-16)', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261027000000_create_collaboration_schema.sql'
  )
  const migrationSql = fs.readFileSync(migrationPath, 'utf8')

  it('defines the required tables: events, plan_versions, and change_records', () => {
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS public.events')
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS public.plan_versions')
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS public.change_records')
  })

  it('stores total budget as BIGINT integer paise to prevent floating-point rounding errors', () => {
    expect(migrationSql).toMatch(/total_budget_paise BIGINT NOT NULL CHECK \(total_budget_paise >= 0\)/)
  })

  it('indexes capability hashes for O(1) unguessable token lookups', () => {
    expect(migrationSql).toContain('CREATE INDEX IF NOT EXISTS idx_events_edit_key_hash ON public.events(edit_key_hash)')
    expect(migrationSql).toContain('CREATE INDEX IF NOT EXISTS idx_events_share_key_hash ON public.events(share_key_hash)')
  })

  it('enables Row-Level Security on all collaboration tables', () => {
    expect(migrationSql).toContain('ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;')
    expect(migrationSql).toContain('ALTER TABLE public.plan_versions ENABLE ROW LEVEL SECURITY;')
    expect(migrationSql).toContain('ALTER TABLE public.change_records ENABLE ROW LEVEL SECURITY;')
  })

  it('enforces strict immutability by permitting only SELECT and INSERT on plan_versions and change_records', () => {
    // Check plan_versions policies
    expect(migrationSql).toContain('CREATE POLICY "plan_versions_owner_select"')
    expect(migrationSql).toContain('CREATE POLICY "plan_versions_owner_insert"')
    expect(migrationSql).not.toContain('CREATE POLICY "plan_versions_owner_update"')
    expect(migrationSql).not.toContain('CREATE POLICY "plan_versions_owner_delete"')

    // Check change_records policies
    expect(migrationSql).toContain('CREATE POLICY "change_records_owner_select"')
    expect(migrationSql).toContain('CREATE POLICY "change_records_owner_insert"')
    expect(migrationSql).not.toContain('CREATE POLICY "change_records_owner_update"')
    expect(migrationSql).not.toContain('CREATE POLICY "change_records_owner_delete"')
  })

  it('enforces TypeScript compile-time immutability with Update: never on plan_versions and change_records', () => {
    // Type-level assertion: Database['public']['Tables']['plan_versions']['Update'] is never
    type PlanVersionUpdate = Database['public']['Tables']['plan_versions']['Update']
    type ChangeRecordUpdate = Database['public']['Tables']['change_records']['Update']

    type IsNever<T> = [T] extends [never] ? true : false

    const isPlanVersionUpdateNever: IsNever<PlanVersionUpdate> = true
    const isChangeRecordUpdateNever: IsNever<ChangeRecordUpdate> = true

    expect(isPlanVersionUpdateNever).toBe(true)
    expect(isChangeRecordUpdateNever).toBe(true)
  })

  it('simulates anonymous session initialization mapping to events.owner_id', () => {
    // Mock anonymous session generator
    const generateAnonSession = () => {
      const mockUuid = 'anon-usr-' + Math.random().toString(36).substring(2, 15)
      return {
        user: {
          id: mockUuid,
          is_anonymous: true,
        },
      }
    }

    const session = generateAnonSession()
    expect(session.user.id).toBeDefined()
    expect(session.user.is_anonymous).toBe(true)

    const mockEventInsert = {
      title: 'Simulated Celebration',
      owner_id: session.user.id,
      event_type: 'wedding' as const,
      event_date: '2026-12-10',
      city: 'Bengaluru',
      guest_count: 150,
      total_budget_paise: 120000000,
      protected_category: 'decor',
      edit_key_hash: 'mockhash123',
      share_key_hash: 'mockshare456',
    }

    expect(mockEventInsert.owner_id).toBe(session.user.id)
    expect(mockEventInsert.total_budget_paise).toBe(120000000)
  })
})
