'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewExpensePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [vendor, setVendor] = useState('');
  const [vatAmount, setVatAmount] = useState('');
  const [vatRate, setVatRate] = useState('19');
  const [notes, setNotes] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value && vatRate) {
      const baseAmount = parseFloat(value);
      const vat = (baseAmount * parseFloat(vatRate)) / 100;
      setVatAmount(vat.toFixed(2));
    }
  };

  const handleVatRateChange = (value: string) => {
    setVatRate(value);
    if (amount && value) {
      const baseAmount = parseFloat(amount);
      const vat = (baseAmount * parseFloat(value)) / 100;
      setVatAmount(vat.toFixed(2));
    }
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceipt(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    router.push('/finance/expenses');
  };

  const handleCancel = () => {
    router.push('/finance/expenses');
  };

  const calculateTotal = () => {
    const baseAmount = parseFloat(amount) || 0;
    const vat = parseFloat(vatAmount) || 0;
    return (baseAmount + vat).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/finance/expenses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Expense</h1>
          <p className="text-muted-foreground">Submit a new expense report</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Expense Details */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Office supplies for Q4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (excl. VAT)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      €
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Office Supplies</SelectItem>
                      <SelectItem value="meals">Meals & Entertainment</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    placeholder="e.g., Amazon Business"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vatRate">VAT Rate</Label>
                  <Select value={vatRate} onValueChange={handleVatRateChange}>
                    <SelectTrigger id="vatRate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% (Tax Exempt)</SelectItem>
                      <SelectItem value="7">7% (Reduced Rate)</SelectItem>
                      <SelectItem value="19">19% (Standard Rate)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vatAmount">VAT Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      €
                    </span>
                    <Input
                      id="vatAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={vatAmount}
                      onChange={(e) => setVatAmount(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receipt Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Receipt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="receipt-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or
                        drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, PNG, JPG (MAX. 5MB)
                      </p>
                    </div>
                    <input
                      id="receipt-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleReceiptChange}
                    />
                  </label>
                </div>
                {receipt && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">{receipt.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReceipt(null)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any additional information about this expense..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  €{parseFloat(amount || '0').toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT ({vatRate}%)</span>
                <span className="font-medium">
                  €{parseFloat(vatAmount || '0').toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-lg font-bold">€{calculateTotal()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-6">
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                Submit Expense
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">
                  Expense Guidelines
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Always attach receipts</li>
                  <li>Submit within 30 days</li>
                  <li>Use correct category</li>
                  <li>Include detailed description</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
