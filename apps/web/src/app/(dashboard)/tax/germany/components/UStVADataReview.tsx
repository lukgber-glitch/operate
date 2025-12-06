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
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<VATData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<VATData>>({});

  useEffect(() => {
    loadVATData();
  }, [period]);

  const loadVATData = async () => {
    setIsLoading(true);

    // Simulate API call to fetch VAT data for the period
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock data - in production this would come from the API
    const mockData: VATData = {
      revenue: 45000,
      vatCollected: 8550, // 19% of revenue
      inputVat: 2850,
      vatPayable: 5700, // vatCollected - inputVat
      transactions: [
        { id: '1', date: '2024-01-05', description: 'Software License Sale', amount: 15000, vatRate: 19, vatAmount: 2850, type: 'income' },
        { id: '2', date: '2024-01-12', description: 'Consulting Services', amount: 20000, vatRate: 19, vatAmount: 3800, type: 'income' },
        { id: '3', date: '2024-01-20', description: 'Product Sale', amount: 10000, vatRate: 19, vatAmount: 1900, type: 'income' },
        { id: '4', date: '2024-01-08', description: 'Office Supplies', amount: 500, vatRate: 19, vatAmount: 95, type: 'expense' },
        { id: '5', date: '2024-01-15', description: 'Software Subscription', amount: 1200, vatRate: 19, vatAmount: 228, type: 'expense' },
        { id: '6', date: '2024-01-22', description: 'Equipment Purchase', amount: 13300, vatRate: 19, vatAmount: 2527, type: 'expense' },
      ],
    };

    setData(mockData);
    setEditedData(mockData);
    setIsLoading(false);
  };

  const handleSaveEdits = () => {
    if (editedData.revenue !== undefined) {
      setData((prev) => prev ? { ...prev, ...editedData } : null);
    }
    setIsEditing(false);
  };

  const handleContinue = () => {
    if (data) {
      onDataReviewed(data);
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

  if (!data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load VAT data. Please try again.
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
          <Button variant="outline" size="sm" onClick={loadVATData}>
            <RefreshCw className="w-4 h-4 mr-2" />
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
