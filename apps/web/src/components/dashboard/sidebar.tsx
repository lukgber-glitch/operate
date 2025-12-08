'use client'

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
import Link from 'next/link'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { GuruLogo } from '@/components/ui/guru-logo'
import { useSidebar } from '@/hooks/use-sidebar'
import { cn } from '@/lib/utils'

import { NavItem, NavItemProps } from './nav-item'
import { OrgSwitcher } from './org-switcher'


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
      role="navigation"
      aria-label="Main navigation"
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo & Toggle */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
        {isOpen ? (
          <Link href="/" className="flex items-center gap-2" aria-label="Go to dashboard home">
            <GuruLogo size={32} />
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              Operate
            </span>
          </Link>
        ) : (
          <Link href="/" className="flex items-center" aria-label="Go to dashboard home">
            <GuruLogo size={32} />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className={cn(!isOpen && 'hidden')}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
          ) : (
            <PanelLeft className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Organisation Switcher */}
      <div className="border-b border-slate-200 p-4 dark:border-slate-800">
        <OrgSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Main menu">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-3" role="complementary" aria-label="User profile">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatar-placeholder.png" alt="John Doe profile picture" />
            <AvatarFallback className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" aria-label="John Doe">
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
            aria-label="Expand sidebar"
            aria-expanded={isOpen}
          >
            <PanelLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </aside>
  )
}
