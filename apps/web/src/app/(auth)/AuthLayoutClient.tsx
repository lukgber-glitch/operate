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
    >
      {/* Animated gradient background */}
      <GradientBackground intensity="medium" />

      {/* Base background color */}
      <div className="absolute inset-0 bg-[#F2F2F2] dark:bg-[#0D1F1B] -z-10" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  )
}
