'use client'

import { Menu, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { NotificationBell } from '@/components/notifications'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import { MobileSidebar } from './MobileSidebar'

interface MobileHeaderProps {
  title?: string
  showSearch?: boolean
  className?: string
}

export function MobileHeader({
  title,
  showSearch = true,
  className,
}: MobileHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      {/* Main Header */}
      <header
        className={cn(
          'sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:hidden',
          className
        )}
      >
        {/* Hamburger Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMenuOpen(true)}
          className="h-9 w-9 shrink-0"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo / Title */}
        <div className="flex-1 min-w-0">
          {title ? (
            <h1 className="truncate text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h1>
          ) : (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 dark:bg-slate-100">
                <span className="text-xs font-bold text-white dark:text-slate-900">
                  OP
                </span>
              </div>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                Operate
              </span>
            </Link>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {showSearch && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="h-9 w-9"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          <NotificationBell />

          {/* User Avatar */}
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatar-placeholder.png" alt="User" />
            <AvatarFallback className="bg-slate-200 text-slate-700 text-xs dark:bg-slate-700 dark:text-slate-200">
              JD
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Mobile Menu Sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="p-0 w-80">
          <MobileSidebar onClose={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Search Sheet */}
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent side="top" className="h-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Search</SheetTitle>
          </SheetHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9 w-full"
              autoFocus
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
