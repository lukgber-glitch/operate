/**
 * InvoiceModal Component
 * Modal for chat-triggered invoice creation with client selection and line items
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import type { CreateInvoiceRequest } from '@/lib/api/finance';
import type { Client } from '@/lib/api/clients';

// Line item for the invoice
interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

// Props for the modal
export interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInvoiceRequest) => void | Promise<void>;
  prefillData?: {
    clientId?: string;
    items?: Array<{
      description: string;
      quantity?: number;
      unitPrice?: number;
      taxRate?: number;
    }>;
  };
  clients?: Client[];
  isLoading?: boolean;
}

/**
 * Generate a unique ID for line items
 */
const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Calculate line item total (quantity * unitPrice)
 */
const calculateLineTotal = (item: InvoiceLineItem): number => {
  return item.quantity * item.unitPrice;
};

/**
 * Format currency for display
 */
const formatCurrency = (amount: number, currency = 'EUR'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export function InvoiceModal({
  open,
  onClose,
  onSubmit,
  prefillData,
  clients = [],
  isLoading = false,
}: InvoiceModalProps) {
  // Form state
  const [selectedClientId, setSelectedClientId] = useState<string>(prefillData?.clientId || '');
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split('T')[0] || ''
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || ''
  );
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<InvoiceLineItem[]>(
    prefillData?.items && prefillData.items.length > 0
      ? prefillData.items.map((item) => ({
          id: generateId(),
          description: item.description || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          taxRate: item.taxRate || 0,
        }))
      : [
          {
            id: generateId(),
            description: '',
            quantity: 1,
            unitPrice: 0,
            taxRate: 0,
          },
        ]
  );

  // Get selected client data
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  // Calculate totals
  const { subtotal, taxAmount, total } = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
    const taxAmount = items.reduce(
      (sum, item) => sum + calculateLineTotal(item) * (item.taxRate / 100),
      0
    );
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, [items]);

  // Add new line item
  const handleAddItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        id: generateId(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
      },
    ]);
  }, []);

  // Remove line item
  const handleRemoveItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Update line item field
  const handleUpdateItem = useCallback(
    (id: string, field: keyof InvoiceLineItem, value: string | number) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                [field]: value,
              }
            : item
        )
      );
    },
    []
  );

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!selectedClient) {
      alert('Please select a client');
      return;
    }

    if (items.length === 0 || items.some((item) => !item.description.trim())) {
      alert('Please add at least one item with a description');
      return;
    }

    const invoiceData: CreateInvoiceRequest = {
      customerId: selectedClient.id,
      customerName: selectedClient.name,
      customerEmail: selectedClient.email,
      issueDate,
      dueDate,
      currency: selectedClient.currency || 'EUR',
      notes: notes.trim() || undefined,
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
      })),
    };

    await onSubmit(invoiceData);
  }, [selectedClient, items, issueDate, dueDate, notes, onSubmit]);

  // Reset form when modal closes
  const handleClose = useCallback(() => {
    if (!isLoading) {
      onClose();
    }
  }, [isLoading, onClose]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger id="client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                    {client.email && ` (${client.email})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date *</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Line Items *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 p-3 rounded-lg border border-white/10 bg-white/5"
                >
                  {/* Description */}
                  <div className="col-span-5">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) =>
                        handleUpdateItem(item.id, 'description', e.target.value)
                      }
                      disabled={isLoading}
                    />
                  </div>

                  {/* Quantity */}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      min="0"
                      step="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                      }
                      disabled={isLoading}
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Price"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                      }
                      disabled={isLoading}
                    />
                  </div>

                  {/* Tax Rate */}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Tax %"
                      min="0"
                      max="100"
                      step="0.1"
                      value={item.taxRate}
                      onChange={(e) =>
                        handleUpdateItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)
                      }
                      disabled={isLoading}
                    />
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-1 flex items-center justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={items.length === 1 || isLoading}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 p-4 rounded-lg border border-white/10 bg-white/5">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Subtotal:</span>
              <span className="font-medium">
                {formatCurrency(subtotal, selectedClient?.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Tax:</span>
              <span className="font-medium">
                {formatCurrency(taxAmount, selectedClient?.currency)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-semibold pt-2 border-t border-white/10">
              <span>Total:</span>
              <span>{formatCurrency(total, selectedClient?.currency)}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:border-white/40 focus-visible:ring-4 focus-visible:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Add any notes or payment instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !selectedClientId}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Invoice'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
