'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { WelcomeBackground } from '@/components/onboarding/WelcomeBackground'
import { GuruLogo } from '@/components/ui/guru-logo'
import { AuthSidebarSlider } from '@/components/auth/AuthSidebarSlider'

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
        className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-600"
        dir={rtl ? 'rtl' : 'ltr'}
        role="document"
      >
        {/* Dark Navy Gradient Background */}
        <WelcomeBackground />
        <main className="relative z-10">{children}</main>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      dir={rtl ? 'rtl' : 'ltr'}
      role="document"
    >
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900 focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>

      {/* Left/Center - Main content area with login form */}
      <main
        id="main-content"
        className="flex-1 min-h-screen flex flex-col items-center justify-center py-8 px-4 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-600"
        role="main"
      >
        {/* Animated background */}
        <WelcomeBackground />

        {/* Content */}
        <div className="relative z-10 w-full flex flex-col items-center">
          {/* Logo and branding */}
          <header className="flex flex-col items-center mb-8">
            <Link
              href="/"
              className="hover:opacity-80 transition-opacity"
              aria-label="Operate Guru - Go to homepage"
            >
              <GuruLogo size={72} variant="light" />
            </Link>
            <BrandTitle className="mt-4" />
            <p className="text-gray-300/90 text-sm mt-1">AI-Powered Business Automation</p>
          </header>

          {/* Auth form (H1 is inside the form component) */}
          <section className="w-full" style={{ maxWidth: '420px' }} aria-label="Authentication">
            {children}
          </section>
        </div>
      </main>

      {/* Right sidebar - Feature slider (hidden on mobile, shown on lg+) */}
      <aside
        className="hidden lg:flex lg:w-[420px] xl:w-[480px] min-h-screen bg-slate-900 relative overflow-hidden"
        aria-label="Product features"
      >
        <AuthSidebarSlider />
      </aside>
    </div>
  )
}
