'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CreditCard,
  Building2,
  AlertTriangle,
  ExternalLink,
  DollarSign,
  Euro,
  PoundSterling,
} from 'lucide-react';

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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { usePayments, type CreatePaymentRequest, type Payment } from '@/hooks/use-payments';
import type { WizardPanelProps } from './types';

interface PaymentWizardPanelProps extends WizardPanelProps<Payment> {
  initialData?: {
    amount?: number;
    currency?: 'EUR' | 'GBP';
    beneficiaryName?: string;
    reference?: string;
    billId?: string;
    invoiceId?: string;
    description?: string;
  };
}

const STEPS = [
  { id: 'details', title: 'Payment Details', description: 'Enter amount and recipient' },
  { id: 'bank', title: 'Bank Account', description: 'Enter beneficiary account details' },
  { id: 'confirm', title: 'Confirm', description: 'Review and authorize' },
];

const CURRENCIES = [
  { value: 'EUR', label: 'EUR (€)', icon: Euro },
  { value: 'GBP', label: 'GBP (£)', icon: PoundSterling },
];

export function PaymentWizardPanel({
  onComplete,
  onCancel,
  onStepChange,
  initialData,
}: PaymentWizardPanelProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createPayment } = usePayments();

  // Form state
  const [formData, setFormData] = useState<CreatePaymentRequest>({
    amount: initialData?.amount || 0,
    currency: initialData?.currency || 'EUR',
    beneficiary: {
      name: initialData?.beneficiaryName || '',
      type: 'IBAN',
      iban: '',
    },
    reference: initialData?.reference || '',
    metadata: {
      billId: initialData?.billId,
      invoiceId: initialData?.invoiceId,
      description: initialData?.description,
    },
  });

  const [accountType, setAccountType] = useState<'IBAN' | 'SORT_CODE_ACCOUNT_NUMBER'>('IBAN');

  // Notify parent of step changes
  useEffect(() => {
    onStepChange?.(currentStep, STEPS[currentStep]?.title ?? '');
  }, [currentStep, onStepChange]);

  // Validation
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0:
        return (
          formData.amount > 0 &&
          formData.beneficiary.name.trim() !== '' &&
          formData.reference.trim() !== ''
        );
      case 1:
        if (accountType === 'IBAN') {
          // Basic IBAN validation (more detailed validation on backend)
          const iban = formData.beneficiary.iban?.replace(/\s/g, '') || '';
          return iban.length >= 15 && iban.length <= 34;
        } else {
          return (
            (formData.beneficiary.sortCode?.replace(/\s/g, '') || '').length === 6 &&
            (formData.beneficiary.accountNumber || '').length >= 6
          );
        }
      case 2:
        return true;
      default:
        return false;
    }
  }, [currentStep, formData, accountType]);

  // Navigation
  const goNext = () => {
    if (currentStep < STEPS.length - 1 && canProceed()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Submit
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payment = await createPayment(formData);

      // If authorization required, redirect to bank
      if (payment.authorizationUrl) {
        window.location.href = payment.authorizationUrl;
      } else {
        onComplete(payment);
      }
    } catch (error) {
      console.error('Failed to create payment:', error);
      setIsSubmitting(false);
    }
  };

  // Handle account type change
  const handleAccountTypeChange = (type: 'IBAN' | 'SORT_CODE_ACCOUNT_NUMBER') => {
    setAccountType(type);
    setFormData((prev) => ({
      ...prev,
      beneficiary: {
        ...prev.beneficiary,
        type,
        iban: type === 'IBAN' ? prev.beneficiary.iban : undefined,
        sortCode: type === 'SORT_CODE_ACCOUNT_NUMBER' ? prev.beneficiary.sortCode : undefined,
        accountNumber: type === 'SORT_CODE_ACCOUNT_NUMBER' ? prev.beneficiary.accountNumber : undefined,
      },
    }));
  };

  // Format IBAN with spaces
  const formatIBAN = (value: string) => {
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
  };

  // Format Sort Code
  const formatSortCode = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.match(/.{1,2}/g)?.join('-') || cleaned;
  };

  // Step content components
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            {/* Amount and Currency */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount || ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))
                  }
                  className="bg-zinc-800 border-zinc-700 text-2xl font-semibold"
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v) => setFormData((p) => ({ ...p, currency: v as 'EUR' | 'GBP' }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        <div className="flex items-center gap-2">
                          <currency.icon className="h-4 w-4" />
                          {currency.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Beneficiary Name */}
            <div className="space-y-2">
              <Label>Recipient Name</Label>
              <Input
                placeholder="e.g., Acme Corporation"
                value={formData.beneficiary.name}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    beneficiary: { ...p.beneficiary, name: e.target.value },
                  }))
                }
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <Label>Payment Reference</Label>
              <Input
                placeholder="e.g., Invoice #12345"
                value={formData.reference}
                onChange={(e) => setFormData((p) => ({ ...p, reference: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* Description (Optional) */}
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Additional notes..."
                value={formData.metadata?.description || ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    metadata: { ...p.metadata, description: e.target.value },
                  }))
                }
                className="bg-zinc-800 border-zinc-700 min-h-[80px]"
              />
            </div>

            {/* Amount Preview */}
            {formData.amount > 0 && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <p className="text-sm text-emerald-400 mb-1">Payment Amount</p>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(formData.amount, formData.currency)}
                </p>
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            {/* Account Type Selector */}
            <div className="space-y-2">
              <Label>Account Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAccountTypeChange('IBAN')}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-colors text-left',
                    accountType === 'IBAN'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                  )}
                >
                  <Building2 className="h-5 w-5 mb-2 text-zinc-400" />
                  <p className="font-medium text-white">IBAN</p>
                  <p className="text-xs text-zinc-400">European accounts</p>
                </button>
                <button
                  onClick={() => handleAccountTypeChange('SORT_CODE_ACCOUNT_NUMBER')}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-colors text-left',
                    accountType === 'SORT_CODE_ACCOUNT_NUMBER'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                  )}
                >
                  <Building2 className="h-5 w-5 mb-2 text-zinc-400" />
                  <p className="font-medium text-white">Sort Code</p>
                  <p className="text-xs text-zinc-400">UK accounts</p>
                </button>
              </div>
            </div>

            {/* IBAN Input */}
            {accountType === 'IBAN' && (
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input
                  placeholder="DE89 3704 0044 0532 0130 00"
                  value={formData.beneficiary.iban || ''}
                  onChange={(e) => {
                    const formatted = formatIBAN(e.target.value);
                    setFormData((p) => ({
                      ...p,
                      beneficiary: { ...p.beneficiary, iban: formatted },
                    }));
                  }}
                  className="bg-zinc-800 border-zinc-700 font-mono"
                  maxLength={40}
                />
                <p className="text-xs text-zinc-500">
                  Enter the recipient's IBAN (International Bank Account Number)
                </p>
              </div>
            )}

            {/* UK Account Details */}
            {accountType === 'SORT_CODE_ACCOUNT_NUMBER' && (
              <>
                <div className="space-y-2">
                  <Label>Sort Code</Label>
                  <Input
                    placeholder="12-34-56"
                    value={formData.beneficiary.sortCode || ''}
                    onChange={(e) => {
                      const formatted = formatSortCode(e.target.value);
                      setFormData((p) => ({
                        ...p,
                        beneficiary: { ...p.beneficiary, sortCode: formatted },
                      }));
                    }}
                    className="bg-zinc-800 border-zinc-700 font-mono"
                    maxLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    placeholder="12345678"
                    value={formData.beneficiary.accountNumber || ''}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      setFormData((p) => ({
                        ...p,
                        beneficiary: { ...p.beneficiary, accountNumber: cleaned },
                      }));
                    }}
                    className="bg-zinc-800 border-zinc-700 font-mono"
                    maxLength={8}
                  />
                </div>
              </>
            )}

            {/* Warning */}
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-400">
                <p className="font-medium mb-1">Double-check account details</p>
                <p className="text-yellow-400/80">
                  Make sure the account information is correct. Payments cannot be reversed once authorized.
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {/* Payment Summary Card */}
            <div className="bg-white text-zinc-900 rounded-lg p-4 space-y-4">
              <div>
                <p className="text-sm text-zinc-500 mb-1">Payment Amount</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(formData.amount, formData.currency)}
                </p>
              </div>

              <Separator className="bg-zinc-200" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Recipient</span>
                  <span className="font-medium">{formData.beneficiary.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Reference</span>
                  <span className="font-medium">{formData.reference}</span>
                </div>
                {formData.beneficiary.iban && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">IBAN</span>
                    <span className="font-mono text-xs">{formData.beneficiary.iban}</span>
                  </div>
                )}
                {formData.beneficiary.sortCode && formData.beneficiary.accountNumber && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Sort Code</span>
                      <span className="font-mono">{formData.beneficiary.sortCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Account Number</span>
                      <span className="font-mono">{formData.beneficiary.accountNumber}</span>
                    </div>
                  </>
                )}
              </div>

              {formData.metadata?.description && (
                <>
                  <Separator className="bg-zinc-200" />
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Description</p>
                    <p className="text-sm">{formData.metadata.description}</p>
                  </div>
                </>
              )}
            </div>

            {/* Authorization Warning */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-blue-400">
                <ExternalLink className="h-5 w-5" />
                <p className="font-medium">Bank Authorization Required</p>
              </div>
              <p className="text-sm text-blue-400/80">
                When you click "Confirm & Pay", you'll be redirected to your bank to securely
                authorize this payment using Strong Customer Authentication (SCA).
              </p>
            </div>

            {/* Security Info */}
            <div className="text-xs text-zinc-500 space-y-1">
              <p>• Your payment is secured by TrueLayer's regulated payment infrastructure</p>
              <p>• Your bank credentials are never shared with us</p>
              <p>• You can cancel the authorization at your bank if needed</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Progress Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  index < currentStep && 'bg-emerald-500 text-white',
                  index === currentStep && 'bg-white text-zinc-900',
                  index > currentStep && 'bg-zinc-800 text-zinc-500'
                )}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-8 mx-1',
                    index < currentStep ? 'bg-emerald-500' : 'bg-zinc-700'
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{STEPS[currentStep]?.title}</h3>
          <p className="text-sm text-zinc-400">{STEPS[currentStep]?.description}</p>
        </div>
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
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex gap-3">
          {currentStep > 0 ? (
            <Button variant="outline" onClick={goBack} className="flex-1">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : (
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={goNext}
              disabled={!canProceed()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceed()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Processing...' : 'Confirm & Pay'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
