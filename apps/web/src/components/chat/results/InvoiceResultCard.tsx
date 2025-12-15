/**
 * InvoiceResultCard Component
 * Specialized card for invoice-related action results
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Send,
  Eye,
  Calendar,
  User,
  DollarSign,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Invoice status type
 */
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

/**
 * Line item interface
 */
export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

/**
 * InvoiceResultCard props
 */
export interface InvoiceResultCardProps {
  /**
   * Invoice number
   */
  invoiceNumber: string;

  /**
   * Client/customer name
   */
  clientName: string;

  /**
   * Invoice amount
   */
  amount: number;

  /**
   * Currency code (e.g., USD, EUR)
   */
  currency?: string;

  /**
   * Due date
   */
  dueDate: string;

  /**
   * Invoice status
   */
  status: InvoiceStatus;

  /**
   * Optional line items
   */
  lineItems?: LineItem[];

  /**
   * Callback when View Details is clicked
   */
  onViewDetails?: () => void;

  /**
   * Callback when Send is clicked
   */
  onSend?: () => void;

  /**
   * Callback when Download PDF is clicked
   */
  onDownload?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show loading skeleton
   */
  isLoading?: boolean;
}

/**
 * Get status badge configuration
 */
function getStatusConfig(status: InvoiceStatus) {
  const configs = {
    DRAFT: {
      label: 'Draft',
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    },
    SENT: {
      label: 'Sent',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100',
    },
    PAID: {
      label: 'Paid',
      className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100',
    },
    OVERDUE: {
      label: 'Overdue',
      className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100',
    },
    CANCELLED: {
      label: 'Cancelled',
      className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    },
  };

  return configs[status];
}

/**
 * Format currency
 */
function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get days until/overdue
 */
function getDaysInfo(dueDate: string): {
  days: number;
  isOverdue: boolean;
  label: string;
} {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isOverdue = diffDays < 0;

  let label = '';
  if (diffDays === 0) {
    label = 'Due today';
  } else if (diffDays === 1) {
    label = 'Due tomorrow';
  } else if (diffDays > 1) {
    label = `Due in ${diffDays} days`;
  } else if (diffDays === -1) {
    label = '1 day overdue';
  } else {
    label = `${Math.abs(diffDays)} days overdue`;
  }

  return { days: diffDays, isOverdue, label };
}

/**
 * InvoiceResultCard - Specialized card for invoice results
 *
 * Features:
 * - Invoice number, client, amount, due date display
 * - Status badge with color coding
 * - Overdue warning indicator
 * - Expandable line items preview
 * - Quick actions: View Details, Send, Download PDF
 * - Mobile responsive layout
 * - Smooth expand/collapse animation
 *
 * @example
 * ```tsx
 * <InvoiceResultCard
 *   invoiceNumber="INV-2024-001"
 *   clientName="Acme Corp"
 *   amount={2500}
 *   currency="USD"
 *   dueDate="2024-03-15"
 *   status="SENT"
 *   onViewDetails={() => {}}
 * />
 * ```
 */
export function InvoiceResultCard({
  invoiceNumber,
  clientName,
  amount,
  currency = 'USD',
  dueDate,
  status,
  lineItems,
  onViewDetails,
  onSend,
  onDownload,
  className,
  isLoading,
}: InvoiceResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConfig = getStatusConfig(status);
  const daysInfo = getDaysInfo(dueDate);
  const showDueWarning =
    !['PAID', 'CANCELLED'].includes(status) && daysInfo.isOverdue;

  // Loading skeleton
  if (isLoading) {
    return <InvoiceResultCardSkeleton className={className} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('max-w-[480px] mx-auto', className)}
    >
      <Card className="overflow-hidden border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold truncate">
                  {invoiceNumber}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <User className="h-3.5 w-3.5" />
                  <span className="truncate">{clientName}</span>
                </p>
              </div>
            </div>
            <Badge className={cn('shrink-0', statusConfig.className)}>
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Amount */}
          <div className="rounded-md border bg-background/50 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Amount</span>
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(amount, currency)}
            </p>
          </div>

          {/* Due Date */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Due Date</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{formatDate(dueDate)}</span>
              {showDueWarning && (
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>

          {/* Due warning */}
          {!['PAID', 'CANCELLED'].includes(status) && (
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium',
                daysInfo.isOverdue
                  ? 'bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-900'
                  : 'bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-900'
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{daysInfo.label}</span>
            </div>
          )}

          {/* Line items (expandable) */}
          {lineItems && lineItems.length > 0 && (
            <div className="border-t pt-3">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full text-sm font-medium hover:text-foreground transition-colors"
              >
                <span>
                  Line Items ({lineItems.length})
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-2 max-h-[200px] overflow-y-auto">
                      {lineItems.slice(0, 5).map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-xs p-2 rounded bg-muted/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {item.description}
                            </p>
                            <p className="text-muted-foreground">
                              {item.quantity} × {formatCurrency(item.rate, currency)}
                            </p>
                          </div>
                          <p className="font-medium shrink-0 ml-2">
                            {formatCurrency(item.amount, currency)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {onViewDetails && (
              <Button
                onClick={onViewDetails}
                variant="default"
                size="sm"
                className="flex-1 gap-2"
              >
                <Eye className="h-4 w-4" />
                View Details
              </Button>
            )}
            {onSend && status !== 'CANCELLED' && (
              <Button
                onClick={onSend}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            )}
            {onDownload && (
              <Button
                onClick={onDownload}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * InvoiceResultCardSkeleton - Loading state
 */
export function InvoiceResultCardSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn('max-w-[480px] mx-auto', className)}>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1">
              <Skeleton className="h-5 w-5" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-10" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
