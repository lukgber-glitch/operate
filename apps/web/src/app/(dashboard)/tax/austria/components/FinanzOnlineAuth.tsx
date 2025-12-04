'use client';

import { Lock, AlertCircle, Info } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { FinanzOnlineCredentials, UVAData, UVASubmissionResult } from '../hooks/useUVA';

interface FinanzOnlineAuthProps {
  data: UVAData;
  onSubmit: (credentials: FinanzOnlineCredentials, testMode: boolean) => Promise<UVASubmissionResult>;
  onBack: () => void;
  onComplete: (result: UVASubmissionResult) => void;
  isLoading?: boolean;
}

export function FinanzOnlineAuth({
  data,
  onSubmit,
  onBack,
  onComplete,
  isLoading
}: FinanzOnlineAuthProps) {
  const [credentials, setCredentials] = useState<FinanzOnlineCredentials>({
    teilnehmerId: '',
    benutzerId: '',
    pin: '',
  });
  const [testMode, setTestMode] = useState(true);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = credentials.teilnehmerId && credentials.benutzerId && credentials.pin;

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await onSubmit(credentials, testMode);
      onComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Übermittlung fehlgeschlagen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  // Calculate VAT payable for display
  const outputVat20 = (data.domesticRevenue20 || 0) * 0.20;
  const outputVat13 = (data.domesticRevenue13 || 0) * 0.13;
  const outputVat10 = (data.domesticRevenue10 || 0) * 0.10;
  const totalOutputVat = outputVat20 + outputVat13 + outputVat10;
  const totalInputTax = data.inputTax || 0;
  const vatPayable = totalOutputVat - totalInputTax;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Zusammenfassung</CardTitle>
          <CardDescription>
            Überprüfen Sie die Zahllast vor der Übermittlung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Zeitraum</span>
              <span className="font-medium">
                {data.period.month ? `${data.period.month}/` : `Q${data.period.quarter}/`}{data.period.year}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">UID</span>
              <span className="font-medium">{data.uid || 'ATU12345678'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Umsatzsteuer</span>
              <span className="font-medium">{formatCurrency(totalOutputVat)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Vorsteuer</span>
              <span className="font-medium">{formatCurrency(totalInputTax)}</span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {vatPayable >= 0 ? 'Zahllast' : 'Guthaben'}
                </span>
                <span className={`text-lg font-bold ${vatPayable >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatCurrency(Math.abs(vatPayable))}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            FinanzOnline Zugangsdaten
          </CardTitle>
          <CardDescription>
            Geben Sie Ihre FinanzOnline Zugangsdaten ein, um die UVA zu übermitteln
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Sichere Übermittlung</AlertTitle>
            <AlertDescription>
              Ihre Zugangsdaten werden verschlüsselt übertragen und nicht gespeichert.
            </AlertDescription>
          </Alert>

          {/* Teilnehmer ID */}
          <div className="space-y-2">
            <Label htmlFor="teilnehmer-id">Teilnehmer-Identifikation</Label>
            <Input
              id="teilnehmer-id"
              type="text"
              placeholder="z.B. 123456789"
              value={credentials.teilnehmerId}
              onChange={(e) => setCredentials(prev => ({ ...prev, teilnehmerId: e.target.value }))}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Ihre FinanzOnline Teilnehmer-Identifikation
            </p>
          </div>

          {/* Benutzer ID */}
          <div className="space-y-2">
            <Label htmlFor="benutzer-id">Benutzer-Identifikation</Label>
            <Input
              id="benutzer-id"
              type="text"
              placeholder="z.B. user123"
              value={credentials.benutzerId}
              onChange={(e) => setCredentials(prev => ({ ...prev, benutzerId: e.target.value }))}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Ihre FinanzOnline Benutzer-Identifikation
            </p>
          </div>

          {/* PIN */}
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type={showPin ? 'text' : 'password'}
              placeholder="Ihre PIN"
              value={credentials.pin}
              onChange={(e) => setCredentials(prev => ({ ...prev, pin: e.target.value }))}
              disabled={isSubmitting}
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-pin"
                checked={showPin}
                onCheckedChange={(checked) => setShowPin(checked as boolean)}
              />
              <Label htmlFor="show-pin" className="text-xs text-muted-foreground cursor-pointer">
                PIN anzeigen
              </Label>
            </div>
          </div>

          {/* Test Mode */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Checkbox
              id="test-mode"
              checked={testMode}
              onCheckedChange={(checked) => setTestMode(checked as boolean)}
              disabled={isSubmitting}
            />
            <Label htmlFor="test-mode" className="text-sm cursor-pointer">
              Testmodus (empfohlen für erste Übermittlung)
            </Label>
          </div>

          {testMode && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Im Testmodus wird die UVA an die FinanzOnline Testumgebung gesendet.
                Die Meldung wird nicht beim Finanzamt eingereicht.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fehler</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline" disabled={isSubmitting}>
          Zurück
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1"
          disabled={!canSubmit || isSubmitting || isLoading}
        >
          {isSubmitting ? 'Übermittlung läuft...' : 'Jetzt übermitteln'}
        </Button>
      </div>

      {/* FinanzOnline Branding */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Powered by</span>
        <span className="font-semibold">FinanzOnline</span>
        <span className="text-lg">🇦🇹</span>
      </div>
    </div>
  );
}
