// Example Root Layout with Cookie Consent
// Copy this pattern to your actual root layout

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import '@/styles/accessibility.css';
import { Providers } from '@/providers';
import { CookieConsent } from '@/components/legal/CookieConsent';
import { ServiceWorkerUpdate } from '@/components/service-worker-update';
import { SkipToContent } from '@/components/accessibility/SkipToContent';
import { InstallPrompt } from '@/components/pwa';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: 'Operate | AI-Powered Business Automation',
  description: 'Automate your accounting, taxes, and financial operations with AI',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Operate',
  },
  applicationName: 'Operate',
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SkipToContent />
        <Providers>{children}</Providers>
        <ServiceWorkerUpdate />
        <InstallPrompt />

        {/* GDPR Cookie Consent Banner */}
        <CookieConsent />
      </body>
    </html>
  );
}
