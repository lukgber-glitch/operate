'use client'

import * as React from 'react'
import { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

export interface QuickActionCardProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  count?: number
  onClick: () => void
  variant?: 'default' | 'primary' | 'success' | 'warning'
  disabled?: boolean
  className?: string
}

const variantStyles = {
  default: {
    card: 'hover:border-slate-300 hover:shadow-md dark:hover:border-slate-700',
    icon: 'text-slate-600 dark:text-slate-400',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
  },
  primary: {
    card: 'hover:border-blue-300 hover:shadow-md hover:shadow-blue-100 dark:hover:border-blue-700',
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-50 dark:bg-blue-950',
  },
  success: {
    card: 'hover:border-green-300 hover:shadow-md hover:shadow-green-100 dark:hover:border-green-700',
    icon: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-50 dark:bg-green-950',
  },
  warning: {
    card: 'hover:border-amber-300 hover:shadow-md hover:shadow-amber-100 dark:hover:border-amber-700',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-50 dark:bg-amber-950',
  },
}

export function QuickActionCard({
  icon: Icon,
  title,
  subtitle,
  count,
  onClick,
  variant = 'default',
  disabled = false,
  className,
}: QuickActionCardProps) {
  const styles = variantStyles[variant]

  return (
    <Card
      className={cn(
        'relative cursor-pointer transition-all duration-200',
        styles.card,
        disabled && 'opacity-50 cursor-not-allowed',
        'group',
        className
      )}
      onClick={disabled ? undefined : onClick}
    >
      <div className="p-4 space-y-3">
        {/* Icon container */}
        <div className="flex items-center justify-between">
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-lg transition-transform duration-200 group-hover:scale-110',
              styles.iconBg
            )}
          >
            <Icon className={cn('w-6 h-6', styles.icon)} />
          </div>

          {/* Count badge */}
          {count !== undefined && count > 0 && (
            <div className="flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold">
              {count > 99 ? '99+' : count}
            </div>
          )}
        </div>

        {/* Text content */}
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Hover indicator */}
      <div className="absolute inset-0 rounded-lg ring-2 ring-transparent group-hover:ring-slate-200 dark:group-hover:ring-slate-700 transition-all duration-200 pointer-events-none" />
    </Card>
  )
}
