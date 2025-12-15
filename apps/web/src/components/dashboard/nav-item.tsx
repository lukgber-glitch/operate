'use client'

import { ChevronDown, LucideIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useCallback, memo } from 'react'

import { useSidebar } from '@/hooks/use-sidebar'
import { cn } from '@/lib/utils'

// Memoized spring configuration - defined outside component
const navSpringConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 20,
} as const

// Memoized animation variants - defined outside component
const chevronVariants = {
  collapsed: { rotate: 0 },
  expanded: { rotate: 180, transition: navSpringConfig },
} as const

const nestedItemsVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2 },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.3, ease: 'easeOut' as const },
      opacity: { delay: 0.1, duration: 0.2 },
    },
  },
} as const

const hoverVariants = {
  hover: {
    x: 2,
    transition: navSpringConfig,
  },
} as const

export interface NavItemProps {
  icon: LucideIcon
  label: string
  href: string
  children?: Array<{
    label: string
    href: string
    icon?: LucideIcon
  }>
}

export const NavItem = memo(function NavItem({ icon: Icon, label, href, children }: NavItemProps) {
  const pathname = usePathname()
  const { isOpen: isSidebarOpen } = useSidebar()
  const [isExpanded, setIsExpanded] = useState(false)

  const isActive = pathname === href || pathname.startsWith(href + '/')
  const hasChildren = children && children.length > 0

  // Memoized click handler
  const handleClick = useCallback(() => {
    if (hasChildren) {
      setIsExpanded(prev => !prev)
    }
  }, [hasChildren])

  return (
    <div>
      {hasChildren ? (
        <motion.button
          onClick={handleClick}
          whileHover="hover"
          variants={hoverVariants}
          style={{ borderRadius: 'var(--radius-md)' }}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors',
            isActive
              ? 'bg-white/10 text-white'
              : 'text-gray-300 hover:bg-white/5 hover:text-white'
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 flex-shrink-0" />
            {isSidebarOpen && <span>{label}</span>}
          </div>
          {isSidebarOpen && hasChildren && (
            <motion.div
              variants={chevronVariants}
              animate={isExpanded ? 'expanded' : 'collapsed'}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          )}
        </motion.button>
      ) : (
        <motion.div whileHover="hover" variants={hoverVariants}>
          <Link
            href={href}
            style={{ borderRadius: 'var(--radius-md)' }}
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-white/10 text-white'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            )}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {isSidebarOpen && <span>{label}</span>}
          </Link>
        </motion.div>
      )}

      {/* Nested children */}
      <AnimatePresence>
        {hasChildren && isExpanded && isSidebarOpen && (
          <motion.div
            variants={nestedItemsVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="ml-8 mt-1 space-y-1 overflow-hidden"
          >
            {children.map((child, index) => {
              const ChildIcon = child.icon;
              return (
                <motion.div
                  key={child.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: { delay: index * 0.05, ...navSpringConfig },
                  }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <Link
                    href={child.href}
                    style={{ borderRadius: 'var(--radius-md)' }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                      pathname === child.href
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {ChildIcon && <ChildIcon className="h-4 w-4 flex-shrink-0" />}
                    {child.label}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
