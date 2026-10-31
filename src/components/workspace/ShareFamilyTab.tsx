import * as React from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Lock, Loader2, RefreshCw, Share2 } from 'lucide-react'
import { ShareCopyRow } from './ShareCopyRow'
import { ShareWhatsAppButton } from './ShareWhatsAppButton'

interface ShareFamilyTabProps {
  shareUrl?: string
  canManageShareLink: boolean
  copied: boolean
  onCopy: () => void
  whatsappMessage: string
  isRegenerating: boolean
  regenerateFailed: boolean
  /** Asks for confirmation before replacing an existing link. */
  onRequestRegenerate: () => void
  /** Creates a link straight away when none exists yet. */
  onCreateLink: () => void
}

/** Revoke control shown under an existing family link. */
function RevokeRow({
  isRegenerating,
  onRequestRegenerate,
}: Pick<ShareFamilyTabProps, 'isRegenerating' | 'onRequestRegenerate'>) {
  return (
    <div className="pt-2 border-t border-royal-plum/10 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-royal-plum">Need to revoke access?</p>
        <p className="text-2xs text-royal-plum/70">
          Regenerating invalidates previously shared links.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRequestRegenerate}
        disabled={isRegenerating}
        className="text-terracotta border-terracotta/30 hover:bg-terracotta/10 text-xs gap-1.5 font-semibold"
      >
        {isRegenerating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        <span>Regenerate Link</span>
      </Button>
    </div>
  )
}

/** Explains why there is no family link yet and offers to create one when allowed. */
function NoShareLink({
  canManageShareLink,
  isRegenerating,
  onCreateLink,
}: Pick<ShareFamilyTabProps, 'canManageShareLink' | 'isRegenerating' | 'onCreateLink'>) {
  return (
    <div className="space-y-3" data-testid="no-share-link">
      <p className="text-xs leading-relaxed text-royal-plum/80">
        {canManageShareLink
          ? 'There is no family link on this device yet. Creating one gives you a fresh link to send. Any link made earlier on another device stops working.'
          : 'Family links need cloud sync, which is not set up for this plan. Until then your plan stays in this browser.'}
      </p>
      {canManageShareLink && (
        <Button type="button" onClick={onCreateLink} disabled={isRegenerating} className="gap-2">
          {isRegenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          <span>Create family link</span>
        </Button>
      )}
    </div>
  )
}

/** Family tab: sanitized share link, WhatsApp hand-off and revocation, or link creation. */
export function ShareFamilyTab({
  shareUrl,
  canManageShareLink,
  copied,
  onCopy,
  whatsappMessage,
  isRegenerating,
  regenerateFailed,
  onRequestRegenerate,
  onCreateLink,
}: ShareFamilyTabProps) {
  return (
    <TabsContent value="family" className="space-y-4 pt-3">
      <div className="rounded-2xl border border-marigold/40 bg-marigold/15 p-3.5 flex items-start gap-3">
        <Lock className="h-5 w-5 text-royal-plum/70 shrink-0 mt-0.5" />
        <p className="text-xs text-royal-plum leading-relaxed">
          <strong>Sanitized View:</strong> Strips vendor contract prices, draft notes, and
          contingency margins. Family only sees high-level category totals and ceremony milestones.
        </p>
      </div>

      {shareUrl ? (
        <>
          <ShareCopyRow
            id="share-url"
            label="Celebration Share Link"
            value={shareUrl}
            copied={copied}
            copyLabel="Copy Link"
            onCopy={onCopy}
          />
          <ShareWhatsAppButton encodedMessage={whatsappMessage} label="Share Plan via WhatsApp" />
          <RevokeRow isRegenerating={isRegenerating} onRequestRegenerate={onRequestRegenerate} />
        </>
      ) : (
        <NoShareLink
          canManageShareLink={canManageShareLink}
          isRegenerating={isRegenerating}
          onCreateLink={onCreateLink}
        />
      )}
      {regenerateFailed && (
        <p role="alert" className="text-xs font-medium text-terracotta">
          We could not update the family link. Check your connection and try again.
        </p>
      )}
    </TabsContent>
  )
}
