'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Edit, Send, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
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

// Placeholder data
const invoiceData = {
  id: 'INV-2024-001',
  number: 'INV-2024-001',
  status: 'sent',
  customer: {
    name: 'Acme Corp',
    email: 'billing@acme.com',
    address: 'Hauptstrasse 123\n10115 Berlin\nGermany',
  },
  company: {
    name: 'Your Company GmbH',
    address: 'Musterstrasse 456\n80331 Munich\nGermany',
    taxId: 'DE123456789',
  },
  issueDate: '2024-11-15',
  dueDate: '2024-12-15',
  paymentTerms: 'Net 30',
  lineItems: [
    {
      id: '1',
      description: 'Consulting Services - November 2024',
      quantity: 40,
      unitPrice: 120.0,
      taxRate: 19,
      amount: 4800.0,
    },
    {
      id: '2',
      description: 'Software Development',
      quantity: 15,
      unitPrice: 150.0,
      taxRate: 19,
      amount: 2250.0,
    },
  ],
  notes: 'Payment due within 30 days. Please reference invoice number on payment.',
};

const statusColors = {
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [status, setStatus] = useState(invoiceData.status);
  const [isLoading, setIsLoading] = useState(false);

  const calculateSubtotal = () => {
    return invoiceData.lineItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTax = () => {
    return invoiceData.lineItems.reduce((sum, item) => {
      const taxAmount = (item.amount * item.taxRate) / 100;
      return sum + taxAmount;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSendInvoice = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus('sent');
    setIsLoading(false);
  };

  const handleMarkPaid = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus('paid');
    setIsLoading(false);
  };

  const handleCancelInvoice = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    router.push('/finance/invoices');
  };

  const handleDownload = () => {
    // Simulate PDF download
    console.log('Downloading invoice...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/finance/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {invoiceData.number}
            </h1>
            <p className="text-muted-foreground">Invoice details</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          {status === 'draft' && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/finance/invoices/${params.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button onClick={handleSendInvoice} disabled={isLoading}>
                <Send className="mr-2 h-4 w-4" />
                Send Invoice
              </Button>
            </>
          )}
          {status === 'sent' && (
            <Button onClick={handleMarkPaid} disabled={isLoading}>
              <Check className="mr-2 h-4 w-4" />
              Mark as Paid
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

      {/* Invoice Details */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-8">
            {/* Header Information */}
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                  FROM
                </h3>
                <div className="space-y-1">
                  <p className="font-semibold">{invoiceData.company.name}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {invoiceData.company.address}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tax ID: {invoiceData.company.taxId}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                  BILL TO
                </h3>
                <div className="space-y-1">
                  <p className="font-semibold">{invoiceData.customer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {invoiceData.customer.email}
                  </p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {invoiceData.customer.address}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Invoice Info */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="font-semibold">{invoiceData.number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Issue Date</p>
                <p className="font-semibold">{invoiceData.issueDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-semibold">{invoiceData.dueDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Terms</p>
                <p className="font-semibold">{invoiceData.paymentTerms}</p>
              </div>
            </div>

            <Separator />

            {/* Line Items */}
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Tax Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceData.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        €{item.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.taxRate}%
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        €{item.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-medium">
                      Subtotal
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      €{calculateSubtotal().toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-medium">
                      Tax
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      €{calculateTax().toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right text-lg font-bold">
                      Total
                    </TableCell>
                    <TableCell className="text-right text-lg font-bold">
                      €{calculateTotal().toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Notes */}
            {invoiceData.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                    NOTES
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {invoiceData.notes}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {status !== 'paid' && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <X className="mr-2 h-4 w-4" />
                  Cancel Invoice
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Invoice</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this invoice? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, keep invoice</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelInvoice}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, cancel invoice
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
