'use client';

import { FileText, Info } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { UStVAData } from '@/hooks/use-tax-filing';

interface AdditionalDataFormProps {
  data: Partial<UStVAData>;
  onUpdate: (data: Partial<UStVAData>) => void;
  onContinue: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function AdditionalDataForm({
  data,
  onUpdate,
  onContinue,
  onBack,
  isLoading
}: AdditionalDataFormProps) {
  const [formData, setFormData] = useState<Partial<UStVAData>>({
    euDeliveries: data.euDeliveries || 0,
    euAcquisitions19: data.euAcquisitions19 || 0,
    euAcquisitions7: data.euAcquisitions7 || 0,
    reverseChargeRevenue: data.reverseChargeRevenue || 0,
    importVat: data.importVat || 0,
    euAcquisitionsInputTax: data.euAcquisitionsInputTax || 0,
  });

  const formatNumber = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const handleInputChange = (field: keyof UStVAData, value: string) => {
    const numValue = parseFloat(value) * 100 || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleContinue = () => {
    onUpdate(formData);
    onContinue();
  };

  const hasEUTransactions =
    (formData.euDeliveries || 0) > 0 ||
    (formData.euAcquisitions19 || 0) > 0 ||
    (formData.euAcquisitions7 || 0) > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Additional VAT Data
          </CardTitle>
          <CardDescription>
            Enter additional information for special cases and EU transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* EU Deliveries */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base">EU Transactions</h3>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                EU deliveries and acquisitions require separate reporting via ZM (Zusammenfassende Meldung).
                This data will also be used for your ZM filing.
              </AlertDescription>
            </Alert>

            {/* EU Deliveries */}
            <div className="space-y-2">
              <Label htmlFor="eu-deliveries">
                EU Deliveries (Tax-free) - Kennzahl 41
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="eu-deliveries"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formatNumber(formData.euDeliveries || 0)}
                  onChange={(e) => handleInputChange('euDeliveries', e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground min-w-[60px]">EUR</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tax-free deliveries to other EU countries
              </p>
            </div>

            {/* EU Acquisitions 19% */}
            <div className="space-y-2">
              <Label htmlFor="eu-acquisitions-19">
                EU Acquisitions @ 19% - Kennzahl 89
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="eu-acquisitions-19"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formatNumber(formData.euAcquisitions19 || 0)}
                  onChange={(e) => handleInputChange('euAcquisitions19', e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground min-w-[60px]">EUR</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Goods/services acquired from other EU countries (19% rate)
              </p>
            </div>

            {/* EU Acquisitions 7% */}
            <div className="space-y-2">
              <Label htmlFor="eu-acquisitions-7">
                EU Acquisitions @ 7% - Kennzahl 93
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="eu-acquisitions-7"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formatNumber(formData.euAcquisitions7 || 0)}
                  onChange={(e) => handleInputChange('euAcquisitions7', e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground min-w-[60px]">EUR</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Goods/services acquired from other EU countries (7% rate)
              </p>
            </div>

            {/* EU Acquisitions Input Tax */}
            <div className="space-y-2">
              <Label htmlFor="eu-input-tax">
                Input Tax from EU Acquisitions - Kennzahl 61
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="eu-input-tax"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formatNumber(formData.euAcquisitionsInputTax || 0)}
                  onChange={(e) => handleInputChange('euAcquisitionsInputTax', e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground min-w-[60px]">EUR</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Deductible input tax from EU acquisitions
              </p>
            </div>

            {hasEUTransactions && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-900">
                  You have EU transactions. Remember to file your ZM (Zusammenfassende Meldung) separately.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* Reverse Charge */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Reverse Charge (§13b UStG)</h3>

            <div className="space-y-2">
              <Label htmlFor="reverse-charge">
                Reverse Charge Revenue - Kennzahl 60
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="reverse-charge"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formatNumber(formData.reverseChargeRevenue || 0)}
                  onChange={(e) => handleInputChange('reverseChargeRevenue', e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground min-w-[60px]">EUR</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Services subject to reverse charge (e.g., construction services, scrap metal)
              </p>
            </div>
          </div>

          <Separator />

          {/* Import VAT */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Import VAT</h3>

            <div className="space-y-2">
              <Label htmlFor="import-vat">
                Import VAT - Kennzahl 62
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="import-vat"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formatNumber(formData.importVat || 0)}
                  onChange={(e) => handleInputChange('importVat', e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground min-w-[60px]">EUR</span>
              </div>
              <p className="text-xs text-muted-foreground">
                VAT paid on imports from non-EU countries
              </p>
            </div>
          </div>

          {/* Info Box */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              All amounts should be entered in EUR. Leave fields at 0.00 if not applicable.
              You can skip this step if you don't have any special transactions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline" disabled={isLoading}>
          Back
        </Button>
        <Button onClick={handleContinue} className="flex-1" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Continue to Summary'}
        </Button>
      </div>
    </div>
  );
}
