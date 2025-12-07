'use client'

import '@/app/globals.css'
import { ChatButton } from '@/components/chat'
import { Header } from '@/components/dashboard/header'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileHeader } from '@/components/mobile'
import { PushPermissionBanner } from '@/components/notifications'
import { TrialManager, UsageManager } from '@/components/billing'
import { GradientBackground } from '@/components/animation'
import { useSidebar } from '@/hooks/use-sidebar'
import { cn } from '@/lib/utils'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isOpen } = useSidebar()

  return (
    <div className="min-h-screen bg-[#F2F2F2] dark:bg-[#0D1F1B] relative overflow-hidden">
      {/* Subtle animated gradient background */}
      <GradientBackground intensity="subtle" />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block relative z-20">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div
        className={cn(
          'min-h-screen transition-all duration-300 relative z-10',
          'lg:pl-16', // collapsed sidebar width
          isOpen && 'lg:pl-64' // expanded sidebar width
        )}
      >
        {/* Desktop Header - Minimal icons in top right */}
        <div className="hidden lg:block">
          <Header />
        </div>

        {/* Mobile Header */}
        <MobileHeader />

        {/* Page Content */}
        <main id="main-content" className="p-4 pb-20 sm:p-6 lg:pb-6 lg:pt-20" role="main" aria-label="Main content">
          {/* Push Notification Permission Banner */}
          <PushPermissionBanner />

          {/* Trial Status Management */}
          <TrialManager />

          {/* Usage Limit Warnings & Modals */}
          <UsageManager />

          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* AI Chat Assistant */}
      <ChatButton />
    </div>
  )
}
