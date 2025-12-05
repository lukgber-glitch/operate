'use client';

import { Calculator, Edit2, Save } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UVAData, UVACalculation } from '../hooks/useUVA';

interface UVADataReviewProps {
  calculation: UVACalculation;
  onUpdate: (data: Partial<UVAData>) => void;
  onContinue: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function UVADataReview({
  calculation,
  onUpdate,
  onContinue,
  onBack,
  isLoading
}: UVADataReviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<UVAData>>({
    domesticRevenue20: calculation.domesticRevenue20,
    domesticRevenue13: calculation.domesticRevenue13,
    domesticRevenue10: calculation.domesticRevenue10,
    domesticRevenue0: calculation.domesticRevenue0,
    taxFreeRevenue: calculation.taxFreeRevenue,
    inputTax: calculation.inputTax,
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const formatNumber = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const handleInputChange = (field: keyof UVAData, value: string) => {
    const numValue = parseFloat(value) * 100 || 0;
    setEditedData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSave = () => {
    onUpdate(editedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedData({
      domesticRevenue20: calculation.domesticRevenue20,
      domesticRevenue13: calculation.domesticRevenue13,
      domesticRevenue10: calculation.domesticRevenue10,
      domesticRevenue0: calculation.domesticRevenue0,
      taxFreeRevenue: calculation.taxFreeRevenue,
      inputTax: calculation.inputTax,
    });
    setIsEditing(false);
  };

  const currentData = isEditing ? editedData : calculation;

  // Calculate output VAT (Austrian rates)
  const outputVat20 = (currentData.domesticRevenue20 || 0) * 0.20;
  const outputVat13 = (currentData.domesticRevenue13 || 0) * 0.13;
  const outputVat10 = (currentData.domesticRevenue10 || 0) * 0.10;
  const totalOutputVat = outputVat20 + outputVat13 + outputVat10;

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
                UVA-Daten prüfen
              </CardTitle>
              <CardDescription>
                Überprüfen und korrigieren Sie die berechneten Umsatzsteuerbeträge
              </CardDescription>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Source Info */}
          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
            <div className="flex-1">
              <div className="text-sm font-medium">Automatisch berechnet aus Rechnungen</div>
              <div className="text-xs text-muted-foreground">
                {calculation.invoiceCount} Rechnungen, {calculation.expenseCount} Ausgaben
              </div>
            </div>
            <Badge variant="secondary">Automatisiert</Badge>
          </div>

          {/* Output VAT (Tax Revenue) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Umsatzsteuer (zu zahlen)</h3>

            {/* 20% Revenue */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="revenue-20">Inländische Umsätze @ 20% (Kennzahl 000)</Label>
                {!isEditing && (
                  <span className="text-sm text-muted-foreground">
                    USt: {formatCurrency(outputVat20)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    id="revenue-20"
                    type="number"
                    step="0.01"
                    value={formatNumber(currentData.domesticRevenue20 || 0)}
                    onChange={(e) => handleInputChange('domesticRevenue20', e.target.value)}
                    className="flex-1"
                  />
                ) : (
                  <div className="flex-1 p-2 border rounded-md bg-muted/50">
                    {formatCurrency(currentData.domesticRevenue20 || 0)}
                  </div>
                )}
              </div>
            </div>

            {/* 13% Revenue */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="revenue-13">Inländische Umsätze @ 13% (Kennzahl 029)</Label>
                {!isEditing && (
                  <span className="text-sm text-muted-foreground">
                    USt: {formatCurrency(outputVat13)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    id="revenue-13"
                    type="number"
                    step="0.01"
                    value={formatNumber(currentData.domesticRevenue13 || 0)}
                    onChange={(e) => handleInputChange('domesticRevenue13', e.target.value)}
                    className="flex-1"
                  />
                ) : (
                  <div className="flex-1 p-2 border rounded-md bg-muted/50">
                    {formatCurrency(currentData.domesticRevenue13 || 0)}
                  </div>
                )}
              </div>
            </div>

            {/* 10% Revenue */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="revenue-10">Inländische Umsätze @ 10% (Kennzahl 006)</Label>
                {!isEditing && (
                  <span className="text-sm text-muted-foreground">
                    USt: {formatCurrency(outputVat10)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    id="revenue-10"
                    type="number"
                    step="0.01"
                    value={formatNumber(currentData.domesticRevenue10 || 0)}
                    onChange={(e) => handleInputChange('domesticRevenue10', e.target.value)}
                    className="flex-1"
                  />
                ) : (
                  <div className="flex-1 p-2 border rounded-md bg-muted/50">
                    {formatCurrency(currentData.domesticRevenue10 || 0)}
                  </div>
                )}
              </div>
            </div>

            {/* 0% Revenue */}
            <div className="space-y-2">
              <Label htmlFor="revenue-0">Umsätze @ 0% (Kennzahl 021)</Label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    id="revenue-0"
                    type="number"
                    step="0.01"
                    value={formatNumber(currentData.domesticRevenue0 || 0)}
                    onChange={(e) => handleInputChange('domesticRevenue0', e.target.value)}
                    className="flex-1"
                  />
                ) : (
                  <div className="flex-1 p-2 border rounded-md bg-muted/50">
                    {formatCurrency(currentData.domesticRevenue0 || 0)}
                  </div>
                )}
              </div>
            </div>

            {/* Tax-free Revenue */}
            <div className="space-y-2">
              <Label htmlFor="tax-free">Steuerfreie Umsätze (Kennzahl 019)</Label>
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
              <span className="font-semibold">Gesamte Umsatzsteuer</span>
              <span className="text-lg font-bold">{formatCurrency(totalOutputVat)}</span>
            </div>
          </div>

          {/* Input Tax (Deductible) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Vorsteuer (abziehbar)</h3>

            <div className="space-y-2">
              <Label htmlFor="input-tax">Abziehbare Vorsteuer (Kennzahl 060)</Label>
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
              <span className="font-semibold">Gesamte Vorsteuer</span>
              <span className="text-lg font-bold">{formatCurrency(totalInputTax)}</span>
            </div>
          </div>

          {/* VAT Payable Summary */}
          <Separator className="my-6" />

          <div className={`p-4 rounded-lg ${vatPayable >= 0 ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">
                  {vatPayable >= 0 ? 'Zahllast' : 'Guthaben'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {vatPayable >= 0 ? 'Zu zahlender Betrag an das Finanzamt' : 'Zu erstattender Betrag'}
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
                Änderungen speichern
              </Button>
              <Button onClick={handleCancel} variant="outline" className="flex-1">
                Abbrechen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline" disabled={isLoading}>
          Zurück
        </Button>
        <Button onClick={onContinue} className="flex-1" disabled={isLoading || isEditing}>
          {isLoading ? 'Lädt...' : 'Weiter zur Übermittlung'}
        </Button>
      </div>
    </div>
  );
}
