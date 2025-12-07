/**
 * CustomerCard Component
 * Rich customer card for displaying customer information inline in chat messages
 */

'use client';

import { Building2, Mail, DollarSign, FileText, ExternalLink, User, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface CustomerCardProps {
  customer: {
    id: string;
    name: string;
    company?: string;
    email?: string;
    status: 'ACTIVE' | 'INACTIVE';
    totalRevenue?: number;
    invoiceCount?: number;
    currency?: string;
  };
  onViewProfile?: (id: string) => void;
  onSendEmail?: (email: string) => void;
}

const statusConfig = {
  ACTIVE: {
    icon: CheckCircle,
    label: 'Active',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  INACTIVE: {
    icon: XCircle,
    label: 'Inactive',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  },
};

export function CustomerCard({ customer, onViewProfile, onSendEmail }: CustomerCardProps) {
  const statusInfo = statusConfig[customer.status];
  const StatusIcon = statusInfo.icon;

  // Generate initials from customer name
  const initials = customer.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: customer.currency || 'USD',
    }).format(amount);
  };

  return (
    <Card className="max-w-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Avatar and Name Section */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarFallback className="text-base bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base truncate">{customer.name}</h3>
              </div>

              {customer.company && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{customer.company}</span>
                </div>
              )}

              {customer.email && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <Badge variant="secondary" className={cn('shrink-0', statusInfo.className)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-md">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Total Revenue</span>
            </div>
            <p className="text-lg font-semibold">
              {formatCurrency(customer.totalRevenue)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Invoices</span>
            </div>
            <p className="text-lg font-semibold">
              {customer.invoiceCount ?? 0}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 pt-2">
          {onViewProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewProfile(customer.id)}
              className="flex-1 gap-1.5"
            >
              <User className="h-3.5 w-3.5" />
              View Profile
              <ExternalLink className="h-3 w-3 ml-auto" />
            </Button>
          )}

          {onSendEmail && customer.email && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSendEmail(customer.email!)}
              className="flex-1 gap-1.5"
            >
              <Mail className="h-3.5 w-3.5" />
              Send Email
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
