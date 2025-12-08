'use client';

import { AISettings } from '@/components/settings/AISettings';
import { Card, CardContent } from '@/components/ui/card';

/**
 * AI Settings Page
 *
 * Provides user controls for AI consent and data processing.
 * Accessible from Settings > AI Processing
 */
export default function AISettingsPage() {
  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Processing</h1>
        <p className="text-muted-foreground">Configure AI processing and data usage preferences</p>
      </div>
      <Card className="rounded-[24px]">
        <CardContent className="p-6">
          <AISettings />
        </CardContent>
      </Card>
    </div>
  );
}
