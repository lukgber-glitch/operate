'use client'

import { Settings } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { MiniTimer } from '@/components/time-tracking'
import { AutopilotHeaderIndicator } from '@/components/autopilot'

import { UserMenu } from './user-menu'

export function Header() {
  return (
    <header
      className="fixed top-0 right-0 z-40 flex h-16 items-center justify-end gap-2 px-4"
      style={{
        backgroundColor: 'transparent',
      }}
    >
      {/* Autopilot status indicator */}
      <AutopilotHeaderIndicator />

      {/* Running timer indicator */}
      <MiniTimer />

      {/* Right side actions - minimal icons only */}
      <Link href="/settings" aria-label="Settings">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-white hover:text-[#06BF9D] hover:bg-white/10 transition-colors"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </Link>
      <UserMenu />
    </header>
  )
}
