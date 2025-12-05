'use client';

import { CheckCircle2, XCircle, Clock, AlertCircle, Download } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UVASubmissionResult, UVAFilingStatus } from '../hooks/useUVA';

interface UVAStatusTrackerProps {
  result: UVASubmissionResult;
  onCheckStatus: (id: string) => Promise<void>;
  onDownloadReceipt?: (id: string) => void;
  onClose: () => void;
  isChecking?: boolean;
}

export function UVAStatusTracker({
  result,
  onCheckStatus,
  onDownloadReceipt,
  onClose,
  isChecking
}: UVAStatusTrackerProps) {
  // Auto-refresh status every 10 seconds if pending
  useEffect(() => {
    if (result.status === UVAFilingStatus.PENDING) {
      const interval = setInterval(() => {
        onCheckStatus(result.id);
      }, 10000);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [result.status, result.id, onCheckStatus]);

  const getStatusIcon = () => {
    switch (result.status) {
      case UVAFilingStatus.ACCEPTED:
        return <CheckCircle2 className="h-12 w-12 text-green-500" />;
      case UVAFilingStatus.REJECTED:
      case UVAFilingStatus.ERROR:
        return <XCircle className="h-12 w-12 text-red-500" />;
      case UVAFilingStatus.PENDING:
      case UVAFilingStatus.SUBMITTED:
        return <Clock className="h-12 w-12 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-12 w-12 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (result.status) {
      case UVAFilingStatus.ACCEPTED:
        return <Badge className="bg-green-500">Akzeptiert</Badge>;
      case UVAFilingStatus.REJECTED:
        return <Badge variant="destructive">Abgelehnt</Badge>;
      case UVAFilingStatus.ERROR:
        return <Badge variant="destructive">Fehler</Badge>;
      case UVAFilingStatus.PENDING:
        return <Badge variant="outline">Ausstehend</Badge>;
      case UVAFilingStatus.SUBMITTED:
        return <Badge variant="secondary">Übermittelt</Badge>;
      default:
        return <Badge variant="outline">Unbekannt</Badge>;
    }
  };

  const getStatusMessage = () => {
    switch (result.status) {
      case UVAFilingStatus.ACCEPTED:
        return {
          title: 'UVA erfolgreich übermittelt',
          description: 'Ihre Umsatzsteuervoranmeldung wurde vom Finanzamt akzeptiert.',
        };
      case UVAFilingStatus.REJECTED:
        return {
          title: 'UVA abgelehnt',
          description: 'Ihre Umsatzsteuervoranmeldung wurde vom Finanzamt abgelehnt. Bitte überprüfen Sie die Fehlermeldungen.',
        };
      case UVAFilingStatus.ERROR:
        return {
          title: 'Übermittlungsfehler',
          description: 'Bei der Übermittlung ist ein Fehler aufgetreten.',
        };
      case UVAFilingStatus.PENDING:
        return {
          title: 'Verarbeitung läuft',
          description: 'Ihre UVA wird vom Finanzamt verarbeitet. Bitte warten Sie.',
        };
      case UVAFilingStatus.SUBMITTED:
        return {
          title: 'UVA übermittelt',
          description: 'Ihre UVA wurde übermittelt und wartet auf Bestätigung.',
        };
      default:
        return {
          title: 'Status unbekannt',
          description: 'Der Status Ihrer Meldung konnte nicht ermittelt werden.',
        };
    }
  };

  const getProgress = () => {
    switch (result.status) {
      case UVAFilingStatus.SUBMITTED:
        return 33;
      case UVAFilingStatus.PENDING:
        return 66;
      case UVAFilingStatus.ACCEPTED:
        return 100;
      case UVAFilingStatus.REJECTED:
      case UVAFilingStatus.ERROR:
        return 100;
      default:
        return 0;
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Status der Übermittlung
          </CardTitle>
          <CardDescription>
            Verfolgen Sie den Status Ihrer UVA-Übermittlung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Icon and Badge */}
          <div className="flex flex-col items-center gap-4">
            {getStatusIcon()}
            {getStatusBadge()}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={getProgress()} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Übermittelt</span>
              <span>Verarbeitung</span>
              <span>Abgeschlossen</span>
            </div>
          </div>

          {/* Status Message */}
          <Alert>
            <AlertTitle>{statusMessage.title}</AlertTitle>
            <AlertDescription>{statusMessage.description}</AlertDescription>
          </Alert>

          {/* Reference Number */}
          {result.referenceNumber && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">Referenznummer</div>
              <div className="text-xs text-muted-foreground mt-1 font-mono">
                {result.referenceNumber}
              </div>
            </div>
          )}

          {/* Errors */}
          {result.errors && result.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fehler</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warnungen</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {result.warnings.map((warning, index) => (
                    <li key={index} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Submission Details */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Übermittlungs-ID:</div>
              <div className="font-mono text-xs">{result.id}</div>
              <div className="text-muted-foreground">Status:</div>
              <div>{result.status}</div>
              <div className="text-muted-foreground">Erfolg:</div>
              <div>{result.success ? 'Ja' : 'Nein'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        {(result.status === UVAFilingStatus.PENDING || result.status === UVAFilingStatus.SUBMITTED) && (
          <Button
            onClick={() => onCheckStatus(result.id)}
            variant="outline"
            disabled={isChecking}
          >
            {isChecking ? 'Prüfe...' : 'Status aktualisieren'}
          </Button>
        )}

        {result.status === UVAFilingStatus.ACCEPTED && onDownloadReceipt && (
          <Button
            onClick={() => onDownloadReceipt(result.id)}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Bestätigung herunterladen
          </Button>
        )}

        <Button onClick={onClose} className="flex-1">
          {result.status === UVAFilingStatus.ACCEPTED ? 'Abschließen' : 'Schließen'}
        </Button>
      </div>

      {/* Auto-refresh indicator */}
      {(result.status === UVAFilingStatus.PENDING || result.status === UVAFilingStatus.SUBMITTED) && (
        <div className="text-center text-xs text-muted-foreground">
          Status wird automatisch alle 10 Sekunden aktualisiert
        </div>
      )}
    </div>
  );
}
