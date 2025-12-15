'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { WelcomeBackground } from '@/components/onboarding/WelcomeBackground'
import { GuruLogo } from '@/components/ui/guru-logo'
import { FeatureShowcase } from '@/components/auth/FeatureShowcase'

interface AuthLayoutClientProps {
  children: React.ReactNode
  rtl: boolean
}

/**
 * Brand title component - uses appropriate heading level
 * Desktop: decorative (not the main heading), Mobile: visually hidden for screen readers
 */
function BrandTitle({ className = '' }: { className?: string }) {
  return (
    <p className={`text-3xl font-bold text-white ${className}`} aria-label="Operate Guru">
      operate.<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">guru</span>
    </p>
  )
}

export function AuthLayoutClient({ children, rtl }: AuthLayoutClientProps) {
  const pathname = usePathname()
  const isOnboarding = pathname?.startsWith('/onboarding')

  // Onboarding page has its own layout structure but still needs the gradient background
  if (isOnboarding) {
    return (
      <div
        className="min-h-screen relative overflow-hidden"
        dir={rtl ? 'rtl' : 'ltr'}
        role="document"
        style={{
          background: 'linear-gradient(135deg, #0a2540 0%, #1a3a5a 100%)'
        }}
      >
        {/* Dark Navy Gradient Background */}
        <WelcomeBackground />
        <main className="relative z-10">{children}</main>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row items-center lg:items-stretch relative overflow-hidden"
      dir={rtl ? 'rtl' : 'ltr'}
      role="document"
      style={{
        background: 'linear-gradient(135deg, #0a2540 0%, #1a3a5a 100%)'
      }}
    >
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900 focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>

      {/* Dark Navy Gradient Background */}
      <WelcomeBackground />

      {/* Left side - Features (hidden on mobile, shown on lg+) */}
      <aside
        className="hidden lg:flex lg:flex-1 relative z-10 items-center justify-center p-12"
        aria-label="Product features"
      >
        <div className="max-w-md">
          {/* Logo and branding - decorative, not the main page heading */}
          <header className="mb-8">
            <Link
              href="/"
              className="hover:opacity-80 transition-opacity inline-block"
              aria-label="Operate Guru - Go to homepage"
            >
              <GuruLogo size={56} variant="light" />
            </Link>
            <BrandTitle className="mt-4" />
            <p className="text-gray-300/90 text-sm mt-1">AI-Powered Business Automation</p>
          </header>
          <FeatureShowcase />
        </div>
      </aside>

      {/* Right side - Auth form (main content) */}
      <main
        id="main-content"
        className="relative z-10 w-full lg:w-[480px] lg:min-h-screen flex flex-col items-center justify-center py-8 px-4 lg:bg-black/20"
        role="main"
      >
        {/* Mobile logo (shown only on mobile) */}
        <header className="lg:hidden flex flex-col items-center mb-6">
          <Link
            href="/"
            className="hover:opacity-80 transition-opacity"
            aria-label="Operate Guru - Go to homepage"
          >
            <GuruLogo size={64} variant="light" />
          </Link>
          <BrandTitle className="mt-4" />
          <p className="text-gray-300/90 text-sm mt-1">AI-Powered Business Automation</p>
        </header>

        {/* Content - Auth form (H1 is inside the form component) */}
        <section className="w-full" style={{ maxWidth: '400px' }} aria-label="Authentication">
          {children}
        </section>
      </main>
    </div>
  )
}
