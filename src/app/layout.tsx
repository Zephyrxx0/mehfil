import type { Metadata } from 'next'
import { Fraunces, Plus_Jakarta_Sans, Noto_Serif_Devanagari } from 'next/font/google'
import localFont from 'next/font/local'
import { Agentation } from 'agentation'
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
  title: 'Mehfil (महफ़िल) — Celebration Planning with Mathematical Integrity',
  description:
    'Intelligent milestone celebration workspace where budget and timeline form a mathematically locked plan in integer paise.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plusJakartaSans.variable} ${notoSerifDevanagari.variable} ${ewert.variable}`}
    >
      <body className="min-h-screen bg-warm-ivory text-royal-plum antialiased font-sans selection:bg-marigold/30 selection:text-royal-plum">
        {children}
        {process.env.NODE_ENV === 'development' && (
          <Agentation endpoint="http://localhost:4747" />
        )}
      </body>
    </html>
  )
}
