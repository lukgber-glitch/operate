'use client';

import { CheckCircle2, AlertTriangle, FileCheck, Info } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { UStVAData, ValidationResult, VATFilingPeriod } from '@/hooks/use-tax-filing';

interface VATSummaryProps {
  data: UStVAData;
  periodType: VATFilingPeriod;
  validationResult: ValidationResult | null;
  onValidate: () => void;
  onContinue: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function VATSummary({
  data,
  periodType,
  validationResult,
  onValidate,
  onContinue,
  onBack,
  isLoading
}: VATSummaryProps) {
  useEffect(() => {
    // Auto-validate when component mounts
    if (!validationResult) {
      onValidate();
    }
  }, [validationResult, onValidate]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const getPeriodLabel = () => {
    if (periodType === VATFilingPeriod.MONTHLY && data.period.month) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${monthNames[data.period.month - 1]} ${data.period.year}`;
    } else if (data.period.quarter) {
      return `Q${data.period.quarter} ${data.period.year}`;
    }
    return `${data.period.year}`;
  };

  // Calculate totals
  const outputVat19 = data.domesticRevenue19 * 0.19;
  const outputVat7 = data.domesticRevenue7 * 0.07;
  const euAcquisitionsVat19 = (data.euAcquisitions19 || 0) * 0.19;
  const euAcquisitionsVat7 = (data.euAcquisitions7 || 0) * 0.07;

  const totalOutputVat = outputVat19 + outputVat7 + euAcquisitionsVat19 + euAcquisitionsVat7;
  const totalInputTax = data.inputTax + (data.importVat || 0) + (data.euAcquisitionsInputTax || 0);
  const vatPayable = totalOutputVat - totalInputTax;

  const canContinue = validationResult?.isValid && validationResult.errors.length === 0;

  return (
    <div className="space-y-6">
      {/* Validation Status */}
      {validationResult && (
        <>
          {validationResult.isValid ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Validation Successful</AlertTitle>
              <AlertDescription className="text-green-800">
                Your VAT return data has been validated and is ready for submission.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Validation Failed</AlertTitle>
              <AlertDescription>
                Please correct the following errors before continuing:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {validationResult.warnings.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Info className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-900">Warnings</AlertTitle>
              <AlertDescription className="text-yellow-800">
                <ul className="list-disc list-inside space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index}>{warning.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            VAT Return Summary (UStVA)
          </CardTitle>
          <CardDescription>
            Review all data before submission
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Period Info */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Filing Period</div>
              <div className="text-lg font-semibold">{getPeriodLabel()}</div>
            </div>
            <Badge>{periodType}</Badge>
          </div>

          {/* Output VAT Section */}
          <div className="space-y-3">
            <h3 className="font-semibold">Output VAT (Umsatzsteuer)</h3>

            {data.domesticRevenue19 > 0 && (
              <div className="flex justify-between items-center p-2 border-l-2 border-primary pl-4">
                <div>
                  <div className="text-sm">Domestic Revenue @ 19%</div>
                  <div className="text-xs text-muted-foreground">Kennzahl 81</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{formatCurrency(data.domesticRevenue19)}</div>
                  <div className="text-xs text-muted-foreground">VAT: {formatCurrency(outputVat19)}</div>
                </div>
              </div>
            )}

            {data.domesticRevenue7 > 0 && (
              <div className="flex justify-between items-center p-2 border-l-2 border-primary pl-4">
                <div>
                  <div className="text-sm">Domestic Revenue @ 7%</div>
                  <div className="text-xs text-muted-foreground">Kennzahl 86</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{formatCurrency(data.domesticRevenue7)}</div>
                  <div className="text-xs text-muted-foreground">VAT: {formatCurrency(outputVat7)}</div>
                </div>
              </div>
            )}

            {data.taxFreeRevenue > 0 && (
              <div className="flex justify-between items-center p-2 border-l-2 border-secondary pl-4">
                <div>
                  <div className="text-sm">Tax-free Revenue</div>
                  <div className="text-xs text-muted-foreground">Kennzahl 48</div>
                </div>
                <div className="text-sm">{formatCurrency(data.taxFreeRevenue)}</div>
              </div>
            )}

            {(data.euDeliveries || 0) > 0 && (
              <div className="flex justify-between items-center p-2 border-l-2 border-secondary pl-4">
                <div>
                  <div className="text-sm">EU Deliveries (Tax-free)</div>
                  <div className="text-xs text-muted-foreground">Kennzahl 41</div>
                </div>
                <div className="text-sm">{formatCurrency(data.euDeliveries || 0)}</div>
              </div>
            )}

            {(data.euAcquisitions19 || 0) > 0 && (
              <div className="flex justify-between items-center p-2 border-l-2 border-primary pl-4">
                <div>
                  <div className="text-sm">EU Acquisitions @ 19%</div>
                  <div className="text-xs text-muted-foreground">Kennzahl 89</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{formatCurrency(data.euAcquisitions19 || 0)}</div>
                  <div className="text-xs text-muted-foreground">VAT: {formatCurrency(euAcquisitionsVat19)}</div>
                </div>
              </div>
            )}

            {(data.euAcquisitions7 || 0) > 0 && (
              <div className="flex justify-between items-center p-2 border-l-2 border-primary pl-4">
                <div>
                  <div className="text-sm">EU Acquisitions @ 7%</div>
                  <div className="text-xs text-muted-foreground">Kennzahl 93</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{formatCurrency(data.euAcquisitions7 || 0)}</div>
                  <div className="text-xs text-muted-foreground">VAT: {formatCurrency(euAcquisitionsVat7)}</div>
                </div>
              </div>
            )}

            {(data.reverseChargeRevenue || 0) > 0 && (
              <div className="flex justify-between items-center p-2 border-l-2 border-secondary pl-4">
                <div>
                  <div className="text-sm">Reverse Charge (§13b)</div>
                  <div className="text-xs text-muted-foreground">Kennzahl 60</div>
                </div>
                <div className="text-sm">{formatCurrency(data.reverseChargeRevenue || 0)}</div>
              </div>
            )}

            <Separator />

            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
              <span className="font-semibold">Total Output VAT</span>
              <span className="text-lg font-bold">{formatCurrency(totalOutputVat)}</span>
            </div>
          </div>

          {/* Input Tax Section */}
          <div className="space-y-3">
            <h3 className="font-semibold">Input Tax (Vorsteuer)</h3>

            {data.inputTax > 0 && (
              <div className="flex justify-between items-center p-2 border-l-2 border-green-500 pl-4">
                <div>
                  <div className="text-sm">Deductible Input Tax</div>
                  <div className="text-xs text-muted-foreground">Kennzahl 66</div>
                </div>
                <div className="text-sm">{formatCurrency(data.inputTax)}</div>
              </div>
            )}

            {(data.importVat || 0) > 0 && (
              <div className="flex justify-between items-center p-2 border-l-2 border-green-500 pl-4">
                <div>
                  <div className="text-sm">Import VAT</div>
                  <div className="text-xs text-muted-foreground">Kennzahl 62</div>
                </div>
                <div className="text-sm">{formatCurrency(data.importVat || 0)}</div>
              </div>
            )}

            {(data.euAcquisitionsInputTax || 0) > 0 && (
              <div className="flex justify-between items-center p-2 border-l-2 border-green-500 pl-4">
                <div>
                  <div className="text-sm">EU Acquisitions Input Tax</div>
                  <div className="text-xs text-muted-foreground">Kennzahl 61</div>
                </div>
                <div className="text-sm">{formatCurrency(data.euAcquisitionsInputTax || 0)}</div>
              </div>
            )}

            <Separator />

            <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg">
              <span className="font-semibold">Total Input Tax</span>
              <span className="text-lg font-bold text-green-700">{formatCurrency(totalInputTax)}</span>
            </div>
          </div>

          {/* Final Calculation */}
          <Separator className="my-4" />

          <div className={`p-4 rounded-lg ${vatPayable >= 0 ? 'bg-orange-50 border-2 border-orange-300' : 'bg-green-50 border-2 border-green-300'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold">
                  {vatPayable >= 0 ? 'VAT Payable' : 'VAT Refundable'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {vatPayable >= 0
                    ? 'Amount to be paid to tax office (Finanzamt)'
                    : 'Amount to be refunded by tax office (Finanzamt)'}
                </div>
              </div>
              <div className={`text-3xl font-bold ${vatPayable >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(vatPayable))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline" disabled={isLoading}>
          Back
        </Button>
        <Button
          onClick={onContinue}
          className="flex-1"
          disabled={isLoading || !canContinue}
        >
          {isLoading ? 'Loading...' : 'Continue to Submission'}
        </Button>
      </div>
    </div>
  );
}
