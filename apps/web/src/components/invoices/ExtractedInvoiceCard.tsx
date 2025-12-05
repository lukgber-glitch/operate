/**
 * Extracted Invoice Card Component
 * Card displaying summary of extracted invoice
 */

'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { CheckCircle2, XCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExtractedInvoice, ExtractionReviewStatus } from '@/types/extracted-invoice';
import { format } from 'date-fns';

interface ExtractedInvoiceCardProps {
  invoice: ExtractedInvoice;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  onView?: () => void;
  className?: string;
}

export function ExtractedInvoiceCard({
  invoice,
  selected = false,
  onSelect,
  onView,
  className,
}: ExtractedInvoiceCardProps) {
  const { data, overallConfidence, reviewStatus, createdAt } = invoice;

  const getStatusIcon = (status: ExtractionReviewStatus) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'NEEDS_CORRECTION':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusBadgeVariant = (status: ExtractionReviewStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'default';
      case 'REJECTED':
        return 'destructive';
      case 'NEEDS_CORRECTION':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-shadow cursor-pointer',
        selected && 'ring-2 ring-primary',
        className
      )}
      onClick={() => onView?.()}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {onSelect && (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onSelect(e.target.checked);
                  }}
                  className="w-4 h-4 rounded border-gray-300"
                />
              )}
              <h3 className="font-semibold text-base truncate">
                {data.vendorName || 'Unknown Vendor'}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.invoiceNumber || 'No invoice number'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {getStatusIcon(reviewStatus)}
            <ConfidenceIndicator
              confidence={overallConfidence}
              showLabel={false}
              size="sm"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total:</span>
          <span className="text-lg font-bold">
            {formatCurrency(data.total, data.currency)}
          </span>
        </div>

        {data.invoiceDate && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Date:</span>
            <span>{format(new Date(data.invoiceDate), 'MMM d, yyyy')}</span>
          </div>
        )}

        {data.dueDate && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Due:</span>
            <span>{format(new Date(data.dueDate), 'MMM d, yyyy')}</span>
          </div>
        )}

        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Extracted:</span>
          <span>{format(new Date(createdAt), 'MMM d, yyyy HH:mm')}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t flex items-center justify-between">
        <Badge variant={getStatusBadgeVariant(reviewStatus)}>
          {reviewStatus.replace(/_/g, ' ')}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onView?.();
          }}
        >
          <Eye className="w-4 h-4 mr-2" />
          Review
        </Button>
      </CardFooter>
    </Card>
  );
}
