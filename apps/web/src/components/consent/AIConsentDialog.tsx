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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Brain, Lock, ExternalLink, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

/**
 * AI Consent Dialog Component
 *
 * GDPR & App Store compliant consent dialog for AI data processing.
 *
 * Features:
 * - Clear explanation of AI usage
 * - Data processing transparency
 * - User rights information
 * - Privacy policy links
 * - Accept/Decline options
 * - Mobile-responsive
 * - Accessible (ARIA labels)
 *
 * Compliance:
 * - GDPR Article 7 (Conditions for consent)
 * - GDPR Article 13 (Information to be provided)
 * - Apple App Store Review Guidelines 5.1.2
 * - Google Play User Data Policy
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

  const handleDecline = () => {
    onDecline();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh]"
        aria-describedby="ai-consent-description"
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="p-3 rounded-lg"
              style={{ background: 'var(--color-accent-light)' }}
            >
              <Brain
                className="h-6 w-6"
                style={{ color: 'var(--color-primary)' }}
              />
            </div>
            <DialogTitle className="text-2xl">
              AI Assistant Data Processing
            </DialogTitle>
          </div>
          <DialogDescription id="ai-consent-description">
            Before using our AI-powered features, please review how we process
            your data
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-6">
            {/* What is AI Processing */}
            <section>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                What is AI Processing?
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Operate uses Claude AI by Anthropic to help you manage your
                business. Our AI assistant can:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                <li>Answer questions about your finances</li>
                <li>Analyze invoices and transactions</li>
                <li>Provide business insights and suggestions</li>
                <li>Help with tax filing and compliance</li>
                <li>Automate document processing</li>
              </ul>
            </section>

            {/* Data Processing */}
            <section>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                What Data Will Be Processed?
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                To provide AI assistance, we may process:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                <li>
                  <strong>Financial data:</strong> Invoices, transactions, bank
                  statements
                </li>
                <li>
                  <strong>Business data:</strong> Client information, vendor
                  details
                </li>
                <li>
                  <strong>Documents:</strong> Uploaded receipts, contracts, tax
                  forms
                </li>
                <li>
                  <strong>Conversations:</strong> Your chat messages with the AI
                  assistant
                </li>
                <li>
                  <strong>Usage data:</strong> Feature usage, preferences
                </li>
              </ul>
            </section>

            {/* Security */}
            <section>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                How Is Your Data Protected?
              </h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                <li>All data is encrypted in transit and at rest</li>
                <li>
                  AI processing is done by Anthropic (Claude), a trusted AI
                  provider
                </li>
                <li>
                  Your data is not used to train AI models without explicit
                  consent
                </li>
                <li>
                  You can request data deletion at any time via Settings
                </li>
                <li>We comply with GDPR, CCPA, and other privacy regulations</li>
              </ul>
            </section>

            {/* User Rights */}
            <section>
              <h3 className="font-semibold text-lg mb-3">Your Rights</h3>
              <p className="text-sm text-muted-foreground">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                <li>
                  <strong>Opt-out:</strong> Disable AI processing at any time
                  in Settings
                </li>
                <li>
                  <strong>Access:</strong> Request a copy of your AI-processed
                  data
                </li>
                <li>
                  <strong>Delete:</strong> Request deletion of your AI data
                </li>
                <li>
                  <strong>Revoke:</strong> Withdraw consent at any time
                </li>
              </ul>
            </section>

            {/* Third-Party Provider */}
            <section className="pt-2">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  AI processing is provided by{' '}
                  <a
                    href="https://www.anthropic.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    Anthropic
                  </a>
                  . Your data may be processed in accordance with their privacy
                  policy.
                </AlertDescription>
              </Alert>
            </section>

            {/* Privacy Policy Link */}
            <section className="pt-2 pb-4">
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Read our full Privacy Policy
                <ExternalLink className="h-3 w-3" />
              </a>
            </section>
          </div>
        </ScrollArea>

        <div className="space-y-4">
          {/* Acknowledgment Checkbox */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
            <Checkbox
              id="ai-consent-acknowledge"
              checked={hasRead}
              onCheckedChange={(checked) => setHasRead(checked as boolean)}
              aria-label="I have read and understood the AI data processing information"
            />
            <div className="flex-1">
              <Label
                htmlFor="ai-consent-acknowledge"
                className="text-sm font-medium cursor-pointer leading-relaxed"
              >
                I have read and understood how Operate processes my data using
                AI technology. I consent to AI processing of my business data
                as described above.
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={handleDecline}
              disabled={isLoading}
              aria-label="Decline AI processing and continue without AI features"
            >
              Decline
            </Button>
            <Button
              variant="primary"
              onClick={handleAccept}
              disabled={!hasRead || isLoading}
              aria-label="Accept AI processing and enable AI features"
            >
              {isLoading ? 'Processing...' : 'Accept & Continue'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
