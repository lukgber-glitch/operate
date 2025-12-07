'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, ChevronRight, Edit2, RefreshCw } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { useVatReturnPreview } from '@/hooks/useElsterSubmission';

interface VATData {
  revenue: number;
  vatCollected: number;
  inputVat: number;
  vatPayable: number;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  vatRate: number;
  vatAmount: number;
  type: 'income' | 'expense';
}

interface UStVADataReviewProps {
  period: { year: number; month: number };
  onDataReviewed: (data: VATData) => void;
  onBack: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function UStVADataReview({ period, onDataReviewed, onBack }: UStVADataReviewProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<VATData>>({});

  // Build period string (YYYY-MM)
  const periodString = `${period.year}-${String(period.month).padStart(2, '0')}`;

  // Fetch VAT data from API
  const {
    data: previewData,
    isLoading,
    error,
    refetch,
  } = useVatReturnPreview(user?.orgId || '', periodString);

  // Convert preview data to VATData format
  const data: VATData | null = previewData
    ? {
        revenue: previewData.outputVat.total - previewData.outputVat.invoices.reduce((sum, inv) => sum + inv.vat, 0),
        vatCollected: previewData.outputVat.total,
        inputVat: previewData.inputVat.total,
        vatPayable: previewData.netVat,
        transactions: [
          ...previewData.outputVat.invoices.map((inv) => ({
            id: inv.id,
            date: inv.date,
            description: `Invoice - ${inv.customer}`,
            amount: inv.amount,
            vatRate: 19, // Default German VAT rate
            vatAmount: inv.vat,
            type: 'income' as const,
          })),
          ...previewData.inputVat.expenses.map((exp) => ({
            id: exp.id,
            date: exp.date,
            description: `Expense - ${exp.vendor}`,
            amount: exp.amount,
            vatRate: 19, // Default German VAT rate
            vatAmount: exp.vat,
            type: 'expense' as const,
          })),
        ],
      }
    : null;

  // Initialize edited data when preview data loads
  useEffect(() => {
    if (data && !isEditing) {
      setEditedData(data);
    }
  }, [data, isEditing]);

  const handleSaveEdits = () => {
    // For now, just close editing mode
    // In future, could save to draft API
    setIsEditing(false);
  };

  const handleContinue = () => {
    const finalData = isEditing && editedData.revenue !== undefined
      ? { ...data!, ...editedData }
      : data;

    if (finalData) {
      onDataReviewed(finalData);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load VAT data. {error instanceof Error ? error.message : 'Please try again.'}
        </AlertDescription>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>
          No VAT data found for this period.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {MONTHS[period.month - 1]} {period.year}
          </h3>
          <p className="text-sm text-muted-foreground">
            Review and verify your VAT data before submission
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            {isEditing ? 'Cancel Edit' : 'Edit'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue (Netto)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Input
                type="number"
                value={editedData.revenue || data.revenue}
                onChange={(e) => setEditedData({ ...editedData, revenue: parseFloat(e.target.value) })}
              />
            ) : (
              <p className="text-2xl font-bold">
                €{data.revenue.toLocaleString('de-DE')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              VAT Collected (19%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              €{data.vatCollected.toLocaleString('de-DE')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Input VAT (Vorsteuer)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              €{data.inputVat.toLocaleString('de-DE')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              VAT Payable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              €{data.vatPayable.toLocaleString('de-DE')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">VAT Rate</TableHead>
                <TableHead className="text-right">VAT Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{new Date(tx.date).toLocaleDateString('de-DE')}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      tx.type === 'income'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {tx.type === 'income' ? 'Income' : 'Expense'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    €{tx.amount.toLocaleString('de-DE')}
                  </TableCell>
                  <TableCell className="text-right">{tx.vatRate}%</TableCell>
                  <TableCell className="text-right">
                    €{tx.vatAmount.toLocaleString('de-DE')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        {isEditing ? (
          <Button onClick={handleSaveEdits} className="flex-1">
            Save Changes
          </Button>
        ) : (
          <Button onClick={handleContinue} className="flex-1">
            Continue to Submit
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
