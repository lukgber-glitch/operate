'use client'

import { FileText, Calendar, DollarSign } from 'lucide-react'


import { Badge } from '@/components/ui/badge'

import { cn } from '@/lib/utils'

import { MobileListCard } from './MobileCard'

export interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  amount: number
  currency: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  dueDate: Date | string
  issueDate: Date | string
}

interface MobileInvoiceListProps {
  invoices: Invoice[]
  isLoading?: boolean
  emptyMessage?: string
  onInvoiceClick?: (invoice: Invoice) => void
}

const statusConfig = {
  PAID: {
    label: 'Paid',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  SENT: {
    label: 'Sent',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  OVERDUE: {
    label: 'Overdue',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  DRAFT: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  },
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(amount)
}

export function MobileInvoiceList({
  invoices,
  isLoading = false,
  emptyMessage = 'No invoices found',
  onInvoiceClick,
}: MobileInvoiceListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
          />
        ))}
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-slate-400 mb-4" />
        <p className="text-sm text-slate-600 dark:text-slate-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => {
        const status = statusConfig[invoice.status]
        const handleClick = onInvoiceClick
          ? () => onInvoiceClick(invoice)
          : undefined

        return (
          <MobileListCard
            key={invoice.id}
            href={!onInvoiceClick ? `/finance/invoices/${invoice.id}` : undefined}
            onClick={handleClick}
            icon={FileText}
            title={invoice.invoiceNumber}
            subtitle={invoice.clientName}
            badge={
              <Badge variant="secondary" className={cn('text-xs', status.className)}>
                {status.label}
              </Badge>
            }
            actions={
              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="font-semibold">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(invoice.dueDate)}</span>
                </div>
              </div>
            }
          />
        )
      })}
    </div>
  )
}

interface MobileInvoiceCardProps {
  invoice: Invoice
  onClick?: () => void
}

/**
 * Individual mobile invoice card component
 * Can be used standalone or as part of the list
 */
export function MobileInvoiceCard({ invoice, onClick }: MobileInvoiceCardProps) {
  const status = statusConfig[invoice.status]

  return (
    <MobileListCard
      href={!onClick ? `/finance/invoices/${invoice.id}` : undefined}
      onClick={onClick}
      icon={FileText}
      title={invoice.invoiceNumber}
      subtitle={invoice.clientName}
      badge={
        <Badge variant="secondary" className={cn('text-xs', status.className)}>
          {status.label}
        </Badge>
      }
      actions={
        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="font-semibold">
              {formatCurrency(invoice.amount, invoice.currency)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(invoice.dueDate)}</span>
          </div>
        </div>
      }
    />
  )
}
