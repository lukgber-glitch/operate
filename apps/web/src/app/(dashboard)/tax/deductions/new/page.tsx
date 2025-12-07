'use client';

import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AnimatedCard } from '@/components/ui/animated-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Mock expenses that can be linked
const availableExpenses = [
  {
    id: 'EXP-125',
    description: 'Office Supplies - Standing Desk',
    amount: '€1,200.00',
    date: '2024-11-25',
    category: 'Office',
  },
  {
    id: 'EXP-124',
    description: 'AWS Certification Course',
    amount: '€850.00',
    date: '2024-11-22',
    category: 'Software',
  },
  {
    id: 'EXP-123',
    description: 'Travel to Frankfurt',
    amount: '€450.00',
    date: '2024-11-20',
    category: 'Travel',
  },
  {
    id: 'EXP-122',
    description: 'Professional Insurance',
    amount: '€680.00',
    date: '2024-11-18',
    category: 'Insurance',
  },
];

export default function NewDeductionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: '',
    date: '',
    deductionRate: '38',
    notes: '',
  });

  const handleExpenseSelect = (expenseId: string) => {
    const expense = availableExpenses.find((e) => e.id === expenseId);
    if (expense) {
      setSelectedExpense(expenseId);
      setFormData({
        ...formData,
        description: expense.description,
        amount: expense.amount.replace('€', '').trim(),
        date: expense.date,
      });
    }
  };

  const calculatePotentialSaving = () => {
    const amount = parseFloat(formData.amount.replace(/,/g, ''));
    const rate = parseFloat(formData.deductionRate);
    if (!isNaN(amount) && !isNaN(rate)) {
      return ((amount * rate) / 100).toFixed(2);
    }
    return '0.00';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    router.push('/tax/deductions');
  };

  return (
    <div className="space-y-6">
      <HeadlineOutside
        subtitle="Create a new tax-deductible expense claim"
        actions={
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tax/deductions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        }
      >
        Add Tax Deduction
      </HeadlineOutside>

      <AnimatedCard variant="elevated" padding="lg">
        <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deduction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Link to Expense */}
                <div className="space-y-2">
                  <Label htmlFor="expense">Link to Expense (Optional)</Label>
                  <Select
                    value={selectedExpense || ''}
                    onValueChange={handleExpenseSelect}
                  >
                    <SelectTrigger id="expense">
                      <SelectValue placeholder="Select an expense to link" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableExpenses.map((expense) => (
                        <SelectItem key={expense.id} value={expense.id}>
                          {expense.id} - {expense.description} ({expense.amount})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Link this deduction to an existing expense for easier tracking
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Home Office Equipment"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Office Expenses">Office Expenses</SelectItem>
                      <SelectItem value="Education">Education & Training</SelectItem>
                      <SelectItem value="Travel">Travel & Transportation</SelectItem>
                      <SelectItem value="Insurance">Insurance</SelectItem>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                      <SelectItem value="Meals & Entertainment">
                        Meals & Entertainment
                      </SelectItem>
                      <SelectItem value="Marketing">Marketing & Advertising</SelectItem>
                      <SelectItem value="Professional Fees">
                        Professional Fees
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount and Date */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (€) *</Label>
                    <Input
                      id="amount"
                      type="text"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Deduction Rate */}
                <div className="space-y-2">
                  <Label htmlFor="deductionRate">Deduction Rate (%)</Label>
                  <Select
                    value={formData.deductionRate}
                    onValueChange={(value) =>
                      setFormData({ ...formData, deductionRate: value })
                    }
                  >
                    <SelectTrigger id="deductionRate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100% - Fully Deductible</SelectItem>
                      <SelectItem value="70">70% - Partially Deductible</SelectItem>
                      <SelectItem value="50">50% - Half Deductible</SelectItem>
                      <SelectItem value="38">38% - Standard Rate</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The percentage of the expense that is tax-deductible
                  </p>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional information or justification for this deduction..."
                    rows={4}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? 'Saving...' : 'Save Deduction'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/tax/deductions')}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Potential Saving Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Potential Tax Saving</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-lg font-semibold">
                    €{formData.amount || '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deduction Rate</p>
                  <p className="text-lg font-semibold">{formData.deductionRate}%</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Estimated Saving</p>
                  <p className="text-2xl font-bold text-green-600">
                    €{calculatePotentialSaving()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deduction Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Deduction Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Office Expenses</p>
                  <p className="text-muted-foreground">
                    Equipment, furniture, and supplies used for business
                  </p>
                </div>
                <div>
                  <p className="font-medium">Education</p>
                  <p className="text-muted-foreground">
                    Courses and training directly related to your profession
                  </p>
                </div>
                <div>
                  <p className="font-medium">Travel</p>
                  <p className="text-muted-foreground">
                    Business trips, mileage, and accommodation
                  </p>
                </div>
                <div>
                  <p className="font-medium">Home Office</p>
                  <p className="text-muted-foreground">
                    Portion of rent, utilities, and internet for business use
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </AnimatedCard>
    </div>
  );
}
