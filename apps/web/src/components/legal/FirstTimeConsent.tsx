'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FirstTimeConsentProps {
  isOpen: boolean;
  onConsent: () => void;
}

export function FirstTimeConsent({ isOpen, onConsent }: FirstTimeConsentProps) {
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    aiDisclaimer: false,
  });

  const allConsented = consents.terms && consents.privacy && consents.aiDisclaimer;

  const handleConsent = async () => {
    if (!allConsented) return;

    try {
      // Store consent timestamp in user profile
      await fetch('/api/v1/user/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentedAt: new Date().toISOString(),
          consents: {
            terms: true,
            privacy: true,
            aiDisclaimer: true,
          },
        }),
      });

      onConsent();
    } catch (error) {
      console.error('Failed to save consent:', error);
      // Still proceed with consent locally
      onConsent();
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-[500px]"
        // Prevent closing without consent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to Operate</DialogTitle>
          <DialogDescription className="text-base">
            Before you get started, please review and accept our terms and policies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Terms of Service */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={consents.terms}
              onCheckedChange={(checked) =>
                setConsents((prev) => ({ ...prev, terms: checked as boolean }))
              }
              aria-describedby="terms-label"
            />
            <label
              id="terms-label"
              htmlFor="terms"
              className="text-sm leading-relaxed cursor-pointer flex-1"
            >
              I agree to the{' '}
              <a
                href="/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#06BF9D] hover:underline font-medium"
              >
                Terms of Service
              </a>
            </label>
          </div>

          {/* Privacy Policy */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="privacy"
              checked={consents.privacy}
              onCheckedChange={(checked) =>
                setConsents((prev) => ({ ...prev, privacy: checked as boolean }))
              }
              aria-describedby="privacy-label"
            />
            <label
              id="privacy-label"
              htmlFor="privacy"
              className="text-sm leading-relaxed cursor-pointer flex-1"
            >
              I agree to the{' '}
              <a
                href="/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#06BF9D] hover:underline font-medium"
              >
                Privacy Policy
              </a>
            </label>
          </div>

          {/* AI Disclaimer */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="ai-disclaimer"
              checked={consents.aiDisclaimer}
              onCheckedChange={(checked) =>
                setConsents((prev) => ({ ...prev, aiDisclaimer: checked as boolean }))
              }
              aria-describedby="ai-disclaimer-label"
            />
            <label
              id="ai-disclaimer-label"
              htmlFor="ai-disclaimer"
              className="text-sm leading-relaxed cursor-pointer flex-1"
            >
              I understand the AI provides informational suggestions only, not professional
              financial, tax, or legal advice
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleConsent}
            disabled={!allConsented}
            className="w-full sm:w-auto bg-[#06BF9D] hover:bg-[#05a889] text-white"
            aria-label="Accept terms and continue"
          >
            <Check className="mr-2 h-4 w-4" aria-hidden="true" />
            Accept and Continue
          </Button>
        </DialogFooter>

        <p className="text-xs text-center text-muted-foreground mt-4">
          By continuing, you agree to all the terms and policies above.
        </p>
      </DialogContent>
    </Dialog>
  );
}
