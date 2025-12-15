'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  Search,
  User,
  FileText,
  Send,
  Save,
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

import type { LineItem, InvoiceFormData, CreatedInvoice, WizardPanelProps } from './types';

// Mock clients for demo
const mockClients = [
  { id: '1', name: 'Acme Corporation', email: 'billing@acme.com' },
  { id: '2', name: 'TechStart GmbH', email: 'finance@techstart.de' },
  { id: '3', name: 'Global Services Ltd', email: 'ap@globalservices.co.uk' },
  { id: '4', name: 'Smith & Partners', email: 'accounts@smithpartners.com' },
];

interface InvoiceBuilderPanelProps extends WizardPanelProps<CreatedInvoice> {
  initialClient?: { id: string; name: string };
}

const STEPS = [
  { id: 'client', title: 'Client', description: 'Select or add client' },
  { id: 'items', title: 'Line Items', description: 'Add products/services' },
  { id: 'details', title: 'Details', description: 'Invoice settings' },
  { id: 'review', title: 'Review', description: 'Confirm and create' },
];

const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}-${random}`;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export function InvoiceBuilderPanel({
  onComplete,
  onCancel,
  initialClient,
  onStepChange,
}: InvoiceBuilderPanelProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  // Form state
  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: initialClient?.id || '',
    clientName: initialClient?.name || '',
    clientEmail: '',
    lineItems: [
      { id: generateId(), description: '', quantity: 1, unitPrice: 0, taxRate: 19, total: 0 },
    ],
    invoiceNumber: generateInvoiceNumber(),
    invoiceDate: new Date().toISOString().split('T')[0] ?? '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '',
    currency: 'EUR',
    notes: '',
    subtotal: 0,
    taxTotal: 0,
    total: 0,
  });

  // Notify parent of step changes
  useEffect(() => {
    onStepChange?.(currentStep, STEPS[currentStep]?.title ?? '');
  }, [currentStep, onStepChange]);

  // Calculate totals when line items change
  useEffect(() => {
    const subtotal = formData.lineItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      return sum + itemTotal;
    }, 0);

    const taxTotal = formData.lineItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      return sum + (itemTotal * item.taxRate) / 100;
    }, 0);

    setFormData((prev) => ({
      ...prev,
      subtotal,
      taxTotal,
      total: subtotal + taxTotal,
    }));
  }, [formData.lineItems]);

  // Filter clients based on search
  const filteredClients = mockClients.filter(
    (client) =>
      client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      client.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Select client
  const selectClient = (client: typeof mockClients[0]) => {
    setFormData((prev) => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
    }));
  };

  // Line item handlers
  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { id: generateId(), description: '', quantity: 1, unitPrice: 0, taxRate: 19, total: 0 },
      ],
    }));
  };

  const removeLineItem = (id: string) => {
    if (formData.lineItems.length > 1) {
      setFormData((prev) => ({
        ...prev,
        lineItems: prev.lineItems.filter((item) => item.id !== id),
      }));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        updated.total = updated.quantity * updated.unitPrice * (1 + updated.taxRate / 100);
        return updated;
      }),
    }));
  };

  // Validation
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0:
        return formData.clientId !== '';
      case 1:
        return formData.lineItems.some((item) => item.description && item.unitPrice > 0);
      case 2:
        return formData.invoiceNumber && formData.invoiceDate && formData.dueDate;
      case 3:
        return true;
      default:
        return false;
    }
  }, [currentStep, formData]);

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
  const handleSubmit = async (sendImmediately: boolean) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const invoice: CreatedInvoice = {
        ...formData,
        id: generateId(),
        status: sendImmediately ? 'sent' : 'draft',
      };

      onComplete(invoice);
    } catch (error) {
      console.error('Failed to create invoice:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step content components
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search clients..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700"
              />
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => selectClient(client)}
                  className={cn(
                    'w-full p-3 rounded-lg text-left transition-colors',
                    'hover:bg-zinc-800 border border-transparent',
                    formData.clientId === client.id && 'bg-zinc-800 border-emerald-500'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center">
                      <User className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{client.name}</p>
                      <p className="text-sm text-zinc-400">{client.email}</p>
                    </div>
                    {formData.clientId === client.id && (
                      <Check className="h-5 w-5 text-emerald-500 ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {formData.clientId && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <p className="text-sm text-emerald-400">
                  Selected: <span className="font-medium">{formData.clientName}</span>
                </p>
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {formData.lineItems.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Item {index + 1}</span>
                    {formData.lineItems.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(item.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                    className="bg-zinc-900 border-zinc-700"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-zinc-400">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)
                        }
                        className="bg-zinc-900 border-zinc-700"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                        className="bg-zinc-900 border-zinc-700"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">Tax %</Label>
                      <Select
                        value={item.taxRate.toString()}
                        onValueChange={(v) => updateLineItem(item.id, 'taxRate', parseInt(v))}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="7">7%</SelectItem>
                          <SelectItem value="19">19%</SelectItem>
                          <SelectItem value="20">20%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="text-right text-sm">
                    <span className="text-zinc-400">Line total: </span>
                    <span className="font-medium text-white">
                      {formatCurrency(item.quantity * item.unitPrice * (1 + item.taxRate / 100), formData.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={addLineItem}
              className="w-full border-dashed border-zinc-600 text-zinc-400 hover:text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Line Item
            </Button>

            <Separator className="bg-zinc-700" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span>{formatCurrency(formData.subtotal, formData.currency)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Tax</span>
                <span>{formatCurrency(formData.taxTotal, formData.currency)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-white">
                <span>Total</span>
                <span>{formatCurrency(formData.total, formData.currency)}</span>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData((p) => ({ ...p, invoiceNumber: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v) => setFormData((p) => ({ ...p, currency: v }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CHF">CHF (Fr)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Date</Label>
                <Input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData((p) => ({ ...p, invoiceDate: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes / Terms</Label>
              <Textarea
                placeholder="Payment terms, additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 min-h-[100px]"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {/* Invoice Preview */}
            <div className="bg-white text-zinc-900 rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">INVOICE</h3>
                  <p className="text-sm text-zinc-500">{formData.invoiceNumber}</p>
                </div>
                <Badge variant="outline" className="text-zinc-600">
                  Draft
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500">Bill To</p>
                  <p className="font-medium">{formData.clientName}</p>
                  <p className="text-zinc-600">{formData.clientEmail}</p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-500">Invoice Date</p>
                  <p>{formData.invoiceDate}</p>
                  <p className="text-zinc-500 mt-2">Due Date</p>
                  <p>{formData.dueDate}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                {formData.lineItems.filter(i => i.description).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <p>{item.description}</p>
                      <p className="text-zinc-500">
                        {item.quantity} × {formatCurrency(item.unitPrice, formData.currency)}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(item.quantity * item.unitPrice, formData.currency)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Subtotal</span>
                  <span>{formatCurrency(formData.subtotal, formData.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Tax</span>
                  <span>{formatCurrency(formData.taxTotal, formData.currency)}</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(formData.total, formData.currency)}</span>
                </div>
              </div>
            </div>

            {formData.notes && (
              <div className="p-3 bg-zinc-800/50 rounded-lg">
                <p className="text-xs text-zinc-400 mb-1">Notes</p>
                <p className="text-sm text-zinc-300">{formData.notes}</p>
              </div>
            )}
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
            <Button onClick={goNext} disabled={!canProceed()} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <div className="flex-1 flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-1" />
                Save Draft
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="h-4 w-4 mr-1" />
                {isSubmitting ? 'Creating...' : 'Create & Send'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
