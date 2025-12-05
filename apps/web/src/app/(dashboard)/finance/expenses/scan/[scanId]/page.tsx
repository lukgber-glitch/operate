'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Camera,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useReceiptScan,
  useConfirmScan,
  useRejectScan,
  type ConfirmScanRequest,
} from '@/hooks/use-receipt-scanner';

// Confidence badge component
function ConfidenceBadge({ confidence }: { confidence?: number }) {
  if (!confidence) return null;

  let variant: 'default' | 'secondary' | 'destructive' = 'default';
  let label = 'High';

  if (confidence < 0.7) {
    variant = 'destructive';
    label = 'Low';
  } else if (confidence < 0.9) {
    variant = 'secondary';
    label = 'Medium';
  }

  return (
    <Badge variant={variant} className="ml-2">
      {label} ({Math.round(confidence * 100)}%)
    </Badge>
  );
}

// Field with confidence indicator
interface FieldWithConfidenceProps {
  label: string;
  value: string;
  confidence?: number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'date';
  icon?: React.ReactNode;
  required?: boolean;
}

function FieldWithConfidence({
  label,
  value,
  confidence,
  onChange,
  type = 'text',
  icon,
  required = false,
}: FieldWithConfidenceProps) {
  const getConfidenceColor = () => {
    if (!confidence) return 'border-muted';
    if (confidence >= 0.9) return 'border-green-500/50';
    if (confidence >= 0.7) return 'border-yellow-500/50';
    return 'border-red-500/50';
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {icon}
        {label}
        {required && <span className="text-destructive">*</span>}
        <ConfidenceBadge confidence={confidence} />
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${getConfidenceColor()} transition-colors`}
        required={required}
      />
    </div>
  );
}

export default function ReceiptReviewPage() {
  const router = useRouter();
  const params = useParams();
  const scanId = params.scanId as string;

  const { scan, isLoading, error: scanError } = useReceiptScan(scanId, true);
  const { confirmScan, isConfirming } = useConfirmScan();
  const { rejectScan, isRejecting } = useRejectScan();

  // Form state
  const [merchantName, setMerchantName] = useState('');
  const [date, setDate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  // Populate form when scan data is loaded
  useEffect(() => {
    if (scan?.extractedData) {
      const data = scan.extractedData;
      setMerchantName(data.merchantName || '');
      setDate(data.date || '');
      setTotalAmount(data.totalAmount?.toString() || '');
      setTaxAmount(data.taxAmount?.toString() || '');
      setCurrency(data.currency || 'EUR');
      setCategory(data.category || '');
    }
  }, [scan]);

  // Handle confirm
  const handleConfirm = async () => {
    if (!merchantName || !date || !totalAmount) {
      return;
    }

    const confirmData: ConfirmScanRequest = {
      merchantName,
      date,
      totalAmount: parseFloat(totalAmount),
      taxAmount: taxAmount ? parseFloat(taxAmount) : undefined,
      currency,
      category: category || undefined,
      notes: notes || undefined,
      lineItems: scan?.extractedData?.lineItems,
    };

    try {
      const expense = await confirmScan(scanId, confirmData);
      // Redirect to expense detail page
      router.push(`/finance/expenses/${expense.id}`);
    } catch (error) {
      // Error handled in hook
    }
  };

  // Handle reject
  const handleReject = async () => {
    try {
      await rejectScan(scanId, 'Manual rejection');
      router.push('/finance/expenses');
    } catch (error) {
      // Error handled in hook
    }
  };

  // Handle scan another
  const handleScanAnother = () => {
    router.push('/finance/expenses/scan');
  };

  // Loading state
  if (isLoading && !scan) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Card className="p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading scan results...</p>
        </Card>
      </div>
    );
  }

  // Error state
  if (scanError || !scan) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {scanError || 'Failed to load scan results'}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push('/finance/expenses/scan')}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Processing state
  if (scan.status === 'PENDING' || scan.status === 'PROCESSING') {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Card className="p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-2">Processing Receipt</h2>
          <p className="text-muted-foreground mb-6">
            Our AI is extracting information from your receipt. This usually takes a few seconds.
          </p>
          <div className="flex gap-2 justify-center">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-75" />
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-150" />
          </div>
        </Card>
      </div>
    );
  }

  // Failed state
  if (scan.status === 'FAILED') {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to process receipt: {scan.error || 'Unknown error'}
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex gap-3">
          <Button onClick={() => router.push('/finance/expenses/scan')}>
            Try Another Receipt
          </Button>
          <Button variant="outline" onClick={() => router.push('/finance/expenses')}>
            Back to Expenses
          </Button>
        </div>
      </div>
    );
  }

  // Success - Show review form
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Review Extracted Data</h1>
        <p className="text-muted-foreground mt-2">
          Verify and edit the information extracted from your receipt
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receipt Image */}
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Receipt Image
            </h2>
            <div className="relative rounded-lg overflow-hidden bg-muted">
              {scan.receiptUrl.endsWith('.pdf') ? (
                <div className="p-12 text-center">
                  <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                    <FileText className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">PDF Document</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(scan.receiptUrl, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View PDF
                  </Button>
                </div>
              ) : (
                <img
                  src={scan.receiptUrl}
                  alt="Receipt"
                  className="w-full h-auto max-h-[600px] object-contain"
                />
              )}
            </div>
          </Card>

          {/* Line Items */}
          {scan.extractedData?.lineItems && scan.extractedData.lineItems.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Line Items
              </h3>
              <div className="space-y-2">
                {scan.extractedData.lineItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-sm p-2 rounded bg-muted/50"
                  >
                    <span className="font-medium">{item.description}</span>
                    <span>
                      {item.quantity && `${item.quantity}x `}
                      {currency} {item.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Overall Confidence */}
          {scan.extractedData?.confidence?.overall && (
            <Card className="p-4 bg-muted/50">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Overall Confidence
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      scan.extractedData.confidence.overall >= 0.9
                        ? 'bg-green-500'
                        : scan.extractedData.confidence.overall >= 0.7
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${scan.extractedData.confidence.overall * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {Math.round(scan.extractedData.confidence.overall * 100)}%
                </span>
              </div>
            </Card>
          )}
        </div>

        {/* Extracted Data Form */}
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-6">Expense Details</h2>

            <div className="space-y-4">
              <FieldWithConfidence
                label="Merchant Name"
                value={merchantName}
                confidence={scan.extractedData?.confidence?.merchantName}
                onChange={setMerchantName}
                icon={<Tag className="h-4 w-4" />}
                required
              />

              <FieldWithConfidence
                label="Date"
                value={date}
                confidence={scan.extractedData?.confidence?.date}
                onChange={setDate}
                type="date"
                icon={<Calendar className="h-4 w-4" />}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <FieldWithConfidence
                  label="Total Amount"
                  value={totalAmount}
                  confidence={scan.extractedData?.confidence?.totalAmount}
                  onChange={setTotalAmount}
                  type="number"
                  icon={<DollarSign className="h-4 w-4" />}
                  required
                />

                <FieldWithConfidence
                  label="Tax Amount"
                  value={taxAmount}
                  confidence={scan.extractedData?.confidence?.taxAmount}
                  onChange={setTaxAmount}
                  type="number"
                  icon={<DollarSign className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CHF">CHF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">Office Supplies</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="meals">Meals & Entertainment</SelectItem>
                    <SelectItem value="transport">Transportation</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="software">Software & Subscriptions</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>
            </div>

            <Separator className="my-6" />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={handleConfirm}
                disabled={isConfirming || isRejecting || !merchantName || !date || !totalAmount}
                className="flex-1"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Expense...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Confirm & Create Expense
                  </>
                )}
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={handleReject}
                disabled={isConfirming || isRejecting}
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-5 w-5" />
                    Reject
                  </>
                )}
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={handleScanAnother}
              className="w-full mt-3"
              disabled={isConfirming || isRejecting}
            >
              <Camera className="mr-2 h-4 w-4" />
              Scan Another Receipt
            </Button>
          </Card>

          {/* Tips */}
          <Card className="p-4 bg-muted/50">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <svg
                className="h-4 w-4 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Review Tips
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
              <li>Fields with low confidence (red) should be carefully reviewed</li>
              <li>Verify the total amount matches the receipt</li>
              <li>Add notes to help with future expense tracking</li>
              <li>Select the appropriate category for accurate reporting</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
