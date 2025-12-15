'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { WelcomeBackground } from '@/components/onboarding/WelcomeBackground'
import { GuruLogo } from '@/components/ui/guru-logo'

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
      className="min-h-screen flex flex-col items-center relative overflow-hidden py-8"
      dir={rtl ? 'rtl' : 'ltr'}
      style={{
        background: 'linear-gradient(135deg, #0a2540 0%, #1a3a5a 100%)'
      }}
    >
      {/* Dark Navy Gradient Background */}
      <WelcomeBackground />

      {/* Logo centered at top */}
      <div className="relative z-10 flex justify-center mb-6">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <GuruLogo size={64} variant="light" />
        </Link>
      </div>

      {/* Branding text */}
      <div className="relative z-10 flex flex-col items-center mb-8">
        <h1 className="text-3xl font-bold text-white">
          operate.<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">guru</span>
        </h1>
        <p className="text-gray-300/90 text-sm mt-1">AI-Powered Business Automation</p>
      </div>

      {/* Content - Login max-width ~420-460px */}
      <div className="relative z-10 w-full px-4 flex-1 flex items-start justify-center" style={{ maxWidth: '440px' }}>
        {children}
      </div>
    </div>
  )
}
