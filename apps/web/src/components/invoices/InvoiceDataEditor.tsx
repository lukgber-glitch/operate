/**
 * Invoice Data Editor Component
 * Form for editing extracted invoice fields
 */

'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FieldConfidenceIndicator } from './ConfidenceIndicator';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ExtractedInvoiceData,
  InvoiceLineItem,
  FieldConfidence,
} from '@/types/extracted-invoice';

interface InvoiceDataEditorProps {
  data: ExtractedInvoiceData;
  fieldConfidences: FieldConfidence[];
  onChange: (data: ExtractedInvoiceData) => void;
  readOnly?: boolean;
  className?: string;
}

export function InvoiceDataEditor({
  data,
  fieldConfidences,
  onChange,
  readOnly = false,
  className,
}: InvoiceDataEditorProps) {
  const getFieldConfidence = (fieldName: string) => {
    return fieldConfidences.find((fc) => fc.field === fieldName);
  };

  const updateField = (field: keyof ExtractedInvoiceData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateLineItem = (index: number, updates: Partial<InvoiceLineItem>) => {
    const newLineItems = [...data.lineItems];
    newLineItems[index] = { ...newLineItems[index], ...updates };
    onChange({ ...data, lineItems: newLineItems });
  };

  const addLineItem = () => {
    onChange({
      ...data,
      lineItems: [
        ...data.lineItems,
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          totalAmount: 0,
        },
      ],
    });
  };

  const removeLineItem = (index: number) => {
    const newLineItems = data.lineItems.filter((_, i) => i !== index);
    onChange({ ...data, lineItems: newLineItems });
  };

  const recalculateTotals = () => {
    const subtotal = data.lineItems.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const taxAmount = data.taxRate ? (subtotal * data.taxRate) / 100 : 0;
    const total = subtotal + taxAmount;

    onChange({
      ...data,
      subtotal,
      taxAmount,
      total,
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Vendor Information */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Vendor Information</h3>
        <div className="grid gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="vendorName">Vendor Name</Label>
              {getFieldConfidence('vendorName') && (
                <FieldConfidenceIndicator
                  fieldName=""
                  confidence={getFieldConfidence('vendorName')!.confidence}
                  extracted={getFieldConfidence('vendorName')!.extracted}
                />
              )}
            </div>
            <Input
              id="vendorName"
              value={data.vendorName || ''}
              onChange={(e) => updateField('vendorName', e.target.value)}
              readOnly={readOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorAddress">Address</Label>
            <Input
              id="vendorAddress"
              value={data.vendorAddress || ''}
              onChange={(e) => updateField('vendorAddress', e.target.value)}
              readOnly={readOnly}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendorVatId">VAT ID</Label>
              <Input
                id="vendorVatId"
                value={data.vendorVatId || ''}
                onChange={(e) => updateField('vendorVatId', e.target.value)}
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorEmail">Email</Label>
              <Input
                id="vendorEmail"
                type="email"
                value={data.vendorEmail || ''}
                onChange={(e) => updateField('vendorEmail', e.target.value)}
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Invoice Details */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Invoice Details</h3>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={data.invoiceNumber || ''}
                onChange={(e) => updateField('invoiceNumber', e.target.value)}
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={data.currency}
                onChange={(e) => updateField('currency', e.target.value)}
                readOnly={readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={data.invoiceDate?.split('T')[0] || ''}
                onChange={(e) => updateField('invoiceDate', e.target.value)}
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={data.dueDate?.split('T')[0] || ''}
                onChange={(e) => updateField('dueDate', e.target.value)}
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Line Items */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Line Items</h3>
          {!readOnly && (
            <Button onClick={addLineItem} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {data.lineItems.map((item, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg space-y-3 bg-muted/20"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      updateLineItem(index, { description: e.target.value })
                    }
                    readOnly={readOnly}
                  />
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(index)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    value={item.quantity || ''}
                    onChange={(e) =>
                      updateLineItem(index, {
                        quantity: parseFloat(e.target.value),
                      })
                    }
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unitPrice || ''}
                    onChange={(e) =>
                      updateLineItem(index, {
                        unitPrice: parseFloat(e.target.value),
                      })
                    }
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tax Rate %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.taxRate || ''}
                    onChange={(e) =>
                      updateLineItem(index, {
                        taxRate: parseFloat(e.target.value),
                      })
                    }
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Total</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.totalAmount}
                    onChange={(e) =>
                      updateLineItem(index, {
                        totalAmount: parseFloat(e.target.value),
                      })
                    }
                    readOnly={readOnly}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Totals */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Totals</h3>
        <div className="space-y-3 max-w-md ml-auto">
          <div className="flex justify-between items-center">
            <Label>Subtotal</Label>
            <Input
              type="number"
              step="0.01"
              value={data.subtotal}
              onChange={(e) =>
                updateField('subtotal', parseFloat(e.target.value))
              }
              readOnly={readOnly}
              className="w-32 text-right"
            />
          </div>

          <div className="flex justify-between items-center">
            <Label>Tax Rate %</Label>
            <Input
              type="number"
              step="0.01"
              value={data.taxRate || ''}
              onChange={(e) => {
                updateField('taxRate', parseFloat(e.target.value));
                recalculateTotals();
              }}
              readOnly={readOnly}
              className="w-32 text-right"
            />
          </div>

          <div className="flex justify-between items-center">
            <Label>Tax Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={data.taxAmount || ''}
              onChange={(e) =>
                updateField('taxAmount', parseFloat(e.target.value))
              }
              readOnly={readOnly}
              className="w-32 text-right"
            />
          </div>

          <Separator />

          <div className="flex justify-between items-center text-lg font-semibold">
            <Label>Total</Label>
            <Input
              type="number"
              step="0.01"
              value={data.total}
              onChange={(e) => updateField('total', parseFloat(e.target.value))}
              readOnly={readOnly}
              className="w-32 text-right font-semibold"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
