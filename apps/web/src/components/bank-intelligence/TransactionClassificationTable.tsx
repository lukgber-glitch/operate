'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  CheckCircle,
  AlertCircle,
  Edit2,
  ExternalLink,
  ChevronDown,
  FileText,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRecentTransactions, useReclassifyTransaction } from './useBankIntelligence';
import type { ClassifiedTransaction } from './types';

interface TransactionClassificationTableProps {
  limit?: number;
  className?: string;
}

export function TransactionClassificationTable({
  limit = 20,
  className,
}: TransactionClassificationTableProps) {
  const { data: transactions, isLoading, isError } = useRecentTransactions(limit);
  const reclassifyMutation = useReclassifyTransaction();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          {Math.round(confidence * 100)}%
        </Badge>
      );
    }
    if (confidence >= 0.7) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300">
          <AlertCircle className="h-3 w-3 mr-1" />
          {Math.round(confidence * 100)}%
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300">
        <AlertCircle className="h-3 w-3 mr-1" />
        {Math.round(confidence * 100)}%
      </Badge>
    );
  };

  const handleReclassify = (transactionId: string, category: string) => {
    reclassifyMutation.mutate({ transactionId, category });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription className="text-destructive">
            Failed to load transactions
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>No transactions available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Auto-classified with AI - {transactions.length} transactions
            </CardDescription>
          </div>
          <Link
            href="/transactions"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View All
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-1">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-3 py-2 text-xs font-semibold text-muted-foreground border-b">
            <div className="col-span-2">Date</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-1">Confidence</div>
            <div className="col-span-1"></div>
          </div>

          {/* Rows */}
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="border-b last:border-0 hover:bg-muted/50 transition-colors"
            >
              {/* Main Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-3 py-3">
                {/* Mobile Layout */}
                <div className="md:hidden space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold ${
                          transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.amount >= 0 ? '+' : ''}
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{transaction.category}</Badge>
                    <Badge variant="secondary" className="text-xs">
                      {transaction.taxCategory}
                    </Badge>
                    {getConfidenceBadge(transaction.confidence)}
                    {transaction.matchedTo && (
                      <Badge variant="default" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        Matched
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:contents">
                  <div className="col-span-2 flex items-center text-sm">
                    {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                  </div>
                  <div className="col-span-4 flex items-center">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{transaction.description}</div>
                      {transaction.matchedTo && (
                        <Link
                          href={`/${transaction.matchedTo.type}s/${transaction.matchedTo.id}`}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          {transaction.matchedTo.type === 'invoice' ? (
                            <FileText className="h-3 w-3" />
                          ) : (
                            <Receipt className="h-3 w-3" />
                          )}
                          {transaction.matchedTo.reference}
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    <span
                      className={`font-bold ${
                        transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.amount >= 0 ? '+' : ''}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs">
                        {transaction.category}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {transaction.taxCategory}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 flex items-center">
                    {getConfidenceBadge(transaction.confidence)}
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleReclassify(transaction.id, 'Office Expenses')}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Reclassify
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/transactions/${transaction.id}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {transactions.length >= limit && (
          <div className="mt-4 text-center">
            <Link href="/transactions" className="text-sm text-primary hover:underline">
              View all transactions
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
