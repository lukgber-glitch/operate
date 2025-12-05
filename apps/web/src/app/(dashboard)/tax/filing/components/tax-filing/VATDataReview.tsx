'use client';

import { Calculator, Edit2, Save } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UStVAData, VATCalculation } from '@/hooks/use-tax-filing';

interface VATDataReviewProps {
  calculation: VATCalculation;
  onUpdate: (data: Partial<UStVAData>) => void;
  onContinue: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function VATDataReview({
  calculation,
  onUpdate,
  onContinue,
  onBack,
  isLoading
}: VATDataReviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<UStVAData>>({
    domesticRevenue19: calculation.domesticRevenue19,
    domesticRevenue7: calculation.domesticRevenue7,
    taxFreeRevenue: calculation.taxFreeRevenue,
    inputTax: calculation.inputTax,
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const formatNumber = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const handleInputChange = (field: keyof UStVAData, value: string) => {
    const numValue = parseFloat(value) * 100 || 0;
    setEditedData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSave = () => {
    onUpdate(editedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedData({
      domesticRevenue19: calculation.domesticRevenue19,
      domesticRevenue7: calculation.domesticRevenue7,
      taxFreeRevenue: calculation.taxFreeRevenue,
      inputTax: calculation.inputTax,
    });
    setIsEditing(false);
  };

  const currentData = isEditing ? editedData : calculation;

  // Calculate output VAT
  const outputVat19 = (currentData.domesticRevenue19 || 0) * 0.19;
  const outputVat7 = (currentData.domesticRevenue7 || 0) * 0.07;
  const totalOutputVat = outputVat19 + outputVat7;

  // Calculate total input tax
  const totalInputTax = currentData.inputTax || 0;

  // Calculate VAT payable (positive) or refundable (negative)
  const vatPayable = totalOutputVat - totalInputTax;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                VAT Data Review
              </CardTitle>
              <CardDescription>
                Review and adjust calculated VAT amounts
              </CardDescription>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Source Info */}
          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
            <div className="flex-1">
              <div className="text-sm font-medium">Auto-calculated from invoices</div>
              <div className="text-xs text-muted-foreground">
                {calculation.invoiceCount} invoices, {calculation.expenseCount} expenses
              </div>
            </div>
            <Badge variant="secondary">Automated</Badge>
          </div>

          {/* Output VAT (Tax Revenue) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Output VAT (Umsatzsteuer)</h3>

            {/* 19% Revenue */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="revenue-19">Domestic Revenue @ 19% (Kennzahl 81)</Label>
                {!isEditing && (
                  <span className="text-sm text-muted-foreground">
                    VAT: {formatCurrency(outputVat19)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    id="revenue-19"
                    type="number"
                    step="0.01"
                    value={formatNumber(currentData.domesticRevenue19 || 0)}
                    onChange={(e) => handleInputChange('domesticRevenue19', e.target.value)}
                    className="flex-1"
                  />
                ) : (
                  <div className="flex-1 p-2 border rounded-md bg-muted/50">
                    {formatCurrency(currentData.domesticRevenue19 || 0)}
                  </div>
                )}
              </div>
            </div>

            {/* 7% Revenue */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="revenue-7">Domestic Revenue @ 7% (Kennzahl 86)</Label>
                {!isEditing && (
                  <span className="text-sm text-muted-foreground">
                    VAT: {formatCurrency(outputVat7)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    id="revenue-7"
                    type="number"
                    step="0.01"
                    value={formatNumber(currentData.domesticRevenue7 || 0)}
                    onChange={(e) => handleInputChange('domesticRevenue7', e.target.value)}
                    className="flex-1"
                  />
                ) : (
                  <div className="flex-1 p-2 border rounded-md bg-muted/50">
                    {formatCurrency(currentData.domesticRevenue7 || 0)}
                  </div>
                )}
              </div>
            </div>

            {/* Tax-free Revenue */}
            <div className="space-y-2">
              <Label htmlFor="tax-free">Tax-free Revenue (Kennzahl 48)</Label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    id="tax-free"
                    type="number"
                    step="0.01"
                    value={formatNumber(currentData.taxFreeRevenue || 0)}
                    onChange={(e) => handleInputChange('taxFreeRevenue', e.target.value)}
                    className="flex-1"
                  />
                ) : (
                  <div className="flex-1 p-2 border rounded-md bg-muted/50">
                    {formatCurrency(currentData.taxFreeRevenue || 0)}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Total Output VAT */}
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <span className="font-semibold">Total Output VAT</span>
              <span className="text-lg font-bold">{formatCurrency(totalOutputVat)}</span>
            </div>
          </div>

          {/* Input Tax (Deductible) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Input Tax (Vorsteuer)</h3>

            <div className="space-y-2">
              <Label htmlFor="input-tax">Deductible Input Tax (Kennzahl 66)</Label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    id="input-tax"
                    type="number"
                    step="0.01"
                    value={formatNumber(currentData.inputTax || 0)}
                    onChange={(e) => handleInputChange('inputTax', e.target.value)}
                    className="flex-1"
                  />
                ) : (
                  <div className="flex-1 p-2 border rounded-md bg-muted/50">
                    {formatCurrency(currentData.inputTax || 0)}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Total Input Tax */}
            <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
              <span className="font-semibold">Total Input Tax</span>
              <span className="text-lg font-bold">{formatCurrency(totalInputTax)}</span>
            </div>
          </div>

          {/* VAT Payable Summary */}
          <Separator className="my-6" />

          <div className={`p-4 rounded-lg ${vatPayable >= 0 ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">
                  {vatPayable >= 0 ? 'VAT Payable' : 'VAT Refundable'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {vatPayable >= 0 ? 'Amount to pay to tax office' : 'Amount to be refunded'}
                </div>
              </div>
              <div className={`text-2xl font-bold ${vatPayable >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(vatPayable))}
              </div>
            </div>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button onClick={handleCancel} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline" disabled={isLoading}>
          Back
        </Button>
        <Button onClick={onContinue} className="flex-1" disabled={isLoading || isEditing}>
          {isLoading ? 'Loading...' : 'Continue to Additional Data'}
        </Button>
      </div>
    </div>
  );
}
