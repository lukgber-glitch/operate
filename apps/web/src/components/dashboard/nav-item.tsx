'use client'

import { ChevronDown, LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { useSidebar } from '@/hooks/use-sidebar'
import { cn } from '@/lib/utils'

export interface NavItemProps {
  icon: LucideIcon
  label: string
  href: string
  children?: Array<{
    label: string
    href: string
  }>
}

export function NavItem({ icon: Icon, label, href, children }: NavItemProps) {
  const pathname = usePathname()
  const { isOpen: isSidebarOpen } = useSidebar()
  const [isExpanded, setIsExpanded] = useState(false)

  const isActive = pathname === href || pathname.startsWith(href + '/')
  const hasChildren = children && children.length > 0

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div>
      {hasChildren ? (
        <button
          onClick={handleClick}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors',
            isActive
              ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
              : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50'
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 flex-shrink-0" />
            {isSidebarOpen && <span>{label}</span>}
          </div>
          {isSidebarOpen && hasChildren && (
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                isExpanded && 'transform rotate-180'
              )}
            />
          )}
        </button>
      ) : (
        <Link
          href={href}
          className={cn(
            'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
            isActive
              ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
              : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50'
          )}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          {isSidebarOpen && <span>{label}</span>}
        </Link>
      )}

      {/* Nested children */}
      {hasChildren && isExpanded && isSidebarOpen && (
        <div className="ml-8 mt-1 space-y-1">
          {children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={cn(
                'block px-3 py-2 text-sm rounded-md transition-colors',
                pathname === child.href
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-medium'
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
}
