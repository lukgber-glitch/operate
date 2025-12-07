'use client'

import { MinimalHeader } from '@/components/main/MinimalHeader'
import { GradientBackground } from '@/components/animation'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen bg-[#F2F2F2] dark:bg-[#0D1F1B] relative overflow-hidden">
      {/* Animated gradient background */}
      <GradientBackground intensity="subtle" />

      <div className="relative z-10 flex flex-col h-full">
        <MinimalHeader />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
