'use client'

import { LayoutDashboard } from 'lucide-react'
import Link from 'next/link'

import { NotificationBell } from '@/components/notifications/NotificationBell'
import { Button } from '@/components/ui/button'

import { UserMenu } from '../dashboard/user-menu'

export function MinimalHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 dark:bg-slate-100">
          <span className="text-sm font-bold text-white dark:text-slate-900">
            OP
          </span>
        </div>
        <span className="text-lg font-bold text-slate-900 dark:text-white">
          Operate
        </span>
      </Link>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Dashboard button */}
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </Button>

        {/* Notifications */}
        <NotificationBell />

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  )
}
