import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'
import { Providers } from '@/providers'
import { ServiceWorkerUpdate } from '@/components/service-worker-update'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Operate | CoachOS - Enterprise Coaching Platform',
  description: 'AI-powered coaching platform for enterprise teams',
  manifest: '/manifest.json',
  themeColor: '#0f172a',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
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
        <Providers>{children}</Providers>
        <ServiceWorkerUpdate />
      </body>
    </html>
  )
}
