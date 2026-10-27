'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, MessageCircle, RefreshCw, KeyRound, Share2, ShieldAlert, Lock, Loader2 } from 'lucide-react'

export interface ShareSaveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planId: string
  planTitle: string
  editKey?: string
  initialShareToken?: string
}

export function ShareSaveModal({
  open,
  onOpenChange,
  planId,
  planTitle,
  editKey,
  initialShareToken,
}: ShareSaveModalProps) {
  const [copiedEditKey, setCopiedEditKey] = React.useState(false)
  const [copiedShareLink, setCopiedShareLink] = React.useState(false)
  const [shareToken, setShareToken] = React.useState<string>(initialShareToken || 'share-token-preview')
  const [isRegenerating, setIsRegenerating] = React.useState(false)
  const [isAlertOpen, setIsAlertOpen] = React.useState(false)

  // Construct absolute capability URLs safely on browser mount
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mehfil.app'
  const editUrl = editKey
    ? `${origin}/plan/${planId}?key=${editKey}`
    : `${origin}/plan/${planId}`
  const shareUrl = `${origin}/share/${shareToken}`

  const copyToClipboard = async (text: string, isEdit: boolean) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      }
      if (isEdit) {
        setCopiedEditKey(true)
        setTimeout(() => setCopiedEditKey(false), 2000)
      } else {
        setCopiedShareLink(true)
        setTimeout(() => setCopiedShareLink(false), 2000)
      }
    } catch {
      console.warn('Clipboard write failed')
    }
  }

  const handleRegenerateShareKey = async () => {
    setIsRegenerating(true)
    try {
      const res = await fetch(`/api/plan/${planId}/regenerate-share`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.shareToken) {
        setShareToken(data.shareToken)
      }
    } catch (e) {
      console.warn('Failed to regenerate share key:', e)
    } finally {
      setIsRegenerating(false)
      setIsAlertOpen(false)
    }
  }

  const whatsappEditMessage = encodeURIComponent(
    `Here is my private Mehfil organizer edit link for ${planTitle}. Keep this secret: ${editUrl}`
  )
  const whatsappShareMessage = encodeURIComponent(
    `Here's our ${planTitle} celebration plan on Mehfil! Take a look: ${shareUrl}`
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-bold text-royal-plum flex items-center gap-2">
              <Share2 className="h-6 w-6 text-marigold" />
              <span>Share & Save Celebration</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-royal-plum/70">
              Manage secret editing capability keys or share a celebratory sanitized view with family.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="organizer" className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="organizer" className="gap-2">
                <KeyRound className="h-4 w-4" />
                <span>Organizer Edit Key</span>
              </TabsTrigger>
              <TabsTrigger value="family" className="gap-2">
                <Share2 className="h-4 w-4" />
                <span>Family Share Link</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Organizer Edit Key */}
            <TabsContent value="organizer" className="space-y-4 pt-3">
              <div className="rounded-2xl border border-terracotta/30 bg-terracotta/10 p-3.5 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-terracotta shrink-0 mt-0.5" />
                <p className="text-xs text-royal-plum leading-relaxed">
                  <strong>Keep this private.</strong> Anyone with this capability key can modify budgets, guests, and dates.
                </p>
              </div>

              {/* URL Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-royal-plum/80">
                  Private Edit URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={editUrl}
                    className="w-full rounded-xl border border-royal-plum/15 bg-white/70 px-3.5 py-2 text-xs font-mono text-royal-plum select-all focus:outline-hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(editUrl, true)}
                    className="shrink-0 gap-1.5 text-xs font-semibold"
                  >
                    {copiedEditKey ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#4A7C59]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Key</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-royal-plum/10 bg-warm-ivory/50">
                <div className="bg-white p-3 rounded-2xl shadow-xs border border-royal-plum/5">
                  <QRCodeSVG
                    value={editUrl}
                    size={160}
                    level="M"
                    fgColor="#3A2442"
                    bgColor="#FFFFFF"
                  />
                </div>
                <p className="text-xs text-royal-plum/60 mt-3 font-medium">
                  Scan with phone camera to resume editing on mobile
                </p>
              </div>

              {/* WhatsApp Button */}
              <Button
                asChild
                className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a] font-semibold gap-2"
              >
                <a
                  href={`https://wa.me/?text=${whatsappEditMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Send Edit Key via WhatsApp</span>
                </a>
              </Button>
            </TabsContent>

            {/* TAB 2: Family Share Link */}
            <TabsContent value="family" className="space-y-4 pt-3">
              <div className="rounded-2xl border border-marigold/40 bg-marigold/15 p-3.5 flex items-start gap-3">
                <Lock className="h-5 w-5 text-royal-plum/70 shrink-0 mt-0.5" />
                <p className="text-xs text-royal-plum leading-relaxed">
                  <strong>Sanitized View:</strong> Strips vendor contract prices, draft notes, and contingency margins. Family only sees high-level category totals and ceremony milestones.
                </p>
              </div>

              {/* Share URL Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-royal-plum/80">
                  Celebration Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full rounded-xl border border-royal-plum/15 bg-white/70 px-3.5 py-2 text-xs font-mono text-royal-plum select-all focus:outline-hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(shareUrl, false)}
                    className="shrink-0 gap-1.5 text-xs font-semibold"
                  >
                    {copiedShareLink ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#4A7C59]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* WhatsApp Family Share */}
              <Button
                asChild
                className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a] font-semibold gap-2"
              >
                <a
                  href={`https://wa.me/?text=${whatsappShareMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Share Plan via WhatsApp</span>
                </a>
              </Button>

              {/* Regenerate Trigger */}
              <div className="pt-2 border-t border-royal-plum/10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-royal-plum">
                    Need to revoke access?
                  </p>
                  <p className="text-2xs text-royal-plum/60">
                    Regenerating invalidates previously shared links.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAlertOpen(true)}
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
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Regenerating Share Key */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Invalidate Old Link & Create New?</AlertDialogTitle>
            <AlertDialogDescription>
              Anyone with the previous link will immediately lose access and see an expired celebration screen. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Current Link</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegenerateShareKey}
              className="bg-terracotta text-white hover:bg-terracotta/90"
            >
              Invalidate & Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
