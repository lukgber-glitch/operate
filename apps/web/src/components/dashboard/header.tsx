'use client'

import { Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NotificationBell } from '@/components/notifications'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import { Sidebar } from './sidebar'
import { UserMenu } from './user-menu'

export function Header() {
  const pathname = usePathname()

  return (
    <header
      className="sticky top-0 z-40 flex h-16 items-center gap-6 border-b px-6 shadow-sm"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)'
      }}
    >
      {/* Logo - Left Side */}
      <Link
        href="/"
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        aria-label="Operate home"
      >
        {/* Logo Icon */}
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <span className="text-lg">O</span>
        </div>
        {/* Logo Text - Desktop only */}
        <span
          className="hidden text-xl font-bold sm:inline-block"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Operate
        </span>
      </Link>

      {/* Mobile menu trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Navigation Links - Center */}
      <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
        <Link
          href="/dashboard"
          className={cn(
            'rounded-md px-4 py-2 text-sm font-medium transition-colors',
            'hover:bg-[var(--color-background)]',
            pathname === '/dashboard' || pathname === '/'
              ? 'text-[var(--color-primary)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          )}
        >
          Dashboard
        </Link>
        <Link
          href="/settings"
          className={cn(
            'rounded-md px-4 py-2 text-sm font-medium transition-colors',
            'hover:bg-[var(--color-background)]',
            pathname.startsWith('/settings')
              ? 'text-[var(--color-primary)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          )}
        >
          Settings
        </Link>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  )
}
