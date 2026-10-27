import type { Metadata } from 'next'
import { Fraunces, Plus_Jakarta_Sans, Tiro_Devanagari_Hindi } from 'next/font/google'
import './globals.css'

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

const tiroDevanagariHindi = Tiro_Devanagari_Hindi({
  weight: '400',
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
      className={`${fraunces.variable} ${plusJakartaSans.variable} ${tiroDevanagariHindi.variable}`}
    >
      <body className="min-h-screen bg-warm-ivory text-royal-plum antialiased font-sans selection:bg-marigold/30 selection:text-royal-plum">
        {children}
      </body>
    </html>
  )
}
