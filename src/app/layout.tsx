import type { Metadata } from 'next'
import { Fraunces, Plus_Jakarta_Sans, Noto_Serif_Devanagari } from 'next/font/google'
import localFont from 'next/font/local'
import { connection } from 'next/server'
import { MotionProvider } from '@/components/providers/MotionProvider'
import './globals.css'

// Ewert — the all-caps slab display face used for the hero wordmark ("Meh").
const ewert = localFont({
  src: './Ewert.ttf',
  variable: '--font-ewert',
  display: 'swap',
  weight: '400',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

// Noto Serif Devanagari (bold) — the brand's Devanagari face, with the nukta and a
// strong, confident weight for "महफ़िल" across the app.
const notoSerifDevanagari = Noto_Serif_Devanagari({
  weight: ['400', '700'],
  subsets: ['devanagari', 'latin'],
  variable: '--font-tiro',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://mehfil.app')
  ),
  title: {
    default: 'Mehfil (महफ़िल) — Celebration Planning with Mathematical Integrity',
    template: '%s | Mehfil (महफ़िल)',
  },
  description:
    'Intelligent milestone celebration workspace where budget and timeline form a mathematically locked plan in integer paise.',
  keywords: [
    'celebration planning',
    'wedding planner',
    'budget rebalancing',
    'integer paise',
    'vendor quote check',
    'mehfil',
    'milestone celebrations',
  ],
  authors: [{ name: 'Mehfil' }],
  creator: 'Mehfil Team',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://mehfil.app',
    siteName: 'Mehfil (महफ़िल)',
    title: 'Mehfil (महफ़िल) — Celebration Planning with Mathematical Integrity',
    description:
      'Intelligent milestone celebration workspace where budget and timeline form a mathematically locked plan in integer paise.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mehfil (महफ़िल) — Celebration Planning with Mathematical Integrity',
    description:
      'Intelligent milestone celebration workspace where budget and timeline form a mathematically locked plan in integer paise.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

/** Visual feedback toolbar for local development only. It is never loaded in production. */
async function DevToolbar() {
  // Written as an `if` block so the bundler can see it is dead code in production and drop
  // the import entirely.
  if (process.env.NODE_ENV === 'development') {
    const { Agentation } = await import('agentation')
    return <Agentation endpoint="http://localhost:4747" />
  }
  return null
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // A nonce-based CSP (src/middleware.ts) needs a fresh nonce on every request, which static
  // prerendering cannot provide. Waiting for the connection opts every page into dynamic rendering.
  await connection()

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plusJakartaSans.variable} ${notoSerifDevanagari.variable} ${ewert.variable}`}
    >
      <body className="min-h-screen bg-warm-ivory text-royal-plum antialiased font-sans selection:bg-marigold/30 selection:text-royal-plum">
        <MotionProvider>{children}</MotionProvider>
        <DevToolbar />
      </body>
    </html>
  )
}
