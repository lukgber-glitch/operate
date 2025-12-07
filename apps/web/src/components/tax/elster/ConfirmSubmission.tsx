/**
 * ELSTER Confirm Submission Component
 * Final confirmation before submitting VAT return to ELSTER
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle2, FileText, Send } from 'lucide-react';
import type { VatReturnPreview, ValidationResult } from '@/types/tax';

interface ConfirmSubmissionProps {
  preview: VatReturnPreview;
  period: string;
  onSubmit: () => void;
  onBack: () => void;
  validationResult?: ValidationResult | null;
  isLoading?: boolean;
  isValidating?: boolean;
}

export function ConfirmSubmission({
  preview,
  period,
  onSubmit,
  onBack,
  validationResult,
  isLoading = false,
  isValidating = false,
}: ConfirmSubmissionProps) {
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [confirmLegalImplications, setConfirmLegalImplications] = useState(false);
  const [confirmIrrevocable, setConfirmIrrevocable] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const canSubmit = confirmAccuracy && confirmLegalImplications && confirmIrrevocable && !isLoading && !isValidating;

  const hasErrors = validationResult ? !validationResult.valid : false;
  const hasWarnings = validationResult ? validationResult.warnings.length > 0 : false;

  return (
    <div className="space-y-6">
      {/* Validation Results */}
      {hasErrors && validationResult && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Validierung fehlgeschlagen</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {validationResult.errors.map((error, idx) => (
                <li key={idx}>
                  <strong>{error.field}:</strong> {error.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {hasWarnings && !hasErrors && validationResult && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warnungen</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {validationResult.warnings.map((warning, idx) => (
                <li key={idx}>
                  <strong>{warning.field}:</strong> {warning.message}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm">Sie können trotzdem fortfahren.</p>
          </AlertDescription>
        </Alert>
      )}

      {!hasErrors && !hasWarnings && validationResult && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Validierung erfolgreich</AlertTitle>
          <AlertDescription className="text-green-700">
            Alle Daten wurden erfolgreich validiert. Sie können jetzt übermitteln.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Übersicht der Übermittlung
          </CardTitle>
          <CardDescription>
            Bitte überprüfen Sie die Angaben vor der Übermittlung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Zeitraum</span>
              <span className="font-medium">{preview.periodLabel}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Umsatzsteuer</span>
              <span className="font-medium">{formatCurrency(preview.outputVat.total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Vorsteuer</span>
              <span className="font-medium text-green-600">-{formatCurrency(preview.inputVat.total)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center pt-2">
              <span className="font-semibold">Zahllast / Erstattung</span>
              <span className={`text-xl font-bold ${preview.netVat >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {preview.netVat >= 0 ? '' : '+'}{formatCurrency(Math.abs(preview.netVat))}
              </span>
            </div>
            {preview.netVat >= 0 ? (
              <p className="text-xs text-muted-foreground">
                Dieser Betrag wird vom Finanzamt eingezogen.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Dieser Betrag wird vom Finanzamt erstattet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legal Confirmations */}
      <Card>
        <CardHeader>
          <CardTitle>Rechtliche Hinweise</CardTitle>
          <CardDescription>
            Bitte bestätigen Sie die folgenden Punkte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Accuracy Confirmation */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="confirm-accuracy"
              checked={confirmAccuracy}
              onCheckedChange={(checked) => setConfirmAccuracy(checked as boolean)}
            />
            <div className="space-y-1">
              <Label
                htmlFor="confirm-accuracy"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Richtigkeit der Angaben
              </Label>
              <p className="text-sm text-muted-foreground">
                Ich versichere, dass alle Angaben nach bestem Wissen und Gewissen gemacht wurden und der Wahrheit entsprechen.
              </p>
            </div>
          </div>

          <Separator />

          {/* Legal Implications */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="confirm-legal"
              checked={confirmLegalImplications}
              onCheckedChange={(checked) => setConfirmLegalImplications(checked as boolean)}
            />
            <div className="space-y-1">
              <Label
                htmlFor="confirm-legal"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Rechtliche Folgen
              </Label>
              <p className="text-sm text-muted-foreground">
                Mir sind die rechtlichen Folgen falscher oder unvollständiger Angaben bekannt.
                Falsche Angaben können strafrechtliche Konsequenzen haben.
              </p>
            </div>
          </div>

          <Separator />

          {/* Irrevocability */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="confirm-irrevocable"
              checked={confirmIrrevocable}
              onCheckedChange={(checked) => setConfirmIrrevocable(checked as boolean)}
            />
            <div className="space-y-1">
              <Label
                htmlFor="confirm-irrevocable"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Unwiderrufliche Übermittlung
              </Label>
              <p className="text-sm text-muted-foreground">
                Mir ist bewusst, dass die Übermittlung an ELSTER unwiderruflich ist.
                Nach der Übermittlung können keine Änderungen mehr vorgenommen werden.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning Alert */}
      <Alert variant="default" className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800">Wichtiger Hinweis</AlertTitle>
        <AlertDescription className="text-orange-700">
          Die Umsatzsteuervoranmeldung wird direkt an das Finanzamt über ELSTER übermittelt.
          Stellen Sie sicher, dass alle Daten korrekt sind, bevor Sie fortfahren.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} disabled={isLoading || isValidating}>
          Zurück
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!canSubmit || hasErrors}
          size="lg"
          className="min-w-[200px]"
        >
          {isLoading ? (
            'Wird übermittelt...'
          ) : isValidating ? (
            'Validierung läuft...'
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Jetzt übermitteln
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
