'use client';

import { Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { UvaPreview } from '@/lib/api/austrian-tax';

interface DataReviewProps {
  preview: UvaPreview;
  onContinue: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function DataReview({ preview, onContinue, onBack, isLoading }: DataReviewProps) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const { kennzahlen, details, netVat } = preview;

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
                Überprüfen Sie die berechneten Umsatzsteuerbeträge für {preview.periodLabel}
              </CardDescription>
            </div>
            <Badge variant="secondary">Automatisch berechnet</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Output VAT (Tax Revenue) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Umsatzsteuer (zu zahlen)</h3>

            {/* 20% Revenue */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="font-medium">Inländische Umsätze @ 20%</div>
                <div className="text-sm text-muted-foreground">Kennzahl 022</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCurrency(kennzahlen.kz022)}</div>
                <div className="text-sm text-muted-foreground">
                  USt: {formatCurrency(kennzahlen.kz022 * 0.20)}
                </div>
              </div>
            </div>

            {/* 13% Revenue */}
            {kennzahlen.kz006 > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">Inländische Umsätze @ 13%</div>
                  <div className="text-sm text-muted-foreground">Kennzahl 006</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(kennzahlen.kz006)}</div>
                  <div className="text-sm text-muted-foreground">
                    USt: {formatCurrency(kennzahlen.kz006 * 0.13)}
                  </div>
                </div>
              </div>
            )}

            {/* 10% Revenue */}
            {kennzahlen.kz029 > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">Inländische Umsätze @ 10%</div>
                  <div className="text-sm text-muted-foreground">Kennzahl 029</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(kennzahlen.kz029)}</div>
                  <div className="text-sm text-muted-foreground">
                    USt: {formatCurrency(kennzahlen.kz029 * 0.10)}
                  </div>
                </div>
              </div>
            )}

            {/* Total Revenue */}
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div>
                <div className="font-semibold">Gesamtbetrag der Bemessungsgrundlagen</div>
                <div className="text-sm text-muted-foreground">Kennzahl 000</div>
              </div>
              <div className="text-lg font-bold">{formatCurrency(kennzahlen.kz000)}</div>
            </div>
          </div>

          <Separator />

          {/* Input Tax (Deductible) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Vorsteuer (abziehbar)</h3>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="font-medium">Abziehbare Vorsteuer</div>
                <div className="text-sm text-muted-foreground">Kennzahl 072</div>
              </div>
              <div className="font-semibold">{formatCurrency(kennzahlen.kz072)}</div>
            </div>
          </div>

          <Separator />

          {/* VAT Payable Summary */}
          <div className={`p-4 rounded-lg ${netVat >= 0 ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">
                  {netVat >= 0 ? 'Zahllast' : 'Guthaben'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Kennzahl 083 - {netVat >= 0 ? 'Zu zahlender Betrag' : 'Zu erstattender Betrag'}
                </div>
              </div>
              <div className={`text-2xl font-bold ${netVat >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(netVat))}
              </div>
            </div>
          </div>

          {/* Due Date */}
          {preview.dueDate && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-900">
                Fälligkeitsdatum: {new Date(preview.dueDate).toLocaleDateString('de-AT')}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline" disabled={isLoading}>
          Zurück
        </Button>
        <Button onClick={onContinue} className="flex-1" disabled={isLoading}>
          {isLoading ? 'Lädt...' : 'Weiter zur UID-Prüfung'}
        </Button>
      </div>
    </div>
  );
}
