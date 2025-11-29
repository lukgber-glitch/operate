'use client'

import { Search, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from './breadcrumbs'
import { UserMenu } from './user-menu'
import { Notifications } from './notifications'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from './sidebar'

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
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

      {/* Breadcrumbs */}
      <div className="hidden md:block">
        <Breadcrumbs />
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-9 w-full"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <Notifications />
        <UserMenu />
      </div>
    </header>
  )
}
