'use client';

import { Shield, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { UidVerificationResult } from '@/lib/api/austrian-tax';

interface UidVerificationProps {
  onVerify: (uid: string) => Promise<UidVerificationResult>;
  onBack: () => void;
  isLoading?: boolean;
}

export function UidVerification({ onVerify, onBack, isLoading }: UidVerificationProps) {
  const [uid, setUid] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<UidVerificationResult | null>(null);

  const isValidUidFormat = (uid: string) => {
    // Austrian UID format: ATU + 8 digits
    return /^ATU\d{8}$/.test(uid);
  };

  const handleVerify = async () => {
    if (!isValidUidFormat(uid)) {
      setVerificationResult({
        valid: false,
        uid,
        verifiedAt: new Date().toISOString(),
      });
      return;
    }

    setIsVerifying(true);
    try {
      const result = await onVerify(uid);
      setVerificationResult(result);
    } catch (error) {
      setVerificationResult({
        valid: false,
        uid,
        verifiedAt: new Date().toISOString(),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUidChange = (value: string) => {
    // Auto-format: convert to uppercase and ensure ATU prefix
    let formatted = value.toUpperCase();
    if (!formatted.startsWith('ATU') && formatted.length > 0) {
      formatted = 'ATU' + formatted;
    }
    setUid(formatted);
    setVerificationResult(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            UID-Nummer verifizieren
          </CardTitle>
          <CardDescription>
            Bitte geben Sie Ihre österreichische UID-Nummer ein
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uid">UID-Nummer</Label>
            <div className="flex gap-2">
              <Input
                id="uid"
                type="text"
                placeholder="ATU12345678"
                value={uid}
                onChange={(e) => handleUidChange(e.target.value)}
                maxLength={11}
                disabled={isVerifying}
                className="flex-1"
              />
              <Button
                onClick={handleVerify}
                disabled={!uid || isVerifying || isLoading}
              >
                {isVerifying ? 'Prüfe...' : 'Verifizieren'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Format: ATU + 8 Ziffern (z.B. ATU12345678)
            </p>
          </div>

          {/* Verification Result */}
          {verificationResult && (
            <Alert variant={verificationResult.valid ? 'default' : 'destructive'}>
              {verificationResult.valid ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>UID erfolgreich verifiziert</AlertTitle>
                  <AlertDescription>
                    {verificationResult.name && (
                      <div className="mt-2">
                        <div className="font-medium">{verificationResult.name}</div>
                        {verificationResult.address && (
                          <div className="text-sm mt-1">{verificationResult.address}</div>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>UID ungültig</AlertTitle>
                  <AlertDescription>
                    Die eingegebene UID konnte nicht verifiziert werden.
                    Bitte überprüfen Sie die Nummer und versuchen Sie es erneut.
                  </AlertDescription>
                </>
              )}
            </Alert>
          )}

          {/* Info about UID */}
          <Alert>
            <AlertDescription>
              <strong>Was ist eine UID?</strong>
              <p className="mt-1 text-sm">
                Die Umsatzsteuer-Identifikationsnummer (UID) ist eine eindeutige Kennnummer
                für Unternehmen im österreichischen Umsatzsteuerregister.
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline" disabled={isLoading || isVerifying}>
          Zurück
        </Button>
        <Button
          onClick={() => verificationResult?.valid && onVerify(uid)}
          className="flex-1"
          disabled={!verificationResult?.valid || isLoading || isVerifying}
        >
          Weiter zur Bestätigung
        </Button>
      </div>
    </div>
  );
}
