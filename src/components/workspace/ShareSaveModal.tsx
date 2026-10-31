'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KeyRound, Share2, CloudOff } from 'lucide-react'
import { useShareLinks } from './hooks/useShareLinks'
import { ShareOrganizerTab } from './ShareOrganizerTab'
import { ShareFamilyTab } from './ShareFamilyTab'
import { ShareRegenerateAlert } from './ShareRegenerateAlert'

export interface ShareSaveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planId: string
  planTitle: string
  editKey?: string
  initialShareToken?: string
  isCloudConfigured?: boolean
}

/** Notice that links only live in this browser until cloud sync is configured. */
function CloudUnconfiguredNotice() {
  return (
    <div
      data-testid="cloud-unconfigured-notice"
      className="rounded-2xl border border-marigold/50 bg-marigold/15 p-3.5 flex items-start gap-3 mt-2"
    >
      <CloudOff className="h-5 w-5 text-royal-plum/70 shrink-0 mt-0.5" />
      <div className="space-y-0.5 text-xs text-royal-plum leading-relaxed">
        <p className="font-semibold text-royal-plum">Saved to this device only</p>
        <p className="text-royal-plum/80">
          Cloud database sync isn&apos;t configured yet. Your celebration is safely stored in this
          browser, but shared links and QR codes won&apos;t open on other phones or computers.
        </p>
      </div>
    </div>
  )
}

export function ShareSaveModal({
  open,
  onOpenChange,
  planId,
  planTitle,
  editKey,
  initialShareToken,
  isCloudConfigured,
}: ShareSaveModalProps) {
  const links = useShareLinks({ planId, planTitle, editKey, initialShareToken, isCloudConfigured })

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl p-6 sm:p-8">
          <DialogHeader className="pr-10">
            <DialogTitle className="font-serif text-2xl font-bold text-royal-plum flex items-center gap-2">
              <Share2 className="h-6 w-6 text-marigold" aria-hidden="true" />
              <span>Share & Save Celebration</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-royal-plum/70">
              Manage secret editing capability keys or share a celebratory sanitized view with
              family.
            </DialogDescription>
          </DialogHeader>

          {!links.isCloudConfigured && <CloudUnconfiguredNotice />}

          <Tabs defaultValue="organizer" className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="organizer" className="gap-2">
                <KeyRound className="h-4 w-4 shrink-0" />
                <span>Organizer Edit Key</span>
              </TabsTrigger>
              <TabsTrigger value="family" className="gap-2">
                <Share2 className="h-4 w-4 shrink-0" />
                <span>Family Share Link</span>
              </TabsTrigger>
            </TabsList>

            <ShareOrganizerTab
              editUrl={links.editUrl}
              copied={links.copiedEditKey}
              onCopy={links.copyEditUrl}
              whatsappMessage={links.whatsappEditMessage}
            />
            <ShareFamilyTab
              shareUrl={links.shareUrl}
              canManageShareLink={links.canManageShareLink}
              copied={links.copiedShareLink}
              onCopy={links.copyShareUrl}
              whatsappMessage={links.whatsappShareMessage}
              isRegenerating={links.isRegenerating}
              regenerateFailed={links.regenerateFailed}
              onRequestRegenerate={() => links.setIsAlertOpen(true)}
              onCreateLink={links.regenerateShareKey}
            />
          </Tabs>
        </DialogContent>
      </Dialog>

      <ShareRegenerateAlert
        open={links.isAlertOpen}
        onOpenChange={links.setIsAlertOpen}
        onConfirm={links.regenerateShareKey}
      />
    </>
  )
}
