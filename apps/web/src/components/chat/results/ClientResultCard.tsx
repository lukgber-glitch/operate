/**
 * ClientResultCard Component
 * Specialized card for client/vendor action results
 */

'use client';

import { motion } from 'framer-motion';
import {
  Users,
  Building2,
  Eye,
  FileText,
  Mail,
  DollarSign,
  TrendingUp,
  Phone,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Entity type
 */
export type EntityType = 'client' | 'vendor';

/**
 * Payment status
 */
export type PaymentStatus = 'current' | 'overdue' | 'paid-in-full';

/**
 * ClientResultCard props
 */
export interface ClientResultCardProps {
  /**
   * Entity type (client or vendor)
   */
  type: EntityType;

  /**
   * Client/vendor name
   */
  name: string;

  /**
   * Email address
   */
  email?: string;

  /**
   * Phone number
   */
  phone?: string;

  /**
   * Address
   */
  address?: string;

  /**
   * Total revenue (for clients) or spend (for vendors)
   */
  totalAmount?: number;

  /**
   * Outstanding balance
   */
  outstandingBalance?: number;

  /**
   * Currency code
   */
  currency?: string;

  /**
   * Payment status indicator
   */
  paymentStatus?: PaymentStatus;

  /**
   * Number of invoices/bills
   */
  documentCount?: number;

  /**
   * Callback when View Profile is clicked
   */
  onViewProfile?: () => void;

  /**
   * Callback when Create Invoice is clicked (clients only)
   */
  onCreateInvoice?: () => void;

  /**
   * Callback when Email is clicked
   */
  onEmail?: () => void;

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
 * Get payment status configuration
 */
function getPaymentStatusConfig(status: PaymentStatus) {
  const configs = {
    current: {
      label: 'Current',
      className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100',
    },
    overdue: {
      label: 'Overdue',
      className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100',
    },
    'paid-in-full': {
      label: 'Paid in Full',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100',
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
 * ClientResultCard - Specialized card for client/vendor results
 *
 * Features:
 * - Name, email, contact info display
 * - Total revenue/spend indicator
 * - Outstanding balance warning
 * - Payment status badge
 * - Quick actions: View Profile, Create Invoice, Email
 * - Mobile responsive layout
 * - Smooth animations
 *
 * @example
 * ```tsx
 * <ClientResultCard
 *   type="client"
 *   name="Acme Corp"
 *   email="billing@acme.com"
 *   totalAmount={50000}
 *   outstandingBalance={5000}
 *   paymentStatus="current"
 *   onViewProfile={() => {}}
 * />
 * ```
 */
export function ClientResultCard({
  type,
  name,
  email,
  phone,
  address,
  totalAmount,
  outstandingBalance,
  currency = 'USD',
  paymentStatus,
  documentCount,
  onViewProfile,
  onCreateInvoice,
  onEmail,
  className,
  isLoading,
}: ClientResultCardProps) {
  const isClient = type === 'client';
  const Icon = isClient ? Users : Building2;
  const statusConfig = paymentStatus
    ? getPaymentStatusConfig(paymentStatus)
    : null;

  // Loading skeleton
  if (isLoading) {
    return <ClientResultCardSkeleton className={className} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('max-w-[480px] mx-auto', className)}
    >
      <Card className="overflow-hidden border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold truncate">{name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {isClient ? 'Client' : 'Vendor'}
                </p>
              </div>
            </div>
            {statusConfig && (
              <Badge className={cn('shrink-0', statusConfig.className)}>
                {statusConfig.label}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Contact info */}
          {(email || phone || address) && (
            <div className="space-y-2 text-sm">
              {email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <a
                    href={`mailto:${email}`}
                    className="hover:underline truncate"
                  >
                    {email}
                  </a>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <a href={`tel:${phone}`} className="hover:underline">
                    {phone}
                  </a>
                </div>
              )}
              {address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{address}</span>
                </div>
              )}
            </div>
          )}

          {/* Financial metrics */}
          {(totalAmount !== undefined || outstandingBalance !== undefined) && (
            <div className="grid grid-cols-2 gap-3">
              {/* Total amount */}
              {totalAmount !== undefined && (
                <div className="rounded-md border bg-background/50 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Total {isClient ? 'Revenue' : 'Spend'}</span>
                  </div>
                  <p className="text-lg font-bold truncate">
                    {formatCurrency(totalAmount, currency)}
                  </p>
                  {documentCount !== undefined && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {documentCount} {isClient ? 'invoice' : 'bill'}
                      {documentCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Outstanding balance */}
              {outstandingBalance !== undefined && (
                <div
                  className={cn(
                    'rounded-md border p-3',
                    outstandingBalance > 0
                      ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900'
                      : 'bg-background/50'
                  )}
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Outstanding</span>
                  </div>
                  <p
                    className={cn(
                      'text-lg font-bold truncate',
                      outstandingBalance > 0 &&
                        'text-orange-600 dark:text-orange-400'
                    )}
                  >
                    {formatCurrency(outstandingBalance, currency)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {onViewProfile && (
              <Button
                onClick={onViewProfile}
                variant="default"
                size="sm"
                className="flex-1 gap-2"
              >
                <Eye className="h-4 w-4" />
                View Profile
              </Button>
            )}
            {isClient && onCreateInvoice && (
              <Button
                onClick={onCreateInvoice}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
              >
                <FileText className="h-4 w-4" />
                Create Invoice
              </Button>
            )}
            {onEmail && email && (
              <Button
                onClick={onEmail}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * ClientResultCardSkeleton - Loading state
 */
export function ClientResultCardSkeleton({
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
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
