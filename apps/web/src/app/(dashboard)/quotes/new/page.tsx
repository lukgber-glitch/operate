'use client';

import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { MoneyField } from '@/components/forms/MoneyField';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import { useDefaultCurrency } from '@/contexts/CurrencyContext';
import type { CurrencyCode } from '@/types/currency';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: CurrencyCode;
  taxRate: number;
  amount: number;
}

export default function NewQuotePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const defaultCurrency = useDefaultCurrency();

  // Form state
  const [title, setTitle] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [quoteCurrency, _setQuoteCurrency] = useState<CurrencyCode>(defaultCurrency);

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      currency: defaultCurrency,
      taxRate: 19,
      amount: 0,
    },
  ]);

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      currency: quoteCurrency,
      taxRate: 19,
      amount: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Recalculate amount
          updated.amount = updated.quantity * updated.unitPrice;
          return updated;
        }
        return item;
      })
    );
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTax = () => {
    return lineItems.reduce((sum, item) => {
      const taxAmount = (item.amount * item.taxRate) / 100;
      return sum + taxAmount;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (saveAsDraft: boolean) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    router.push('/quotes');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/quotes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl text-white font-semibold tracking-tight">New Quote</h1>
          <p className="text-muted-foreground">Create a new quote or estimate</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quote Title */}
          <Card className="rounded-[16px]">
            <CardContent className="p-6">
              <div className="text-lg font-semibold mb-4">Quote Details</div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Website Redesign Project"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="rounded-[16px]">
            <CardContent className="p-6">
              <div className="text-lg font-semibold mb-4">Customer Information</div>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      placeholder="Acme Corp"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder="contact@acme.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerAddress">Address</Label>
                  <Textarea
                    id="customerAddress"
                    placeholder="Street, City, Postal Code, Country"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="rounded-[16px]">
            <CardContent className="p-4">
              <div className="flex flex-row items-center justify-between p-2 pb-3">
                <div className="text-lg font-semibold">Line Items</div>
                <Button onClick={addLineItem} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Description</TableHead>
                      <TableHead className="w-[100px]">Qty</TableHead>
                      <TableHead className="w-[250px]">Unit Price</TableHead>
                      <TableHead className="w-[100px]">Tax %</TableHead>
                      <TableHead className="w-[150px]">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input
                            placeholder="Item description"
                            value={item.description}
                            onChange={(e) =>
                              updateLineItem(item.id, 'description', e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(
                                item.id,
                                'quantity',
                                parseInt(e.target.value) || 1
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <MoneyField
                            value={item.unitPrice}
                            currency={item.currency}
                            onValueChange={(value) =>
                              updateLineItem(item.id, 'unitPrice', value)
                            }
                            onCurrencyChange={(currency) =>
                              updateLineItem(item.id, 'currency', currency)
                            }
                            layout="compact"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={String(item.taxRate)}
                            onValueChange={(value) =>
                              updateLineItem(item.id, 'taxRate', parseInt(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="7">7%</SelectItem>
                              <SelectItem value="19">19%</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="font-medium">
                          <CurrencyDisplay
                            amount={item.amount}
                            currency={item.currency}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLineItem(item.id)}
                            disabled={lineItems.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          <Card className="rounded-[16px]">
            <CardContent className="p-6">
              <div className="text-lg font-semibold mb-4">Additional Information</div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes for the customer..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    placeholder="Payment terms, delivery schedule, etc..."
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card className="rounded-[16px]">
            <CardContent className="p-6">
              <div className="text-lg font-semibold mb-4">Summary</div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <CurrencyDisplay
                    amount={calculateSubtotal()}
                    currency={quoteCurrency}
                    className="font-medium"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <CurrencyDisplay
                    amount={calculateTax()}
                    currency={quoteCurrency}
                    className="font-medium"
                  />
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <CurrencyDisplay
                      amount={calculateTotal()}
                      currency={quoteCurrency}
                      className="text-lg font-bold"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[16px]">
            <CardContent className="p-6">
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => handleSubmit(false)}
                  disabled={isLoading}
                >
                  Send Quote
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSubmit(true)}
                  disabled={isLoading}
                >
                  Save as Draft
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  asChild
                  disabled={isLoading}
                >
                  <Link href="/quotes">Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
