'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  Calendar,
  DollarSign,
  FileText,
  Tag,
  Building2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { WizardPanelProps, WizardStep, ExpenseFormData, CreatedExpense } from './types';

interface ExpenseFormPanelProps extends WizardPanelProps<CreatedExpense> {
  initialVendor?: { id: string; name: string };
  initialCategory?: string;
}

const STEPS: WizardStep[] = [
  { id: 'amount', title: 'Amount & Category', description: 'Enter expense details' },
  { id: 'details', title: 'Details & Receipt', description: 'Add description and receipt' },
  { id: 'review', title: 'Review', description: 'Confirm and save' },
];

const EXPENSE_CATEGORIES = [
  { value: 'office_supplies', label: 'Office Supplies', icon: '📦' },
  { value: 'travel', label: 'Travel & Transport', icon: '✈️' },
  { value: 'meals', label: 'Meals & Entertainment', icon: '🍽️' },
  { value: 'software', label: 'Software & Subscriptions', icon: '💻' },
  { value: 'equipment', label: 'Equipment', icon: '🖥️' },
  { value: 'professional_services', label: 'Professional Services', icon: '👔' },
  { value: 'marketing', label: 'Marketing & Advertising', icon: '📢' },
  { value: 'utilities', label: 'Utilities', icon: '💡' },
  { value: 'insurance', label: 'Insurance', icon: '🛡️' },
  { value: 'other', label: 'Other', icon: '📋' },
];

const CURRENCIES = [
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
  { value: 'CHF', label: 'Swiss Franc (CHF)', symbol: 'CHF' },
];

// Mock vendors for demo
const MOCK_VENDORS = [
  { id: 'v1', name: 'Amazon Business' },
  { id: 'v2', name: 'Office Depot' },
  { id: 'v3', name: 'Staples' },
  { id: 'v4', name: 'Adobe Inc.' },
  { id: 'v5', name: 'Google Cloud' },
];

