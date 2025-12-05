import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'
import '@/styles/accessibility.css'
import { Providers } from '@/providers'
import { ServiceWorkerUpdate } from '@/components/service-worker-update'
import { SkipToContent } from '@/components/accessibility/SkipToContent'
import { InstallPrompt } from '@/components/pwa'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
}

export const metadata: Metadata = {
  title: 'Operate | CoachOS - Enterprise Coaching Platform',
  description: 'AI-powered coaching platform for enterprise teams',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Operate',
  },
  applicationName: 'Operate | CoachOS',
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SkipToContent />
        <Providers>{children}</Providers>
        <ServiceWorkerUpdate />
        <InstallPrompt />
      </body>
    </html>
  )
}
