'use client'

import { useEffect, useState } from 'react'
import { createLogger } from '@/lib/logger'
import { persistence } from '@/lib/storage/persistence'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { SITE_URL } from '@/lib/site'

const logger = createLogger('share-modal')

interface UseShareLinksOptions {
  planId: string
  planTitle: string
  editKey?: string
  initialShareToken?: string
  isCloudConfigured?: boolean
}

/**
 * Capability links for a plan: the private edit URL, the family share URL, WhatsApp messages,
 * copy-to-clipboard feedback, and share key regeneration. The share token comes only from the
 * database, so there is no placeholder link (S2).
 */
export function useShareLinks({
  planId,
  planTitle,
  editKey,
  initialShareToken,
  isCloudConfigured: customIsCloudConfigured,
}: UseShareLinksOptions) {
  const isCloudConfigured = customIsCloudConfigured ?? isSupabaseConfigured()

  const [copiedEditKey, setCopiedEditKey] = useState(false)
  const [copiedShareLink, setCopiedShareLink] = useState(false)
  // Only a token the database stored can open a page, so there is no placeholder (S2).
  const [shareToken, setShareToken] = useState<string | undefined>(initialShareToken)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenerateFailed, setRegenerateFailed] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)

  useEffect(() => {
    setShareToken(initialShareToken)
  }, [initialShareToken])

  // Construct absolute capability URLs safely on browser mount
  const origin = typeof window !== 'undefined' ? window.location.origin : SITE_URL
  const editUrl = editKey ? `${origin}/plan/${planId}?key=${editKey}` : undefined
  const shareUrl = shareToken ? `${origin}/share/${shareToken}` : undefined
  const canManageShareLink = isCloudConfigured && Boolean(editKey)

  const copyToClipboard = async (text: string, setCopied: (copied: boolean) => void) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      logger.warn('Clipboard write failed')
    }
  }

  const copyEditUrl = () => {
    if (editUrl) void copyToClipboard(editUrl, setCopiedEditKey)
  }

  const copyShareUrl = () => {
    if (shareUrl) void copyToClipboard(shareUrl, setCopiedShareLink)
  }

  const regenerateShareKey = async () => {
    setIsRegenerating(true)
    setRegenerateFailed(false)
    try {
      const result = await persistence.regenerateShareKey(planId, editKey)
      if (result) setShareToken(result.shareToken)
      else setRegenerateFailed(true)
    } catch (err) {
      logger.warn('Failed to regenerate share key', { err })
      setRegenerateFailed(true)
    } finally {
      setIsRegenerating(false)
      setIsAlertOpen(false)
    }
  }

  const whatsappEditMessage = encodeURIComponent(
    `Here is my private Mehfil organizer edit link for ${planTitle}. Keep this secret: ${editUrl ?? ''}`
  )
  const whatsappShareMessage = encodeURIComponent(
    `Here's our ${planTitle} celebration plan on Mehfil! Take a look: ${shareUrl ?? ''}`
  )

  return {
    isCloudConfigured,
    canManageShareLink,
    editUrl,
    shareUrl,
    copiedEditKey,
    copiedShareLink,
    copyEditUrl,
    copyShareUrl,
    isRegenerating,
    regenerateFailed,
    isAlertOpen,
    setIsAlertOpen,
    regenerateShareKey,
    whatsappEditMessage,
    whatsappShareMessage,
  }
}
