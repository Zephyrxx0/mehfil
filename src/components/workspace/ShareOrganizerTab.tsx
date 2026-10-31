import * as React from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { QRCodeSVG } from 'qrcode.react'
import { ShieldAlert } from 'lucide-react'
import { ShareCopyRow } from './ShareCopyRow'
import { ShareWhatsAppButton } from './ShareWhatsAppButton'

interface ShareOrganizerTabProps {
  editUrl?: string
  copied: boolean
  onCopy: () => void
  whatsappMessage: string
}

function EditQrCode({ editUrl }: { editUrl: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-royal-plum/10 bg-warm-ivory/50">
      <div className="bg-white p-3 rounded-2xl shadow-xs border border-royal-plum/5">
        <QRCodeSVG
          value={editUrl}
          size={160}
          level="M"
          fgColor="#3A2442"
          bgColor="#FFFFFF"
          title="QR code for the private organizer edit link"
        />
      </div>
      <p className="text-xs text-royal-plum/70 mt-3 font-medium">
        Scan with phone camera to resume editing on mobile
      </p>
    </div>
  )
}

/** Organizer tab: private edit URL, QR code and WhatsApp hand-off, or a notice when none exists. */
export function ShareOrganizerTab({
  editUrl,
  copied,
  onCopy,
  whatsappMessage,
}: ShareOrganizerTabProps) {
  return (
    <TabsContent value="organizer" className="space-y-4 pt-3">
      <div className="rounded-2xl border border-terracotta/30 bg-terracotta/10 p-3.5 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-terracotta shrink-0 mt-0.5" />
        <p className="text-xs text-royal-plum leading-relaxed">
          <strong>Keep this private.</strong> Anyone with this capability key can modify budgets,
          guests, and dates.
        </p>
      </div>

      {editUrl ? (
        <>
          <ShareCopyRow
            id="edit-url"
            label="Private Edit URL"
            value={editUrl}
            copied={copied}
            copyLabel="Copy Key"
            onCopy={onCopy}
          />
          <EditQrCode editUrl={editUrl} />
          <ShareWhatsAppButton
            encodedMessage={whatsappMessage}
            label="Send Edit Key via WhatsApp"
          />
        </>
      ) : (
        <p
          data-testid="no-edit-link-notice"
          className="rounded-2xl border border-royal-plum/10 bg-warm-ivory/60 p-3.5 text-xs leading-relaxed text-royal-plum/80"
        >
          An organizer edit link is created together with a cloud-saved plan. This plan is stored in
          this browser only, so there is nothing to carry to another device yet.
        </p>
      )}
    </TabsContent>
  )
}
