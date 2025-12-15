'use client';

import { ArrowLeft, Download, Edit, Send, Check, X, FileCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';

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
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { QuoteSendDialog } from '@/components/quotes/QuoteSendDialog';
import { formatCurrency } from '@/lib/utils/currency';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';

// Placeholder data
const quoteData = {
  id: 'QUO-2024-001',
  number: 'QUO-2024-001',
  title: 'Website Redesign Project',
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
  validUntil: '2024-12-15',
  currency: 'EUR',
  lineItems: [
    {
      id: '1',
      description: 'UI/UX Design - Mockups and Prototypes',
      quantity: 40,
      unitPrice: 120.0,
      taxRate: 19,
      amount: 4800.0,
    },
    {
      id: '2',
      description: 'Frontend Development',
      quantity: 80,
      unitPrice: 150.0,
      taxRate: 19,
      amount: 12000.0,
    },
    {
      id: '3',
      description: 'Backend Integration',
      quantity: 40,
      unitPrice: 150.0,
      taxRate: 19,
      amount: 6000.0,
    },
  ],
  notes: 'This quote is valid for 30 days from the issue date. All prices include development, testing, and deployment.',
  terms: 'Payment terms: 50% upfront, 50% on completion. Delivery time: 8-10 weeks from project start.',
  discount: 0,
  activity: [
    { id: '1', type: 'created', date: '2024-11-15', user: 'John Doe' },
    { id: '2', type: 'sent', date: '2024-11-15', user: 'John Doe' },
    { id: '3', type: 'viewed', date: '2024-11-16', user: 'Acme Corp' },
  ],
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  viewed: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  expired: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  converted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function QuoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [status, setStatus] = useState(quoteData.status);
  const [isLoading, setIsLoading] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);

  const calculateSubtotal = () => {
    return quoteData.lineItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateDiscount = () => {
    return (calculateSubtotal() * quoteData.discount) / 100;
  };

  const calculateTax = () => {
    const subtotalAfterDiscount = calculateSubtotal() - calculateDiscount();
    return quoteData.lineItems.reduce((sum, item) => {
      const itemSubtotal = (item.amount / calculateSubtotal()) * subtotalAfterDiscount;
      const taxAmount = (itemSubtotal * item.taxRate) / 100;
      return sum + taxAmount;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount() + calculateTax();
  };

  const handleSendQuote = async (email: string, message: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus('sent');
    setIsLoading(false);
    setShowSendDialog(false);
  };

  const handleAccept = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus('accepted');
    setIsLoading(false);
  };

  const handleReject = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus('rejected');
    setIsLoading(false);
  };

  const handleConvertToInvoice = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    router.push('/finance/invoices/new?from=quote&quoteId=' + params.id);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    router.push('/quotes');
  };

  const handleDownload = async () => {
    setIsLoading(true);
    // Simulate download
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/quotes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl text-white font-semibold tracking-tight">{quoteData.number}</h1>
            <p className="text-muted-foreground">{quoteData.title}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          {status === 'draft' && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/quotes/${params.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button onClick={() => setShowSendDialog(true)} disabled={isLoading}>
                <Send className="mr-2 h-4 w-4" />
                Send Quote
              </Button>
            </>
          )}
          {(status === 'sent' || status === 'viewed') && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/quotes/${params.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            </>
          )}
          {status === 'accepted' && (
            <Button onClick={handleConvertToInvoice} disabled={isLoading}>
              <FileCheck className="mr-2 h-4 w-4" />
              Convert to Invoice
            </Button>
          )}
        </div>
      </motion.div>

      {/* Status Badge */}
      <motion.div variants={fadeUp} className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        <Badge
          variant="secondary"
          className={statusColors[status as keyof typeof statusColors]}
        >
          {status}
        </Badge>
      </motion.div>

      {/* Quote Details */}
      <motion.div variants={fadeUp}>
        <Card className="rounded-[24px]">
        <CardContent className="p-6">
        <div className="space-y-8">
            {/* Header Information */}
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                  FROM
                </h3>
                <div className="space-y-1">
                  <p className="font-semibold">{quoteData.company.name}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {quoteData.company.address}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tax ID: {quoteData.company.taxId}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                  TO
                </h3>
                <div className="space-y-1">
                  <p className="font-semibold">{quoteData.customer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {quoteData.customer.email}
                  </p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {quoteData.customer.address}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Quote Info */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Quote Number</p>
                <p className="font-semibold">{quoteData.number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Issue Date</p>
                <p className="font-semibold">{quoteData.issueDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valid Until</p>
                <p className="font-semibold">{quoteData.validUntil}</p>
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
                  {quoteData.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice, quoteData.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.taxRate}%
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.amount, quoteData.currency)}
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
                      {formatCurrency(calculateSubtotal(), quoteData.currency)}
                    </TableCell>
                  </TableRow>
                  {quoteData.discount > 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-medium">
                        Discount ({quoteData.discount}%)
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        -{formatCurrency(calculateDiscount(), quoteData.currency)}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-medium">
                      Tax
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(calculateTax(), quoteData.currency)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right text-lg font-bold">
                      Total
                    </TableCell>
                    <TableCell className="text-right text-lg font-bold">
                      {formatCurrency(calculateTotal(), quoteData.currency)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Notes & Terms */}
            {(quoteData.notes || quoteData.terms) && (
              <>
                <Separator />
                <div className="grid gap-6 sm:grid-cols-2">
                  {quoteData.notes && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                        NOTES
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {quoteData.notes}
                      </p>
                    </div>
                  )}
                  {quoteData.terms && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                        TERMS & CONDITIONS
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {quoteData.terms}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
        </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Activity Timeline */}
      <motion.div variants={fadeUp}>
        <Card className="rounded-[24px]">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Activity</h3>
            <div className="space-y-3">
              {quoteData.activity.map((event) => (
                <div key={event.id} className="flex items-start gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                  <div className="flex-1">
                    <p className="font-medium">
                      {event.type === 'created' && 'Quote created'}
                      {event.type === 'sent' && 'Quote sent to customer'}
                      {event.type === 'viewed' && 'Quote viewed by customer'}
                    </p>
                    <p className="text-muted-foreground">
                      {event.date} by {event.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      {status !== 'converted' && status !== 'accepted' && (
        <motion.div variants={fadeUp}>
          <Card className="rounded-[24px]">
          <CardContent className="p-6">
          <div className="text-lg font-semibold mb-4">Actions</div>
            <div className="flex gap-3">
              {(status === 'sent' || status === 'viewed') && (
                <>
                  <Button onClick={handleAccept} disabled={isLoading}>
                    <Check className="mr-2 h-4 w-4" />
                    Mark as Accepted
                  </Button>
                  <Button variant="outline" onClick={handleReject} disabled={isLoading}>
                    <X className="mr-2 h-4 w-4" />
                    Mark as Rejected
                  </Button>
                </>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Quote
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Quote</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this quote? This action
                      cannot be undone.
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
            </div>
          </CardContent>
        </Card>
        </motion.div>
      )}

      {/* Send Quote Dialog */}
      <QuoteSendDialog
        open={showSendDialog}
        onOpenChange={setShowSendDialog}
        onSend={handleSendQuote}
        defaultEmail={quoteData.customer.email}
      />
    </motion.div>
  );
}
