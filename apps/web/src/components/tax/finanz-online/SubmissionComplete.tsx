'use client';

import { CheckCircle2, XCircle, Download, Home, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { finanzOnlineApi, type FinanzOnlineResult } from '@/lib/api/austrian-tax';
import { useState, useEffect } from 'react';

interface SubmissionCompleteProps {
  result: FinanzOnlineResult;
  onClose: () => void;
}

export function SubmissionComplete({ result, onClose }: SubmissionCompleteProps) {
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const orgId = user?.orgId || '';
  const [isDownloading, setIsDownloading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  // Poll submission status every 10 seconds for the first minute
  useEffect(() => {
    if (!result.success || !result.submissionId || !orgId) {
      setIsPolling(false);
      return;
    }

    let pollCount = 0;
    const maxPolls = 6; // Poll for 1 minute (6 * 10 seconds)

    const pollStatus = async () => {
      try {
        const status = await finanzOnlineApi.getUvaStatus(orgId, result.submissionId!);
        setSubmissionStatus(status.status);

        if (status.status === 'accepted' || status.status === 'rejected') {
          setIsPolling(false);
        }
      } catch (error) {
        console.error('Failed to poll submission status:', error);
      }
    };

    const interval = setInterval(() => {
      pollCount++;
      if (pollCount >= maxPolls) {
        setIsPolling(false);
        clearInterval(interval);
      } else {
        pollStatus();
      }
    }, 10000);

    // Initial poll
    pollStatus();

    return () => clearInterval(interval);
  }, [result.success, result.submissionId, orgId]);

  const handleDownloadReceipt = async () => {
    if (!result.submissionId) return;

    setIsDownloading(true);
    try {
      const blob = await finanzOnlineApi.downloadReceipt(result.submissionId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finanzonline-receipt-${result.referenceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Bestätigung heruntergeladen',
        description: 'Die Einreichungsbestätigung wurde erfolgreich heruntergeladen',
      });
    } catch (error) {
      toast({
        title: 'Download fehlgeschlagen',
        description: 'Die Bestätigung konnte nicht heruntergeladen werden',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            {result.success ? (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </>
            ) : (
              <>
                <XCircle className="h-12 w-12 text-red-500" />
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success/Error Message */}
          <div className="text-center">
            {result.success ? (
              <>
                <Badge className="bg-green-500 mb-4">Erfolgreich übermittelt</Badge>
                <h3 className="text-2xl font-bold mb-2">UVA erfolgreich übermittelt</h3>
                <p className="text-muted-foreground">
                  Ihre Umsatzsteuervoranmeldung wurde erfolgreich an FinanzOnline übermittelt.
                </p>
              </>
            ) : (
              <>
                <Badge variant="destructive" className="mb-4">Übermittlung fehlgeschlagen</Badge>
                <h3 className="text-2xl font-bold mb-2">Übermittlung fehlgeschlagen</h3>
                <p className="text-muted-foreground">
                  Bei der Übermittlung ist ein Fehler aufgetreten.
                </p>
              </>
            )}
          </div>

          {/* Reference Number */}
          {result.success && result.referenceNumber && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm font-medium text-green-900 mb-1">
                Referenznummer
              </div>
              <div className="text-lg font-mono font-bold text-green-700">
                {result.referenceNumber}
              </div>
              <div className="text-xs text-green-600 mt-1">
                Bitte bewahren Sie diese Nummer für Ihre Unterlagen auf
              </div>
            </div>
          )}

          {/* Submission Status */}
          {result.success && submissionStatus && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Bearbeitungsstatus</span>
                {isPolling && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              <Badge variant={
                submissionStatus === 'accepted' ? 'default' :
                submissionStatus === 'rejected' ? 'destructive' :
                'secondary'
              }>
                {submissionStatus === 'pending' && 'In Bearbeitung'}
                {submissionStatus === 'accepted' && 'Akzeptiert'}
                {submissionStatus === 'rejected' && 'Abgelehnt'}
              </Badge>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Übermittlungszeitpunkt</span>
            <span className="font-medium">
              {new Date(result.timestamp).toLocaleString('de-AT', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </span>
          </div>

          {/* Errors */}
          {result.errors && result.errors.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Fehler bei der Übermittlung</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {result.errors.map((error, index) => (
                    <li key={index} className="text-sm">
                      <strong>{error.code}:</strong> {error.message}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Info */}
          {result.success && (
            <Alert>
              <AlertTitle>Nächste Schritte</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                  <li>Sie erhalten eine Bestätigung per E-Mail von FinanzOnline</li>
                  <li>Die Zahllast wird automatisch vom Finanzamt verbucht</li>
                  <li>Bei Zahllast: Überweisen Sie den Betrag bis zum Fälligkeitsdatum</li>
                  <li>Bei Guthaben: Die Erstattung erfolgt automatisch</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        {result.success && result.submissionId && (
          <Button
            onClick={handleDownloadReceipt}
            variant="outline"
            disabled={isDownloading}
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? 'Wird heruntergeladen...' : 'Bestätigung herunterladen'}
          </Button>
        )}
        <Button onClick={onClose} className="flex-1">
          <Home className="h-4 w-4 mr-2" />
          {result.success ? 'Abschließen' : 'Zurück zum Start'}
        </Button>
      </div>

      {/* Support Info */}
      {!result.success && (
        <div className="text-center text-sm text-muted-foreground">
          <p>Benötigen Sie Hilfe?</p>
          <p className="mt-1">
            Kontaktieren Sie den Support oder versuchen Sie es später erneut
          </p>
        </div>
      )}
    </div>
  );
}
