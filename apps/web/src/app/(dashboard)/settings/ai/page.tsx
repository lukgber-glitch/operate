'use client';

import { AISettings } from '@/components/settings/AISettings';
import { AnimatedCard } from '@/components/ui/animated-card';
import { HeadlineOutside } from '@/components/ui/headline-outside';

/**
 * AI Settings Page
 *
 * Provides user controls for AI consent and data processing.
 * Accessible from Settings > AI Processing
 */
export default function AISettingsPage() {
  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <HeadlineOutside subtitle="Configure AI processing and data usage preferences">
        AI Processing
      </HeadlineOutside>
      <AnimatedCard variant="elevated" padding="lg">
        <AISettings />
      </AnimatedCard>
    </div>
  );
}
