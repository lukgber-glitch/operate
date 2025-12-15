import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'

import './globals.css'
import '@/styles/accessibility.css'
import { Providers } from '@/providers'
import { ServiceWorkerUpdate } from '@/components/service-worker-update'
import { SkipToContent } from '@/components/accessibility/SkipToContent'
import { InstallPrompt, OfflineIndicator } from '@/components/pwa'

// Geist Sans - Stripe-like narrow geometric font
const geistSans = localFont({
  src: [
    { path: '../../node_modules/@fontsource/geist-sans/files/geist-sans-latin-400-normal.woff2', weight: '400' },
    { path: '../../node_modules/@fontsource/geist-sans/files/geist-sans-latin-500-normal.woff2', weight: '500' },
    { path: '../../node_modules/@fontsource/geist-sans/files/geist-sans-latin-600-normal.woff2', weight: '600' },
    { path: '../../node_modules/@fontsource/geist-sans/files/geist-sans-latin-700-normal.woff2', weight: '700' },
  ],
  variable: '--font-geist-sans',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
}

export const metadata: Metadata = {
  title: 'Operate - Business Autopilot',
  description: 'AI-powered business management for freelancers and small businesses',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Operate',
  },
  applicationName: 'Operate',
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geistSans.className}>
        <SkipToContent />
        <Providers>{children}</Providers>
        <ServiceWorkerUpdate />
        <InstallPrompt />
        <OfflineIndicator />
      </body>
    </html>
  )
}
