'use client';

import { AlertTriangle, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import type { UvaPreview } from '@/lib/api/austrian-tax';

interface ConfirmSubmissionProps {
  preview: UvaPreview;
  uid: string;
  period: string;
  onSubmit: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function ConfirmSubmission({
  preview,
  uid,
  period,
  onSubmit,
  onBack,
  isLoading,
}: ConfirmSubmissionProps) {
  const [confirmed, setConfirmed] = useState(false);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const { netVat } = preview;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Übermittlung bestätigen</CardTitle>
          <CardDescription>
            Bitte überprüfen Sie alle Angaben vor der Übermittlung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Zeitraum</span>
              <span className="font-medium">{preview.periodLabel}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">UID-Nummer</span>
              <span className="font-medium font-mono">{uid}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Gesamtumsatz (KZ 000)</span>
              <span className="font-medium">{formatCurrency(preview.kennzahlen.kz000)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Vorsteuer (KZ 072)</span>
              <span className="font-medium">{formatCurrency(preview.kennzahlen.kz072)}</span>
            </div>
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
              netVat >= 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
            }`}>
              <div>
                <div className="font-semibold">
                  {netVat >= 0 ? 'Zahllast (KZ 083)' : 'Guthaben (KZ 083)'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {netVat >= 0 ? 'Zu zahlender Betrag' : 'Zu erstattender Betrag'}
                </div>
              </div>
              <div className={`text-xl font-bold ${
                netVat >= 0 ? 'text-orange-600' : 'text-green-600'
              }`}>
                {formatCurrency(Math.abs(netVat))}
              </div>
            </div>
          </div>

          {/* Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Wichtiger Hinweis</AlertTitle>
            <AlertDescription>
              Nach der Übermittlung kann die UVA nicht mehr geändert werden.
              Bei Fehlern müssen Sie eine Berichtigung beim Finanzamt einreichen.
            </AlertDescription>
          </Alert>

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-3 p-4 border rounded-lg">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
              disabled={isLoading}
            />
            <div className="flex-1">
              <Label
                htmlFor="confirm"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Ich bestätige, dass alle Angaben korrekt sind
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Die UVA wird elektronisch an FinanzOnline übermittelt und ist rechtsverbindlich.
              </p>
            </div>
          </div>

          {/* Due Date Reminder */}
          {preview.dueDate && (
            <Alert>
              <AlertDescription>
                <strong>Fälligkeitsdatum:</strong>{' '}
                {new Date(preview.dueDate).toLocaleDateString('de-AT', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline" disabled={isLoading}>
          Zurück
        </Button>
        <Button
          onClick={onSubmit}
          className="flex-1"
          disabled={!confirmed || isLoading}
        >
          {isLoading ? (
            'Übermittlung läuft...'
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Jetzt an FinanzOnline übermitteln
            </>
          )}
        </Button>
      </div>

      {/* Legal Notice */}
      <div className="text-center text-xs text-muted-foreground">
        <p>Powered by FinanzOnline 🇦🇹</p>
        <p className="mt-1">Sichere und verschlüsselte Datenübertragung</p>
      </div>
    </div>
  );
}
