'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { WizardPanelProps, WizardStep, ClientFormData, CreatedClient } from './types';

interface ClientFormPanelProps extends WizardPanelProps<CreatedClient> {
  type?: 'client' | 'vendor';
  initialData?: Partial<ClientFormData>;
}

const STEPS: WizardStep[] = [
  { id: 'basic', title: 'Basic Info', description: 'Name and contact details' },
  { id: 'address', title: 'Address', description: 'Billing address' },
  { id: 'billing', title: 'Billing', description: 'Payment terms and tax info' },
  { id: 'review', title: 'Review', description: 'Confirm and save' },
];

const COUNTRIES = [
  { code: 'AT', name: 'Austria' },
  { code: 'DE', name: 'Germany' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'BE', name: 'Belgium' },
];

const PAYMENT_TERMS = [
  { value: 0, label: 'Due on Receipt' },
  { value: 7, label: 'Net 7' },
  { value: 14, label: 'Net 14' },
  { value: 30, label: 'Net 30' },
  { value: 45, label: 'Net 45' },
  { value: 60, label: 'Net 60' },
];

export function ClientFormPanel({
  onComplete,
  onCancel,
  onStepChange,
  type = 'client',
  initialData,
}: ClientFormPanelProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isVendor = type === 'vendor';
  const entityLabel = isVendor ? 'Vendor' : 'Client';

  // Form state
  const [formData, setFormData] = useState<ClientFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    company: initialData?.company || '',
    address: initialData?.address || {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'AT',
    },
    taxId: initialData?.taxId || '',
    paymentTerms: initialData?.paymentTerms || 30,
    notes: initialData?.notes || '',
  });

  const updateFormData = useCallback((updates: Partial<ClientFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateAddress = useCallback((updates: Partial<ClientFormData['address']>) => {
    setFormData((prev) => ({
      ...prev,
      address: prev.address ? { ...prev.address, ...updates } : undefined,
    }));
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

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const createdClient: CreatedClient = {
      ...formData,
      id: `${isVendor ? 'vendor' : 'client'}_${Date.now()}`,
    };

    onComplete(createdClient);
  };

  // Validation
  const isStep1Valid = formData.name.trim() !== '' && formData.email.trim() !== '';
  const isStep2Valid = formData.address?.street && formData.address?.city && formData.address?.country;
  const isStep3Valid = true; // Billing info is optional
  const canSubmit = isStep1Valid;

  const getCountryName = (code: string) => {
    return COUNTRIES.find((c) => c.code === code)?.name || code;
  };

  const getPaymentTermsLabel = (days: number) => {
    return PAYMENT_TERMS.find((t) => t.value === days)?.label || `Net ${days}`;
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
            {/* Step 1: Basic Info */}
            {currentStep === 0 && (
              <>
                <div className="text-center mb-6">
                  {isVendor ? (
                    <Building2 className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                  ) : (
                    <User className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                  )}
                  <h3 className="text-lg font-medium text-white">Add {entityLabel}</h3>
                  <p className="text-sm text-zinc-400">Enter basic contact information</p>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label>{isVendor ? 'Vendor' : 'Contact'} Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      placeholder={isVendor ? 'Vendor name' : 'John Doe'}
                      value={formData.name}
                      onChange={(e) => updateFormData({ name: e.target.value })}
                      className="pl-10 bg-zinc-900 border-zinc-800"
                    />
                  </div>
                </div>

                {/* Company */}
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      placeholder="Acme Inc."
                      value={formData.company || ''}
                      onChange={(e) => updateFormData({ company: e.target.value })}
                      className="pl-10 bg-zinc-900 border-zinc-800"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => updateFormData({ email: e.target.value })}
                      className="pl-10 bg-zinc-900 border-zinc-800"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      type="tel"
                      placeholder="+43 1 234 5678"
                      value={formData.phone || ''}
                      onChange={(e) => updateFormData({ phone: e.target.value })}
                      className="pl-10 bg-zinc-900 border-zinc-800"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Address */}
            {currentStep === 1 && (
              <>
                <div className="text-center mb-6">
                  <MapPin className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                  <h3 className="text-lg font-medium text-white">Billing Address</h3>
                  <p className="text-sm text-zinc-400">Where should invoices be sent?</p>
                </div>

                {/* Street */}
                <div className="space-y-2">
                  <Label>Street Address</Label>
                  <Input
                    placeholder="123 Main Street"
                    value={formData.address?.street || ''}
                    onChange={(e) => updateAddress({ street: e.target.value })}
                    className="bg-zinc-900 border-zinc-800"
                  />
                </div>

                {/* City & Postal Code */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      placeholder="Vienna"
                      value={formData.address?.city || ''}
                      onChange={(e) => updateAddress({ city: e.target.value })}
                      className="bg-zinc-900 border-zinc-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Postal Code</Label>
                    <Input
                      placeholder="1010"
                      value={formData.address?.postalCode || ''}
                      onChange={(e) => updateAddress({ postalCode: e.target.value })}
                      className="bg-zinc-900 border-zinc-800"
                    />
                  </div>
                </div>

                {/* State/Province */}
                <div className="space-y-2">
                  <Label>State / Province</Label>
                  <Input
                    placeholder="Vienna"
                    value={formData.address?.state || ''}
                    onChange={(e) => updateAddress({ state: e.target.value })}
                    className="bg-zinc-900 border-zinc-800"
                  />
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select
                    value={formData.address?.country || 'AT'}
                    onValueChange={(value) => updateAddress({ country: value })}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-zinc-500" />
                            {country.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 3: Billing */}
            {currentStep === 2 && (
              <>
                <div className="text-center mb-6">
                  <CreditCard className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                  <h3 className="text-lg font-medium text-white">Billing Settings</h3>
                  <p className="text-sm text-zinc-400">Payment terms and tax information</p>
                </div>

                {/* Payment Terms */}
                <div className="space-y-2">
                  <Label>Default Payment Terms</Label>
                  <Select
                    value={String(formData.paymentTerms)}
                    onValueChange={(value) => updateFormData({ paymentTerms: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TERMS.map((term) => (
                        <SelectItem key={term.value} value={String(term.value)}>
                          {term.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-zinc-500">
                    This will be the default for all invoices to this {entityLabel.toLowerCase()}
                  </p>
                </div>

                {/* Tax ID / VAT */}
                <div className="space-y-2">
                  <Label>Tax ID / VAT Number</Label>
                  <Input
                    placeholder="ATU12345678"
                    value={formData.taxId || ''}
                    onChange={(e) => updateFormData({ taxId: e.target.value })}
                    className="bg-zinc-900 border-zinc-800"
                  />
                  <p className="text-xs text-zinc-500">
                    Required for B2B invoices in EU
                  </p>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Internal Notes</Label>
                  <Textarea
                    placeholder="Any notes about this client..."
                    value={formData.notes || ''}
                    onChange={(e) => updateFormData({ notes: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 min-h-[100px]"
                  />
                </div>
              </>
            )}

            {/* Step 4: Review */}
            {currentStep === 3 && (
              <>
                <div className="text-center mb-6">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                  <h3 className="text-lg font-medium text-white">Review {entityLabel}</h3>
                  <p className="text-sm text-zinc-400">Confirm details before saving</p>
                </div>

                {/* Summary Card */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                  {/* Header */}
                  <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        {isVendor ? (
                          <Building2 className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <User className="w-6 h-6 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{formData.name}</p>
                        {formData.company && (
                          <p className="text-sm text-zinc-400">{formData.company}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-3">
                    {/* Contact */}
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Contact</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-zinc-500" />
                        <span className="text-white">{formData.email}</span>
                      </div>
                      {formData.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-zinc-500" />
                          <span className="text-white">{formData.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    {formData.address?.street && (
                      <div className="space-y-2 pt-2 border-t border-zinc-800">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider">Address</p>
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-zinc-500 mt-0.5" />
                          <div className="text-white">
                            <p>{formData.address.street}</p>
                            <p>
                              {formData.address.postalCode} {formData.address.city}
                            </p>
                            <p>{getCountryName(formData.address.country)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Billing */}
                    <div className="space-y-2 pt-2 border-t border-zinc-800">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Billing</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Payment Terms</span>
                        <Badge variant="outline" className="bg-zinc-800 border-zinc-700">
                          {getPaymentTermsLabel(formData.paymentTerms)}
                        </Badge>
                      </div>
                      {formData.taxId && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">Tax ID</span>
                          <span className="text-white font-mono">{formData.taxId}</span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {formData.notes && (
                      <div className="space-y-2 pt-2 border-t border-zinc-800">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider">Notes</p>
                        <p className="text-sm text-zinc-300">{formData.notes}</p>
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
              disabled={
                (currentStep === 0 && !isStep1Valid) ||
                (currentStep === 1 && !isStep2Valid) ||
                (currentStep === 2 && !isStep3Valid)
              }
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
                  {isVendor ? (
                    <Building2 className="w-4 h-4 mr-2" />
                  ) : (
                    <User className="w-4 h-4 mr-2" />
                  )}
                  Save {entityLabel}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
