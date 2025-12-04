'use client';

import { ArrowLeft, Download, Edit, Check, X, FileText } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

// Placeholder data
const expenseData = {
  id: 'EXP-001',
  description: 'Office Supplies - Quarterly Stock',
  amount: 245.5,
  vatAmount: 46.65,
  vatRate: 19,
  total: 292.15,
  category: 'Office',
  vendor: 'Office Depot GmbH',
  date: '2024-11-25',
  submittedBy: {
    name: 'John Doe',
    email: 'john.doe@company.com',
  },
  submittedDate: '2024-11-26',
  status: 'pending',
  notes: 'Purchased various office supplies including printer paper, pens, and folders for the team.',
  receipt: {
    name: 'receipt_office_supplies.pdf',
    url: '#',
  },
  approver: null,
  approvalDate: null,
  approvalNotes: '',
};

const statusColors = {
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const categoryColors = {
  Office: 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400',
  Meals: 'border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-400',
  Software: 'border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-400',
  Travel: 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-400',
  Rent: 'border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-400',
  Marketing: 'border-pink-200 text-pink-700 dark:border-pink-800 dark:text-pink-400',
  Utilities: 'border-cyan-200 text-cyan-700 dark:border-cyan-800 dark:text-cyan-400',
};

export default function ExpenseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [status, setStatus] = useState(expenseData.status);
  const [isLoading, setIsLoading] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  const handleApprove = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus('approved');
    setIsLoading(false);
  };

  const handleReject = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus('rejected');
    setIsLoading(false);
  };

  const handleDownloadReceipt = () => {
    console.log('Downloading receipt...');
  };

  const isManager = true; // This would come from user context

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/finance/expenses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {expenseData.id}
            </h1>
            <p className="text-muted-foreground">Expense details</p>
          </div>
        </div>

        <div className="flex gap-2">
          {expenseData.receipt && (
            <Button variant="outline" onClick={handleDownloadReceipt}>
              <Download className="mr-2 h-4 w-4" />
              Receipt
            </Button>
          )}
          {status === 'pending' && (
            <Button variant="outline" asChild>
              <Link href={`/finance/expenses/${params.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        <Badge
          variant="secondary"
          className={statusColors[status as keyof typeof statusColors]}
        >
          {status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Expense Details */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="font-medium">{expenseData.description}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <Badge
                    variant="outline"
                    className={
                      categoryColors[
                        expenseData.category as keyof typeof categoryColors
                      ]
                    }
                  >
                    {expenseData.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vendor</p>
                  <p className="font-medium">{expenseData.vendor}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date</p>
                  <p className="font-medium">{expenseData.date}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount (excl. VAT)</span>
                  <span className="font-medium">€{expenseData.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    VAT ({expenseData.vatRate}%)
                  </span>
                  <span className="font-medium">€{expenseData.vatAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Total Amount</span>
                  <span className="font-bold">€{expenseData.total.toFixed(2)}</span>
                </div>
              </div>

              {expenseData.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm">{expenseData.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Submitter Information */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Submitted By</p>
                  <p className="font-medium">{expenseData.submittedBy.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {expenseData.submittedBy.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Submitted On</p>
                  <p className="font-medium">{expenseData.submittedDate}</p>
                </div>
              </div>

              {expenseData.receipt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Receipt</p>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{expenseData.receipt.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDownloadReceipt}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Approval Section - Only for managers */}
          {isManager && status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle>Approval</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="approvalNotes">Approval Notes (Optional)</Label>
                  <Textarea
                    id="approvalNotes"
                    placeholder="Add notes about this approval/rejection..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="flex-1" disabled={isLoading}>
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Approve Expense</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to approve this expense of €
                          {expenseData.total.toFixed(2)}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApprove}>
                          Approve
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        disabled={isLoading}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Expense</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reject this expense? The
                          submitter will be notified.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleReject}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Reject
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-2 w-2 rounded-full bg-blue-600" />
                    <div className="h-full w-px bg-border" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium">Expense Submitted</p>
                    <p className="text-xs text-muted-foreground">
                      {expenseData.submittedDate}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      by {expenseData.submittedBy.name}
                    </p>
                  </div>
                </div>

                {status === 'approved' && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-2 w-2 rounded-full bg-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Approved</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date().toISOString().split('T')[0]}
                      </p>
                    </div>
                  </div>
                )}

                {status === 'rejected' && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-2 w-2 rounded-full bg-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Rejected</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date().toISOString().split('T')[0]}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
