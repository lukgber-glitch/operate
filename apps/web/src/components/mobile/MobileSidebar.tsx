'use client'

import {
  Home,
  Users,
  FileText,
  CreditCard,
  Calculator,
  BarChart,
  Settings,
  ChevronRight,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'

interface NavItem {
  icon: LucideIcon
  label: string
  href: string
  children?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: Users, label: 'HR', href: '/hr' },
  { icon: FileText, label: 'Documents', href: '/documents' },
  {
    icon: CreditCard,
    label: 'Finance',
    href: '/finance',
    children: [
      { label: 'Invoices', href: '/finance/invoices' },
      { label: 'Expenses', href: '/finance/expenses' },
      { label: 'Banking', href: '/finance/banking' },
    ],
  },
  { icon: Calculator, label: 'Tax', href: '/tax' },
  { icon: BarChart, label: 'Reports', href: '/reports' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

interface MobileSidebarProps {
  onClose?: () => void
}

export function MobileSidebar({ onClose }: MobileSidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
    )
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 dark:bg-slate-100">
            <span className="text-sm font-bold text-white dark:text-slate-900">
              OP
            </span>
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            Operate
          </span>
        </Link>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            const expanded = expandedItems.includes(item.href)

            return (
              <div key={item.href}>
                {/* Main Nav Item */}
                <div
                  className={cn(
                    'group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors',
                    'min-h-[44px]', // Touch-friendly height
                    active
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  )}
                >
                  <Link
                    href={item.href}
                    className="flex flex-1 items-center gap-3"
                    onClick={onClose}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                  {item.children && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpanded(item.href)}
                      className={cn(
                        'h-8 w-8 shrink-0',
                        active
                          ? 'text-white dark:text-slate-900'
                          : 'text-slate-700 dark:text-slate-300'
                      )}
                    >
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 transition-transform',
                          expanded && 'rotate-90'
                        )}
                      />
                    </Button>
                  )}
                </div>

                {/* Sub Items */}
                {item.children && expanded && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center rounded-lg px-3 py-2 text-sm transition-colors',
                          'min-h-[44px]', // Touch-friendly height
                          pathname === child.href
                            ? 'bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-white'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/avatar-placeholder.png" alt="User" />
            <AvatarFallback className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
              JD
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
              John Doe
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              john@example.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
