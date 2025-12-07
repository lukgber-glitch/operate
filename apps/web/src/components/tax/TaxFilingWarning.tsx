'use client';

import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

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

interface TaxFilingWarningProps {
  isOpen: boolean;
  onCancel: () => void;
  onProceed: () => void;
}

export function TaxFilingWarning({
  isOpen,
  onCancel,
  onProceed
}: TaxFilingWarningProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleProceed = () => {
    if (!acknowledged) return;
    setAcknowledged(false); // Reset for next time
    onProceed();
  };

  const handleCancel = () => {
    setAcknowledged(false); // Reset for next time
    onCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-amber-100 dark:bg-amber-950 p-2">
              <AlertTriangle
                className="h-6 w-6 text-amber-600 dark:text-amber-500"
                aria-hidden="true"
              />
            </div>
            <DialogTitle className="text-xl">Important: Tax Filing Disclaimer</DialogTitle>
          </div>
          <DialogDescription className="text-base text-left space-y-3 pt-2">
            <p className="font-semibold text-foreground">
              This tool assists with tax filing but does not replace professional tax advice.
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside">
              <li>You are responsible for the accuracy of all submitted information</li>
              <li>Tax laws are complex and vary by jurisdiction</li>
              <li>We recommend consulting a qualified tax professional before filing</li>
              <li>Operate is not liable for errors, omissions, or tax consequences</li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        <div className="border-t pt-4">
          <div className="flex items-start space-x-3 bg-muted/50 p-4 rounded-lg">
            <Checkbox
              id="tax-acknowledgment"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
              aria-describedby="tax-acknowledgment-label"
              className="mt-1"
            />
            <label
              id="tax-acknowledgment-label"
              htmlFor="tax-acknowledgment"
              className="text-sm leading-relaxed cursor-pointer flex-1 font-medium"
            >
              I understand and accept full responsibility for the accuracy of my tax filing.
              I acknowledge this is an assistance tool and not professional tax advice.
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            aria-label="Cancel tax filing"
          >
            Cancel
          </Button>
          <Button
            onClick={handleProceed}
            disabled={!acknowledged}
            className="bg-[#06BF9D] hover:bg-[#05a889] text-white"
            aria-label="Proceed with tax filing"
          >
            I Understand, Proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
