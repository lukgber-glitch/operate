'use client'

import {
  MessageSquare,
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Calculator,
  BarChart,
  Settings,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Activity,
  Shield,
  FileSignature,
  Clock,
  Lightbulb,
  Zap,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { GuruLogo } from '@/components/ui/guru-logo'
import { useAuth } from '@/hooks/use-auth'
import { useSidebar } from '@/hooks/use-sidebar'
import { cn } from '@/lib/utils'
import { staggerContainer, slideInLeft } from '@/lib/animation-variants'

import { NavItem, NavItemProps } from './nav-item'
import { OrgSwitcher } from './org-switcher'

// Memoized spring configuration - defined outside component to prevent recreation
const sidebarSpringConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
} as const

// Memoized sidebar variants - defined outside component
const sidebarVariants = {
  open: {
    width: 256,
    transition: sidebarSpringConfig,
  },
  closed: {
    width: 64,
    transition: sidebarSpringConfig,
  },
} as const

// Static navigation items - defined outside component to prevent recreation
const navItems: NavItemProps[] = [
  { icon: MessageSquare, label: 'Chat', href: '/chat' }, // Chat is the brain - main interface
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: Zap, label: 'Autopilot', href: '/autopilot' },
  { icon: Activity, label: 'Business Health', href: '/health-score' },
  { icon: Users, label: 'HR', href: '/hr' },
  { icon: FileText, label: 'Documents', href: '/documents' },
  { icon: FileSignature, label: 'Contracts', href: '/contracts' },
  {
    icon: CreditCard,
    label: 'Finance',
    href: '/finance',
    children: [
      { label: 'Invoices', href: '/finance/invoices' },
      { label: 'Quotes', href: '/quotes' },
      { label: 'Expenses', href: '/finance/expenses' },
      { label: 'Banking', href: '/finance/banking' },
      { label: 'Mileage', href: '/mileage' },
    ],
  },
  {
    icon: Clock,
    label: 'Time Tracking',
    href: '/time',
    children: [
      { label: 'Timer', href: '/time' },
      { label: 'Entries', href: '/time/entries' },
      { label: 'Projects', href: '/time/projects' },
    ],
  },
  {
    icon: Calculator,
    label: 'Tax',
    href: '/tax',
    children: [
      { label: 'Tax Assistant', href: '/tax-assistant', icon: Lightbulb },
      { label: 'Filing', href: '/tax/filing' },
      { label: 'Deductions', href: '/tax/deductions' },
      { label: 'Calculators', href: '/tax/deductions/calculators' },
      { label: 'Reports', href: '/tax/reports' },
    ],
  },
  { icon: Shield, label: 'Insurance', href: '/insurance' },
  { icon: BarChart, label: 'Reports', href: '/reports' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export function Sidebar() {
  const { isOpen, toggle } = useSidebar()
  const { logout, isLoading } = useAuth()
  const router = useRouter()

  // Memoized logout handler to prevent recreation on each render
  const handleLogout = useCallback(async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }, [logout, router])

  return (
    <motion.aside
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
      variants={sidebarVariants}
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-white/5 backdrop-blur-sm border-white/10'
      )}
    >
      {/* Logo & Toggle */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        {isOpen ? (
          <Link href="/chat" className="flex items-center gap-2" aria-label="Go to chat">
            <GuruLogo size={32} />
            <AnimatePresence mode="wait">
              <motion.span
                key="logo-text"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-bold text-white"
              >
                Operate
              </motion.span>
            </AnimatePresence>
          </Link>
        ) : (
          <Link href="/chat" className="flex items-center" aria-label="Go to chat">
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
      <div className="border-b border-white/10 p-4">
        <OrgSwitcher />
      </div>

      {/* Navigation */}
      <motion.nav
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex-1 space-y-1 overflow-y-auto p-4"
        aria-label="Main navigation"
      >
        {navItems.map((item, index) => (
          <motion.div key={item.href} variants={slideInLeft} custom={index}>
            <NavItem {...item} />
          </motion.div>
        ))}
      </motion.nav>

      {/* User Profile */}
      <div className="border-t border-white/10 p-4" role="complementary" aria-label="User profile">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatar-placeholder.png" alt="John Doe profile picture" />
            <AvatarFallback className="bg-white/10 text-white" aria-label="John Doe">
              JD
            </AvatarFallback>
          </Avatar>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-white">
                John Doe
              </p>
              <p className="truncate text-xs text-gray-300">
                john@example.com
              </p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            size={isOpen ? 'sm' : 'icon'}
            onClick={handleLogout}
            disabled={isLoading}
            className={cn(
              'w-full justify-start text-gray-300 hover:text-red-400 hover:bg-red-950/50',
              !isOpen && 'justify-center'
            )}
            data-testid="logout-button"
            aria-label="Log out of your account"
          >
            <LogOut className={cn('h-4 w-4', isOpen && 'mr-2')} aria-hidden="true" />
            {isOpen && <span>Log out</span>}
          </Button>
        </motion.div>
      </div>

      {/* Expand button when collapsed */}
      {!isOpen && (
        <div className="border-t border-white/10 p-4">
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
    </motion.aside>
  )
}
