'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  LayoutDashboard,
  FileText,
  Settings,
  LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive: boolean;
}

function NavItem({ icon: Icon, label, href, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center justify-center gap-1',
        'min-w-[64px] min-h-[44px] px-3 py-2',
        'transition-colors rounded-md',
        'active:bg-accent/50',
        isActive
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
      )}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </Link>
  );
}

/**
 * BottomNav - Mobile bottom navigation bar
 *
 * Features:
 * - Only visible on mobile (< md breakpoint)
 * - Fixed at bottom with safe area insets
 * - Touch-friendly 44px min tap targets
 * - Active route highlighting
 * - Semantic navigation with ARIA labels
 *
 * Usage:
 * - Add to layout.tsx inside the body, outside main content
 * - Will automatically hide on desktop
 */
export function BottomNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Don't render on desktop or during SSR (prevents hydration issues)
  if (!isMobile) {
    return null;
  }

  const navItems = [
    {
      icon: MessageSquare,
      label: 'Chat',
      href: '/',
    },
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      href: '/dashboard',
    },
    {
      icon: FileText,
      label: 'Invoices',
      href: '/invoices',
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/settings',
    },
  ];

  return (
    <nav
      className={cn(
        'fixed bottom-0 start-0 end-0 z-50',
        'h-16 bg-background/95 backdrop-blur-sm',
        'border-t shadow-lg',
        'md:hidden',
        // Safe area insets for notch devices
        'pb-safe'
      )}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-full max-w-screen-xl mx-auto px-2">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            isActive={pathname === item.href}
          />
        ))}
      </div>
    </nav>
  );
}
