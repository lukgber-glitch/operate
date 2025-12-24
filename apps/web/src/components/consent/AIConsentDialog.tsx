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
import { Brain, Shield, Lock } from 'lucide-react';

interface AIConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

/**
 * AI Consent Dialog - Compact version that always fits in viewport
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
        className="sm:max-w-md max-h-[500px]"
        aria-describedby="ai-consent-description"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <DialogTitle className="text-base">AI Data Processing</DialogTitle>
          </div>
          <DialogDescription id="ai-consent-description" className="text-xs">
            Review before using AI features
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content - fixed small height */}
        <div className="max-h-[180px] overflow-y-auto text-sm space-y-2">
          <div className="flex gap-2">
            <Brain className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">AI Can:</span> Answer questions, analyze invoices, provide insights
            </div>
          </div>
          <div className="flex gap-2">
            <Shield className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">Data Used:</span> Financial data, documents, chat messages
            </div>
          </div>
          <div className="flex gap-2">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">Protected:</span> Encrypted, not used for training, GDPR compliant
            </div>
          </div>
        </div>

        {/* Footer - always visible */}
        <div className="pt-3 border-t space-y-3">
          <div className="flex items-start gap-2 p-2 rounded bg-muted">
            <Checkbox
              id="ai-consent-acknowledge"
              checked={hasRead}
              onCheckedChange={(checked) => setHasRead(checked as boolean)}
            />
            <Label htmlFor="ai-consent-acknowledge" className="text-xs cursor-pointer leading-tight">
              I consent to AI processing of my data as described
            </Label>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={onDecline} disabled={isLoading}>
              Decline
            </Button>
            <Button size="sm" onClick={handleAccept} disabled={!hasRead || isLoading}>
              {isLoading ? 'Processing...' : 'Accept'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
