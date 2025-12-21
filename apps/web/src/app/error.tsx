'use client';

import { useEffect, useState } from 'react';
import { GlassCard, GlassCardContent, AnimatedButton } from '@/components/ui';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log the error for debugging
    console.error('[ErrorBoundary] Error caught:', error);
    console.error('[ErrorBoundary] Error message:', error.message);
    console.error('[ErrorBoundary] Error stack:', error.stack);
  }, [error]);

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
          <p className="text-blue-600/70 mb-4">
            An unexpected error occurred. Please try again.
          </p>

          {/* Error summary - always shown */}
          <p className="text-xs text-red-500/80 mb-4 font-mono px-4 py-2 bg-red-50 rounded-lg break-words">
            {error.message?.slice(0, 150) || 'Unknown error'}
          </p>

          {/* Toggle for full details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-500 hover:text-blue-700 mb-4 flex items-center gap-1 mx-auto"
          >
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showDetails ? 'Hide details' : 'Show details'}
          </button>

          {/* Full error details */}
          {showDetails && (
            <div className="text-left bg-gray-100 border border-gray-200 rounded-lg p-4 mb-6 max-h-48 overflow-auto">
              <p className="text-xs font-mono text-gray-700 break-all whitespace-pre-wrap">
                {error.stack || error.message || 'No stack trace available'}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-2">Digest: {error.digest}</p>
              )}
            </div>
          )}

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
