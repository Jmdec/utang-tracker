import type { Metadata } from 'next'
import { Caveat, DM_Sans, DM_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from './providers'
import InstallPrompt from '@/components/InstallPrompt'
import AuthInitializer from '@/components/AuthInitializer' // 👈 NEW
import './globals.css'

const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: "400", variable: "--font-dm-mono" });

export const metadata: Metadata = {
  title: 'Personal Finance Tracker',
  description: 'Track your debts, expenses, and personal finances with ease.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Personal Finance Tracker',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${caveat.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <head>
        <meta name="theme-color" content="#7c3aed" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Personal Finance Tracker" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body
        style={{
          fontFamily: 'var(--font-dm-sans)',
          margin: 0,
          padding: 0,
          minHeight: '100vh',
        }}
        className="antialiased"
      >
        <Providers>
          {/* ✅ This runs rehydrate ONCE */}
          <AuthInitializer />

          {/* ❌ REMOVE AuthGuard here */}
          {children}

          <InstallPrompt />
        </Providers>

        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}