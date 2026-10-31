import * as React from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

interface ShareWhatsAppButtonProps {
  /** Message already passed through `encodeURIComponent`. */
  encodedMessage: string
  label: string
}

/**
 * Full-width WhatsApp link that opens a prefilled message in a new tab. Plum ink on WhatsApp
 * green is 7.0:1; white on it is only 2.0:1.
 */
export function ShareWhatsAppButton({ encodedMessage, label }: ShareWhatsAppButtonProps) {
  return (
    <Button
      asChild
      className="w-full bg-[#25D366] text-royal-plum hover:bg-[#20bd5a] font-semibold gap-2"
    >
      <a href={`https://wa.me/?text=${encodedMessage}`} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-4 w-4" />
        <span>{label}</span>
      </a>
    </Button>
  )
}
