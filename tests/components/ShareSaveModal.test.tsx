import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShareSaveModal } from '@/components/workspace/ShareSaveModal'

describe('ShareSaveModal UI Component (D-01, D-08, COLLAB-02, COLLAB-03)', () => {
  const planId = 'test-plan-id-123'
  const planTitle = 'Riya & Kabir Wedding'
  const editKey = 'secreteditkey1234567890abcdef1234567890'
  const initialShareToken = 'publicsharetoken123'
  const writeTextMock = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
      writable: true,
    })
  })

  it('renders modal with 2 tabs: Organizer Edit Key and Family Share Link', () => {
    render(
      <ShareSaveModal
        open={true}
        onOpenChange={vi.fn()}
        planId={planId}
        planTitle={planTitle}
        editKey={editKey}
        initialShareToken={initialShareToken}
      />
    )

    expect(screen.getByText('Share & Save Celebration')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Organizer Edit Key/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Family Share Link/i })).toBeInTheDocument()
  })

  it('Tab 1 displays private key warning, SVG QR code, and WhatsApp trigger', () => {
    render(
      <ShareSaveModal
        open={true}
        onOpenChange={vi.fn()}
        planId={planId}
        planTitle={planTitle}
        editKey={editKey}
        initialShareToken={initialShareToken}
      />
    )

    expect(screen.getByText(/Keep this private/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Scan with phone camera to resume editing on mobile/i)
    ).toBeInTheDocument()

    // Verify WhatsApp button with prefilled text
    const whatsappBtn = screen.getByRole('link', { name: /Send Edit Key via WhatsApp/i })
    expect(whatsappBtn).toHaveAttribute('href', expect.stringContaining('https://wa.me/?text='))
  })

  it('copies private edit URL to clipboard and shows feedback', async () => {
    render(
      <ShareSaveModal
        open={true}
        onOpenChange={vi.fn()}
        planId={planId}
        planTitle={planTitle}
        editKey={editKey}
        initialShareToken={initialShareToken}
      />
    )

    const copyBtn = screen.getByRole('button', { name: /Copy Key/i })
    fireEvent.click(copyBtn)

    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining(`/plan/${planId}?key=${editKey}`)
    )

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument()
    })
  })

  it('Tab 2 displays sanitized view disclaimer, share link, and handles link regeneration', async () => {
    const user = userEvent.setup()

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ shareToken: 'new-fresh-token-999' }),
    } as any)

    render(
      <ShareSaveModal
        open={true}
        onOpenChange={vi.fn()}
        planId={planId}
        planTitle={planTitle}
        editKey={editKey}
        initialShareToken={initialShareToken}
      />
    )

    // Switch to Family tab using userEvent
    const familyTab = screen.getByRole('tab', { name: /Family Share Link/i })
    await user.click(familyTab)

    await waitFor(() => {
      expect(screen.getByText(/Sanitized View:/i)).toBeInTheDocument()
    })

    // Click Regenerate Link trigger
    const regenerateBtn = screen.getByRole('button', { name: /Regenerate Link/i })
    await user.click(regenerateBtn)

    // Alert dialog opens
    await waitFor(() => {
      expect(screen.getByText('Invalidate Old Link & Create New?')).toBeInTheDocument()
    })

    const confirmBtn = screen.getByRole('button', { name: /Invalidate & Regenerate/i })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(`/api/plan/${planId}/regenerate-share`, {
        method: 'POST',
      })
    })
  })

  it('displays presentable notice when cloud database is not configured', () => {
    render(
      <ShareSaveModal
        open={true}
        onOpenChange={vi.fn()}
        planId={planId}
        planTitle={planTitle}
        editKey={editKey}
        initialShareToken={initialShareToken}
        isCloudConfigured={false}
      />
    )

    expect(screen.getByTestId('cloud-unconfigured-notice')).toBeInTheDocument()
    expect(screen.getByText('Saved to this device only')).toBeInTheDocument()
    expect(
      screen.getByText(/Cloud database sync isn't configured yet/i)
    ).toBeInTheDocument()
  })

  it('hides unconfigured notice when cloud database is configured', () => {
    render(
      <ShareSaveModal
        open={true}
        onOpenChange={vi.fn()}
        planId={planId}
        planTitle={planTitle}
        editKey={editKey}
        initialShareToken={initialShareToken}
        isCloudConfigured={true}
      />
    )

    expect(screen.queryByTestId('cloud-unconfigured-notice')).not.toBeInTheDocument()
  })
})
