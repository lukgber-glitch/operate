'use client'

import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { forwardRef } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface MobileCardProps {
  children?: React.ReactNode
  className?: string
  contentClassName?: string
  href?: string
  onClick?: () => void
  asButton?: boolean
}

/**
 * MobileCard - Touch-friendly card component optimized for mobile devices
 * Features:
 * - Minimum 44x44px touch target
 * - Larger padding for easier tapping
 * - Optional link or button behavior
 * - Active state feedback
 */
export const MobileCard = forwardRef<HTMLDivElement, MobileCardProps>(
  ({ children, className, contentClassName, href, onClick, asButton = false }, ref) => {
    const interactive = !!href || !!onClick || asButton
    const isLink = !!href

    const cardClasses = cn(
      'transition-all duration-200',
      interactive && [
        'cursor-pointer',
        'active:scale-[0.98] active:shadow-sm',
        'hover:shadow-md',
      ],
      className
    )

    const content = (
      <CardContent className={cn('p-4 min-h-[44px]', contentClassName)}>
        {children}
      </CardContent>
    )

    if (isLink) {
      return (
        <Link href={href} className="block">
          <Card ref={ref} className={cardClasses}>
            {content}
          </Card>
        </Link>
      )
    }

    if (onClick || asButton) {
      return (
        <Card
          ref={ref}
          className={cardClasses}
          onClick={onClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onClick?.()
            }
          }}
        >
          {content}
        </Card>
      )
    }

    return (
      <Card ref={ref} className={className}>
        {content}
      </Card>
    )
  }
)

MobileCard.displayName = 'MobileCard'

export interface MobileListCardProps {
  title: string
  subtitle?: string
  description?: string
  icon?: LucideIcon
  badge?: React.ReactNode
  actions?: React.ReactNode
  href?: string
  onClick?: () => void
  className?: string
}

/**
 * MobileListCard - Specialized card for list items on mobile
 * Optimized layout for displaying list items with icon, title, subtitle, and actions
 */
export const MobileListCard = forwardRef<HTMLDivElement, MobileListCardProps>(
  (
    {
      title,
      subtitle,
      description,
      icon: Icon,
      badge,
      actions,
      href,
      onClick,
      className,
    },
    ref
  ) => {
    return (
      <MobileCard
        ref={ref}
        href={href}
        onClick={onClick}
        className={cn('mb-3', className)}
        asButton={!href && !!onClick}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
              <Icon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {title}
                </h3>
                {subtitle && (
                  <p className="truncate text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
              {badge && <div className="shrink-0">{badge}</div>}
            </div>

            {description && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                {description}
              </p>
            )}

            {actions && (
              <div className="mt-3 flex items-center gap-2">{actions}</div>
            )}
          </div>
        </div>
      </MobileCard>
    )
  }
)

MobileListCard.displayName = 'MobileListCard'

export interface MobileStatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  trend?: {
    value: string | number
    isPositive: boolean
  }
  href?: string
  onClick?: () => void
  className?: string
}

/**
 * MobileStatCard - Card for displaying statistics on mobile
 * Compact layout for displaying key metrics
 */
export const MobileStatCard = forwardRef<HTMLDivElement, MobileStatCardProps>(
  ({ label, value, icon: Icon, trend, href, onClick, className }, ref) => {
    return (
      <MobileCard
        ref={ref}
        href={href}
        onClick={onClick}
        className={className}
        asButton={!href && !!onClick}
        contentClassName="p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {value}
            </p>
            {trend && (
              <p
                className={cn(
                  'mt-1 text-xs font-medium',
                  trend.isPositive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </p>
            )}
          </div>
          {Icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Icon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
            </div>
          )}
        </div>
      </MobileCard>
    )
  }
)

MobileStatCard.displayName = 'MobileStatCard'
