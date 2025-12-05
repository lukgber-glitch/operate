'use client';

import { useState } from 'react';
import { VATCalculation } from '@/hooks/useHMRC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, Edit2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VATBoxesGridProps {
  calculation: VATCalculation;
  editable?: boolean;
  onValuesChange?: (values: VATBoxValues) => void;
}

export interface VATBoxValues {
  box1: number; // VAT due on sales
  box2: number; // VAT due on acquisitions
  box3: number; // Total VAT due (box1 + box2)
  box4: number; // VAT reclaimed on purchases
  box5: number; // Net VAT (box3 - box4)
  box6: number; // Total sales ex VAT
  box7: number; // Total purchases ex VAT
  box8: number; // EC goods supplied ex VAT
  box9: number; // EC acquisitions ex VAT
}

const BOX_INFO = {
  1: {
    label: 'VAT due on sales and other outputs',
    description: 'VAT charged to customers on sales',
    calculated: true,
  },
  2: {
    label: 'VAT due on acquisitions from other EC Member States',
    description: 'VAT due on goods purchased from EU countries',
    calculated: false,
  },
  3: {
    label: 'Total VAT due',
    description: 'Sum of boxes 1 and 2',
    calculated: true,
  },
  4: {
    label: 'VAT reclaimed on purchases and other inputs',
    description: 'VAT paid on purchases that can be reclaimed',
    calculated: true,
  },
  5: {
    label: 'Net VAT to be paid or reclaimed',
    description: 'Difference between box 3 and box 4',
    calculated: true,
  },
  6: {
    label: 'Total value of sales and all other outputs excluding VAT',
    description: 'Total sales excluding VAT',
    calculated: true,
  },
  7: {
    label: 'Total value of purchases and all other inputs excluding VAT',
    description: 'Total purchases excluding VAT',
    calculated: true,
  },
  8: {
    label: 'Total value of EC goods supplied excluding VAT',
    description: 'Value of goods sold to EU countries',
    calculated: false,
  },
  9: {
    label: 'Total value of EC acquisitions excluding VAT',
    description: 'Value of goods purchased from EU countries',
    calculated: false,
  },
};

export function VATBoxesGrid({ calculation, editable = false, onValuesChange }: VATBoxesGridProps) {
  const [values, setValues] = useState<VATBoxValues>({
    box1: calculation.vatDueSales,
    box2: calculation.vatDueAcquisitions,
    box3: calculation.totalVatDue,
    box4: calculation.vatReclaimedCurrPeriod,
    box5: calculation.netVatDue,
    box6: calculation.totalValueSalesExVAT,
    box7: calculation.totalValuePurchasesExVAT,
    box8: calculation.totalValueGoodsSuppliedExVAT,
    box9: calculation.totalAcquisitionsExVAT,
  });

  const [isEditing, setIsEditing] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatWholeNumber = (amount: number) => {
    return Math.round(amount).toString();
  };

  const handleValueChange = (box: keyof VATBoxValues, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newValues = { ...values, [box]: numValue };

    // Auto-calculate dependent boxes
    newValues.box3 = newValues.box1 + newValues.box2;
    newValues.box5 = newValues.box3 - newValues.box4;

    setValues(newValues);
    if (onValuesChange) {
      onValuesChange(newValues);
    }
  };

  const isBoxEditable = (boxNum: number) => {
    return editable && isEditing && !BOX_INFO[boxNum as keyof typeof BOX_INFO].calculated;
  };

  const hasValidationErrors = () => {
    // Box 3 should equal Box 1 + Box 2
    if (Math.abs(values.box3 - (values.box1 + values.box2)) > 0.01) return true;
    // Box 5 should equal Box 3 - Box 4
    if (Math.abs(values.box5 - (values.box3 - values.box4)) > 0.01) return true;
    return false;
  };

  const renderBox = (boxNum: number) => {
    const boxKey = `box${boxNum}` as keyof VATBoxValues;
    const info = BOX_INFO[boxNum as keyof typeof BOX_INFO];
    const value = values[boxKey];
    const canEdit = isBoxEditable(boxNum);

    return (
      <Card key={boxNum} className={canEdit ? 'border-blue-500' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  Box {boxNum}
                </Badge>
                {info.calculated && (
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Auto
                  </Badge>
                )}
              </div>
              <CardTitle className="text-sm font-medium mt-2 leading-tight">
                {info.label}
              </CardTitle>
            </div>
          </div>
          <CardDescription className="text-xs">{info.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <div className="space-y-2">
              <Label htmlFor={`box-${boxNum}`}>Amount (GBP)</Label>
              <Input
                id={`box-${boxNum}`}
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => handleValueChange(boxKey, e.target.value)}
                className="text-lg font-semibold"
              />
            </div>
          ) : (
            <div>
              <p className={`text-2xl font-bold ${boxNum === 5 ? (value >= 0 ? 'text-red-600' : 'text-green-600') : ''}`}>
                {formatCurrency(value)}
              </p>
              {boxNum === 5 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {value >= 0 ? 'To pay HMRC' : 'HMRC owes you'}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {editable && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">VAT Return Boxes</h3>
            <p className="text-sm text-muted-foreground">
              Review and adjust the calculated values if needed
            </p>
          </div>
          <Button
            variant={isEditing ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Done Editing
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Values
              </>
            )}
          </Button>
        </div>
      )}

      {hasValidationErrors() && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The calculated totals don't match. Please check boxes 3 and 5.
          </AlertDescription>
        </Alert>
      )}

      {/* VAT Account - Boxes 1-5 */}
      <div>
        <h4 className="text-sm font-semibold mb-3 text-muted-foreground">VAT Account</h4>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map(renderBox)}
        </div>
      </div>

      {/* Additional Information - Boxes 6-9 */}
      <div>
        <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
          Additional Information (whole pounds only)
        </h4>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[6, 7, 8, 9].map(renderBox)}
        </div>
      </div>

      {/* Summary for Box 5 */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Net VAT Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total VAT due (Box 3):</span>
              <span className="font-semibold">{formatCurrency(values.box3)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">VAT reclaimed (Box 4):</span>
              <span className="font-semibold">{formatCurrency(values.box4)}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Net VAT (Box 5):</span>
              <span className={`text-xl font-bold ${values.box5 >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(values.box5))}
              </span>
            </div>
            <Alert className={values.box5 >= 0 ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : 'border-green-200 bg-green-50 dark:bg-green-950/20'}>
              <AlertDescription>
                {values.box5 >= 0 ? (
                  <>You will need to pay <strong>{formatCurrency(values.box5)}</strong> to HMRC</>
                ) : (
                  <>HMRC will refund <strong>{formatCurrency(Math.abs(values.box5))}</strong> to you</>
                )}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