export function ExpenseFormPanel({
  onComplete,
  onCancel,
  onStepChange,
  initialVendor,
  initialCategory,
}: ExpenseFormPanelProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ExpenseFormData>({
    vendorId: initialVendor?.id,
    vendorName: initialVendor?.name || '',
    amount: 0,
    currency: 'EUR',
    category: initialCategory || '',
    date: new Date().toISOString().split('T')[0] ?? '',
    description: '',
    receiptUrl: undefined,
    taxDeductible: true,
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const updateFormData = useCallback((updates: Partial<ExpenseFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
    onStepChange?.(step, STEPS[step]?.title ?? '');
  }, [onStepChange]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      handleStepChange(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      handleStepChange(currentStep - 1);
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    updateFormData({ receiptUrl: undefined });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const createdExpense: CreatedExpense = {
      ...formData,
      id: `exp_${Date.now()}`,
      receiptUrl: receiptPreview || undefined,
    };

    onComplete(createdExpense);
  };

  // Validation
  const isStep1Valid = formData.amount > 0 && formData.category !== '';
  const isStep2Valid = formData.description.trim() !== '' && formData.date !== '';
  const canSubmit = isStep1Valid && isStep2Valid;

  const getCategoryLabel = (value: string) => {
    return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  const getCategoryIcon = (value: string) => {
    return EXPENSE_CATEGORIES.find((c) => c.value === value)?.icon || '📋';
  };

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find((c) => c.value === code)?.symbol || code;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Progress Steps */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => index < currentStep && handleStepChange(index)}
              disabled={index > currentStep}
              className={cn(
                'flex items-center gap-2 text-sm transition-colors',
                index === currentStep && 'text-white',
                index < currentStep && 'text-emerald-400 cursor-pointer hover:text-emerald-300',
                index > currentStep && 'text-zinc-500 cursor-not-allowed'
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                  index === currentStep && 'bg-emerald-500 text-white',
                  index < currentStep && 'bg-emerald-500/20 text-emerald-400',
                  index > currentStep && 'bg-zinc-800 text-zinc-500'
                )}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="hidden sm:inline">{step.title}</span>
            </button>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-px mx-2',
                  index < currentStep ? 'bg-emerald-500' : 'bg-zinc-800'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Step 1: Amount & Category */}
            {currentStep === 0 && (
              <>
                <div className="text-center mb-6">
                  <Receipt className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                  <h3 className="text-lg font-medium text-white">Enter Expense</h3>
                  <p className="text-sm text-zinc-400">How much did you spend?</p>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => updateFormData({ currency: value })}
                    >
                      <SelectTrigger className="w-28 bg-zinc-900 border-zinc-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.amount || ''}
                        onChange={(e) => updateFormData({ amount: parseFloat(e.target.value) || 0 })}
                        className="bg-zinc-900 border-zinc-800 text-2xl font-medium h-12"
                      />
                    </div>
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {EXPENSE_CATEGORIES.map((category) => (
                      <button
                        key={category.value}
                        onClick={() => updateFormData({ category: category.value })}
                        className={cn(
                          'flex items-center gap-2 p-3 rounded-lg border text-left transition-colors',
                          formData.category === category.value
                            ? 'border-emerald-500 bg-emerald-500/10 text-white'
                            : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700'
                        )}
                      >
                        <span className="text-lg">{category.icon}</span>
                        <span className="text-sm">{category.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vendor (Optional) */}
                <div className="space-y-2">
                  <Label>Vendor (Optional)</Label>
                  <Select
                    value={formData.vendorId || ''}
                    onValueChange={(value) => {
                      const vendor = MOCK_VENDORS.find((v) => v.id === value);
                      updateFormData({
                        vendorId: value,
                        vendorName: vendor?.name || '',
                      });
                    }}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                      <SelectValue placeholder="Select or enter vendor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_VENDORS.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-zinc-500" />
                            {vendor.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!formData.vendorId && (
                    <Input
                      placeholder="Or type vendor name..."
                      value={formData.vendorName}
                      onChange={(e) => updateFormData({ vendorName: e.target.value })}
                      className="bg-zinc-900 border-zinc-800"
                    />
                  )}
                </div>
              </>
            )}

            {/* Step 2: Details & Receipt */}
            {currentStep === 1 && (
              <>
                <div className="text-center mb-6">
                  <FileText className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                  <h3 className="text-lg font-medium text-white">Add Details</h3>
                  <p className="text-sm text-zinc-400">Describe the expense and attach receipt</p>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateFormData({ date: e.target.value })}
                    className="bg-zinc-900 border-zinc-800"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    placeholder="What was this expense for?"
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 min-h-[100px]"
                  />
                </div>

                {/* Receipt Upload */}
                <div className="space-y-2">
                  <Label>Receipt (Optional)</Label>
                  {receiptPreview ? (
                    <div className="relative rounded-lg border border-zinc-800 overflow-hidden">
                      <img
                        src={receiptPreview}
                        alt="Receipt preview"
                        className="w-full h-48 object-cover"
                      />
                      <button
                        onClick={removeReceipt}
                        className="absolute top-2 right-2 p-1 bg-zinc-900/80 rounded-full hover:bg-zinc-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 cursor-pointer hover:border-zinc-600 transition-colors">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Camera className="w-5 h-5" />
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-sm text-zinc-400">
                        Click to upload or take photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleReceiptUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Tax Deductible */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                  <div className="space-y-1">
                    <Label>Tax Deductible</Label>
                    <p className="text-xs text-zinc-500">
                      Mark if this expense can be deducted from taxes
                    </p>
                  </div>
                  <Switch
                    checked={formData.taxDeductible}
                    onCheckedChange={(checked) => updateFormData({ taxDeductible: checked })}
                  />
                </div>
              </>
            )}

            {/* Step 3: Review */}
            {currentStep === 2 && (
              <>
                <div className="text-center mb-6">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                  <h3 className="text-lg font-medium text-white">Review Expense</h3>
                  <p className="text-sm text-zinc-400">Confirm details before saving</p>
                </div>

                {/* Expense Summary Card */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                  {/* Amount Header */}
                  <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-400">Amount</p>
                        <p className="text-3xl font-bold text-white">
                          {getCurrencySymbol(formData.currency)}{formData.amount.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-4xl">
                        {getCategoryIcon(formData.category)}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Category</span>
                      <Badge variant="outline" className="bg-zinc-800 border-zinc-700">
                        {getCategoryLabel(formData.category)}
                      </Badge>
                    </div>

                    {formData.vendorName && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Vendor</span>
                        <span className="text-white">{formData.vendorName}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Date</span>
                      <span className="text-white">
                        {new Date(formData.date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Tax Deductible</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          formData.taxDeductible
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-zinc-800 border-zinc-700'
                        )}
                      >
                        {formData.taxDeductible ? 'Yes' : 'No'}
                      </Badge>
                    </div>

                    <div className="pt-2 border-t border-zinc-800">
                      <p className="text-sm text-zinc-400 mb-1">Description</p>
                      <p className="text-sm text-white">{formData.description}</p>
                    </div>

                    {receiptPreview && (
                      <div className="pt-2 border-t border-zinc-800">
                        <p className="text-sm text-zinc-400 mb-2">Receipt</p>
                        <img
                          src={receiptPreview}
                          alt="Receipt"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-zinc-800 p-4">
        <div className="flex justify-between">
          {currentStep > 0 ? (
            <Button variant="outline" onClick={handleBack} className="border-zinc-800">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <Button variant="outline" onClick={onCancel} className="border-zinc-800">
              Cancel
            </Button>
          )}

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={currentStep === 0 ? !isStep1Valid : !isStep2Valid}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4 mr-2" />
                  Save Expense
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
