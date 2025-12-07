/**
 * ELSTER Submission Status Component
 * Shows submission status and allows downloading receipt
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import type { ElsterSubmissionResult, VatReturnStatus } from '@/types/tax';
import confetti from 'canvas-confetti';

interface SubmissionStatusProps {
  submissionResult: ElsterSubmissionResult;
  status?: VatReturnStatus | null;
  onDownloadReceipt?: () => Promise<void>;
  onRefreshStatus?: () => Promise<void>;
  onClose: () => void;
  isLoadingStatus?: boolean;
}

export function SubmissionStatus({
  submissionResult,
  status,
  onDownloadReceipt,
  onRefreshStatus,
  onClose,
  isLoadingStatus = false,
}: SubmissionStatusProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);

  // Trigger confetti on successful submission
  useEffect(() => {
    if (submissionResult.success && status?.status === 'accepted' && !hasShownConfetti) {
      // Celebrate with confetti!
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#22c55e', '#10b981', '#4ade80'],
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#22c55e', '#10b981', '#4ade80'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
      setHasShownConfetti(true);
    }
  }, [submissionResult.success, status?.status, hasShownConfetti]);

  const handleDownload = async () => {
    if (!onDownloadReceipt) return;
    setIsDownloading(true);
    try {
      await onDownloadReceipt();
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusIcon = () => {
    if (!status) {
      return submissionResult.success ? (
        <Clock className="h-12 w-12 text-blue-500" />
      ) : (
        <XCircle className="h-12 w-12 text-red-500" />
      );
    }

    switch (status.status) {
      case 'accepted':
        return <CheckCircle2 className="h-12 w-12 text-green-500" />;
      case 'rejected':
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
      case 'processing':
      case 'pending':
        return <Clock className="h-12 w-12 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="h-12 w-12 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (!status) {
      return submissionResult.success ? 'Übermittlung erfolgreich' : 'Übermittlung fehlgeschlagen';
    }

    switch (status.status) {
      case 'accepted':
        return 'Von ELSTER angenommen';
      case 'rejected':
        return 'Von ELSTER abgelehnt';
      case 'error':
        return 'Fehler bei der Verarbeitung';
      case 'processing':
        return 'Wird verarbeitet';
      case 'pending':
        return 'Wartet auf Verarbeitung';
      default:
        return 'Unbekannter Status';
    }
  };

  const getStatusVariant = (): 'default' | 'destructive' | 'outline' | 'secondary' => {
    if (!status) {
      return submissionResult.success ? 'default' : 'destructive';
    }

    switch (status.status) {
      case 'accepted':
        return 'default';
      case 'rejected':
      case 'error':
        return 'destructive';
      case 'processing':
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const isSuccess = submissionResult.success && status?.status === 'accepted';
  const isFailure = !submissionResult.success || status?.status === 'rejected' || status?.status === 'error';
  const isPending = !status || status.status === 'pending' || status.status === 'processing';

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-center text-2xl">
            {getStatusText()}
          </CardTitle>
          <CardDescription className="text-center">
            {submissionResult.transferTicket && (
              <>Transfer-Ticket: {submissionResult.transferTicket}</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge variant={getStatusVariant()} className="text-base px-4 py-1">
              {getStatusText()}
            </Badge>
          </div>

          {/* Progress Bar for Pending */}
          {isPending && (
            <div className="space-y-2">
              <Progress value={undefined} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Die Verarbeitung durch ELSTER kann einige Minuten dauern...
              </p>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">
                Umsatzsteuervoranmeldung erfolgreich übermittelt!
              </AlertTitle>
              <AlertDescription className="text-green-700">
                Ihre Umsatzsteuervoranmeldung wurde erfolgreich an das Finanzamt übermittelt.
                Sie können den Beleg jetzt herunterladen.
              </AlertDescription>
            </Alert>
          )}

          {/* Failure Message */}
          {isFailure && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Übermittlung fehlgeschlagen</AlertTitle>
              <AlertDescription>
                {submissionResult.errors && submissionResult.errors.length > 0 ? (
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {submissionResult.errors.map((error, idx) => (
                      <li key={idx}>
                        <strong>{error.code}:</strong> {error.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  'Ein unbekannter Fehler ist aufgetreten. Bitte kontaktieren Sie den Support.'
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Warnings */}
          {submissionResult.warnings && submissionResult.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warnungen</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {submissionResult.warnings.map((warning, idx) => (
                    <li key={idx}>
                      <strong>{warning.code}:</strong> {warning.message}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Details */}
          {status && (
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Übermittelt am:</span>
                <span className="font-medium">
                  {new Date(status.submittedAt).toLocaleString('de-DE')}
                </span>
              </div>
              {status.processedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Verarbeitet am:</span>
                  <span className="font-medium">
                    {new Date(status.processedAt).toLocaleString('de-DE')}
                  </span>
                </div>
              )}
              {status.transferTicket && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transfer-Ticket:</span>
                  <span className="font-mono text-xs">{status.transferTicket}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {/* Download Receipt */}
        {status?.receiptAvailable && onDownloadReceipt && (
          <Button
            variant="default"
            size="lg"
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? 'Wird heruntergeladen...' : 'Beleg herunterladen (PDF)'}
          </Button>
        )}

        {/* Refresh Status */}
        {isPending && onRefreshStatus && (
          <Button
            variant="outline"
            size="lg"
            onClick={onRefreshStatus}
            disabled={isLoadingStatus}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingStatus ? 'animate-spin' : ''}`} />
            Status aktualisieren
          </Button>
        )}

        {/* Close/Done Button */}
        <Button
          variant={isSuccess ? 'default' : 'outline'}
          size="lg"
          onClick={onClose}
          className="w-full"
        >
          {isSuccess ? 'Fertig' : 'Schließen'}
        </Button>
      </div>
    </div>
  );
}
