'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Users,
  FileText,
  CreditCard,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface MobileNavItem {
  icon: LucideIcon
  label: string
  href: string
}

const mobileNavItems: MobileNavItem[] = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Users, label: 'HR', href: '/hr' },
  { icon: FileText, label: 'Docs', href: '/documents' },
  { icon: CreditCard, label: 'Finance', href: '/finance' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
      {mobileNavItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors',
              isActive
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
