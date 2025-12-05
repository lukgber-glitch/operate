'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface VerificationPromptProps {
  onStartVerification?: () => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export function VerificationPrompt({
  onStartVerification,
  className,
  variant = 'default',
}: VerificationPromptProps) {
  if (variant === 'compact') {
    return (
      <Card className={cn('border-primary/20 bg-primary/5', className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold">Verify Your Identity</h4>
              <p className="text-xs text-muted-foreground">
                Complete KYC to unlock all features
              </p>
            </div>
            {onStartVerification ? (
              <Button onClick={onStartVerification} size="sm">
                Start
              </Button>
            ) : (
              <Link href="/settings/verification/start">
                <Button size="sm">Start</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10', className)}>
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-semibold mb-2">
              Verify Your Identity
            </h3>
            <p className="text-muted-foreground mb-4">
              Complete KYC verification to unlock all platform features, increase your
              transaction limits, and ensure the security of your account.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2 justify-center md:justify-start">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Access to all features
              </li>
              <li className="flex items-center gap-2 justify-center md:justify-start">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Higher transaction limits
              </li>
              <li className="flex items-center gap-2 justify-center md:justify-start">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Enhanced account security
              </li>
            </ul>
          </div>

          {/* Action */}
          <div className="flex flex-col gap-2">
            {onStartVerification ? (
              <Button onClick={onStartVerification} size="lg" className="gap-2">
                Start Verification
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Link href="/settings/verification/start">
                <Button size="lg" className="gap-2">
                  Start Verification
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Takes 5-10 minutes
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
