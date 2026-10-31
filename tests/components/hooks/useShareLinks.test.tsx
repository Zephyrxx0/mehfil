import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useShareLinks } from '@/components/workspace/hooks/useShareLinks'
import { persistence } from '@/lib/storage/persistence'

vi.mock('@/lib/storage/persistence', () => ({
  persistence: { regenerateShareKey: vi.fn() },
}))

const regenerateShareKey = vi.mocked(persistence.regenerateShareKey)
const EDIT_KEY = 'e'.repeat(40)

function setup(options: { editKey?: string; token?: string; cloud?: boolean } = {}) {
  return renderHook(() =>
    useShareLinks({
      planId: 'plan-1',
      planTitle: 'Riya & Kabir',
      editKey: options.editKey,
      initialShareToken: options.token,
      isCloudConfigured: options.cloud ?? true,
    })
  )
}

describe('useShareLinks', () => {
  const writeText = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    })
  })

  it('builds edit and share URLs only from keys that exist', () => {
    const { result } = setup({ editKey: EDIT_KEY, token: 'tok' })
    expect(result.current.editUrl).toBe(`${window.location.origin}/plan/plan-1?key=${EDIT_KEY}`)
    expect(result.current.shareUrl).toBe(`${window.location.origin}/share/tok`)

    const bare = setup()
    expect(bare.result.current.editUrl).toBeUndefined()
    expect(bare.result.current.shareUrl).toBeUndefined()
  })

  it('allows link management only with cloud sync and an edit key', () => {
    expect(setup({ editKey: EDIT_KEY, cloud: true }).result.current.canManageShareLink).toBe(true)
    expect(setup({ editKey: EDIT_KEY, cloud: false }).result.current.canManageShareLink).toBe(false)
    expect(setup({ cloud: true }).result.current.canManageShareLink).toBe(false)
  })

  it('url-encodes the WhatsApp messages with the plan title and link', () => {
    const { result } = setup({ editKey: EDIT_KEY, token: 'tok' })
    expect(decodeURIComponent(result.current.whatsappEditMessage)).toContain(
      `organizer edit link for Riya & Kabir. Keep this secret: ${result.current.editUrl}`
    )
    expect(decodeURIComponent(result.current.whatsappShareMessage)).toContain(
      `Riya & Kabir celebration plan on Mehfil! Take a look: ${result.current.shareUrl}`
    )
  })

  it('copies the share URL and sets the copied flag', async () => {
    const { result } = setup({ editKey: EDIT_KEY, token: 'tok' })
    act(() => result.current.copyShareUrl())
    await waitFor(() => expect(result.current.copiedShareLink).toBe(true))
    expect(writeText).toHaveBeenCalledWith(result.current.shareUrl)
    expect(result.current.copiedEditKey).toBe(false)
  })

  it('stores the regenerated token and closes the confirmation', async () => {
    regenerateShareKey.mockResolvedValue({ shareToken: 'fresh' })
    const { result } = setup({ editKey: EDIT_KEY, token: 'old' })
    act(() => result.current.setIsAlertOpen(true))
    await act(async () => {
      await result.current.regenerateShareKey()
    })
    expect(regenerateShareKey).toHaveBeenCalledWith('plan-1', EDIT_KEY)
    expect(result.current.shareUrl).toBe(`${window.location.origin}/share/fresh`)
    expect(result.current.regenerateFailed).toBe(false)
    expect(result.current.isAlertOpen).toBe(false)
    expect(result.current.isRegenerating).toBe(false)
  })

  it('flags a failed regeneration and keeps the old token', async () => {
    regenerateShareKey.mockRejectedValue(new Error('offline'))
    const { result } = setup({ editKey: EDIT_KEY, token: 'old' })
    await act(async () => {
      await result.current.regenerateShareKey()
    })
    expect(result.current.regenerateFailed).toBe(true)
    expect(result.current.shareUrl).toBe(`${window.location.origin}/share/old`)
  })
})
