'use client'

import { MinimalHeader } from '@/components/main/MinimalHeader'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen bg-muted relative overflow-hidden">
      <div className="relative z-10 flex flex-col h-full">
        <MinimalHeader />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
