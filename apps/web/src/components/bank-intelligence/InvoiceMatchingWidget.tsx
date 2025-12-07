'use client';

import { format, parseISO } from 'date-fns';
import { Check, X, ExternalLink, FileText } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnmatchedPayments, useConfirmMatch } from './useBankIntelligence';

interface InvoiceMatchingWidgetProps {
  className?: string;
}

export function InvoiceMatchingWidget({ className }: InvoiceMatchingWidgetProps) {
  const { data: unmatched, isLoading, isError } = useUnmatchedPayments();
  const confirmMatchMutation = useConfirmMatch();

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleConfirmMatch = (transactionId: string, invoiceId: string) => {
    confirmMatchMutation.mutate({ transactionId, invoiceId });
  };

  const incomingPayments = unmatched?.incoming || [];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Invoice Matching</CardTitle>
          <CardDescription className="text-destructive">
            Failed to load unmatched payments
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (incomingPayments.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Invoice Matching
          </CardTitle>
          <CardDescription>No unmatched incoming payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 text-center">
            <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-900 dark:text-green-100">
              All payments matched!
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              All incoming payments are matched to invoices
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Invoice Matching
            </CardTitle>
            <CardDescription>
              {incomingPayments.length} unmatched incoming payment{incomingPayments.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Link
            href="/reconciliation"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Manual Match
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {incomingPayments.slice(0, 3).map((payment) => (
            <div
              key={payment.id}
              className="p-3 rounded-lg border border-border space-y-3"
            >
              {/* Payment Info */}
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <div className="font-medium">{payment.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(parseISO(payment.date), 'MMM dd, yyyy')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    +{formatCurrency(payment.amount, payment.currency)}
                  </div>
                </div>
              </div>

              {/* Suggested Matches */}
              {payment.suggestedMatches && payment.suggestedMatches.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Suggested Matches
                  </div>
                  {payment.suggestedMatches.slice(0, 2).map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-2 rounded bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{match.reference}</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(match.confidence * 100)}% match
                          </Badge>
                        </div>
                        {match.clientOrVendor && (
                          <div className="text-xs text-muted-foreground">
                            {match.clientOrVendor}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(match.amount, payment.currency)} •{' '}
                          {format(parseISO(match.date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleConfirmMatch(payment.transactionId, match.id)}
                        disabled={confirmMatchMutation.isPending}
                        className="ml-2"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-2">
                  No automatic matches found
                </div>
              )}
            </div>
          ))}

          {incomingPayments.length > 3 && (
            <div className="text-center">
              <Link
                href="/reconciliation"
                className="text-sm text-primary hover:underline"
              >
                View all {incomingPayments.length} unmatched payments
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
