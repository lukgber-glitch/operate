'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InvoiceStatusBadge, type InvoiceStatus } from './InvoiceStatusBadge';
import { FileText, Download, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';

interface InvoiceMiniCardProps {
  invoice: {
    id: string;
    number: string;
    date: string;
    dueDate: string;
    total: number;
    currency: string;
    status: InvoiceStatus;
  };
  onView?: (invoiceId: string) => void;
  onDownload?: (invoiceId: string) => void;
}

export function InvoiceMiniCard({
  invoice,
  onView,
  onDownload,
}: InvoiceMiniCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{invoice.number}</p>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(invoice.date)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-sm">
              {formatCurrency(invoice.total, invoice.currency)}
            </p>
            {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
              <p className="text-xs text-muted-foreground">
                Due: {formatDate(invoice.dueDate)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onView(invoice.id)}
            >
              <Eye className="mr-1 h-3 w-3" />
              View
            </Button>
          )}
          {onDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(invoice.id)}
            >
              <Download className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
