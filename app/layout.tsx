import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { GeistPixelGrid } from 'geist/font/pixel'
import { ThemeProvider } from '@/components/theme-provider'

import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Zeker | ZK-Proof Anonymous Cash Disbursement on Stellar',
  description:
    'Humanitarian cash-aid disbursement with zero-knowledge proofs. Prevent double-claiming and fraud on Stellar while keeping recipient identity fully anonymous and unlinkable. Built for Stellar Hacks: Real-World ZK.',
  keywords: [
    'Zeker',
    'Stellar blockchain',
    'Soroban smart contracts',
    'zero-knowledge proofs',
    'ZK SNARKs',
    'Noir language',
    'humanitarian cash transfer',
    'financial privacy',
    'Protocol 26 native ZK',
    'anonymous disbursements',
    'sybil resistance',
    'nullifiers',
    'Merkle tree membership proof',
  ],
  authors: [{ name: 'Team Zeker' }],
  creator: 'Team Zeker',
  publisher: 'Stellar ZK Hacks Team',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Zeker | ZK-Proof Anonymous Cash Disbursement on Stellar',
    description:
      'Humanitarian cash-aid disbursement with zero-knowledge proofs. Prevent double-claiming and fraud on Stellar while keeping recipient identity fully anonymous and unlinkable.',
    siteName: 'Zeker',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zeker | ZK-Proof Anonymous Cash Disbursement on Stellar',
    description:
      'Humanitarian cash-aid disbursement with zero-knowledge proofs. Prevent double-claiming and fraud on Stellar while keeping recipient identity fully anonymous and unlinkable.',
  },
  category: 'technology',
}

export const viewport: Viewport = {
  themeColor: '#F2F1EA',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${GeistPixelGrid.variable}`} suppressHydrationWarning>
      <body className="font-mono antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
