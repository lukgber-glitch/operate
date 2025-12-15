'use client';

import { GlassCard, GlassCardContent, AnimatedButton } from '@/components/ui';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center p-4">
      <GlassCard className="max-w-md w-full text-center">
        <GlassCardContent className="pt-8 pb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-blue-700 mb-2">
            Something went wrong!
          </h2>
          <p className="text-blue-600/70 mb-6">
            An unexpected error occurred. Please try again.
          </p>
          <AnimatedButton
            onClick={() => reset()}
            variant="primary"
            className="inline-flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try again
          </AnimatedButton>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
