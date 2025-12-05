'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EmailProviderButton, EmailProvider } from './EmailProviderButton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConnectEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (provider: EmailProvider) => Promise<void>;
  isConnectingGmail?: boolean;
  isConnectingOutlook?: boolean;
}

export function ConnectEmailDialog({
  open,
  onOpenChange,
  onConnect,
  isConnectingGmail = false,
  isConnectingOutlook = false,
}: ConnectEmailDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (provider: EmailProvider) => {
    setError(null);
    try {
      await onConnect(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect email account');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect Email Account</DialogTitle>
          <DialogDescription>
            Connect your email account to automatically process invoices and receipts from your inbox.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <EmailProviderButton
              provider="gmail"
              isConnecting={isConnectingGmail}
              onClick={() => handleConnect('gmail')}
              disabled={isConnectingOutlook}
              className="w-full"
              size="lg"
            />

            <EmailProviderButton
              provider="outlook"
              isConnecting={isConnectingOutlook}
              onClick={() => handleConnect('outlook')}
              disabled={isConnectingGmail}
              className="w-full"
              size="lg"
            />
          </div>

          <div className="rounded-lg border bg-muted p-4">
            <h4 className="mb-2 text-sm font-medium">What we access:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Read emails to identify invoices and receipts</li>
              <li>• Download attachments (PDFs, images)</li>
              <li>• No access to send emails or modify your inbox</li>
              <li>• You can disconnect at any time</li>
            </ul>
          </div>

          <div className="text-xs text-muted-foreground">
            By connecting your email, you agree to our{' '}
            <a href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </a>
            .
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isConnectingGmail || isConnectingOutlook}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
