'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Brain, Shield, Lock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

/**
 * AI Consent Dialog - Simplified and properly constrained
 */
export function AIConsentDialog({
  open,
  onOpenChange,
  onAccept,
  onDecline,
  isLoading = false,
}: AIConsentDialogProps) {
  const [hasRead, setHasRead] = useState(false);

  const handleAccept = () => {
    if (!hasRead) return;
    onAccept();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        aria-describedby="ai-consent-description"
      >
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>AI Assistant Data Processing</DialogTitle>
          </div>
          <DialogDescription id="ai-consent-description">
            Review how we process your data before using AI features
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content - shrinks to fit, scrolls if needed */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-4">
          <section>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Brain className="h-4 w-4" /> What AI Can Do
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
              <li>Answer questions about your finances</li>
              <li>Analyze invoices and transactions</li>
              <li>Provide business insights</li>
              <li>Help with tax filing</li>
            </ul>
          </section>

          <section>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" /> Data We Process
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
              <li>Financial data (invoices, transactions)</li>
              <li>Business data (clients, vendors)</li>
              <li>Documents you upload</li>
              <li>Your chat messages</li>
            </ul>
          </section>

          <section>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Lock className="h-4 w-4" /> Your Protection
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
              <li>Data encrypted in transit and at rest</li>
              <li>Not used to train AI models</li>
              <li>Delete your data anytime in Settings</li>
              <li>GDPR & CCPA compliant</li>
            </ul>
          </section>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              AI by{' '}
              <a href="https://anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                Anthropic
              </a>
              . You can opt-out anytime.
            </AlertDescription>
          </Alert>
        </div>

        {/* Fixed footer - never shrinks */}
        <div className="flex-shrink-0 pt-4 border-t space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            <Checkbox
              id="ai-consent-acknowledge"
              checked={hasRead}
              onCheckedChange={(checked) => setHasRead(checked as boolean)}
            />
            <Label htmlFor="ai-consent-acknowledge" className="text-sm cursor-pointer">
              I consent to AI processing of my business data as described above.
            </Label>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={onDecline} disabled={isLoading}>
              Decline
            </Button>
            <Button onClick={handleAccept} disabled={!hasRead || isLoading}>
              {isLoading ? 'Processing...' : 'Accept & Continue'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
