'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Subscription } from '@/hooks/use-subscription';

interface CancelSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

const CANCELLATION_REASONS = [
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'missing_features', label: 'Missing features I need' },
  { value: 'not_using', label: 'Not using it enough' },
  { value: 'switching', label: 'Switching to another service' },
  { value: 'temporary', label: 'Taking a temporary break' },
  { value: 'other', label: 'Other reason' },
];

export function CancelSubscriptionModal({
  open,
  onOpenChange,
  subscription,
  onConfirm,
  isLoading,
}: CancelSubscriptionModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      // Reset form
      setSelectedReason('');
      setFeedback('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!subscription) return null;

  const endDate = format(new Date(subscription.currentPeriodEnd), 'MMMM dd, yyyy');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle>Cancel Subscription</DialogTitle>
              <DialogDescription>
                We&apos;re sorry to see you go
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Information Box */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
              What happens when you cancel?
            </h4>
            <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
              <li className="flex items-start gap-2">
                <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>You&apos;ll keep access to all features until {endDate}</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>After {endDate}, you&apos;ll be downgraded to the Free plan</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Your data will be preserved, but some features will be limited</span>
              </li>
            </ul>
          </div>

          {/* Cancellation Reason */}
          <div className="space-y-3">
            <Label>Why are you cancelling? (Optional)</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {CANCELLATION_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="font-normal cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Additional feedback (Optional)</Label>
            <Textarea
              id="feedback"
              placeholder="Help us improve by sharing more details..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>

          {/* Alternative Offer */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Before you go...
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              Would you like to pause your subscription instead? You can resume anytime with all your data intact.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-300 dark:border-blue-700"
              onClick={() => onOpenChange(false)}
            >
              Maybe Later
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing || isLoading}
          >
            Keep Subscription
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleCancel}
            disabled={isProcessing || isLoading}
          >
            {isProcessing ? 'Cancelling...' : 'Cancel Subscription'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
