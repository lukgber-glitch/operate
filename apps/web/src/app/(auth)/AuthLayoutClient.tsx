'use client'

import { GradientBackground } from '@/components/animation'

interface AuthLayoutClientProps {
  children: React.ReactNode
  rtl: boolean
}

export function AuthLayoutClient({ children, rtl }: AuthLayoutClientProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      dir={rtl ? 'rtl' : 'ltr'}
      style={{
        background: 'var(--color-background-light)',
      }}
    >
      {/* Animated gradient background */}
      <GradientBackground intensity="subtle" />

      {/* Content - Login max-width ~420-460px */}
      <div className="relative z-10 w-full px-4" style={{ maxWidth: '440px' }}>
        {children}
      </div>
    </div>
  )
}
