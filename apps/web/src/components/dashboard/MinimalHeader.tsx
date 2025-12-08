'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  Bell,
  HelpCircle,
  History,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GuruLogo } from '@/components/ui/guru-logo';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface MinimalHeaderProps {
  className?: string;
  showDashboardLink?: boolean;
  showHistory?: boolean;
  showNotifications?: boolean;
  onHistoryClick?: () => void;
}

// Animation variants
const headerVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const iconButtonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

/**
 * MinimalHeader - Clean, minimal header for chat-centric pages
 *
 * Features:
 * - Centered logo
 * - Dashboard icon (left) - navigates to full dashboard
 * - Settings/History icons (right)
 * - Responsive with mobile menu
 * - Subtle entrance animation
 */
export function MinimalHeader({
  className,
  showDashboardLink = true,
  showHistory = true,
  showNotifications = true,
  onHistoryClick,
}: MinimalHeaderProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const isOnDashboard = pathname === '/dashboard';

  return (
    <TooltipProvider delayDuration={300}>
      <motion.header
        className={cn(
          'fixed top-0 left-0 right-0 z-30',
          'flex items-center justify-between px-4 md:px-6 py-3',
          'bg-gradient-to-b from-white/90 to-white/70',
          'backdrop-blur-md border-b border-blue-100/50',
          className
        )}
        variants={prefersReducedMotion ? undefined : headerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left Section - Dashboard Link */}
        <div className="flex items-center gap-2 w-32">
          {showDashboardLink && !isOnDashboard && (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  variants={prefersReducedMotion ? undefined : iconButtonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="h-9 w-9 rounded-xl hover:bg-blue-100/80"
                  >
                    <Link href="/dashboard">
                      <LayoutDashboard
                        className="h-5 w-5"
                        style={{ color: 'var(--color-blue-600)' }}
                      />
                      <span className="sr-only">Dashboard</span>
                    </Link>
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                <p>View Dashboard</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Center - Logo */}
        <Link
          href="/chat"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <GuruLogo className="h-8 w-8" />
          <span
            className="font-semibold text-lg hidden sm:inline"
            style={{ color: 'var(--color-blue-700)' }}
          >
            Operate
          </span>
        </Link>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-1 w-32 justify-end">
          {/* Chat History */}
          {showHistory && (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  variants={prefersReducedMotion ? undefined : iconButtonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl hover:bg-blue-100/80"
                    onClick={onHistoryClick}
                  >
                    <History
                      className="h-5 w-5"
                      style={{ color: 'var(--color-blue-600)' }}
                    />
                    <span className="sr-only">Chat History</span>
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                <p>Chat History</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Notifications */}
          {showNotifications && (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  variants={prefersReducedMotion ? undefined : iconButtonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="h-9 w-9 rounded-xl hover:bg-blue-100/80 relative"
                  >
                    <Link href="/notifications">
                      <Bell
                        className="h-5 w-5"
                        style={{ color: 'var(--color-blue-600)' }}
                      />
                      {/* Notification dot */}
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                      <span className="sr-only">Notifications</span>
                    </Link>
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Settings Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <motion.div
                    variants={prefersReducedMotion ? undefined : iconButtonVariants}
                    initial="initial"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl hover:bg-blue-100/80"
                    >
                      <Settings
                        className="h-5 w-5"
                        style={{ color: 'var(--color-blue-600)' }}
                      />
                      <span className="sr-only">Settings</span>
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/ai" className="flex items-center gap-2">
                  <span className="h-4 w-4 text-center">AI</span>
                  <span>AI Preferences</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/help" className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help & Support</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>
    </TooltipProvider>
  );
}

export default MinimalHeader;
