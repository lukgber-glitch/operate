'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Check, X, Zap, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface TrialEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

interface FeatureComparison {
  name: string;
  free: boolean | string;
  pro: boolean | string;
}

/**
 * Modal shown when trial expires
 * Compares Free vs Pro features with strong upgrade CTA
 */
export function TrialEndModal({
  isOpen,
  onClose,
  onUpgrade,
}: TrialEndModalProps) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      // Entrance animation
      gsap.fromTo(
        contentRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
      );
    }
  }, [isOpen]);

  const features: FeatureComparison[] = [
    { name: 'Monthly Invoices', free: '5', pro: '100' },
    { name: 'Bank Account Connections', free: '1', pro: 'Unlimited' },
    { name: 'AI Chat Assistant', free: false, pro: true },
    { name: 'Smart Invoice Extraction', free: false, pro: true },
    { name: 'Auto Transaction Classification', free: false, pro: true },
    { name: 'Advanced Reports & Analytics', free: false, pro: true },
    { name: 'Cash Flow Predictions', free: false, pro: true },
    { name: 'Recurring Invoices', free: false, pro: true },
    { name: 'Multi-Currency Support', free: false, pro: true },
    { name: 'API Access', free: false, pro: true },
  ];

  const handleUpgrade = () => {
    onClose();
    router.push('/settings?tab=billing');
    onUpgrade();
  };

  const handleContinueFree = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" ref={contentRef}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Your Pro Trial Has Ended
          </DialogTitle>
          <DialogDescription className="text-base">
            Thanks for trying Operate Pro! Here's what happens next:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Feature Comparison */}
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-[2fr,1fr,1fr] bg-gray-50 px-4 py-3 font-semibold dark:bg-gray-900">
              <div>Feature</div>
              <div className="text-center">Free</div>
              <div className="text-center text-[var(--color-primary)]">Pro</div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[2fr,1fr,1fr] items-center px-4 py-3 text-sm"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {feature.name}
                  </div>

                  {/* Free Tier */}
                  <div className="flex justify-center">
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 dark:text-gray-700" />
                      )
                    ) : (
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature.free}
                      </span>
                    )}
                  </div>

                  {/* Pro Tier */}
                  <div className="flex justify-center">
                    {typeof feature.pro === 'boolean' ? (
                      feature.pro ? (
                        <Check className="h-5 w-5 text-[var(--color-primary)]" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 dark:text-gray-700" />
                      )
                    ) : (
                      <span className="font-semibold text-[var(--color-primary)]">
                        {feature.pro}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Card */}
          <Card className="border-2 border-[var(--color-primary)] bg-gradient-to-br from-[var(--color-accent-light)] to-white p-6 dark:to-gray-900">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[var(--color-primary)]" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Upgrade to Pro
                  </h3>
                </div>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  Continue enjoying all the features you've been using
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    $29
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    /month
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              onClick={handleContinueFree}
              variant="ghost"
              className="order-2 sm:order-1"
            >
              Continue with Free
            </Button>

            <Button
              onClick={handleUpgrade}
              variant="primary"
              size="lg"
              className="group order-1 shadow-md transition-all hover:shadow-lg sm:order-2"
            >
              Upgrade to Pro
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Note */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-500">
            You can upgrade or downgrade at any time. No long-term commitment required.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
