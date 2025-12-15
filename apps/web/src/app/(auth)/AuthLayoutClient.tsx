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

export function AuthLayoutClient({ children, rtl }: AuthLayoutClientProps) {
  const pathname = usePathname()
  const isOnboarding = pathname?.startsWith('/onboarding')

  // Onboarding page has its own layout structure but still needs the gradient background
  if (isOnboarding) {
    return (
      <div
        className="min-h-screen relative overflow-hidden"
        dir={rtl ? 'rtl' : 'ltr'}
        style={{
          background: 'linear-gradient(135deg, #0a2540 0%, #1a3a5a 100%)'
        }}
      >
        {/* Dark Navy Gradient Background */}
        <WelcomeBackground />
        <div className="relative z-10">{children}</div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row items-center lg:items-stretch relative overflow-hidden"
      dir={rtl ? 'rtl' : 'ltr'}
      style={{
        background: 'linear-gradient(135deg, #0a2540 0%, #1a3a5a 100%)'
      }}
    >
      {/* Dark Navy Gradient Background */}
      <WelcomeBackground />

      {/* Left side - Features (hidden on mobile, shown on lg+) */}
      <div className="hidden lg:flex lg:flex-1 relative z-10 items-center justify-center p-12">
        <div className="max-w-md">
          {/* Logo and branding */}
          <div className="mb-8">
            <Link href="/" className="hover:opacity-80 transition-opacity inline-block">
              <GuruLogo size={56} variant="light" />
            </Link>
            <h1 className="text-3xl font-bold text-white mt-4">
              operate.<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">guru</span>
            </h1>
            <p className="text-gray-300/90 text-sm mt-1">AI-Powered Business Automation</p>
          </div>
          <FeatureShowcase />
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="relative z-10 w-full lg:w-[480px] lg:min-h-screen flex flex-col items-center justify-center py-8 px-4 lg:bg-black/20">
        {/* Mobile logo (shown only on mobile) */}
        <div className="lg:hidden flex flex-col items-center mb-6">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <GuruLogo size={64} variant="light" />
          </Link>
          <h1 className="text-3xl font-bold text-white mt-4">
            operate.<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">guru</span>
          </h1>
          <p className="text-gray-300/90 text-sm mt-1">AI-Powered Business Automation</p>
        </div>

        {/* Content - Login form */}
        <div className="w-full" style={{ maxWidth: '400px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
