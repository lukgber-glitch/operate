'use client';

import { ArrowLeft, Edit, Play, Pause, Zap, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useRecurringInvoice,
  useRecurringInvoiceHistory,
  useDeleteRecurringInvoice,
  useActivateRecurringInvoice,
  useDeactivateRecurringInvoice,
  useGenerateRecurringInvoiceNow,
} from '@/hooks/use-recurring-invoices';

const frequencyLabels = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
};

const statusColors = {
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function RecurringInvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: invoice, isLoading } = useRecurringInvoice(params.id);
  const { data: history } = useRecurringInvoiceHistory(params.id);
  const deleteRecurringInvoice = useDeleteRecurringInvoice();
  const activateRecurringInvoice = useActivateRecurringInvoice();
  const deactivateRecurringInvoice = useDeactivateRecurringInvoice();
  const generateNow = useGenerateRecurringInvoiceNow();

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const handleDelete = async () => {
    await deleteRecurringInvoice.mutateAsync(params.id);
    router.push('/finance/invoices/recurring');
  };

  const handleToggleActive = async () => {
    if (!invoice) return;
    if (invoice.isActive) {
      await deactivateRecurringInvoice.mutateAsync(params.id);
    } else {
      await activateRecurringInvoice.mutateAsync(params.id);
    }
  };

  const handleGenerateNow = async () => {
    await generateNow.mutateAsync(params.id);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!invoice) {
    return <div>Recurring invoice not found</div>;
  }

  // Calculate next 5 scheduled runs
  const getNextRuns = () => {
    if (!invoice.nextRunDate) return [];
    const runs: Date[] = [];
    let currentDate = new Date(invoice.nextRunDate);

    for (let i = 0; i < 5; i++) {
      runs.push(new Date(currentDate));

      switch (invoice.frequency) {
        case 'DAILY':
          currentDate.setDate(currentDate.getDate() + invoice.interval);
          break;
        case 'WEEKLY':
          currentDate.setDate(currentDate.getDate() + (7 * invoice.interval));
          break;
        case 'BIWEEKLY':
          currentDate.setDate(currentDate.getDate() + (14 * invoice.interval));
          break;
        case 'MONTHLY':
          currentDate.setMonth(currentDate.getMonth() + invoice.interval);
          break;
        case 'QUARTERLY':
          currentDate.setMonth(currentDate.getMonth() + (3 * invoice.interval));
          break;
        case 'YEARLY':
          currentDate.setFullYear(currentDate.getFullYear() + invoice.interval);
          break;
      }

      if (invoice.endDate && currentDate > new Date(invoice.endDate)) {
        break;
      }
    }

    return runs;
  };

  const nextRuns = getNextRuns();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/finance/invoices/recurring">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Recurring Invoice</h1>
              <Badge variant={invoice.isActive ? 'default' : 'secondary'}>
                {invoice.isActive ? 'Active' : 'Paused'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {invoice.customerName} - {frequencyLabels[invoice.frequency]}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleToggleActive}
          >
            {invoice.isActive ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleGenerateNow}
            disabled={!invoice.isActive}
          >
            <Zap className="mr-2 h-4 w-4" />
            Generate Now
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/finance/invoices/recurring/${params.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground">Customer</div>
                  <div className="font-medium">{invoice.customerName}</div>
                  {invoice.customerEmail && (
                    <div className="text-sm text-muted-foreground">{invoice.customerEmail}</div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Frequency</div>
                  <div className="font-medium">
                    {frequencyLabels[invoice.frequency]}
                    {invoice.interval > 1 && ` (every ${invoice.interval})`}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Start Date</div>
                  <div className="font-medium">{formatDate(invoice.startDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">End Date</div>
                  <div className="font-medium">
                    {invoice.endDate ? formatDate(invoice.endDate) : 'No end date'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Next Run</div>
                  <div className="font-medium">
                    {invoice.nextRunDate ? formatDate(invoice.nextRunDate) : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Last Run</div>
                  <div className="font-medium">
                    {invoice.lastRunDate ? formatDate(invoice.lastRunDate) : 'Never'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Payment Terms</div>
                  <div className="font-medium">{invoice.paymentTermsDays} days</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Amount</div>
                  <div className="font-medium">
                    {formatCurrency(invoice.totalAmount, invoice.currency)}
                  </div>
                </div>
              </div>
              {invoice.notes && (
                <div>
                  <div className="text-sm text-muted-foreground">Notes</div>
                  <div className="mt-1 text-sm">{invoice.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Tax Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unitPrice, invoice.currency)}</TableCell>
                      <TableCell>{item.taxRate}%</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.amount, invoice.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Invoices History */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {!history || history.data.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No invoices generated yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Generated Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.data.map((item) => (
                      <TableRow key={item.invoiceId}>
                        <TableCell>
                          <Link
                            href={`/finance/invoices/${item.invoiceId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {item.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{formatDate(item.generatedDate)}</TableCell>
                        <TableCell>
                          <Badge className={(statusColors as any)[item.status]}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.amount, invoice.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl text-white font-bold">{invoice.generatedCount}</div>
                <div className="text-sm text-muted-foreground">Total Generated</div>
              </div>
              <div>
                <div className="text-2xl text-white font-bold">
                  {formatCurrency(invoice.totalAmount * invoice.generatedCount, invoice.currency)}
                </div>
                <div className="text-sm text-muted-foreground">Total Value</div>
              </div>
            </CardContent>
          </Card>

          {/* Next Runs Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {nextRuns.length === 0 ? (
                <div className="text-sm text-muted-foreground">No upcoming runs scheduled</div>
              ) : (
                <div className="space-y-2">
                  {nextRuns.map((date, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Run {index + 1}</span>
                      <span className="font-medium">{formatDate(date.toISOString())}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recurring Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this recurring invoice? This action cannot be undone.
              Past generated invoices will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteRecurringInvoice.isPending}
            >
              {deleteRecurringInvoice.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
