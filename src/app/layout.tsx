import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Tiro+Devanagari+Hindi:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-warm-ivory text-royal-plum font-sans selection:bg-marigold selection:text-royal-plum">
        {children}
      </body>
    </html>
  )
}

