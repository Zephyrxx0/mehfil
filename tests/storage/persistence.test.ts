import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HybridPersistenceAdapter } from '@/lib/storage/persistence'
import { SyncStatusBadge } from '@/components/workspace/SyncStatusBadge'
import type { Plan } from '@/lib/engine/types'

describe('Local-First Persistence Adapter & Concurrency (D-13, D-14, D-15, COLLAB-01)', () => {
  let adapter: HybridPersistenceAdapter
  let mockPlan: Plan

  beforeEach(() => {
    window.localStorage.clear()
    adapter = new HybridPersistenceAdapter()

    mockPlan = {
      id: 'test-event-uuid-123',
      brief: {
        title: 'Meera & Rohan Sangeet',
        eventType: 'wedding',
        eventDate: '2026-12-15',
        city: 'Mumbai',
        guestCount: 200,
        totalBudgetPaise: 100000000,
        protectedCategory: 'venue',
      },
      lines: [
        {
          id: 'line-venue',
          name: 'Grand Ballroom',
          category: 'venue',
          lineType: 'fixed',
          baselinePaise: 40000000,
          currentPaise: 40000000,
          isProtected: true,
        },
        {
          id: 'line-catering',
          name: 'Royal Buffet',
          category: 'catering',
          lineType: 'per_guest',
          baselinePaise: 30000000,
          currentPaise: 30000000,
        },
      ],
      totalBudgetPaise: 100000000,
      baselineGuestCount: 200,
    }
  })

  it('saves plan to localStorage when offline or unconfigured, returning saved_local status', async () => {
    const result = await adapter.savePlan(mockPlan, undefined, 'Initial plan creation')

    expect(result.status).toBe('saved_local')
    expect(result.versionNumber).toBe(1)
    expect(result.versionId).toBeDefined()

    const storedPlan = window.localStorage.getItem('mehfil_plan_test-event-uuid-123')
    expect(storedPlan).not.toBeNull()
    expect(JSON.parse(storedPlan!).brief.title).toBe('Meera & Rohan Sangeet')
  })

  it('maintains an append-only version history stack in reverse chronological order', async () => {
    // Save v1
    const res1 = await adapter.savePlan(mockPlan, undefined, 'Initial v1')
    expect(res1.versionNumber).toBe(1)

    // Save v2
    const updatedPlan: Plan = {
      ...mockPlan,
      brief: { ...mockPlan.brief, guestCount: 220 },
    }
    const res2 = await adapter.savePlan(updatedPlan, res1.versionId, 'Scaled guests to 220')
    expect(res2.versionNumber).toBe(2)

    const history = await adapter.getVersionHistory(mockPlan.id)
    expect(history.length).toBe(2)
    expect(history[0].versionNumber).toBe(2)
    expect(history[0].reason).toBe('Scaled guests to 220')
    expect(history[1].versionNumber).toBe(1)
    expect(history[1].reason).toBe('Initial v1')
  })

  it('detects optimistic concurrency conflicts when parent_version_id does not match the latest stored version', async () => {
    // Initial save (v1)
    const v1 = await adapter.savePlan(mockPlan, undefined, 'Version 1')

    // Simulate Device A saves v2
    const planDeviceA: Plan = {
      ...mockPlan,
      brief: { ...mockPlan.brief, totalBudgetPaise: 110000000 },
    }
    const v2 = await adapter.savePlan(planDeviceA, v1.versionId, 'Device A update')
    expect(v2.versionNumber).toBe(2)

    // Device B attempts to save using stale parentVersionId (v1)
    const planDeviceB: Plan = {
      ...mockPlan,
      brief: { ...mockPlan.brief, guestCount: 250 },
    }
    const conflictResult = await adapter.savePlan(planDeviceB, v1.versionId, 'Device B update')

    expect(conflictResult.status).toBe('conflict')
    expect(conflictResult.versionNumber).toBe(2)
    expect(conflictResult.conflictPlan).toBeDefined()
    expect(conflictResult.conflictPlan?.brief.totalBudgetPaise).toBe(110000000)
  })

  it('performs forward restore by creating a new version with the snapshot of the target version', async () => {
    const v1 = await adapter.savePlan(mockPlan, undefined, 'Version 1 original')
    const modifiedPlan: Plan = {
      ...mockPlan,
      brief: { ...mockPlan.brief, city: 'Jaipur' },
    }
    await adapter.savePlan(modifiedPlan, v1.versionId, 'Changed city to Jaipur')

    // Restore back to v1
    const restoreResult = await adapter.restoreVersion(mockPlan.id, 1)
    expect(restoreResult.status).toBe('saved_local')
    expect(restoreResult.versionNumber).toBe(3) // Forward restore creates v3!

    const history = await adapter.getVersionHistory(mockPlan.id)
    expect(history[0].versionNumber).toBe(3)
    expect(history[0].reason).toContain('Reverted to v1')
  })

  describe('SyncStatusBadge UI Component (D-14, 03-UI-SPEC.md §1)', () => {
    it('renders cloud_saved state with green dot and "Saved to Cloud"', () => {
      render(
        React.createElement(SyncStatusBadge, { status: 'cloud_saved', lastSavedAt: new Date() })
      )
      expect(screen.getByText('Saved to Cloud')).toBeInTheDocument()
      const badge = screen.getByTestId('sync-status-badge')
      expect(badge).toBeInTheDocument()
    })

    it('renders syncing state with pulsing ring and "Syncing..."', () => {
      render(React.createElement(SyncStatusBadge, { status: 'syncing' }))
      expect(screen.getByText('Syncing...')).toBeInTheDocument()
    })

    it('renders local_saved state with lightning icon and "Saved Locally"', () => {
      render(
        React.createElement(SyncStatusBadge, { status: 'local_saved', lastSavedAt: new Date() })
      )
      expect(screen.getByText('Saved Locally')).toBeInTheDocument()
    })
  })
})
