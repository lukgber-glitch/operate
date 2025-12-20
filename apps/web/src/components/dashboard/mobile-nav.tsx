'use client'

import {
  MessageSquare,
  Users,
  FileText,
  CreditCard,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'


interface MobileNavItem {
  icon: LucideIcon
  label: string
  href: string
}

const mobileNavItems: MobileNavItem[] = [
  { icon: MessageSquare, label: 'Chat', href: '/chat' }, // Chat is the brain - main interface
  { icon: Users, label: 'HR', href: '/hr' },
  { icon: FileText, label: 'Docs', href: '/documents' },
  { icon: CreditCard, label: 'Finance', href: '/finance' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export function MobileNav() {
  const pathname = usePathname()
  const activeIndex = mobileNavItems.findIndex(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  const springConfig = {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  }

  const iconTapVariants = {
    tap: { scale: 0.9, transition: { duration: 0.1 } },
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
      {/* Active indicator background */}
      {activeIndex !== -1 && (
        <motion.div
          layoutId="mobile-nav-indicator"
          className="absolute inset-x-0 bottom-0 mx-auto h-1 bg-slate-900 dark:bg-white"
          style={{
            width: `${100 / mobileNavItems.length}%`,
            left: `${(activeIndex * 100) / mobileNavItems.length}%`,
          }}
          transition={springConfig}
        />
      )}

      {mobileNavItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

        return (
          <motion.div key={item.href} whileTap="tap" variants={iconTapVariants}>
            <Link
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors min-h-[48px] min-w-[48px]',
                isActive
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={springConfig}
              >
                <Icon className="h-5 w-5" />
              </motion.div>
              <span>{item.label}</span>
            </Link>
          </motion.div>
        )
      })}
    </nav>
  )
}
