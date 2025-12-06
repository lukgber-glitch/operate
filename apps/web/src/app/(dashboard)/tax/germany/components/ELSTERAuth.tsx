'use client';

import { useState } from 'react';
import { Key, Shield, Upload } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ELSTERAuthProps {
  onAuthenticated: () => void;
}

export function ELSTERAuth({ onAuthenticated }: ELSTERAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'certificate' | 'software'>('certificate');

  const handleCertificateAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Simulate ELSTER authentication
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onAuthenticated();
    } catch (err) {
      setError('Authentication failed. Please check your certificate and PIN.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSoftwareAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Simulate software certificate authentication
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onAuthenticated();
    } catch (err) {
      setError('Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your connection to ELSTER is encrypted and secure. We never store your ELSTER credentials.
        </AlertDescription>
      </Alert>

      <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'certificate' | 'software')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="certificate">
            <Key className="w-4 h-4 mr-2" />
            Certificate (PFX)
          </TabsTrigger>
          <TabsTrigger value="software">
            <Upload className="w-4 h-4 mr-2" />
            Software Certificate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="certificate" className="mt-6">
          <form onSubmit={handleCertificateAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certificate">ELSTER Certificate File (.pfx)</Label>
              <Input
                id="certificate"
                type="file"
                accept=".pfx,.p12"
                required
              />
              <p className="text-xs text-muted-foreground">
                Upload your ELSTER certificate file (usually ends in .pfx or .p12)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">Certificate PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter your certificate PIN"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Authenticating...' : 'Connect to ELSTER'}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="software" className="mt-6">
          <form onSubmit={handleSoftwareAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taxNumber">Tax Number (Steuernummer)</Label>
              <Input
                id="taxNumber"
                type="text"
                placeholder="e.g., 123/456/78901"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="elsterId">ELSTER ID</Label>
              <Input
                id="elsterId"
                type="text"
                placeholder="Your ELSTER ID"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Authenticating...' : 'Connect to ELSTER'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          Don&apos;t have an ELSTER certificate?{' '}
          <a
            href="https://www.elster.de/eportal/registrierung-auswahl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Register at ELSTER
          </a>
        </p>
      </div>
    </div>
  );
}
