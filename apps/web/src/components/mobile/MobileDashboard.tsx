'use client'

import {
  DollarSign,
  FileText,
  Users,
  TrendingUp,
  Calendar,
  AlertCircle,
} from 'lucide-react'

import { MobileStatCard } from './MobileCard'

export interface DashboardStats {
  revenue: {
    value: number
    currency: string
    trend?: { value: string; isPositive: boolean }
  }
  invoices: {
    total: number
    pending: number
    overdue: number
  }
  employees: {
    total: number
    active: number
  }
  expenses: {
    value: number
    currency: string
    trend?: { value: string; isPositive: boolean }
  }
}

interface MobileDashboardProps {
  stats?: DashboardStats
  isLoading?: boolean
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function MobileDashboard({ stats, isLoading = false }: MobileDashboardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
          />
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No dashboard data available
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Top Stats - 2 Column Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MobileStatCard
          label="Revenue"
          value={formatCurrency(stats.revenue.value, stats.revenue.currency)}
          icon={DollarSign}
          trend={stats.revenue.trend}
          href="/finance"
        />
        <MobileStatCard
          label="Invoices"
          value={stats.invoices.total}
          icon={FileText}
          href="/finance/invoices"
        />
      </div>

      {/* Secondary Stats - 2 Column Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MobileStatCard
          label="Employees"
          value={stats.employees.total}
          icon={Users}
          href="/hr/employees"
        />
        <MobileStatCard
          label="Expenses"
          value={formatCurrency(stats.expenses.value, stats.expenses.currency)}
          icon={TrendingUp}
          trend={stats.expenses.trend}
          href="/finance/expenses"
        />
      </div>

      {/* Alert Stats - Full Width */}
      {stats.invoices.overdue > 0 && (
        <MobileStatCard
          label="Overdue Invoices"
          value={stats.invoices.overdue}
          icon={AlertCircle}
          href="/finance/invoices?status=OVERDUE"
          className="border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20"
        />
      )}

      {stats.invoices.pending > 0 && (
        <MobileStatCard
          label="Pending Invoices"
          value={stats.invoices.pending}
          icon={Calendar}
          href="/finance/invoices?status=SENT"
          className="border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20"
        />
      )}
    </div>
  )
}

export interface QuickAction {
  id: string
  label: string
  icon: any
  href: string
  color?: string
}

interface MobileQuickActionsProps {
  actions: QuickAction[]
}

/**
 * Quick action buttons for common tasks
 * Displayed as a grid on mobile dashboard
 */
export function MobileQuickActions({ actions }: MobileQuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <MobileStatCard
            key={action.id}
            label={action.label}
            value=""
            icon={Icon}
            href={action.href}
            className={action.color}
          />
        )
      })}
    </div>
  )
}
