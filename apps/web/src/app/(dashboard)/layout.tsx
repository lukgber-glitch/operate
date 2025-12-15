'use client'

import '@/app/globals.css'
import { Header } from '@/components/dashboard/header'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileHeader } from '@/components/mobile'
import { PushPermissionBanner } from '@/components/notifications'
import { TrialManager, UsageManager } from '@/components/billing'
import { useSidebar } from '@/hooks/use-sidebar'
import { useTimerWarning } from '@/hooks/use-timer-warning'
import { cn } from '@/lib/utils'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isOpen } = useSidebar()
  useTimerWarning() // Warn before closing tab if timer is running

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a2540] to-[#1a3a5a] text-white relative">

      {/* Desktop Sidebar - Fixed positioned */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content - Properly offset for fixed sidebar */}
      <div
        className={cn(
          'min-h-screen transition-all duration-300',
          'lg:ml-16', // collapsed sidebar width (use margin-left instead of padding)
          isOpen && 'lg:ml-64' // expanded sidebar width
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
    </div>
  )
}
