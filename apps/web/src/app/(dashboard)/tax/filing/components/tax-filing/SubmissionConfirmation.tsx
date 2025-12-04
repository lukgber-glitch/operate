'use client';

import { Send, Shield, CheckCircle2, XCircle, Loader2, FileCheck } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { CertificateInfo, SubmissionResult, ElsterFilingStatus } from '@/hooks/use-tax-filing';

interface SubmissionConfirmationProps {
  certificates: CertificateInfo[];
  onSubmit: (certificateId: string, testMode: boolean) => Promise<SubmissionResult>;
  onBack: () => void;
  onComplete: (result: SubmissionResult) => void;
  isLoading?: boolean;
}

export function SubmissionConfirmation({
  certificates,
  onSubmit,
  onBack,
  onComplete,
  isLoading
}: SubmissionConfirmationProps) {
  const [selectedCertificate, setSelectedCertificate] = useState<string>('');
  const [testMode, setTestMode] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  const validCertificates = certificates.filter(cert => cert.isValid);

  const handleSubmit = async () => {
    if (!selectedCertificate || !confirmed) return;

    setIsSubmitting(true);
    setProgress(10);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const submissionResult = await onSubmit(selectedCertificate, testMode);

      clearInterval(progressInterval);
      setProgress(100);
      setResult(submissionResult);

      // Call onComplete after a short delay
      setTimeout(() => {
        onComplete(submissionResult);
      }, 2000);
    } catch (error) {
      setIsSubmitting(false);
      setProgress(0);
    }
  };

  // Show result screen
  if (result) {
    return (
      <div className="space-y-6">
        {result.success ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-900 text-lg">Submission Successful!</AlertTitle>
            <AlertDescription className="text-green-800 space-y-2 mt-2">
              <p>Your VAT return has been successfully submitted to ELSTER.</p>
              {result.transferTicket && (
                <div className="mt-3 p-3 bg-white rounded border border-green-200">
                  <div className="text-sm font-medium text-gray-900">Transfer Ticket</div>
                  <div className="font-mono text-sm mt-1">{result.transferTicket}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Keep this reference number for your records
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <XCircle className="h-5 w-5" />
            <AlertTitle className="text-lg">Submission Failed</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              <p>There was an error submitting your VAT return:</p>
              {result.errors && result.errors.length > 0 && (
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {result.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        {result.warnings && result.warnings.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTitle className="text-yellow-900">Warnings</AlertTitle>
            <AlertDescription className="text-yellow-800">
              <ul className="list-disc list-inside space-y-1">
                {result.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Submission Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={result.success ? 'default' : 'destructive'}>
                {result.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-2">
              <span className="text-sm text-muted-foreground">Submission ID</span>
              <span className="font-mono text-sm">{result.id}</span>
            </div>
            {testMode && (
              <div className="flex justify-between items-center p-2">
                <span className="text-sm text-muted-foreground">Mode</span>
                <Badge variant="outline">Test Mode</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={() => window.location.href = '/tax'}
          className="w-full"
        >
          <FileCheck className="h-4 w-4 mr-2" />
          Back to Tax Overview
        </Button>
      </div>
    );
  }

  // Show submission form
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Submit to ELSTER
          </CardTitle>
          <CardDescription>
            Select your certificate and confirm submission to the German tax authorities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Certificate Selection */}
          <div className="space-y-2">
            <Label htmlFor="certificate">
              ELSTER Certificate <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedCertificate}
              onValueChange={setSelectedCertificate}
              disabled={isSubmitting}
            >
              <SelectTrigger id="certificate">
                <SelectValue placeholder="Select certificate" />
              </SelectTrigger>
              <SelectContent>
                {validCertificates.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No valid certificates available
                  </div>
                ) : (
                  validCertificates.map((cert) => (
                    <SelectItem key={cert.id} value={cert.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{cert.name}</span>
                        <span className="text-xs text-muted-foreground ml-4">
                          Valid until: {new Date(cert.validUntil).toLocaleDateString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {validCertificates.length === 0 && (
              <p className="text-sm text-destructive">
                No valid certificates found. Please upload a certificate in settings.
              </p>
            )}
          </div>

          {/* Test Mode */}
          <div className="flex items-center space-x-2 p-4 border rounded-lg">
            <Checkbox
              id="test-mode"
              checked={testMode}
              onCheckedChange={(checked) => setTestMode(checked as boolean)}
              disabled={isSubmitting}
            />
            <div className="flex-1">
              <Label
                htmlFor="test-mode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Test Mode
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Submit to ELSTER test environment (recommended for first-time use)
              </p>
            </div>
            <Badge variant="outline">Optional</Badge>
          </div>

          {/* Confirmation */}
          <div className="flex items-start space-x-2 p-4 border rounded-lg bg-muted/50">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
              disabled={isSubmitting}
            />
            <div className="flex-1">
              <Label
                htmlFor="confirm"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I confirm that all information is correct <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                By checking this box, you confirm that the VAT return data is accurate and complete.
                False declarations may result in penalties.
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Secure Submission</AlertTitle>
            <AlertDescription className="text-sm">
              Your data will be encrypted and transmitted securely to ELSTER using your selected certificate.
              This is a legally binding submission to the German tax authorities (Finanzamt).
            </AlertDescription>
          </Alert>

          {/* Submission Progress */}
          {isSubmitting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Submitting to ELSTER...</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline" disabled={isSubmitting}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1"
          disabled={!selectedCertificate || !confirmed || isSubmitting || validCertificates.length === 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit VAT Return
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
