/**
 * InvoicePreview Component
 * Displays invoice details inline in chat messages
 */

'use client';

import { Receipt, Eye, Send, Download, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InvoicePreviewProps {
  invoice: {
    id: string;
    number: string;
    customerName: string;
    amount: number;
    currency: string;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    dueDate: string;
    issueDate: string;
    lineItemCount: number;
  };
  onView?: (id: string) => void;
  onSend?: (id: string) => void;
  onDownload?: (id: string) => void;
}

/**
 * Get status badge configuration
 */
function getStatusConfig(status: InvoicePreviewProps['invoice']['status']) {
  switch (status) {
    case 'DRAFT':
      return {
        variant: 'secondary' as const,
        label: 'Draft',
        className: 'bg-gray-100 text-gray-700 border-gray-200',
      };
    case 'SENT':
      return {
        variant: 'default' as const,
        label: 'Sent',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
      };
    case 'PAID':
      return {
        variant: 'default' as const,
        label: 'Paid',
        className: 'bg-green-100 text-green-700 border-green-200',
      };
    case 'OVERDUE':
      return {
        variant: 'destructive' as const,
        label: 'Overdue',
        className: 'bg-red-100 text-red-700 border-red-200',
      };
    case 'CANCELLED':
      return {
        variant: 'outline' as const,
        label: 'Cancelled',
        className: 'bg-gray-50 text-gray-500 border-gray-300',
      };
  }
}

/**
 * Calculate days until/since due date
 */
function getDaysInfo(dueDate: string): { days: number; isOverdue: boolean; label: string } {
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
 * Format date in readable format
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
 * Format currency amount
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function InvoicePreview({ invoice, onView, onSend, onDownload }: InvoicePreviewProps) {
  const statusConfig = getStatusConfig(invoice.status);
  const daysInfo = getDaysInfo(invoice.dueDate);
  const isPaid = invoice.status === 'PAID';
  const isCancelled = invoice.status === 'CANCELLED';

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md border-l-4',
        invoice.status === 'OVERDUE' && 'border-l-red-500',
        invoice.status === 'PAID' && 'border-l-green-500',
        invoice.status === 'SENT' && 'border-l-blue-500',
        invoice.status === 'DRAFT' && 'border-l-gray-400',
        invoice.status === 'CANCELLED' && 'border-l-gray-300'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Icon and invoice info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className={cn(
                'p-2 rounded-lg shrink-0',
                invoice.status === 'OVERDUE' && 'bg-red-100',
                invoice.status === 'PAID' && 'bg-green-100',
                invoice.status === 'SENT' && 'bg-blue-100',
                invoice.status === 'DRAFT' && 'bg-gray-100',
                invoice.status === 'CANCELLED' && 'bg-gray-50'
              )}
            >
              <Receipt
                className={cn(
                  'h-5 w-5',
                  invoice.status === 'OVERDUE' && 'text-red-600',
                  invoice.status === 'PAID' && 'text-green-600',
                  invoice.status === 'SENT' && 'text-blue-600',
                  invoice.status === 'DRAFT' && 'text-gray-600',
                  invoice.status === 'CANCELLED' && 'text-gray-400'
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base truncate">{invoice.number}</h3>
                <Badge variant={statusConfig.variant} className={cn('text-xs shrink-0', statusConfig.className)}>
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">{invoice.customerName}</p>
            </div>
          </div>

          {/* Right: Amount */}
          <div className="text-right shrink-0">
            <p className="text-lg font-bold">{formatCurrency(invoice.amount, invoice.currency)}</p>
            <p className="text-xs text-muted-foreground">{invoice.currency}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Invoice details grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Issue Date */}
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Issue Date</p>
            <p className="font-medium">{formatDate(invoice.issueDate)}</p>
          </div>

          {/* Due Date with status indicator */}
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Due Date</p>
            <div className="flex items-center gap-1.5">
              <p className="font-medium">{formatDate(invoice.dueDate)}</p>
              {daysInfo.isOverdue && !isPaid && !isCancelled && (
                <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
              )}
              {isPaid && <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />}
            </div>
          </div>
        </div>

        {/* Due date indicator */}
        {!isPaid && !isCancelled && (
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
              daysInfo.isOverdue
                ? 'bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-900'
                : 'bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-900'
            )}
          >
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="font-medium">{daysInfo.label}</span>
          </div>
        )}

        {/* Line items summary */}
        <div className="flex items-center justify-between px-3 py-2 bg-muted rounded-md text-sm">
          <span className="text-muted-foreground">
            {invoice.lineItemCount} {invoice.lineItemCount === 1 ? 'line item' : 'line items'}
          </span>
          <span className="font-medium">{formatCurrency(invoice.amount, invoice.currency)}</span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(invoice.id)}
              className="gap-1.5 flex-1 min-w-[100px]"
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </Button>
          )}
          {onSend && invoice.status === 'DRAFT' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onSend(invoice.id)}
              className="gap-1.5 flex-1 min-w-[100px]"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </Button>
          )}
          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(invoice.id)}
              className="gap-1.5 flex-1 min-w-[100px]"
            >
              <Download className="h-3.5 w-3.5" />
              PDF
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for inline display in messages
 */
interface InvoicePreviewCompactProps extends InvoicePreviewProps {
  onClick?: () => void;
}

export function InvoicePreviewCompact({ invoice, onClick }: InvoicePreviewCompactProps) {
  const statusConfig = getStatusConfig(invoice.status);
  const daysInfo = getDaysInfo(invoice.dueDate);

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all',
        onClick && 'cursor-pointer hover:bg-accent hover:shadow-sm',
        'border-l-4',
        invoice.status === 'OVERDUE' && 'border-l-red-500',
        invoice.status === 'PAID' && 'border-l-green-500',
        invoice.status === 'SENT' && 'border-l-blue-500',
        invoice.status === 'DRAFT' && 'border-l-gray-400',
        invoice.status === 'CANCELLED' && 'border-l-gray-300'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'p-2 rounded-md shrink-0',
          invoice.status === 'OVERDUE' && 'bg-red-100',
          invoice.status === 'PAID' && 'bg-green-100',
          invoice.status === 'SENT' && 'bg-blue-100',
          invoice.status === 'DRAFT' && 'bg-gray-100',
          invoice.status === 'CANCELLED' && 'bg-gray-50'
        )}
      >
        <Receipt
          className={cn(
            'h-4 w-4',
            invoice.status === 'OVERDUE' && 'text-red-600',
            invoice.status === 'PAID' && 'text-green-600',
            invoice.status === 'SENT' && 'text-blue-600',
            invoice.status === 'DRAFT' && 'text-gray-600',
            invoice.status === 'CANCELLED' && 'text-gray-400'
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-sm truncate">{invoice.number}</span>
          <Badge variant={statusConfig.variant} className={cn('text-xs shrink-0', statusConfig.className)}>
            {statusConfig.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{invoice.customerName}</p>
        {daysInfo.isOverdue && invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-0.5">
            <AlertCircle className="h-3 w-3" />
            {daysInfo.label}
          </p>
        )}
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className="font-bold text-sm">{formatCurrency(invoice.amount, invoice.currency)}</p>
        <p className="text-xs text-muted-foreground">{invoice.lineItemCount} items</p>
      </div>
    </div>
  );
}
