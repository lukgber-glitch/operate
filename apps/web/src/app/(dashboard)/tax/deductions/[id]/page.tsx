'use client';

import { ArrowLeft, Edit, Trash2, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Separator } from '@/components/ui/separator';

// Placeholder data
const deductionData = {
  id: 'DED-001',
  description: 'Home Office Equipment - Standing Desk',
  category: 'Office Expenses',
  amount: 1200.0,
  date: '2024-11-25',
  status: 'approved',
  deductionRate: 38,
  potentialSaving: 456.0,
  relatedExpense: {
    id: 'EXP-125',
    description: 'Office Supplies - Standing Desk',
    amount: 1200.0,
    date: '2024-11-25',
  },
  notes: 'Ergonomic standing desk for home office use. Used exclusively for business purposes.',
  submittedBy: 'John Doe',
  submittedAt: '2024-11-25T10:30:00',
  approvedBy: 'Tax Department',
  approvedAt: '2024-11-26T14:20:00',
  taxYear: '2024',
};

const statusColors = {
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function DeductionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [status, setStatus] = useState(deductionData.status);
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus('approved');
    setIsLoading(false);
  };

  const handleReject = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus('rejected');
    setIsLoading(false);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    router.push('/tax/deductions');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tax/deductions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{deductionData.id}</h1>
            <p className="text-muted-foreground">Tax deduction details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {status === 'pending' && (
            <>
              <Button
                variant="outline"
                onClick={handleApprove}
                disabled={isLoading}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isLoading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
          <Button variant="outline" asChild>
            <Link href={`/tax/deductions/${params.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        <Badge
          variant="secondary"
          className={statusColors[status as keyof typeof statusColors]}
        >
          {status}
        </Badge>
      </div>

      <Card className="rounded-[24px]">
        <CardContent className="p-6">
        <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deduction Details */}
          <Card>
            <CardHeader>
              <CardTitle>Deduction Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-semibold">{deductionData.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <Badge variant="outline">{deductionData.category}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-semibold">
                      €{deductionData.amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold">{deductionData.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tax Year</p>
                    <p className="font-semibold">{deductionData.taxYear}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Deduction Rate</p>
                    <p className="font-semibold">{deductionData.deductionRate}%</p>
                  </div>
                </div>

                <Separator />

                {/* Calculation Breakdown */}
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
                    TAX SAVING CALCULATION
                  </h3>
                  <div className="space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                    <div className="flex justify-between">
                      <span className="text-sm">Expense Amount:</span>
                      <span className="font-medium">
                        €{deductionData.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Deduction Rate:</span>
                      <span className="font-medium">
                        {deductionData.deductionRate}%
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Potential Tax Saving:</span>
                      <span className="font-bold text-green-600">
                        €{deductionData.potentialSaving.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {deductionData.notes && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                        NOTES
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {deductionData.notes}
                      </p>
                    </div>
                  </>
                )}

                {/* Submission & Approval Info */}
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted By</p>
                    <p className="font-semibold">{deductionData.submittedBy}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(deductionData.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  {status === 'approved' && (
                    <div>
                      <p className="text-sm text-muted-foreground">Approved By</p>
                      <p className="font-semibold">{deductionData.approvedBy}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(deductionData.approvedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Expense */}
          {deductionData.relatedExpense && (
            <Card>
              <CardHeader>
                <CardTitle>Related Expense</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {deductionData.relatedExpense.id}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {deductionData.relatedExpense.description}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span>
                        Amount: €{deductionData.relatedExpense.amount.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">
                        Date: {deductionData.relatedExpense.date}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/finance/expenses/${deductionData.relatedExpense.id}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Expense
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">
                    €{deductionData.amount.toFixed(2)}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Tax Saving</p>
                  <p className="text-2xl font-bold text-green-600">
                    €{deductionData.potentialSaving.toFixed(2)}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Effective Rate</p>
                  <p className="text-lg font-semibold">
                    {(
                      (deductionData.potentialSaving / deductionData.amount) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/tax/deductions/${params.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Deduction
                </Link>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Deduction
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Deduction</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this deduction? This action
                      cannot be undone and will affect your tax calculations.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Tax Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Category Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="font-medium">Office Expenses</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Equipment must be used for business</li>
                  <li>Keep receipts for 10 years</li>
                  <li>Depreciation may apply</li>
                  <li>Up to 100% deductible</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
