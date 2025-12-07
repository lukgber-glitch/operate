'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, TrendingUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecurringExpenses } from './useBankIntelligence';
import type { RecurringExpense } from './types';

interface RecurringExpensesListProps {
  className?: string;
}

const frequencyLabels: Record<RecurringExpense['frequency'], string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

const categoryColors: Record<string, string> = {
  subscriptions: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  rent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  utilities: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  insurance: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
};

export function RecurringExpensesList({ className }: RecurringExpensesListProps) {
  const { data: expenses, isLoading, isError } = useRecurringExpenses();

  // Calculate total monthly recurring
  const totalMonthly = useMemo(() => {
    if (!expenses) return 0;

    return expenses.reduce((total, expense) => {
      const multiplier = {
        weekly: 4.33,
        monthly: 1,
        quarterly: 1 / 3,
        yearly: 1 / 12,
      }[expense.frequency];

      return total + (expense.amount * multiplier);
    }, 0);
  }, [expenses]);

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getCategoryColor = (category: string) => {
    const key = category.toLowerCase();
    return categoryColors[key] || categoryColors.default;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recurring Expenses</CardTitle>
          <CardDescription className="text-destructive">
            Failed to load recurring expenses
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recurring Expenses</CardTitle>
          <CardDescription>
            No recurring expenses detected yet
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Recurring Expenses
            </CardTitle>
            <CardDescription>Automatically detected recurring payments</CardDescription>
          </div>
          <Link
            href="/subscriptions"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Manage
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <div className="pt-2">
          <div className="text-2xl font-bold">
            {formatCurrency(totalMonthly, expenses[0]?.currency || 'EUR')}
          </div>
          <p className="text-sm text-muted-foreground">Total monthly recurring</p>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{expense.vendorName}</span>
                  <Badge variant="outline" className={getCategoryColor(expense.category)}>
                    {expense.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {frequencyLabels[expense.frequency]}
                  </span>
                  <span>
                    Next: {format(parseISO(expense.nextDue), 'MMM dd, yyyy')}
                  </span>
                  {expense.confidence < 0.9 && (
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(expense.confidence * 100)}% confidence
                    </Badge>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-lg">
                  {formatCurrency(expense.amount, expense.currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  /{expense.frequency === 'monthly' ? 'mo' : expense.frequency}
                </div>
              </div>
            </div>
          ))}
        </div>

        {expenses.length > 5 && (
          <div className="mt-4 text-center">
            <Link
              href="/subscriptions"
              className="text-sm text-primary hover:underline"
            >
              View all {expenses.length} recurring expenses
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
