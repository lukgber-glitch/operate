'use client'

import Link from 'next/link'
import {
  Home,
  Users,
  FileText,
  CreditCard,
  Calculator,
  BarChart,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/hooks/use-sidebar'
import { NavItem, NavItemProps } from './nav-item'
import { OrgSwitcher } from './org-switcher'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const navItems: NavItemProps[] = [
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

export function Sidebar() {
  const { isOpen, toggle } = useSidebar()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo & Toggle */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
        {isOpen ? (
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
        ) : (
          <Link href="/" className="flex items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 dark:bg-slate-100">
              <span className="text-sm font-bold text-white dark:text-slate-900">
                OP
              </span>
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className={cn(!isOpen && 'hidden')}
        >
          {isOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Organisation Switcher */}
      <div className="border-b border-slate-200 p-4 dark:border-slate-800">
        <OrgSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatar-placeholder.png" alt="User" />
            <AvatarFallback className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
              JD
            </AvatarFallback>
          </Avatar>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                John Doe
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                john@example.com
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Expand button when collapsed */}
      {!isOpen && (
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="w-full"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </aside>
  )
}
