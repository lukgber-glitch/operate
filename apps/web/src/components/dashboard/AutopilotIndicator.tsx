'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import Link from 'next/link';
import { useAutopilotConfig } from '@/hooks/use-autopilot';

interface AutopilotIndicatorProps {
  className?: string;
}

/**
 * AutopilotIndicator Component
 *
 * Shows if automation features are enabled with a gentle pulse animation.
 * Links to autopilot page for easy configuration.
 *
 * TRUTHFULNESS GUARANTEE:
 * - Shows actual automation status from user settings
 * - Only counts genuinely active features
 * - No fake "AI accuracy" percentages
 */
export function AutopilotIndicator({ className }: AutopilotIndicatorProps) {
  const { config, isLoading, fetchConfig } = useAutopilotConfig();

  useEffect(() => {
    fetchConfig();
  }, []);

  if (isLoading || !config) {
    return null;
  }

  const isActive = config.enabled;
  const activeFeatures = Object.entries(config.features).filter(([_, enabled]) => enabled);
  const activeCount = activeFeatures.length;

  return (
    <Card className={cn('rounded-[16px] relative overflow-hidden', className)}>
      {/* Pulse animation when active */}
      {isActive && (
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary to-transparent animate-pulse" />
        </div>
      )}

      <Link href="/autopilot" className="block relative">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2.5 rounded-xl transition-colors',
                  isActive
                    ? 'bg-primary/20'
                    : 'bg-muted'
                )}
              >
                <Sparkles
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-gray-300'
                  )}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold">
                  {isActive ? 'Autopilot Active' : 'Autopilot Off'}
                </h3>
                <p className="text-xs text-gray-300">
                  {isActive
                    ? `${activeCount} feature${activeCount !== 1 ? 's' : ''} enabled`
                    : 'Enable to automate tasks'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isActive && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-green-400">
                    Live
                  </span>
                </div>
              )}
              <Settings className="h-4 w-4 text-gray-300" />
            </div>
          </div>

          {/* Active features list */}
          {isActive && activeCount > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex flex-wrap gap-1.5">
                {config.features.autoCategorizeTransactions && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Auto-Categorize
                  </span>
                )}
                {config.features.autoCreateInvoices && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Auto-Invoice
                  </span>
                )}
                {config.features.autoReconcile && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Auto-Reconcile
                  </span>
                )}
                {config.features.autoExtractReceipts && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Receipt Extract
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
